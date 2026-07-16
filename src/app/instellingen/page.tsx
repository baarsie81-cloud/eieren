import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth/guards";
import { getSettings } from "@/lib/data";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireSession();
  const settings = await getSettings();
  return (
    <main className="page-shell"><AppShell><div className="admin-content"><section className="admin-section narrow"><div className="section-heading"><div><h1>Instellingen</h1><p>Basisgegevens voor nieuwe bezorgrondes.</p></div></div><SettingsForm settings={settings} /></section></div></AppShell></main>
  );
}

