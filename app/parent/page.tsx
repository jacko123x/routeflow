import RouteFlowApp from "../components/RouteFlowApp";

// Parent route for family self-service, journey tracking, payments, tickets, and notifications.
export default function ParentPage() {
  return <RouteFlowApp initialPortal="parent" lockedPortal />;
}
