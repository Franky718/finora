import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finora | Finanzas personales",
  description: "Organiza tu dinero, controla tus movimientos y avanza hacia tus metas."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}