"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PasswordResetRequest() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: new URL("/auth/callback?next=/reset-password", window.location.origin).toString()
      });
      if (resetError) throw resetError;
      window.sessionStorage.setItem("finora-recovery-email", normalizedEmail);
      router.push("/reset-password");
    } catch {
      setError("No se pudo procesar la solicitud. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand-mark">F</div>
      <p className="eyebrow">RECUPERAR ACCESO</p>
      <h1>Restablece tu contraseña</h1>
      <p className="muted">Te enviaremos un enlace seguro y un código al correo asociado a tu cuenta.</p>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>Correo electrónico<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="tu@correo.com" /></label>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button primary full-width" type="submit" disabled={loading}>{loading ? "Enviando..." : "Continuar"}</button>
      </form>
      <p className="auth-switch"><Link href="/login">← Volver al inicio de sesión</Link></p>
    </div>
  );
}
