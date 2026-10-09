"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function numericId(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function amount(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1_000_000_000
    ? Math.round(parsed * 100) / 100
    : null;
}

async function requireSignedIn() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return supabase;
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createAccountAction(formData: FormData) {
  const supabase = await requireSignedIn();
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 100);
  const tipo = String(formData.get("tipo") ?? "otro");
  const rawBalance = String(formData.get("saldo_inicial") ?? "");
  const initialBalance = Number(rawBalance);
  const validTypes = ["efectivo", "nomina", "ahorro", "tarjeta", "inversion", "otro"];

  if (nombre.length < 2 || rawBalance.trim() === "" || !Number.isFinite(initialBalance) ||
      initialBalance < 0 || initialBalance > 1_000_000_000 || !validTypes.includes(tipo)) {
    redirect("/accounts?error=validation");
  }

  // This MVP is MXN-only, to avoid adding USD and MXN balances together.
  const { error } = await supabase.from("cuentas").insert({
    nombre,
    tipo,
    saldo_inicial: Math.round(initialBalance * 100) / 100,
    saldo_actual: Math.round(initialBalance * 100) / 100,
    moneda: "MXN"
  } as any);

  if (error) redirect("/accounts?error=save");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  redirect("/accounts?created=1");
}

export async function createTransactionAction(formData: FormData) {
  const supabase = await requireSignedIn();
  const cuentaId = numericId(formData.get("cuenta_id"));
  const categoriaId = numericId(formData.get("categoria_id"));
  const tipo = String(formData.get("tipo") ?? "");
  const monto = amount(formData.get("monto"));
  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 240);
  const fecha = String(formData.get("fecha") ?? new Date().toISOString().slice(0, 10));

  if (!cuentaId || !categoriaId || !monto || !["ingreso", "gasto", "ahorro"].includes(tipo) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    redirect("/transactions?error=validation");
  }

  const { data: matchingCategory, error: categoryError } = await supabase
    .from("categorias").select("id").eq("id", categoriaId).eq("tipo", tipo).eq("estado", true).maybeSingle();

  if (categoryError || !matchingCategory) redirect("/transactions?error=category");

  const { error } = await supabase.from("transacciones").insert({
    cuenta_id: cuentaId,
    categoria_id: categoriaId,
    tipo,
    monto,
    descripcion: descripcion || null,
    fecha: new Date(fecha + "T12:00:00").toISOString()
  } as any);

  if (error) redirect("/transactions?error=save");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  redirect("/transactions?created=1");
}

export async function createGoalAction(formData: FormData) {
  const supabase = await requireSignedIn();
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 120);
  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 240);
  const objetivo = amount(formData.get("monto_objetivo"));
  const fechaObjetivo = String(formData.get("fecha_objetivo") ?? "").trim();

  if (nombre.length < 2 || !objetivo ||
      (fechaObjetivo && !/^\d{4}-\d{2}-\d{2}$/.test(fechaObjetivo))) {
    redirect("/goals?error=validation");
  }

  const { error } = await supabase.from("metas_ahorro").insert({
    nombre,
    descripcion: descripcion || null,
    monto_objetivo: objetivo,
    monto_actual: 0,
    ...(fechaObjetivo ? { fecha_objetivo: fechaObjetivo } : {})
  } as any);

  if (error) redirect("/goals?error=save");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  redirect("/goals?created=1");
}

export async function createContributionAction(formData: FormData) {
  const supabase = await requireSignedIn();
  const metaId = numericId(formData.get("meta_id"));
  const monto = amount(formData.get("monto"));
  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 240);

  if (!metaId || !monto) redirect("/goals?error=validation");

  const { data: goal, error: goalError } = await supabase
    .from("metas_ahorro").select("id").eq("id", metaId).maybeSingle();

  if (goalError || !goal) redirect("/goals?error=goal");

  const { error } = await supabase.from("aportaciones_ahorro").insert({
    meta_id: metaId,
    monto,
    descripcion: descripcion || null,
    fecha: new Date().toISOString()
  } as any);

  if (error) redirect("/goals?error=contribution");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  redirect("/goals?contributed=1");
}

export async function createCategoryAction(formData: FormData) {
  const supabase = await requireSignedIn();
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);
  const tipo = String(formData.get("tipo") ?? "");
  const icono = String(formData.get("icono") ?? "•").trim().slice(0, 16);
  if (nombre.length < 2 || !["ingreso", "gasto", "ahorro"].includes(tipo)) {
    redirect("/transactions?error=validation");
  }

  const { error } = await supabase.from("categorias").insert({
    nombre, tipo, icono: icono || "•", estado: true
  } as any);

  if (error) redirect("/transactions?error=category");
  revalidatePath("/transactions");
  redirect("/transactions?category=created");
}