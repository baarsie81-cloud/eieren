import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth/guards";
import { getRound, getRounds, getSettings } from "@/lib/data";
import { getNextWeekday } from "@/lib/format";
import { RoundManager } from "./round-manager";

export const dynamic = "force-dynamic";

export default async function RoundsPage({ searchParams }: { searchParams: Promise<{ round?: string }> }) {
  await requireSession();
  const params = await searchParams;
  const [rounds, settings, selectedRound] = await Promise.all([getRounds(), getSettings(), params.round ? getRound(params.round) : Promise.resolve(null)]);
  return <main className="page-shell"><AppShell><div className="admin-content"><RoundManager rounds={rounds} selectedRound={selectedRound} suggestedDate={getNextWeekday(settings.roundDay)} suggestedTitle={settings.roundTitle} /></div></AppShell></main>;
}
