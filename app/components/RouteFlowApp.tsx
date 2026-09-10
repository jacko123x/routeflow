"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

// Role and section types define the visible workspaces and their internal tabs.
export type Portal = "operations" | "driver" | "parent" | "events";
type AdminSection = "overview" | "routes" | "people" | "compliance";
type OperatorSection = "run" | "documents" | "commercials";
type ParentSection = "journey" | "details" | "payments" | "tickets" | "notifications";

// Core demo records. These are the first pass at the domain model before a real API/backend exists.
type RouteRecord = {
  code: string;
  school: string;
  status: string;
  tone: string;
  operator: string;
  driver: string;
  vehicle: string;
  startTime: string;
  pupils: number;
  pickedUp: number;
};

type StopAssignment = {
  pupil: string;
  stop: string;
  guardian: string;
  state: "pending" | "absent" | "boarded";
};

type DocumentRecord = {
  id: string;
  type: string;
  reference: string;
  status: string;
  owner: string;
  submittedAt: string;
  reviewedBy: string;
  reviewNote: string;
};

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  owner: string;
  response: string;
  createdAt: string;
};

type RegistryRecord = [string, string, string, string];
type NotificationSettings = Record<string, boolean>;
type ParentAccount = {
  balanceDue: number;
  lastPayment: number;
  paymentStatus: string;
};

type ParentNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

type EventRecord = {
  type: string;
  message: string;
  time: string;
};

const storageKey = "routeflow-next-state-v1";

// Journey steps drive the shared demo flow across Admin, Operator, and Parent views.
const journeySteps = [
  {
    event: "route.started",
    label: "Route Started",
    routeState: "On time",
    busLeft: "24%",
    parentStatus: "Bus en route",
    parentEtaLabel: "Pickup ETA",
    parentEta: "08:04",
    driverStop: "Oakpark Road",
    driverDistance: "1.2 km",
    driverEta: "3 min",
    action: "Arrive at Stop"
  },
  {
    event: "stop.approaching",
    label: "Approaching Stop",
    routeState: "Approaching Oakpark",
    busLeft: "38%",
    parentStatus: "One stop away",
    parentEtaLabel: "Arriving in",
    parentEta: "6 min",
    driverStop: "Oakpark Road",
    driverDistance: "0.4 km",
    driverEta: "1 min",
    action: "Mark Arrived"
  },
  {
    event: "stop.arrived",
    label: "At Stop",
    routeState: "Boarding pupils",
    busLeft: "52%",
    parentStatus: "Bus arrived",
    parentEtaLabel: "Pickup",
    parentEta: "Now",
    driverStop: "Oakpark Road",
    driverDistance: "0 km",
    driverEta: "Now",
    action: "Board Pupils"
  },
  {
    event: "pupil.boarded",
    label: "Pupils Boarded",
    routeState: "In transit",
    busLeft: "64%",
    parentStatus: "Emma is on board",
    parentEtaLabel: "School ETA",
    parentEta: "08:27",
    driverStop: "Moyderwell",
    driverDistance: "2.1 km",
    driverEta: "5 min",
    action: "Complete Route"
  },
  {
    event: "route.completed",
    label: "Arrived",
    routeState: "Completed",
    busLeft: "83%",
    parentStatus: "Arrived at school",
    parentEtaLabel: "Arrived",
    parentEta: "08:23",
    driverStop: "St Brendan's College",
    driverDistance: "0 km",
    driverEta: "Done",
    action: "Route Complete"
  }
];

// Seed data keeps the prototype useful without a backend. Local storage persists edits between refreshes.
const defaultRoutes: RouteRecord[] = [
  {
    code: "KY-014",
    school: "St Brendan's College",
    status: "Preparing",
    tone: "idle",
    operator: "Kerry Coaches",
    driver: "Michael O'Shea",
    vehicle: "241-KY-123",
    startTime: "07:45",
    pupils: 23,
    pickedUp: 0
  },
  {
    code: "KY-021",
    school: "Presentation",
    status: "On time",
    tone: "",
    operator: "Kingdom Bus",
    driver: "Niamh Foley",
    vehicle: "232-KY-904",
    startTime: "07:50",
    pupils: 18,
    pickedUp: 6
  },
  {
    code: "KY-032",
    school: "CBS Tralee",
    status: "+11 min",
    tone: "watch",
    operator: "Tralee Link",
    driver: "Sean Moriarty",
    vehicle: "221-KY-512",
    startTime: "07:35",
    pupils: 31,
    pickedUp: 11
  },
  {
    code: "KY-041",
    school: "Mercy Mounthawk",
    status: "On time",
    tone: "",
    operator: "Dingle Direct",
    driver: "Aoife Griffin",
    vehicle: "242-KY-118",
    startTime: "08:05",
    pupils: 27,
    pickedUp: 0
  },
  {
    code: "KY-052",
    school: "Gaelcholaiste",
    status: "Incident",
    tone: "late",
    operator: "Kerry Coaches",
    driver: "Pat Collins",
    vehicle: "231-KY-777",
    startTime: "07:40",
    pupils: 16,
    pickedUp: 9
  }
];

const defaultStopAssignments: Record<string, StopAssignment[]> = {
  "KY-014": [
    { pupil: "Emma Murphy", stop: "Oakpark Road", guardian: "Laura Murphy", state: "pending" },
    { pupil: "Daniel O'Shea", stop: "Oakpark Road", guardian: "Brian O'Shea", state: "pending" },
    { pupil: "Sarah Walsh", stop: "Manor West", guardian: "Clare Walsh", state: "absent" },
    { pupil: "Tom Barrett", stop: "Moyderwell", guardian: "Aidan Barrett", state: "pending" },
    { pupil: "Mia Keane", stop: "Moyderwell", guardian: "Siobhan Keane", state: "pending" }
  ],
  "KY-021": [
    { pupil: "Ava Nolan", stop: "Listowel Road", guardian: "Mark Nolan", state: "pending" },
    { pupil: "Jack Foley", stop: "Ballymullen", guardian: "Niamh Foley", state: "pending" }
  ],
  "KY-032": [
    { pupil: "Cian Daly", stop: "Castle Street", guardian: "Eimear Daly", state: "pending" },
    { pupil: "Noah Casey", stop: "Boherbee", guardian: "Paul Casey", state: "pending" }
  ]
};

const defaultDocuments: DocumentRecord[] = [
  {
    id: "DOC-2001",
    type: "Fleet insurance",
    reference: "Kerry Coaches - 2026",
    status: "Approved",
    owner: "Kerry Coaches",
    submittedAt: "07:52",
    reviewedBy: "RouteFlow Compliance",
    reviewNote: "Valid for the 2026 term."
  },
  {
    id: "DOC-2002",
    type: "CVRT Certificate",
    reference: "Vehicle 232-KY-904",
    status: "Due Soon",
    owner: "Kingdom Bus",
    submittedAt: "08:05",
    reviewedBy: "",
    reviewNote: ""
  }
];

const defaultTickets: Ticket[] = [
  {
    id: "TCK-1001",
    subject: "Route query",
    message: "Can Emma use the Moyderwell stop on Friday?",
    status: "Open",
    owner: "Unassigned",
    response: "",
    createdAt: "08:12"
  }
];

const defaultRegistryRecords: RegistryRecord[] = [
  ["driver", "Michael O'Shea", "Kerry Coaches", "Approved"],
  ["driver", "Aoife Griffin", "Dingle Direct", "Review"],
  ["vehicle", "241-KY-123", "Kerry Coaches", "Approved"],
  ["vehicle", "232-KY-904", "Kingdom Bus", "Due Soon"]
];

const defaultNotificationSettings: NotificationSettings = {
  routeStarted: true,
  approachingPickup: true,
  childBoarded: true,
  arrivedAtSchool: true,
  ticketUpdates: true,
  paymentUpdates: true,
  weeklyReminders: false
};

const notificationLabels: Record<string, string> = {
  routeStarted: "Bus started route",
  approachingPickup: "Bus approaching pickup",
  childBoarded: "Child boarded",
  arrivedAtSchool: "Arrival at school",
  ticketUpdates: "Ticket updates",
  paymentUpdates: "Payment updates",
  weeklyReminders: "Weekly payment reminders"
};

const defaultNotifications: ParentNotification[] = [
  {
    id: "NTF-3001",
    type: "routeStarted",
    title: "Route scheduled",
    message: "KY-014 is ready for the morning service.",
    time: "07:40",
    read: false
  }
];

const defaultParentAccount: ParentAccount = {
  balanceDue: 48,
  lastPayment: 96,
  paymentStatus: "Payment due"
};

// Small helpers keep status colouring and demo cloning consistent throughout the component.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function getToneForStatus(status: string) {
  if (status.includes("Incident")) return "late";
  if (status.includes("+") || status.includes("Delay")) return "watch";
  if (status.includes("Preparing") || status.includes("Not started")) return "idle";
  return "";
}

function getDocumentTone(status: string) {
  if (status === "Rejected" || status === "Expired") return "late";
  if (status === "Due Soon" || status === "Review") return "watch";
  if (status === "Pending") return "idle";
  return "";
}

function getTicketTone(status: string) {
  if (status === "Closed") return "";
  if (status === "Responded") return "watch";
  return "idle";
}

const portalLabels: Record<Portal, string> = {
  operations: "Admin",
  driver: "Driver / Operator",
  parent: "Parent",
  events: "Events"
};

const portalPaths: Record<Portal, string> = {
  operations: "/admin",
  driver: "/operator",
  parent: "/parent",
  events: "/"
};

// Shared RouteFlow mark used in the sidebar.
function Logo() {
  return (
    <svg viewBox="0 0 64 64" role="img">
      <path className="logo-route" d="M13 43 C22 31, 42 33, 51 20" />
      <circle className="logo-pin start" cx="13" cy="43" r="3" />
      <circle className="logo-pin end" cx="51" cy="20" r="3" />
      <path className="logo-ear left" d="M18 25 C7 23, 6 39, 17 45 C12 36, 13 29, 18 25Z" />
      <path className="logo-ear right" d="M46 25 C57 23, 58 39, 47 45 C52 36, 51 29, 46 25Z" />
      <path className="logo-face" d="M16 31 C16 18, 25 11, 32 11 C39 11, 48 18, 48 31 C48 45, 40 53, 32 53 C24 53, 16 45, 16 31Z" />
      <path className="logo-muzzle" d="M24 38 C24 32, 29 29, 32 29 C35 29, 40 32, 40 38 C40 44, 36 47, 32 47 C28 47, 24 44, 24 38Z" />
      <circle className="logo-eye" cx="26" cy="29" r="2" />
      <circle className="logo-eye" cx="38" cy="29" r="2" />
      <path className="logo-nose" d="M29 37 C30 34, 34 34, 35 37 C34 39, 30 39, 29 37Z" />
      <path className="logo-smile" d="M32 39 C30 42, 27 42, 26 40 M32 39 C34 42, 37 42, 38 40" />
      <path className="logo-flow" d="M21 18 C25 22, 30 23, 32 17 C34 23, 39 22, 43 18" />
    </svg>
  );
}

type RouteFlowAppProps = {
  initialPortal?: Portal;
  lockedPortal?: boolean;
};

// Main workspace shell. Role pages can lock this to Admin, Operator, or Parent.
export default function RouteFlowApp({
  initialPortal = "operations",
  lockedPortal = false
}: RouteFlowAppProps) {
  const [routes, setRoutes] = useState<RouteRecord[]>(clone(defaultRoutes));
  const [documents, setDocuments] = useState<DocumentRecord[]>(clone(defaultDocuments));
  const [tickets, setTickets] = useState<Ticket[]>(clone(defaultTickets));
  const [registryRecords, setRegistryRecords] = useState<RegistryRecord[]>(clone(defaultRegistryRecords));
  const [parentAccount, setParentAccount] = useState<ParentAccount>(clone(defaultParentAccount));
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(clone(defaultNotificationSettings));
  const [notifications, setNotifications] = useState<ParentNotification[]>(clone(defaultNotifications));
  const [stopAssignments, setStopAssignments] = useState<Record<string, StopAssignment[]>>(clone(defaultStopAssignments));
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(-1);
  const [portal, setPortal] = useState<Portal>(initialPortal);
  const [adminSection, setAdminSection] = useState<AdminSection>("overview");
  const [operatorSection, setOperatorSection] = useState<OperatorSection>("run");
  const [parentSection, setParentSection] = useState<ParentSection>("journey");
  const [hydrated, setHydrated] = useState(false);

  // Derived values keep the rendered views synced to the selected route and journey step.
  const selectedRoute = routes[selectedRouteIndex] || routes[0];
  const assignments = stopAssignments[selectedRoute.code] || [];
  const boardedCount = assignments.filter((assignment) => assignment.state === "boarded").length;
  const currentStep = stepIndex >= 0 ? journeySteps[stepIndex] : null;
  const routeState = currentStep ? currentStep.routeState : selectedRoute.status;
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const parentAssignment = assignments[0];

  useEffect(() => {
    setPortal(initialPortal);
  }, [initialPortal]);

  // Load any local demo edits after hydration so Next server rendering stays stable.
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.routes) && parsed.routes.length > 0) setRoutes(parsed.routes);
        if (Array.isArray(parsed.documents)) setDocuments(parsed.documents);
        if (Array.isArray(parsed.tickets)) setTickets(parsed.tickets);
        if (Array.isArray(parsed.registryRecords)) setRegistryRecords(parsed.registryRecords);
        if (parsed.parentAccount) setParentAccount(parsed.parentAccount);
        if (parsed.notificationSettings) setNotificationSettings({ ...defaultNotificationSettings, ...parsed.notificationSettings });
        if (Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
        if (parsed.stopAssignments) setStopAssignments(parsed.stopAssignments);
        if (Array.isArray(parsed.events)) setEvents(parsed.events);
        if (typeof parsed.selectedRouteIndex === "number") setSelectedRouteIndex(Math.max(0, parsed.selectedRouteIndex));
        if (typeof parsed.stepIndex === "number") setStepIndex(parsed.stepIndex);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setHydrated(true);
  }, []);

  // Persist the prototype state locally until we replace it with real API calls.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify({
      routes,
      documents,
      tickets,
      registryRecords,
      parentAccount,
      notificationSettings,
      notifications: notifications.slice(0, 30),
      stopAssignments,
      events: events.slice(0, 50),
      selectedRouteIndex,
      stepIndex
    }));
  }, [
    hydrated,
    routes,
    documents,
    tickets,
    registryRecords,
    parentAccount,
    notificationSettings,
    notifications,
    stopAssignments,
    events,
    selectedRouteIndex,
    stepIndex
  ]);

  // Shared event and notification helpers used by multiple role workflows.
  function logEvent(type: string, message: string) {
    setEvents((current) => [{ type, message, time: formatTime() }, ...current].slice(0, 50));
  }

  function addNotification(type: string, title: string, message: string) {
    if (!notificationSettings[type]) return;
    setNotifications((current) => [{
      id: `NTF-${3001 + current.length}`,
      type,
      title,
      message,
      time: formatTime(),
      read: false
    }, ...current].slice(0, 30));
  }

  function selectRoute(index: number) {
    setSelectedRouteIndex(index);
    setStepIndex(-1);
    logEvent("route.selected", `${routes[index].code} selected for review`);
  }

  // Moves the demo journey through route start, pickup, boarding, and arrival.
  function advanceJourney() {
    if (stepIndex >= journeySteps.length - 1) return;
    const nextIndex = stepIndex + 1;
    const step = journeySteps[nextIndex];
    setStepIndex(nextIndex);
    logEvent(step.event, `${step.label} for Route ${selectedRoute.code}`);

    const notificationMap: Record<string, [string, string, string]> = {
      "route.started": ["routeStarted", "Bus started", `${selectedRoute.code} has started the school run.`],
      "stop.approaching": ["approachingPickup", "Bus approaching", `${selectedRoute.code} is approaching pickup.`],
      "pupil.boarded": ["childBoarded", "Child boarded", "Emma is now on board."],
      "route.completed": ["arrivedAtSchool", "Arrived at school", `${selectedRoute.code} has arrived at school.`]
    };
    const notification = notificationMap[step.event];
    if (notification) addNotification(...notification);
  }

  function resetDemo() {
    setRoutes(clone(defaultRoutes));
    setDocuments(clone(defaultDocuments));
    setTickets(clone(defaultTickets));
    setRegistryRecords(clone(defaultRegistryRecords));
    setParentAccount(clone(defaultParentAccount));
    setNotificationSettings(clone(defaultNotificationSettings));
    setNotifications(clone(defaultNotifications));
    setStopAssignments(clone(defaultStopAssignments));
    setEvents([]);
    setSelectedRouteIndex(0);
    setStepIndex(-1);
    localStorage.removeItem(storageKey);
  }

  // Admin route planning and assignment handlers.
  function addRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const code = String(data.get("routeCode")).trim().toUpperCase();
    const route: RouteRecord = {
      code,
      school: String(data.get("school")).trim(),
      status: "Not started",
      tone: "idle",
      operator: "Unassigned",
      driver: String(data.get("driver")).trim(),
      vehicle: "Pending",
      startTime: String(data.get("startTime")),
      pupils: 0,
      pickedUp: 0
    };
    setRoutes((current) => [route, ...current]);
    setStopAssignments((current) => ({ ...current, [code]: [] }));
    setSelectedRouteIndex(0);
    setStepIndex(-1);
    logEvent("route.created", `${route.code} created for ${route.school}`);
    form.reset();
  }

  function updateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const status = String(data.get("status"));
    setRoutes((current) => current.map((route, index) => index === selectedRouteIndex ? {
      ...route,
      operator: String(data.get("operator")).trim(),
      driver: String(data.get("driver")).trim(),
      vehicle: String(data.get("vehicle")).trim(),
      pupils: Number(data.get("pupils")),
      status,
      tone: getToneForStatus(status)
    } : route));
    setStepIndex(-1);
    logEvent("route.assignment.updated", `${selectedRoute.code} assignment updated`);
  }

  function addStop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const assignment: StopAssignment = {
      pupil: String(data.get("pupil")).trim(),
      stop: String(data.get("stop")).trim(),
      guardian: String(data.get("guardian")).trim(),
      state: "pending"
    };
    setStopAssignments((current) => ({
      ...current,
      [selectedRoute.code]: [...(current[selectedRoute.code] || []), assignment]
    }));
    setRoutes((current) => current.map((route, index) => index === selectedRouteIndex ? {
      ...route,
      pupils: (stopAssignments[selectedRoute.code] || []).length + 1
    } : route));
    logEvent("pickup.assigned", `${assignment.pupil} assigned to ${selectedRoute.code} at ${assignment.stop}`);
    form.reset();
  }

  function boardPupil(index: number) {
    const assignment = assignments[index];
    if (!assignment || assignment.state !== "pending") return;
    const nextAssignments = assignments.map((item, itemIndex) => itemIndex === index ? { ...item, state: "boarded" as const } : item);
    const nextBoarded = nextAssignments.filter((item) => item.state === "boarded").length;
    setStopAssignments((current) => ({ ...current, [selectedRoute.code]: nextAssignments }));
    setRoutes((current) => current.map((route, routeIndex) => routeIndex === selectedRouteIndex ? { ...route, pickedUp: nextBoarded } : route));
    logEvent("pupil.boarded", `${assignment.pupil} boarded ${selectedRoute.code} at ${assignment.stop}`);
    addNotification("childBoarded", `${assignment.pupil} boarded`, `${assignment.pupil} boarded ${selectedRoute.code} at ${assignment.stop}.`);
  }

  // Operator document uploads and Admin compliance review handlers.
  function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const documentType = String(data.get("documentType"));
    const reference = String(data.get("documentReference")).trim() || "General operator upload";
    setDocuments((current) => [{
      id: `DOC-${2001 + current.length}`,
      type: documentType,
      reference,
      status: "Pending",
      owner: selectedRoute.operator,
      submittedAt: formatTime(),
      reviewedBy: "",
      reviewNote: ""
    }, ...current]);
    logEvent("document.uploaded", `${documentType} added to compliance review`);
    form.reset();
  }

  function reviewDocument(index: number, status: "Approved" | "Rejected") {
    setDocuments((current) => current.map((documentRecord, itemIndex) => itemIndex === index ? {
      ...documentRecord,
      status,
      reviewedBy: "RouteFlow Compliance",
      reviewNote: status === "Approved"
        ? "Document approved and available for operations."
        : "Document rejected. Please upload a corrected file."
    } : documentRecord));
    logEvent(status === "Approved" ? "document.approved" : "document.rejected", `${documents[index].id} ${status.toLowerCase()} by compliance`);
  }

  // Parent ticket creation plus Admin assignment, response, and closure handlers.
  function addTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get("ticketMessage")).trim();
    if (!message) return;
    setTickets((current) => [{
      id: `TCK-${1001 + current.length}`,
      subject: "Parent support",
      message,
      status: "Open",
      owner: "Unassigned",
      response: "",
      createdAt: formatTime()
    }, ...current]);
    logEvent("ticket.created", "Parent support ticket created");
    form.reset();
  }

  function assignTicket(index: number) {
    setTickets((current) => current.map((ticket, itemIndex) => itemIndex === index ? {
      ...ticket,
      owner: "RouteFlow Support",
      status: ticket.status === "Closed" ? "Closed" : "In Progress"
    } : ticket));
    logEvent("ticket.assigned", `${tickets[index].id} assigned to RouteFlow Support`);
  }

  function closeTicket(index: number) {
    setTickets((current) => current.map((ticket, itemIndex) => itemIndex === index ? { ...ticket, status: "Closed" } : ticket));
    logEvent("ticket.closed", `${tickets[index].id} closed`);
    addNotification("ticketUpdates", "Ticket closed", `${tickets[index].id} has been closed.`);
  }

  function respondToLatestTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = String(new FormData(form).get("response")).trim();
    const target = tickets.find((ticket) => ticket.status !== "Closed");
    if (!response || !target) return;
    setTickets((current) => current.map((ticket) => ticket.id === target.id ? {
      ...ticket,
      response,
      owner: "RouteFlow Support",
      status: "Responded"
    } : ticket));
    logEvent("ticket.responded", `${target.id} response sent to parent`);
    addNotification("ticketUpdates", "Support replied", response);
    form.reset();
  }

  function addRegistryRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const type = String(data.get("registryType"));
    const name = String(data.get("registryName")).trim();
    const operator = String(data.get("registryOperator")).trim();
    setRegistryRecords((current) => [[type, name, operator, "Review"], ...current]);
    logEvent(`${type}.created`, `${name} added to operational register`);
    form.reset();
  }

  // Parent account payment simulation.
  function settleParentBalance() {
    if (parentAccount.balanceDue === 0) return;
    const paidAmount = parentAccount.balanceDue;
    setParentAccount({ balanceDue: 0, lastPayment: paidAmount, paymentStatus: "Paid up to date" });
    logEvent("payment.completed", `Parent paid EUR ${paidAmount.toFixed(2)}`);
    addNotification("paymentUpdates", "Payment received", `EUR ${paidAmount.toFixed(2)} received.`);
  }

  const routeCards = useMemo(() => routes.map((route, index) => {
    const currentStatus = index === selectedRouteIndex && currentStep ? currentStep.routeState : route.status;
    const tone = index === selectedRouteIndex && stepIndex === journeySteps.length - 1 ? "" : route.tone;
    return { route, index, currentStatus, tone };
  }), [currentStep, routes, selectedRouteIndex, stepIndex]);

  return (
    <div className="app-shell">
      {/* Shared sidebar: role pages lock this to one workspace, demo mode can still switch roles. */}
      <aside className="sidebar" aria-label="RouteFlow navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><Logo /></div>
          <div>
            <h1>RouteFlow</h1>
            <p>School transport, connected.</p>
          </div>
        </div>
        {lockedPortal ? (
          <nav className="nav-tabs" aria-label="Current role">
            <span className="nav-tab active">{portalLabels[portal]}</span>
            <a className="nav-tab" href="/">Switch Workspace</a>
          </nav>
        ) : (
          <nav className="nav-tabs" aria-label="Views">
            {(["operations", "driver", "parent", "events"] as Portal[]).map((item) => (
              <button key={item} className={`nav-tab ${portal === item ? "active" : ""}`} onClick={() => setPortal(item)} type="button">
                {portalLabels[item]}
              </button>
            ))}
          </nav>
        )}
        <section className="sidebar-section">
          <h2>Today</h2>
          <div className="metric-list">
            <div><span>Routes</span><strong>{routes.length}</strong></div>
            <div><span>On time</span><strong>{routes.filter((route) => route.tone === "").length}</strong></div>
            <div><span>Delayed</span><strong>{routes.filter((route) => route.tone === "watch").length}</strong></div>
            <div><span>Incidents</span><strong>{routes.filter((route) => route.tone === "late").length}</strong></div>
          </div>
        </section>
      </aside>

      <main>
        {/* Shared top bar actions for demo reset, route editing, and journey simulation. */}
        <header className="topbar">
          <div>
            <p className="eyebrow">Today - Thursday 10 September</p>
            <h2>{portal === "operations" ? "Admin Control" : portal === "driver" ? "Driver / Operator Portal" : portal === "parent" ? "Parent Portal" : "Event Stream"}</h2>
          </div>
          <div className="topbar-actions">
            <button className="secondary-action" onClick={resetDemo} type="button">Reset</button>
            <a className="secondary-action" href={portalPaths[portal]}>Role Home</a>
            {portal === "operations" && <button className="secondary-action" onClick={() => { setAdminSection("routes"); }} type="button">Add Route</button>}
            <button className="primary-action" onClick={advanceJourney} type="button">Advance Journey</button>
          </div>
        </header>

        {/* Admin / school transport staff workspace. */}
        {portal === "operations" && (
          <section className="view active">
            <nav className="portal-tabs" aria-label="Admin sections">
              {(["overview", "routes", "people", "compliance"] as AdminSection[]).map((section) => (
                <button key={section} className={`portal-tab ${adminSection === section ? "active" : ""}`} onClick={() => setAdminSection(section)} type="button">{section[0].toUpperCase() + section.slice(1)}</button>
              ))}
            </nav>

            {adminSection === "overview" && (
              <>
                <div className="summary-grid">
                  <article className="summary-panel status-good"><span>On Time</span><strong>103</strong></article>
                  <article className="summary-panel status-watch"><span>Minor Delay</span><strong>14</strong></article>
                  <article className="summary-panel status-late"><span>Significant Delay</span><strong>6</strong></article>
                  <article className="summary-panel status-idle"><span>Not Started</span><strong>3</strong></article>
                </div>
                <section className="admin-command">
                  <div className="section-heading"><h3>Admin Workspace</h3><span>Staff controls</span></div>
                  <div className="command-grid">
                    <article className="command-tile"><span>Route Network</span><strong>{routes.length} active routes</strong><button className="secondary-action" onClick={() => setAdminSection("routes")} type="button">Manage Routes</button></article>
                    <article className="command-tile"><span>Drivers</span><strong>84 approved</strong><button className="secondary-action" onClick={() => setAdminSection("people")} type="button">Assign Drivers</button></article>
                    <article className="command-tile"><span>Vehicles</span><strong>91 compliant</strong><button className="secondary-action" onClick={() => setAdminSection("people")} type="button">Review Fleet</button></article>
                    <article className="command-tile"><span>Operators</span><strong>16 companies</strong><button className="secondary-action" onClick={() => setAdminSection("compliance")} type="button">View Operators</button></article>
                  </div>
                </section>
              </>
            )}

            {adminSection === "routes" && (
              <>
                <div className="content-grid">
                  <section className="route-board">
                    <div className="section-heading"><h3>Live Routes</h3><span>Network view</span></div>
                    <div className="route-list">
                      {routeCards.map(({ route, index, currentStatus, tone }) => (
                        <button key={route.code} className={`route-row ${index === selectedRouteIndex ? "active" : ""}`} onClick={() => selectRoute(index)} type="button">
                          <span><strong>{route.code}</strong><span>{route.school}</span></span>
                          <span className={`route-status ${tone}`}>{currentStatus}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="journey-detail">
                    <div className="section-heading"><h3>{selectedRoute.code}</h3><span>{routeState}</span></div>
                    <div className="map-panel">
                      <div className="map-road"></div>
                      <div className="map-stop stop-one"></div>
                      <div className="map-stop stop-two"></div>
                      <div className="map-stop stop-three"></div>
                      <div className="bus-marker" style={{ left: currentStep ? currentStep.busLeft : "16%" }}>BUS</div>
                    </div>
                    <div className="detail-grid">
                      <div><span>Operator</span><strong>{selectedRoute.operator}</strong></div>
                      <div><span>Driver</span><strong>{selectedRoute.driver}</strong></div>
                      <div><span>Vehicle</span><strong>{selectedRoute.vehicle}</strong></div>
                      <div><span>Pupils</span><strong>{boardedCount || selectedRoute.pickedUp} / {selectedRoute.pupils} picked up</strong></div>
                    </div>
                    <form className="assignment-form" onSubmit={updateAssignment}>
                      <div className="section-heading compact-heading"><h3>Assignment Editor</h3><span>Selected route</span></div>
                      <div className="assignment-grid">
                        <label>Operator<input name="operator" required defaultValue={selectedRoute.operator} key={`${selectedRoute.code}-operator`} /></label>
                        <label>Driver<input name="driver" required defaultValue={selectedRoute.driver} key={`${selectedRoute.code}-driver`} /></label>
                        <label>Vehicle<input name="vehicle" required defaultValue={selectedRoute.vehicle} key={`${selectedRoute.code}-vehicle`} /></label>
                        <label>Pupils<input name="pupils" min="0" required type="number" defaultValue={selectedRoute.pupils} key={`${selectedRoute.code}-pupils`} /></label>
                        <label>Status<select name="status" defaultValue={selectedRoute.status} key={`${selectedRoute.code}-status`}>
                          {["Preparing", "Not started", "On time", "+11 min", "Incident", "Completed"].map((status) => <option key={status} value={status}>{status}</option>)}
                        </select></label>
                        <button className="primary-action" type="submit">Update Assignment</button>
                      </div>
                    </form>
                    <section className="stop-planner">
                      <div className="section-heading compact-heading"><h3>Stops & Pupils</h3><span>Selected route</span></div>
                      <form className="stop-form" onSubmit={addStop}>
                        <label>Pupil<input name="pupil" required placeholder="Pupil name" /></label>
                        <label>Pickup Stop<input name="stop" required placeholder="Pickup point" /></label>
                        <label>Guardian<input name="guardian" required placeholder="Guardian name" /></label>
                        <button className="primary-action" type="submit">Add Pickup</button>
                      </form>
                      <div className="review-list">
                        {assignments.length === 0 && <article className="review-item"><div><strong>No pickups assigned</strong><span>Add pupils to build the run sheet</span></div><span className="route-status idle">Empty</span></article>}
                        {assignments.map((assignment) => <article className="review-item" key={`${assignment.pupil}-${assignment.stop}`}><div><strong>{assignment.pupil}</strong><span>{assignment.stop} - {assignment.guardian}</span></div><span className={`route-status ${assignment.state === "absent" ? "idle" : ""}`}>{assignment.state === "boarded" ? "Boarded" : assignment.state === "absent" ? "Absent" : "Assigned"}</span></article>)}
                      </div>
                    </section>
                  </section>
                </div>

                <section className="planning-board">
                  <div className="section-heading"><h3>Schedule Builder</h3><span>Morning services</span></div>
                  <form className="route-form" onSubmit={addRoute}>
                    <label>Route<input name="routeCode" required placeholder="KY-066" /></label>
                    <label>School<input name="school" required placeholder="St Ita's Primary" /></label>
                    <label>Driver<input name="driver" required placeholder="Aisling Byrne" /></label>
                    <label>Start<input name="startTime" required type="time" defaultValue="07:55" /></label>
                    <button className="primary-action" type="submit">Save Route</button>
                  </form>
                  <div className="schedule-table" role="table" aria-label="Route schedule">
                    <div className="schedule-row schedule-head" role="row"><span>Route</span><span>School</span><span>Driver</span><span>Start</span><span>Status</span></div>
                    {routeCards.map(({ route, index, currentStatus, tone }) => (
                      <button key={route.code} className="schedule-row" onClick={() => selectRoute(index)} type="button" role="row">
                        <span>{route.code}</span><span>{route.school}</span><span>{route.driver}</span><span>{route.startTime}</span><span><span className={`route-status ${tone}`}>{currentStatus}</span></span>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {adminSection === "people" && (
              <div className="people-grid">
                <section className="registry-board">
                  <div className="section-heading"><h3>Driver & Fleet Register</h3><span>Operational records</span></div>
                  <form className="registry-form" onSubmit={addRegistryRecord}>
                    <label>Type<select name="registryType"><option value="driver">Driver</option><option value="vehicle">Vehicle</option></select></label>
                    <label>Name / Registration<input name="registryName" required placeholder="Driver name or bus reg" /></label>
                    <label>Operator<input name="registryOperator" required placeholder="Kerry Coaches" /></label>
                    <button className="primary-action" type="submit">Add Record</button>
                  </form>
                  <div className="review-list">
                    {registryRecords.map(([type, name, operator, status]) => <article className="review-item" key={`${type}-${name}`}><div><strong>{name}</strong><span>{type === "driver" ? "Driver" : "Vehicle"} - {operator}</span></div><span className={`route-status ${status === "Due Soon" ? "watch" : status === "Approved" ? "" : "idle"}`}>{status}</span></article>)}
                  </div>
                </section>
                <section className="registry-board">
                  <div className="section-heading"><h3>Schools & Pupils</h3><span>Assignments</span></div>
                  <div className="review-list">
                    {routes.slice(0, 3).map((route) => <article className="review-item" key={route.code}><div><strong>{route.school}</strong><span>{route.pupils} pupils assigned to {route.code}</span></div><span className="route-status">Active</span></article>)}
                  </div>
                </section>
              </div>
            )}

            {adminSection === "compliance" && (
              <div className="compliance-grid">
                <section className="document-queue">
                  <div className="section-heading"><h3>Compliance Queue</h3><span>Needs staff review</span></div>
                  <div className="review-list">
                    {documents.map((documentRecord, index) => <article className="document-review-row" key={documentRecord.id}><div><strong>{documentRecord.id} - {documentRecord.type}</strong><span>{documentRecord.reference} - {documentRecord.owner}</span><small>Submitted: {documentRecord.submittedAt} - Reviewer: {documentRecord.reviewedBy || "Unreviewed"}</small>{documentRecord.reviewNote && <small>Note: {documentRecord.reviewNote}</small>}</div><div className="ticket-actions"><span className={`route-status ${getDocumentTone(documentRecord.status)}`}>{documentRecord.status}</span><button className="secondary-action" onClick={() => reviewDocument(index, "Approved")} type="button">Approve</button><button className="secondary-action" onClick={() => reviewDocument(index, "Rejected")} type="button">Reject</button></div></article>)}
                  </div>
                </section>
                <section className="support-queue">
                  <div className="section-heading"><h3>Parent Support Queue</h3><span>Tickets and responses</span></div>
                  <form className="ticket-response-form" onSubmit={respondToLatestTicket}>
                    <label>Response<textarea name="response" rows={3} placeholder="Response to selected/open ticket"></textarea></label>
                    <button className="primary-action" type="submit">Respond To Latest Open</button>
                  </form>
                  <div className="review-list">
                    {tickets.map((ticket, index) => <article className="ticket-row" key={ticket.id}><div><strong>{ticket.id} - {ticket.subject}</strong><span>{ticket.message}</span><small>Owner: {ticket.owner} - Created: {ticket.createdAt}</small>{ticket.response && <small>Response: {ticket.response}</small>}</div><div className="ticket-actions"><span className={`route-status ${getTicketTone(ticket.status)}`}>{ticket.status}</span><button className="secondary-action" onClick={() => assignTicket(index)} type="button">Assign</button><button className="secondary-action" onClick={() => closeTicket(index)} type="button">Close</button></div></article>)}
                  </div>
                </section>
              </div>
            )}
          </section>
        )}

        {/* Bus operator and driver workspace. */}
        {portal === "driver" && (
          <section className="view active">
            <nav className="portal-tabs" aria-label="Driver and operator sections">
              {(["run", "documents", "commercials"] as OperatorSection[]).map((section) => <button key={section} className={`portal-tab ${operatorSection === section ? "active" : ""}`} onClick={() => setOperatorSection(section)} type="button">{section === "run" ? "Run Sheet" : section === "commercials" ? "Payments" : "Documents"}</button>)}
            </nav>
            {operatorSection === "run" && (
              <>
                <div className="driver-layout">
                  <section className="next-stop">
                    <p className="eyebrow">Next Stop</p>
                    <h3>{currentStep ? currentStep.driverStop : "Oakpark Road"}</h3>
                    <div className="distance-row"><strong>{currentStep ? currentStep.driverDistance : "1.2 km"}</strong><span>{currentStep ? currentStep.driverEta : "3 min"}</span></div>
                    <button className="primary-action wide" onClick={advanceJourney} type="button">{currentStep ? currentStep.action : "Start Route"}</button>
                  </section>
                  <section className="manifest">
                    <div className="section-heading"><h3>Expected Pupils</h3><span>Stop manifest</span></div>
                    <div className="manifest-list">
                      {assignments.map((assignment, index) => {
                        const isAbsent = assignment.state === "absent";
                        const isBoarded = assignment.state === "boarded";
                        return <article className={`manifest-row ${isAbsent ? "absent" : ""}`} key={`${assignment.pupil}-${assignment.stop}`}><div><strong>{assignment.pupil}</strong><span>{assignment.stop} - {isAbsent ? "Absent" : isBoarded ? "Boarded" : "Waiting"}</span></div><button disabled={isAbsent || isBoarded} onClick={() => boardPupil(index)} type="button">{isAbsent ? "Absent" : isBoarded ? "Done" : "Board"}</button></article>;
                      })}
                    </div>
                  </section>
                </div>
                <section className="operator-panel">
                  <div className="section-heading"><h3>Today's Runs</h3><span>Operator view</span></div>
                  <div className="run-list">{routes.slice(0, 2).map((route) => <article className="run-item" key={route.code}><strong>{route.code}</strong><span>{route.startTime} - {route.school}</span><span className={`route-status ${route.tone}`}>{route.status}</span></article>)}</div>
                </section>
              </>
            )}
            {operatorSection === "documents" && (
              <section className="operator-panel">
                <div className="section-heading"><h3>Document Upload</h3><span>Contracts and fleet</span></div>
                <form className="document-form" onSubmit={addDocument}>
                  <label>Document Type<select name="documentType"><option>Bus Insurance</option><option>CVRT Certificate</option><option>Driver Licence</option><option>Operator Contract</option></select></label>
                  <label>Reference<input name="documentReference" placeholder="Vehicle or contract ref" /></label>
                  <button className="primary-action" type="submit">Add To Review</button>
                </form>
                <div className="review-list">
                  {documents.map((documentRecord) => <article className="review-item" key={documentRecord.id}><div><strong>{documentRecord.type}</strong><span>{documentRecord.reference} - {documentRecord.owner}</span>{documentRecord.reviewNote && <small>{documentRecord.reviewNote}</small>}</div><span className={`route-status ${getDocumentTone(documentRecord.status)}`}>{documentRecord.status}</span></article>)}
                </div>
              </section>
            )}
            {operatorSection === "commercials" && (
              <section className="operator-panel">
                <div className="section-heading"><h3>Operator Payments</h3><span>Contracts and settlement</span></div>
                <div className="finance-grid"><article className="finance-card"><span>Current Month</span><strong>EUR 12,840.00</strong><small>Routes completed and approved</small></article><article className="finance-card"><span>Pending Review</span><strong>EUR 1,460.00</strong><small>Awaiting route sign-off</small></article><article className="finance-card"><span>Contract Status</span><strong>Active</strong><small>2026 school term</small></article></div>
              </section>
            )}
          </section>
        )}

        {/* Parent self-service and journey tracking workspace. */}
        {portal === "parent" && (
          <section className="view active">
            <nav className="portal-tabs" aria-label="Parent sections">
              {(["journey", "details", "payments", "tickets", "notifications"] as ParentSection[]).map((section) => <button key={section} className={`portal-tab ${parentSection === section ? "active" : ""}`} onClick={() => setParentSection(section)} type="button">{section[0].toUpperCase() + section.slice(1)}</button>)}
            </nav>
            {parentSection === "journey" && <div className="parent-layout"><div className="parent-phone"><div className="phone-top"><span>Good morning</span><strong>Emma's journey</strong></div><div className="journey-card"><p>{selectedRoute.school}</p><h3>{currentStep ? currentStep.parentStatus : "Scheduled"}</h3><div className="route-line"><span></span><span></span><span className="active-dot"></span><span></span></div><div className="arrival-block"><span>{currentStep ? currentStep.parentEtaLabel : "Pickup ETA"}</span><strong>{currentStep ? currentStep.parentEta : "08:04"}</strong></div><dl><div><dt>Pickup</dt><dd>{parentAssignment ? parentAssignment.stop : "Unassigned"}</dd></div><div><dt>Driver</dt><dd>{selectedRoute.driver.split(" ")[0]}</dd></div><div><dt>Vehicle</dt><dd>{selectedRoute.vehicle}</dd></div></dl></div></div></div>}
            {parentSection === "details" && <section className="parent-actions"><div className="section-heading"><h3>Family Details</h3><span>Child, guardian and pickup</span></div><div className="detail-grid profile-grid"><div><span>Child</span><strong>Emma Murphy</strong></div><div><span>School</span><strong>{selectedRoute.school}</strong></div><div><span>Pickup Stop</span><strong>{parentAssignment ? parentAssignment.stop : "Unassigned"}</strong></div><div><span>Guardian</span><strong>{parentAssignment ? parentAssignment.guardian : "Laura Murphy"}</strong></div><div><span>Emergency Contact</span><strong>087 555 0192</strong></div><div><span>Plan</span><strong>Morning and afternoon</strong></div></div></section>}
            {parentSection === "payments" && <section className="parent-actions"><div className="section-heading"><h3>Payments</h3><span>Family account</span></div><div className="parent-action-grid"><article className="parent-action-card"><span>Balance Due</span><strong>EUR {parentAccount.balanceDue.toFixed(2)}</strong><button className="primary-action" disabled={parentAccount.balanceDue === 0} onClick={settleParentBalance} type="button">{parentAccount.balanceDue === 0 ? "Paid" : "Pay Now"}</button></article><article className="parent-action-card"><span>Last Payment</span><strong>EUR {parentAccount.lastPayment.toFixed(2)}</strong><button className="secondary-action" type="button">View Receipt</button></article><article className="parent-action-card"><span>Account Status</span><strong>{parentAccount.paymentStatus}</strong><button className="secondary-action" type="button">View Statement</button></article></div></section>}
            {parentSection === "tickets" && <section className="parent-actions"><div className="section-heading"><h3>Support Tickets</h3><span>Pickup and account help</span></div><form className="ticket-form" onSubmit={addTicket}><label>Support Ticket<textarea name="ticketMessage" rows={4} placeholder="Pickup change, payment query, route question"></textarea></label><button className="primary-action" type="submit">Create Ticket</button></form><div className="review-list">{tickets.map((ticket) => <article className="review-item" key={ticket.id}><div><strong>{ticket.subject}</strong><span>{ticket.message}</span>{ticket.response && <small>{ticket.response}</small>}</div><span className={`route-status ${getTicketTone(ticket.status)}`}>{ticket.status}</span></article>)}</div></section>}
            {parentSection === "notifications" && <section className="parent-actions"><div className="section-heading"><h3>Notifications</h3><span>Live journey alerts</span></div><div className="setting-list">{Object.entries(notificationLabels).map(([key, label]) => <label key={key}><input checked={notificationSettings[key]} onChange={(event) => setNotificationSettings((current) => ({ ...current, [key]: event.target.checked }))} type="checkbox" />{label}</label>)}</div><div className="section-heading compact-heading"><h3>Notification Inbox</h3><span>{unreadCount} unread</span></div><div className="notification-list">{notifications.map((notification, index) => <article className={`notification-item ${notification.read ? "read" : ""}`} key={notification.id}><div><strong>{notification.title}</strong><span>{notification.time} - {notification.message}</span></div><button className="secondary-action" onClick={() => setNotifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, read: true } : item))} type="button">Mark Read</button></article>)}</div></section>}
          </section>
        )}

        {/* Internal event stream for debugging the current prototype state. */}
        {portal === "events" && <section className="view active" id="events"><div className="section-heading"><h3>Journey Events</h3><span>Event stream</span></div><ol className="event-log">{events.map((event, index) => <li key={`${event.type}-${index}`}><code>{event.type}</code><span>{event.time} - {event.message}</span></li>)}</ol></section>}
      </main>
    </div>
  );
}
