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

const routes = [
    ["KY-014", "St Brendan's College", "Preparing", ""],
    ["KY-021", "Presentation", "On time", ""],
    ["KY-032", "CBS Tralee", "+11 min", "watch"],
    ["KY-041", "Mercy Mounthawk", "On time", ""],
    ["KY-052", "Gaelcholaiste", "Incident", "late"]
];

const pupils = [
    ["Emma Murphy", "pending"],
    ["Daniel O'Shea", "pending"],
    ["Sarah Walsh", "absent"],
    ["Tom Barrett", "pending"],
    ["Mia Keane", "pending"]
];

let stepIndex = -1;
const eventHistory = [];

const views = {
    operations: "Operations Control",
    driver: "Driver Route",
    parent: "Parent Journey",
    events: "Event Stream"
};

const elements = {
    viewTitle: document.querySelector("#viewTitle"),
    routeList: document.querySelector("#routeList"),
    manifestList: document.querySelector("#manifestList"),
    eventLog: document.querySelector("#eventLog"),
    advanceDemo: document.querySelector("#advanceDemo"),
    resetDemo: document.querySelector("#resetDemo"),
    routeStateLabel: document.querySelector("#routeStateLabel"),
    busMarker: document.querySelector("#busMarker"),
    pickedUpCount: document.querySelector("#pickedUpCount"),
    driverStopName: document.querySelector("#driverStopName"),
    driverDistance: document.querySelector("#driverDistance"),
    driverEta: document.querySelector("#driverEta"),
    driverAction: document.querySelector("#driverAction"),
    parentStatus: document.querySelector("#parentStatus"),
    parentEtaLabel: document.querySelector("#parentEtaLabel"),
    parentEta: document.querySelector("#parentEta")
};

function renderRoutes() {
    elements.routeList.innerHTML = routes.map((route, index) => {
        const [code, school, status, tone] = route;
        const currentStatus = index === 0 && stepIndex >= 0 ? journeySteps[stepIndex].routeState : status;
        const statusClass = tone ? ` ${tone}` : "";

        return `
            <article class="route-row">
                <div>
                    <strong>${code}</strong>
                    <span>${school}</span>
                </div>
                <span class="route-status${statusClass}">${currentStatus}</span>
            </article>
        `;
    }).join("");
}

function renderManifest() {
    const boarded = stepIndex >= 3;

    elements.manifestList.innerHTML = pupils.map(([name, state]) => {
        const isAbsent = state === "absent";
        const label = isAbsent ? "Absent" : boarded ? "Boarded" : "Waiting";
        const rowClass = isAbsent ? " manifest-row absent" : "manifest-row";
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

function logEvent(step) {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    eventHistory.unshift({
        type: step.event,
        message: `${step.label} for Route KY-014`,
        time
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
    const step = stepIndex >= 0 ? journeySteps[stepIndex] : {
        routeState: "Preparing",
        busLeft: "16%",
        pickedUp: 0,
        parentStatus: "Scheduled",
        parentEtaLabel: "Pickup ETA",
        parentEta: "08:04",
        driverStop: "Oakpark Road",
        driverDistance: "1.2 km",
        driverEta: "3 min",
        action: "Start Route"
    };

    elements.routeStateLabel.textContent = step.routeState;
    elements.busMarker.style.left = step.busLeft;
    elements.pickedUpCount.textContent = `${step.pickedUp} / 23 picked up`;
    elements.driverStopName.textContent = step.driverStop;
    elements.driverDistance.textContent = step.driverDistance;
    elements.driverEta.textContent = step.driverEta;
    elements.driverAction.textContent = step.action;
    elements.parentStatus.textContent = step.parentStatus;
    elements.parentEtaLabel.textContent = step.parentEtaLabel;
    elements.parentEta.textContent = step.parentEta;

    renderRoutes();
    renderManifest();
    renderEvents();
}

function advanceJourney() {
    if (stepIndex >= journeySteps.length - 1) {
        return;
    }

    stepIndex += 1;
    logEvent(journeySteps[stepIndex]);
    applyStep();
}

function resetJourney() {
    stepIndex = -1;
    eventHistory.length = 0;
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

elements.advanceDemo.addEventListener("click", advanceJourney);
elements.driverAction.addEventListener("click", advanceJourney);
elements.resetDemo.addEventListener("click", resetJourney);

applyStep();
