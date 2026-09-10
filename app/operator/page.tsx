import RouteFlowApp from "../components/RouteFlowApp";

// Operator route for bus companies and drivers. This locks the shell to run, document, and payment tools.
export default function OperatorPage() {
  return <RouteFlowApp initialPortal="driver" lockedPortal />;
}
