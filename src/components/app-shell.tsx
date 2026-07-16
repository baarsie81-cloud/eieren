import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { CalendarIcon, EggIcon, HomeIcon, LogoutIcon, SettingsIcon, UsersIcon } from "./icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="app-frame">
      <header className="app-header">
        <Link className="brand" href="/" aria-label="Naar actuele bezorgronde">
          <EggIcon className="brand-mark" />
          <span>
            <span className="brand-name">Ei Pim</span>
            <span className="brand-subtitle">Bezorgapp</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Hoofdnavigatie">
          <Link href="/"><HomeIcon className="icon" />Ronde</Link>
          <Link href="/beheer/klanten"><UsersIcon className="icon" />Klanten</Link>
          <Link href="/beheer/rondes"><CalendarIcon className="icon" />Historie</Link>
          <Link href="/instellingen"><SettingsIcon className="icon" />Instellingen</Link>
        </nav>
        <form action={logoutAction}>
          <button className="icon-button" type="submit" aria-label="Uitloggen" title="Uitloggen"><LogoutIcon className="icon" /></button>
        </form>
      </header>
      {children}
    </section>
  );
}

