import Link from "next/link";
import { signOutAction } from "@/app/actions";

const navigation = [
  { href: "/dashboard", label: "Resumen", mark: "⌂" },
  { href: "/accounts", label: "Cuentas", mark: "▤" },
  { href: "/transactions", label: "Movimientos", mark: "↕" },
  { href: "/goals", label: "Metas de ahorro", mark: "◎" }
];

export default function AppShell({
  children,
  email
}: {
  children: React.ReactNode;
  email: string;
}) {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">F</span>
          <span>finora<span className="brand-dot">.</span></span>
        </Link>
        <p className="nav-caption">MENÚ PRINCIPAL</p>
        <nav className="side-nav" aria-label="Menú principal">
          {navigation.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              <span className="nav-icon">{item.mark}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar">{(email[0] || "F").toUpperCase()}</div>
            <div className="profile-copy">
              <strong>Mi cuenta</strong>
              <span title={email}>{email || "Usuario Finora"}</span>
            </div>
          </div>
          <form action={signOutAction}>
            <button className="signout-button" type="submit">↪ Cerrar sesión</button>
          </form>
          <p className="sidebar-note">Tus finanzas, bajo control.</p>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">FINANZAS PERSONALES</span>
            <div className="topbar-title">Tu espacio financiero</div>
          </div>
          <div className="secure-label"><span /> Sesión protegida</div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}