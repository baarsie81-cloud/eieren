import { DeliveryDashboard } from "@/components/delivery-dashboard";
import { demoStops } from "@/data/demo-stops";

export default function HomePage() {
  return (
    <main className="page-shell">
      <DeliveryDashboard initialStops={demoStops} />
    </main>
  );
}
