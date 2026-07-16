import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth/guards";
import { getCustomers } from "@/lib/data";
import { CustomerManager } from "./customer-manager";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireSession();
  const customers = await getCustomers();
  return <main className="page-shell"><AppShell><div className="admin-content"><CustomerManager customers={customers} /></div></AppShell></main>;
}
