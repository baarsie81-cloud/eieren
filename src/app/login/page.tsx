import { redirect } from "next/navigation";
import { EggIcon } from "@/components/icons";
import { isAuthenticated } from "@/lib/auth/guards";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAuthenticated()) redirect("/");
  const params = await searchParams;
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <EggIcon className="login-logo" />
        <h1 id="login-title">Welkom bij Ei Pim</h1>
        <p>Log in om de bezorgronde en klanten te beheren.</p>
        <LoginForm nextPath={params.next ?? "/"} />
      </section>
    </main>
  );
}

