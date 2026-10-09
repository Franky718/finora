"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + "/auth/callback?next=/reset-password"
      });
      if (resetError) throw resetError;
      setMessage("Si el correo corresponde a una cuenta, recibirás instrucciones para cambiar la contraseña.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo solicitar el restablecimiento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand-mark">F</div>
      <p className="eyebrow">RECUPERAR ACCESO</p>
      <h1>Restablece tu contraseña</h1>
      <p className="muted">Te enviaremos un enlace seguro para definir una nueva contraseña.</p>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>Correo electrónico<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="tu@correo.com" /></label>
        {error && <p className="notice error" role="alert">{error}</p>}
        {message && <p className="notice success" role="status">{message}</p>}
        <button className="button primary full-width" type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar enlace"}</button>
      </form>
      <p className="auth-switch"><Link href="/login">← Volver al inicio de sesión</Link></p>
    </div>
  );
}