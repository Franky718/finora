"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RecoveryMethod = "email" | "phone";

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

export default function PasswordUpdateForm() {
  const router = useRouter();
  const [method, setMethod] = useState<RecoveryMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedMethod = window.sessionStorage.getItem("finora-recovery-method");
      if (storedMethod === "phone") setMethod("phone");
      setEmail(window.sessionStorage.getItem("finora-recovery-email") ?? "");
      setPhone(window.sessionStorage.getItem("finora-recovery-phone") ?? "");
    } catch {
      // The user can enter the recovery identifier manually.
    }

    if (new URLSearchParams(window.location.search).get("recovery") === "invalid") {
      setError("El enlace venció o ya se utilizó. Solicita un código nuevo y abre el mensaje más reciente.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    if (token.trim() && method === "email" && !normalizedEmail) {
      setError("Escribe el correo donde recibiste el código.");
      return;
    }
    if (method === "phone" && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError("Escribe el celular en formato internacional, por ejemplo +528112345678.");
      return;
    }
    if (method === "phone" && !/^\d{6}$/.test(token.trim())) {
      setError("Escribe el código de seis dígitos que recibiste por SMS.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (token.trim()) {
        const verification = method === "phone"
          ? await supabase.auth.verifyOtp({ phone: normalizedPhone, token: token.trim(), type: "sms" })
          : await supabase.auth.verifyOtp({ email: normalizedEmail, token: token.trim(), type: "recovery" });
        if (verification.error || !verification.data.session) {
          throw verification.error ?? new Error("No se creó una sesión de recuperación válida.");
        }
      } else {
        // For email-link recovery, the callback must have established a valid session.
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) {
          setError("No hay una sesión de recuperación válida. Abre el enlace más reciente del correo o solicita un código nuevo.");
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      try {
        window.sessionStorage.removeItem("finora-recovery-email");
        window.sessionStorage.removeItem("finora-recovery-phone");
        window.sessionStorage.removeItem("finora-recovery-method");
      } catch {
        // A leftover recovery identifier is not used to authorize future requests.
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo verificar el código o enlace. Solicita uno nuevo y vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand-mark">F</div>
      <p className="eyebrow">SEGURIDAD DE TU CUENTA</p>
      <h1>Restablece tu contraseña</h1>
      <p className="muted">Verifica el código SMS o el enlace del correo antes de guardar la nueva contraseña.</p>
      <form className="stack-form" onSubmit={handleSubmit}>
        {method === "phone" ? (
          <>
            <label>Celular<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required placeholder="+528112345678" /></label>
            <label>Código recibido por SMS<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
          </>
        ) : (
          <>
            <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required={Boolean(token.trim())} /></label>
            <label>Código de recuperación (déjalo vacío si abriste el enlace)<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
          </>
        )}
        <label>Nueva contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <label>Repite la contraseña<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button primary full-width" type="submit" disabled={loading}>{loading ? "Verificando y actualizando..." : "Verificar y guardar contraseña"}</button>
      </form>
      <p className="auth-switch"><Link href="/forgot-password">Solicitar otro enlace o código</Link></p>
    </div>
  );
}
