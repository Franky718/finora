"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PasswordUpdateForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar la contraseña. Solicita otro enlace.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand-mark">F</div>
      <p className="eyebrow">SEGURIDAD DE TU CUENTA</p>
      <h1>Define una nueva contraseña</h1>
      <p className="muted">Utiliza al menos 8 caracteres y evita reutilizar contraseñas de otros sitios.</p>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>Nueva contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <label>Repite la contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button primary full-width" type="submit" disabled={loading}>{loading ? "Actualizando..." : "Guardar contraseña"}</button>
      </form>
    </div>
  );
}