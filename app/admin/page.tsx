import RouteFlowApp from "../components/RouteFlowApp";

// Admin route for school transport staff. This locks the shared app shell to staff-only views.
export default function AdminPage() {
  return <RouteFlowApp initialPortal="operations" lockedPortal />;
}
