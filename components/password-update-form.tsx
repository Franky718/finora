"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PasswordUpdateForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("recovery") === "invalid") {
      setError("El enlace de recuperación venció o ya se utilizó. Solicita uno nuevo y abre el correo más reciente.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (token.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
          setError("Escribe el correo asociado a tu cuenta y el código recibido.");
          return;
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: token.trim(),
          type: "recovery"
        });
        if (verifyError) throw verifyError;
      } else {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) {
          setError("No hay una sesión de recuperación válida. Abre el enlace más reciente del correo o verifica el código recibido.");
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo verificar la recuperación. Solicita un enlace o código nuevo y vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand-mark">F</div>
      <p className="eyebrow">SEGURIDAD DE TU CUENTA</p>
      <h1>Restablece tu contraseña</h1>
      <p className="muted">Abre el enlace del correo o verifica el código de recuperación antes de guardar la nueva contraseña.</p>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required={Boolean(token.trim())} /></label>
        <label>Código de recuperación (déjalo vacío si abriste el enlace)<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
        <label>Nueva contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <label>Repite la contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button primary full-width" type="submit" disabled={loading}>{loading ? "Verificando y actualizando..." : "Verificar y guardar contraseña"}</button>
      </form>
      <p className="auth-switch"><Link href="/forgot-password">Solicitar otro enlace o código</Link></p>
    </div>
  );
}
