import { AppShell } from "@/components/app-shell";
import { DeliveryDashboard } from "@/components/delivery-dashboard";
import { requireSession } from "@/lib/auth/guards";
import { getCurrentRound, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireSession();
  const [round, settings] = await Promise.all([getCurrentRound(), getSettings()]);
  return (
    <main className="page-shell">
      <AppShell><DeliveryDashboard round={round} settings={settings} /></AppShell>
    </main>
  );
}
