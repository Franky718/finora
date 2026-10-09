import { createAccountAction } from "@/app/actions";
import AppShell from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { labelType, money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, email } = await requireUser();
  const params = await searchParams;
  const { data } = await supabase.from("cuentas").select("id,nombre,tipo,saldo_inicial,saldo_actual,moneda,estado,fecha_creacion").order("fecha_creacion", {ascending:false});
  const accounts = (data ?? []) as any[];

  return <AppShell email={email}>
    <section className="page-heading"><div><p className="eyebrow">ORGANIZA TU DINERO</p><h1>Cuentas</h1><p className="muted">Administra los lugares donde tienes tu dinero.</p></div></section>
    {params.created && <p className="notice success">Cuenta creada correctamente.</p>}
    {params.error && <p className="notice error">No se pudo guardar la cuenta. Verifica los campos e inténtalo de nuevo.</p>}
    <div className="content-grid">
      <section className="panel form-panel"><div className="panel-heading"><div><h2>Nueva cuenta</h2><p>Agrega una cuenta a tu resumen.</p></div></div>
        <form action={createAccountAction} className="stack-form">
          <label>Nombre de la cuenta<input name="nombre" placeholder="Ej. Nómina Corning" required minLength={2} maxLength={100}/></label>
          <label>Tipo de cuenta<select name="tipo" defaultValue="nomina"><option value="nomina">Nómina</option><option value="efectivo">Efectivo</option><option value="ahorro">Ahorro</option><option value="tarjeta">Tarjeta</option><option value="inversion">Inversión</option><option value="otro">Otro</option></select></label>
          <label>Saldo inicial (MXN)<input name="saldo_inicial" type="number" min="0" max="1000000000" step="0.01" defaultValue="0" required/></label>
          <p className="field-hint">Esta versión registra únicamente pesos mexicanos para que el total financiero sea comparable.</p>
          <button className="button primary full-width" type="submit">＋ Crear cuenta</button>
        </form>
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>Tus cuentas</h2><p>{accounts.length} registros</p></div></div>
        {accounts.length===0 ? <div className="empty-state"><span className="empty-icon">▤</span><strong>No tienes cuentas todavía</strong><p>Usa el formulario para agregar tu primera cuenta.</p></div> : <div className="table-wrap"><table><thead><tr><th>Cuenta</th><th>Tipo</th><th>Saldo inicial</th><th>Saldo actual</th><th>Estado</th></tr></thead><tbody>{accounts.map(a=><tr key={a.id}><td><strong>{a.nombre}</strong><small>{shortDate(a.fecha_creacion)}</small></td><td>{labelType(a.tipo)}</td><td>{money(a.saldo_inicial)}</td><td><strong>{money(a.saldo_actual)} <small>{a.moneda}</small></strong></td><td><span className="status-pill">{a.estado ? "Activa" : "Inactiva"}</span></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </AppShell>;
}