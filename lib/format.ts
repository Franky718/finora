export function money(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function labelType(value: string | null | undefined) {
  const labels: Record<string, string> = {
    ingreso: "Ingreso",
    gasto: "Gasto",
    ahorro: "Ahorro",
    efectivo: "Efectivo",
    nomina: "Nómina",
    tarjeta: "Tarjeta",
    inversion: "Inversión",
    otro: "Otra cuenta"
  };
  return value ? labels[value] ?? value : "—";
}