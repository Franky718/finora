import { createContributionAction, createGoalAction } from "@/app/actions";
import AppShell from "@/components/app-shell";
import { requireUser } from "@/lib/auth/require-user";
import { money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function GoalsPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { supabase, email } = await requireUser();
  const params=await searchParams;
  const [{data:goalData},{data:contributionData}]=await Promise.all([
    supabase.from("metas_ahorro").select("id,nombre,descripcion,monto_objetivo,monto_actual,fecha_inicio,fecha_objetivo,estado").order("created_at",{ascending:false}),
    supabase.from("aportaciones_ahorro").select("id,meta_id,monto,descripcion,fecha").order("fecha",{ascending:false}).limit(25)
  ]);
  const goals=(goalData??[]) as any[];
  const contributions=(contributionData??[]) as any[];
  const goalsMap=new Map(goals.map(g=>[g.id,g.nombre]));

  return <AppShell email={email}>
    <section className="page-heading"><div><p className="eyebrow">PLANEA TU FUTURO</p><h1>Metas de ahorro</h1><p className="muted">Define objetivos concretos y visualiza cuánto falta para alcanzarlos.</p></div></section>
    {params.created && <p className="notice success">Meta creada correctamente.</p>}
    {params.contributed && <p className="notice success">Aportación registrada y avance de la meta actualizado.</p>}
    {params.error && <p className="notice error">No se pudo guardar la operación. Verifica la meta y el importe.</p>}
    <div className="content-grid goals-layout">
      <section className="panel form-panel"><div className="panel-heading"><div><h2>Nueva meta</h2><p>Ponle nombre a tu próximo objetivo.</p></div></div>
        <form action={createGoalAction} className="stack-form">
          <label>Nombre de la meta<input name="nombre" required minLength={2} maxLength={120} placeholder="Ej. Fondo de emergencia"/></label>
          <label>Monto objetivo (MXN)<input name="monto_objetivo" type="number" min="0.01" max="1000000000" step="0.01" required placeholder="10000.00"/></label>
          <label>Fecha objetivo (opcional)<input name="fecha_objetivo" type="date"/></label>
          <label>Descripción<textarea name="descripcion" maxLength={240} rows={3} placeholder="¿Para qué estás ahorrando?"/></label>
          <button className="button primary full-width" type="submit">＋ Crear meta</button>
        </form>
      </section>
      <section className="panel form-panel"><div className="panel-heading"><div><h2>Registrar aportación</h2><p>El progreso se actualiza automáticamente.</p></div></div>
        {goals.filter(g=>g.estado!=="cancelada").length===0 ? <div className="empty-state compact"><strong>Primero crea una meta</strong><p>Después podrás registrar las aportaciones.</p></div> : <form action={createContributionAction} className="stack-form">
          <label>Meta<select name="meta_id" required>{goals.filter(g=>g.estado!=="cancelada").map(g=><option key={g.id} value={g.id}>{g.nombre}</option>)}</select></label>
          <label>Importe de la aportación (MXN)<input name="monto" type="number" min="0.01" max="1000000000" step="0.01" required placeholder="500.00"/></label>
          <label>Descripción<input name="descripcion" maxLength={240} placeholder="Ej. Ahorro quincenal"/></label>
          <button className="button secondary full-width" type="submit">＋ Registrar aportación</button>
        </form>}
      </section>
    </div>
    <section className="goal-board goals-board-full">{goals.length===0 ? <div className="panel empty-state"><span className="empty-icon">◎</span><strong>Todavía no tienes metas</strong><p>Crea una meta para empezar a planear tu ahorro.</p></div> : goals.map(g=>{const target=Number(g.monto_objetivo)||0;const current=Number(g.monto_actual)||0;const pct=Math.min(100,Math.max(0,target?current/target*100:0)); return <article className="panel goal-card" key={g.id}><div className="goal-header"><span className="goal-art">◎</span><span className={"status-pill "+(g.estado==="completada"?"completed":"")}>{g.estado}</span></div><h2>{g.nombre}</h2><p className="muted">{g.descripcion || "Cada aporte te acerca a tu objetivo."}</p><div className="goal-stats"><strong>{money(current)}</strong><span>de {money(target)}</span></div><div className="progress large"><span style={{width:pct+"%"}}/></div><div className="goal-bottom"><span>{Math.round(pct)}% completado</span><span>{g.fecha_objetivo ? "Objetivo: "+shortDate(g.fecha_objetivo) : "Desde "+shortDate(g.fecha_inicio)}</span></div></article>;})}
    </section>
    <section className="panel table-panel"><div className="panel-heading"><div><h2>Últimas aportaciones</h2><p>Los últimos 25 registros de ahorro.</p></div></div>
      {contributions.length===0 ? <div className="empty-state compact"><strong>Aún no hay aportaciones</strong><p>Cuando registres la primera, aparecerá aquí.</p></div> : <div className="table-wrap"><table><thead><tr><th>Meta</th><th>Descripción</th><th>Fecha</th><th>Importe</th></tr></thead><tbody>{contributions.map(c=><tr key={c.id}><td><strong>{goalsMap.get(c.meta_id)||"Meta"}</strong></td><td>{c.descripcion||"Aportación"}</td><td>{shortDate(c.fecha)}</td><td className="positive-text"><strong>{money(c.monto)}</strong></td></tr>)}</tbody></table></div>}
    </section>
  </AppShell>;
}