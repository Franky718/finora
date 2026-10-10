"use client";

import { useState } from "react";
import { createTransactionAction } from "@/app/actions";

type Account = { id: number; nombre: string; moneda: string };
type Category = { id: number; nombre: string; tipo: string; icono: string | null };

export default function TransactionForm({
  accounts,
  categories,
  today
}: {
  accounts: Account[];
  categories: Category[];
  today: string;
}) {
  const [type, setType] = useState("gasto");
  const availableCategories = categories.filter((category) => category.tipo === type);

  return (
    <form action={createTransactionAction} className="stack-form">
      <label>
        Tipo
        <select name="tipo" value={type} onChange={(event) => setType(event.target.value)} required>
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
          <option value="ahorro">Ahorro</option>
        </select>
      </label>
      <label>
        Cuenta
        <select name="cuenta_id" required>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.nombre} ({account.moneda})
            </option>
          ))}
        </select>
      </label>
      <label>
        Categoría
        <select name="categoria_id" required disabled={availableCategories.length === 0}>
          {availableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icono ? `${category.icono} ` : ""}{category.nombre}
            </option>
          ))}
        </select>
        {availableCategories.length === 0 && (
          <span className="field-hint">Crea una categoría para este tipo antes de continuar.</span>
        )}
      </label>
      <label>
        Importe (MXN)
        <input name="monto" type="number" min="0.01" max="1000000000" step="0.01" required placeholder="0.00" />
      </label>
      <label>
        Fecha
        <input name="fecha" type="date" defaultValue={today} required />
      </label>
      <label>
        Descripción
        <input name="descripcion" maxLength={240} placeholder="Ej. Supermercado, nómina..." />
      </label>
      <button className="button primary full-width" type="submit" disabled={availableCategories.length === 0}>
        Guardar movimiento
      </button>
    </form>
  );
}
