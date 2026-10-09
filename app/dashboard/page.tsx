import Link from "next/link";
import AppShell from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { labelType, money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, email } = await requireUser();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const [accountsResult, recentResult, monthResult, goalsResult] = await Promise.all([
    supabase.from("cuentas").select("id,nombre,tipo,saldo_actual,moneda,estado").eq("estado", true).order("fecha_creacion", { ascending: false }),
    supabase.from("transacciones").select("id,tipo,monto,descripcion,fecha,cuenta_id").order("fecha", { ascending: false }).limit(8),
    supabase.from("transacciones").select("tipo,monto,fecha").gte("fecha", monthStart).lt("fecha", nextMonthStart),
    supabase.from("metas_ahorro").select("id,nombre,monto_objetivo,monto_actual,fecha_objetivo,estado").neq("estado", "cancelada").order("created_at", { ascending: false }).limit(4)
  ]);

  const accounts = (accountsResult.data ?? []) as any[];
  const transactions = (recentResult.data ?? []) as any[];
  const monthTransactions = (monthResult.data ?? []) as any[];
  const goals = (goalsResult.data ?? []) as any[];

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.saldo_actual ?? 0), 0);
  const income = monthTransactions.filter((tx) => tx.tipo === "ingreso").reduce((sum, tx) => sum + Number(tx.monto), 0);
  const expenses = monthTransactions.filter((tx) => tx.tipo === "gasto").reduce((sum, tx) => sum + Number(tx.monto), 0);

  return (
    <AppShell email={email}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">TU RESUMEN</p>
          <h1>Hola, bienvenido a Finora<span className="text-accent">.</span></h1>
          <p className="muted">Una vista clara de tu dinero para tomar mejores decisiones.</p>
        </div>
        <span className="date-chip">{new Intl.DateTimeFormat("es-MX", { dateStyle:"long" }).format(new Date())}</span>
      </section>

      <section className="metric-grid">
        <article className="metric-card feature">
          <div className="metric-top"><span>Saldo total en cuentas</span><span className="metric-icon">₱</span></div>
          <p className="metric-value">{money(totalBalance)}</p>
          <p className="metric-foot">{accounts.length} {accounts.length === 1 ? "cuenta activa" : "cuentas activas"} · las cuentas se muestran en MXN</p>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Ingresos del mes</span><span className="metric-icon green">↗</span></div>
          <p className="metric-value">{money(income)}</p>
          <p className="metric-foot">Todos los ingresos del mes actual</p>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Gastos del mes</span><span className="metric-icon orange">↘</span></div>
          <p className="metric-value">{money(expenses)}</p>
          <p className="metric-foot">Todos los gastos del mes actual</p>
        </article>
      </section>

      <section className="quick-actions">
        <Link href="/accounts" className="quick-action"><span className="quick-icon">＋</span><span><strong>Nueva cuenta</strong><small>Agrega una cuenta financiera</small></span><b>→</b></Link>
        <Link href="/transactions" className="quick-action"><span className="quick-icon mint">↕</span><span><strong>Registrar movimiento</strong><small>Captura un ingreso o gasto</small></span><b>→</b></Link>
        <Link href="/goals" className="quick-action"><span className="quick-icon lilac">◎</span><span><strong>Meta de ahorro</strong><small>Define tu siguiente objetivo</small></span><b>→</b></Link>
      </section>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading"><div><h2>Movimientos recientes</h2><p>Los últimos registros de tu actividad</p></div><Link href="/transactions" className="text-link">Ver todos →</Link></div>
          {transactions.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">↕</span><strong>Aún no hay movimientos</strong><p>Registra tu primer ingreso o gasto para empezar.</p><Link href="/transactions" className="button secondary">Registrar movimiento</Link></div>
          ) : (
            <div className="movement-list">
              {transactions.slice(0, 6).map((tx) => (
                <div className="movement-row" key={tx.id}>
                  <span className={"movement-symbol " + (tx.tipo === "ingreso" ? "positive" : tx.tipo === "gasto" ? "negative" : "neutral")}>{tx.tipo === "ingreso" ? "↗" : tx.tipo === "gasto" ? "↘" : "◎"}</span>
                  <div className="movement-main"><strong>{tx.descripcion || labelType(tx.tipo)}</strong><span>{labelType(tx.tipo)} · {shortDate(tx.fecha)}</span></div>
                  <strong className={"movement-amount " + (tx.tipo === "ingreso" ? "positive-text" : tx.tipo === "gasto" ? "negative-text" : "")}>{tx.tipo === "ingreso" ? "+" : tx.tipo === "gasto" ? "−" : ""}{money(tx.monto)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h2>Tus cuentas</h2><p>Saldo por cuenta</p></div><Link href="/accounts" className="text-link">Administrar →</Link></div>
          {accounts.length === 0 ? (
            <div className="empty-state compact"><span className="empty-icon">▤</span><strong>Agrega tu primera cuenta</strong><p>Por ejemplo, nómina, efectivo o ahorro.</p><Link href="/accounts" className="text-link">Crear cuenta →</Link></div>
          ) : (
            <div className="account-list">
              {accounts.slice(0, 5).map((account, i) => (
                <div className="account-row" key={account.id}><span className={"account-symbol c" + (i % 4)}>{account.tipo === "tarjeta" ? "▣" : account.tipo === "inversion" ? "↗" : "▤"}</span><div className="movement-main"><strong>{account.nombre}</strong><span>{labelType(account.tipo)} · {account.moneda}</span></div><strong>{money(account.saldo_actual)}</strong></div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel goals-panel">
        <div className="panel-heading"><div><h2>Metas de ahorro</h2><p>Pequeños avances, grandes resultados</p></div><Link href="/goals" className="text-link">Ver metas →</Link></div>
        {goals.length === 0 ? (
          <div className="empty-inline"><span>◎</span><div><strong>Empieza por una meta</strong><p>Un fondo de emergencia, un viaje o lo que sea importante para ti.</p></div><Link href="/goals" className="button secondary">Crear meta</Link></div>
        ) : (
          <div className="goal-grid">{goals.map((goal) => { const pct = Math.min(100, Math.max(0, Number(goal.monto_objetivo) ? Number(goal.monto_actual) / Number(goal.monto_objetivo) * 100 : 0)); return <article className="goal-mini" key={goal.id}><div className="goal-mini-top"><span>◎</span><span>{Math.round(pct)}%</span></div><h3>{goal.nombre}</h3><div className="progress"><span style={{width:pct+"%"}} /></div><p>{money(goal.monto_actual)} <span>de {money(goal.monto_objetivo)}</span></p></article>; })}</div>
        )}
      </section>
    </AppShell>
  );
}