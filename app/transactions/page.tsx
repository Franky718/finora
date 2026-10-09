import Link from "next/link";
import { createCategoryAction } from "@/app/actions";
import AppShell from "@/components/app-shell";
import TransactionForm from "@/components/transaction-form";
import { requireUser } from "@/lib/auth/require-user";
import { labelType, money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { supabase, email } = await requireUser();
  const params = await searchParams;
  const [{data:accountsData},{data:categoryData},{data:transactionData}] = await Promise.all([
    supabase.from("cuentas").select("id,nombre,moneda").eq("estado",true).order("nombre"),
    supabase.from("categorias").select("id,nombre,tipo,icono").eq("estado",true).order("nombre"),
    supabase.from("transacciones").select("id,tipo,monto,descripcion,fecha,cuenta_id,categoria_id").order("fecha",{ascending:false}).limit(100)
  ]);
  const accounts=(accountsData??[]) as any[], categories=(categoryData??[]) as any[], transactions=(transactionData??[]) as any[];
  const today=new Date().toISOString().slice(0,10);
  const categoryMap=new Map(categories.map(c=>[c.id,c.nombre]));
  const accountMap=new Map(accounts.map(a=>[a.id,a.nombre]));

  return <AppShell email={email}>
    <section className="page-heading"><div><p className="eyebrow">REGISTRO FINANCIERO</p><h1>Movimientos</h1><p className="muted">Registra ingresos, gastos y movimientos de ahorro.</p></div></section>
    {params.created && <p className="notice success">Movimiento guardado y saldo de la cuenta actualizado.</p>}
    {params.category && <p className="notice success">Categoría personalizada creada.</p>}
    {params.error && <p className="notice error">No se pudo completar la operación. Revisa el tipo, la categoría, la cuenta y el importe.</p>}
    <div className="content-grid">
      <section className="panel form-panel"><div className="panel-heading"><div><h2>Nuevo movimiento</h2><p>Los cambios de saldo se calculan en la base de datos.</p></div></div>
        {accounts.length===0 ? <div className="empty-state compact"><strong>Primero crea una cuenta</strong><p>Necesitas una cuenta activa para registrar movimientos.</p><Link className="button secondary" href="/accounts">Ir a cuentas</Link></div> :
          <TransactionForm accounts={accounts} categories={categories} today={today}/>
        }
      </section>
      <section className="panel form-panel"><div className="panel-heading"><div><h2>Crear categoría</h2><p>Personaliza las etiquetas de tus movimientos.</p></div></div>
        <form action={createCategoryAction} className="stack-form">
          <label>Nombre<input name="nombre" maxLength={80} minLength={2} required placeholder="Ej. Transporte"/></label>
          <label>Tipo<select name="tipo" defaultValue="gasto"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option><option value="ahorro">Ahorro</option></select></label>
          <label>Icono o símbolo<input name="icono" maxLength={16} defaultValue="•"/></label>
          <button className="button secondary full-width" type="submit">＋ Agregar categoría</button>
        </form>
        <div className="category-cloud">{categories.slice(0,18).map(c=><span className="category-chip" key={c.id}>{c.icono || "•"} {c.nombre}</span>)}</div>
      </section>
    </div>
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Historial</h2><p>Hasta los últimos 100 movimientos.</p></div><span className="count-chip">{transactions.length} movimientos</span></div>
      {transactions.length===0 ? <div className="empty-state"><span className="empty-icon">↕</span><strong>No hay movimientos registrados</strong><p>Cuando registres un ingreso o gasto aparecerá aquí.</p></div> : <div className="table-wrap"><table><thead><tr><th>Descripción</th><th>Cuenta</th><th>Categoría</th><th>Fecha</th><th>Importe</th></tr></thead><tbody>{transactions.map(tx=><tr key={tx.id}><td><strong>{tx.descripcion || labelType(tx.tipo)}</strong><small>{labelType(tx.tipo)}</small></td><td>{accountMap.get(tx.cuenta_id) || "Cuenta"}</td><td>{categoryMap.get(tx.categoria_id) || "—"}</td><td>{shortDate(tx.fecha)}</td><td className={tx.tipo==="ingreso"?"positive-text":tx.tipo==="gasto"?"negative-text":""}><strong>{tx.tipo==="ingreso"?"+":tx.tipo==="gasto"?"−":""}{money(tx.monto)}</strong></td></tr>)}</tbody></table></div>}
    </section>
  </AppShell>;
}