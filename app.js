const journeySteps = [
    {
        event: "route.started",
        label: "Route Started",
        routeState: "On time",
        busLeft: "24%",
        pickedUp: 0,
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
        pickedUp: 0,
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
        pickedUp: 0,
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
        pickedUp: 17,
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
        pickedUp: 23,
        parentStatus: "Arrived at school",
        parentEtaLabel: "Arrived",
        parentEta: "08:23",
        driverStop: "St Brendan's College",
        driverDistance: "0 km",
        driverEta: "Done",
        action: "Route Complete"
    }
];

const storageKey = "routeflow-demo-state-v1";

const defaultRoutes = [
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

const pupils = [
    ["Emma Murphy", "pending"],
    ["Daniel O'Shea", "pending"],
    ["Sarah Walsh", "absent"],
    ["Tom Barrett", "pending"],
    ["Mia Keane", "pending"]
];

const defaultOperatorDocuments = [
    ["Fleet insurance", "Kerry Coaches - 2026", "Approved"],
    ["CVRT Certificate", "Vehicle 232-KY-904", "Due Soon"]
];

const defaultTickets = [
    ["Route query", "Can Emma use the Moyderwell stop on Friday?", "Open"]
];

function cloneDefault(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadState() {
    const defaults = {
        routes: cloneDefault(defaultRoutes),
        operatorDocuments: cloneDefault(defaultOperatorDocuments),
        tickets: cloneDefault(defaultTickets),
        selectedRouteIndex: 0,
        stepIndex: -1,
        eventHistory: []
    };

    try {
        const savedState = JSON.parse(localStorage.getItem(storageKey));

        if (!savedState || !Array.isArray(savedState.routes) || savedState.routes.length === 0) {
            return defaults;
        }

        return {
            ...defaults,
            ...savedState,
            operatorDocuments: Array.isArray(savedState.operatorDocuments)
                ? savedState.operatorDocuments
                : defaults.operatorDocuments,
            tickets: Array.isArray(savedState.tickets) ? savedState.tickets : defaults.tickets,
            eventHistory: Array.isArray(savedState.eventHistory) ? savedState.eventHistory : defaults.eventHistory
        };
    } catch {
        return defaults;
    }
}

const state = loadState();
const routes = state.routes;
const operatorDocuments = state.operatorDocuments;
const tickets = state.tickets;
let selectedRouteIndex = Math.max(0, Math.min(state.selectedRouteIndex, routes.length - 1));
let stepIndex = state.stepIndex;
const eventHistory = state.eventHistory;

const views = {
    operations: "Admin Control",
    driver: "Driver / Operator Portal",
    parent: "Parent Portal",
    events: "Event Stream"
};

const elements = {
    viewTitle: document.querySelector("#viewTitle"),
    routeList: document.querySelector("#routeList"),
    manifestList: document.querySelector("#manifestList"),
    eventLog: document.querySelector("#eventLog"),
    scheduleRows: document.querySelector("#scheduleRows"),
    operatorDocumentList: document.querySelector("#operatorDocumentList"),
    ticketList: document.querySelector("#ticketList"),
    routeForm: document.querySelector("#routeForm"),
    documentForm: document.querySelector("#documentForm"),
    ticketForm: document.querySelector("#ticketForm"),
    addRouteButton: document.querySelector("#addRouteButton"),
    advanceDemo: document.querySelector("#advanceDemo"),
    resetDemo: document.querySelector("#resetDemo"),
    activeRouteCode: document.querySelector("#activeRouteCode"),
    activeOperator: document.querySelector("#activeOperator"),
    activeDriver: document.querySelector("#activeDriver"),
    activeVehicle: document.querySelector("#activeVehicle"),
    routeStateLabel: document.querySelector("#routeStateLabel"),
    busMarker: document.querySelector("#busMarker"),
    pickedUpCount: document.querySelector("#pickedUpCount"),
    driverStopName: document.querySelector("#driverStopName"),
    driverDistance: document.querySelector("#driverDistance"),
    driverEta: document.querySelector("#driverEta"),
    driverAction: document.querySelector("#driverAction"),
    parentDriver: document.querySelector("#parentDriver"),
    parentVehicle: document.querySelector("#parentVehicle"),
    parentStatus: document.querySelector("#parentStatus"),
    parentEtaLabel: document.querySelector("#parentEtaLabel"),
    parentEta: document.querySelector("#parentEta")
};

function getSelectedRoute() {
    return routes[selectedRouteIndex];
}

function saveState() {
    localStorage.setItem(storageKey, JSON.stringify({
        routes,
        operatorDocuments,
        tickets,
        selectedRouteIndex,
        stepIndex,
        eventHistory: eventHistory.slice(0, 50)
    }));
}

function restoreDefaults() {
    routes.splice(0, routes.length, ...cloneDefault(defaultRoutes));
    operatorDocuments.splice(0, operatorDocuments.length, ...cloneDefault(defaultOperatorDocuments));
    tickets.splice(0, tickets.length, ...cloneDefault(defaultTickets));
    selectedRouteIndex = 0;
    stepIndex = -1;
    eventHistory.length = 0;
    localStorage.removeItem(storageKey);
}

function getRouteStatus(route, index) {
    if (index === selectedRouteIndex && stepIndex >= 0) {
        return journeySteps[stepIndex].routeState;
    }

    return route.status;
}

function getRouteTone(route, index) {
    if (index === selectedRouteIndex && stepIndex === journeySteps.length - 1) {
        return "";
    }

    return route.tone;
}

function formatTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function selectRoute(index) {
    selectedRouteIndex = index;
    stepIndex = -1;
    eventHistory.unshift({
        type: "route.selected",
        message: `${routes[index].code} selected for review`,
        time: formatTime()
    });
    saveState();
    applyStep();
}

function renderRoutes() {
    elements.routeList.innerHTML = routes.map((route, index) => {
        const currentStatus = getRouteStatus(route, index);
        const tone = getRouteTone(route, index);
        const statusClass = tone ? ` ${tone}` : "";
        const activeClass = index === selectedRouteIndex ? " active" : "";

        return `
            <button class="route-row${activeClass}" data-route-index="${index}" type="button">
                <span>
                    <strong>${route.code}</strong>
                    <span>${route.school}</span>
                </span>
                <span class="route-status${statusClass}">${currentStatus}</span>
            </button>
        `;
    }).join("");

    document.querySelectorAll("[data-route-index]").forEach((row) => {
        row.addEventListener("click", () => selectRoute(Number(row.dataset.routeIndex)));
    });
}

function renderManifest() {
    const boarded = stepIndex >= 3;

    elements.manifestList.innerHTML = pupils.map(([name, state]) => {
        const isAbsent = state === "absent";
        const label = isAbsent ? "Absent" : boarded ? "Boarded" : "Waiting";
        const rowClass = isAbsent ? "manifest-row absent" : "manifest-row";
        const buttonLabel = isAbsent ? "Absent" : boarded ? "Done" : "Board";

        return `
            <article class="${rowClass}">
                <div>
                    <strong>${name}</strong>
                    <span>${label}</span>
                </div>
                <button type="button">${buttonLabel}</button>
            </article>
        `;
    }).join("");
}

function renderSchedule() {
    elements.scheduleRows.innerHTML = routes.map((route, index) => {
        const tone = getRouteTone(route, index);
        const statusClass = tone ? ` ${tone}` : "";

        return `
            <button class="schedule-row" data-schedule-index="${index}" type="button" role="row">
                <span>${route.code}</span>
                <span>${route.school}</span>
                <span>${route.driver}</span>
                <span>${route.startTime}</span>
                <span><span class="route-status${statusClass}">${getRouteStatus(route, index)}</span></span>
            </button>
        `;
    }).join("");

    document.querySelectorAll("[data-schedule-index]").forEach((row) => {
        row.addEventListener("click", () => selectRoute(Number(row.dataset.scheduleIndex)));
    });
}

function renderOperatorDocuments() {
    elements.operatorDocumentList.innerHTML = operatorDocuments.map(([name, reference, status]) => {
        const tone = status === "Approved" ? "" : status === "Due Soon" ? "watch" : "idle";

        return `
            <article class="review-item">
                <div>
                    <strong>${name}</strong>
                    <span>${reference}</span>
                </div>
                <span class="route-status ${tone}">${status}</span>
            </article>
        `;
    }).join("");
}

function renderTickets() {
    elements.ticketList.innerHTML = tickets.map(([subject, message, status]) => `
        <article class="review-item">
            <div>
                <strong>${subject}</strong>
                <span>${message}</span>
            </div>
            <span class="route-status idle">${status}</span>
        </article>
    `).join("");
}

function logEvent(step) {
    const route = getSelectedRoute();

    eventHistory.unshift({
        type: step.event,
        message: `${step.label} for Route ${route.code}`,
        time: formatTime()
    });
}

function renderEvents() {
    elements.eventLog.innerHTML = eventHistory.map((event) => `
        <li>
            <code>${event.type}</code>
            <span>${event.time} - ${event.message}</span>
        </li>
    `).join("");
}

function applyStep() {
    const route = getSelectedRoute();
    const step = stepIndex >= 0 ? journeySteps[stepIndex] : {
        routeState: route.status,
        busLeft: "16%",
        pickedUp: route.pickedUp,
        parentStatus: "Scheduled",
        parentEtaLabel: "Pickup ETA",
        parentEta: "08:04",
        driverStop: "Oakpark Road",
        driverDistance: "1.2 km",
        driverEta: "3 min",
        action: "Start Route"
    };

    elements.activeRouteCode.textContent = route.code;
    elements.activeOperator.textContent = route.operator;
    elements.activeDriver.textContent = route.driver;
    elements.activeVehicle.textContent = route.vehicle;
    elements.routeStateLabel.textContent = step.routeState;
    elements.busMarker.style.left = step.busLeft;
    elements.pickedUpCount.textContent = `${step.pickedUp} / ${route.pupils} picked up`;
    elements.driverStopName.textContent = step.driverStop;
    elements.driverDistance.textContent = step.driverDistance;
    elements.driverEta.textContent = step.driverEta;
    elements.driverAction.textContent = step.action;
    elements.parentDriver.textContent = route.driver.split(" ")[0];
    elements.parentVehicle.textContent = route.vehicle;
    elements.parentStatus.textContent = step.parentStatus;
    elements.parentEtaLabel.textContent = step.parentEtaLabel;
    elements.parentEta.textContent = step.parentEta;

    renderRoutes();
    renderManifest();
    renderSchedule();
    renderOperatorDocuments();
    renderTickets();
    renderEvents();
}

function advanceJourney() {
    if (stepIndex >= journeySteps.length - 1) {
        return;
    }

    stepIndex += 1;
    logEvent(journeySteps[stepIndex]);
    saveState();
    applyStep();
}

function resetJourney() {
    restoreDefaults();
    applyStep();
}

function addRoute(event) {
    event.preventDefault();

    const formData = new FormData(elements.routeForm);
    const route = {
        code: formData.get("routeCode").toString().trim().toUpperCase(),
        school: formData.get("school").toString().trim(),
        status: "Not started",
        tone: "idle",
        operator: "Unassigned",
        driver: formData.get("driver").toString().trim(),
        vehicle: "Pending",
        startTime: formData.get("startTime").toString(),
        pupils: 0,
        pickedUp: 0
    };

    routes.unshift(route);
    selectedRouteIndex = 0;
    stepIndex = -1;
    elements.routeForm.reset();
    document.querySelector("#startInput").value = "07:55";

    eventHistory.unshift({
        type: "route.created",
        message: `${route.code} created for ${route.school}`,
        time: formatTime()
    });

    saveState();
    applyStep();
}

function addDocument(event) {
    event.preventDefault();

    const formData = new FormData(elements.documentForm);
    const documentType = formData.get("documentType").toString();
    const reference = formData.get("documentReference").toString().trim() || "General operator upload";

    operatorDocuments.unshift([documentType, reference, "Pending"]);
    elements.documentForm.reset();

    eventHistory.unshift({
        type: "document.uploaded",
        message: `${documentType} added to compliance review`,
        time: formatTime()
    });

    saveState();
    applyStep();
}

function addTicket(event) {
    event.preventDefault();

    const message = new FormData(elements.ticketForm).get("ticketMessage").toString().trim();

    if (!message) {
        return;
    }

    tickets.unshift(["Parent support", message, "Open"]);
    elements.ticketForm.reset();

    eventHistory.unshift({
        type: "ticket.created",
        message: "Parent support ticket created",
        time: formatTime()
    });

    saveState();
    applyStep();
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        const view = tab.dataset.view;

        document.querySelectorAll(".nav-tab").forEach((item) => item.classList.remove("active"));
        document.querySelectorAll(".view").forEach((panel) => panel.classList.remove("active"));

        tab.classList.add("active");
        document.querySelector(`#${view}`).classList.add("active");
        elements.viewTitle.textContent = views[view];
    });
});

elements.addRouteButton.addEventListener("click", () => {
    document.querySelector("#routeCodeInput").focus();
});
elements.advanceDemo.addEventListener("click", advanceJourney);
elements.driverAction.addEventListener("click", advanceJourney);
elements.resetDemo.addEventListener("click", resetJourney);
elements.routeForm.addEventListener("submit", addRoute);
elements.documentForm.addEventListener("submit", addDocument);
elements.ticketForm.addEventListener("submit", addTicket);

applyStep();
