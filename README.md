# RouteFlow

RouteFlow is a prototype for a real-time school transport platform connecting administrators, operators, drivers, and families.

This first version is deliberately small and usable:

- Admin / staff control tower
- Driver and bus operator route screen
- Parent journey and account screen
- Driver and vehicle register
- Simulated journey events
- Live state updates driven by those events
- Browser persistence for demo-created routes, documents, tickets, and events

Open `index.html` through a local web server to try the prototype.

## Product Areas

### Admin / Staff

- Manage schools, routes, stops, drivers, operators, vehicles, and pupils.
- Monitor live route health, delays, incidents, and active journeys.
- Add driver and vehicle records into the operational register.
- Update selected route assignments including operator, driver, vehicle, pupil count, and route status.
- Assign pupils to pickup stops for the selected route.
- Review compliance documents such as licences, bus insurance, CVRT certificates, and operator contracts.
- Handle parent tickets, payments, reports, and audit logs.
- Current sections: Overview, Routes, People, Compliance.

### Driver / Bus Operator

- View assigned runs and route details.
- Start journeys, mark stops, confirm pupils boarded, report delays, and complete routes.
- See route-specific pupil pickup assignments from the admin route plan.
- Upload documents for drivers, vehicles, and operator contracts.
- Track review status for submitted compliance items.
- Current sections: Run Sheet, Documents, Payments.

### Parent / Guardian

- View live pickup/drop-off status and bus ETA.
- Manage child and guardian details.
- See pickup details from the assigned route.
- Pay fees, view tickets, manage notifications, and report absences.
- Current sections: Journey, Details, Payments, Tickets, Notifications.

## Current Prototype

The app is still frontend-only. Data is stored in `localStorage` so demo changes survive refreshes in the same browser.

## Next Milestones

1. Convert to a typed app structure with reusable components.
2. Add a database schema for routes, stops, pupils, guardians, drivers, operators, vehicles, journeys, documents, tickets, payments, notifications, and audit logs.
3. Add authentication and role-based portals.
4. Build a real driver journey flow backed by stored journey events.
5. Add parent notifications and payment tracking.
