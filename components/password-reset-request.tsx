"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RecoveryMethod = "email" | "phone";

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

function rememberRecovery(method: RecoveryMethod, value: string) {
  try {
    window.sessionStorage.setItem("finora-recovery-method", method);
    window.sessionStorage.setItem(method === "email" ? "finora-recovery-email" : "finora-recovery-phone", value);
    window.sessionStorage.removeItem(method === "email" ? "finora-recovery-phone" : "finora-recovery-email");
  } catch {
    // The reset form can ask for the email or phone again when browser storage is unavailable.
  }
}

export default function PasswordResetRequest() {
  const router = useRouter();
  const [method, setMethod] = useState<RecoveryMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    if (method === "phone" && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError("Escribe el número en formato internacional, por ejemplo +528112345678.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (method === "email") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: window.location.origin + "/auth/callback?next=/reset-password"
        });
        if (resetError) throw resetError;

        rememberRecovery("email", normalizedEmail);
        // Do not navigate to the password form yet. For an email recovery flow,
        // the user must first open the link so Supabase can establish a recovery session.
        setSuccess(
          "Solicitud procesada. Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña. Abre el enlace en este mismo navegador y dispositivo; entonces podrás guardar la contraseña nueva. Revisa también Spam o Correo no deseado."
        );
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: normalizedPhone,
          options: { shouldCreateUser: false }
        });
        if (otpError) throw otpError;
        rememberRecovery("phone", normalizedPhone);
        router.push("/reset-password");
      }
    } catch {
      setError(
        method === "email"
          ? "No se pudo procesar la solicitud. Revisa la dirección de correo e inténtalo de nuevo."
          : "No se pudo enviar el SMS. Revisa el número y que esté confirmado en tu cuenta; el envío SMS debe estar configurado en Supabase."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand-mark">F</div>
      <p className="eyebrow">RECUPERAR ACCESO</p>
      <h1>Restablece tu contraseña</h1>
      <p className="muted">
        {method === "email"
          ? "Te enviaremos un enlace seguro. Primero tendrás que abrirlo para verificar que eres tú."
          : "Solicita un código SMS para verificar tu número y recuperar el acceso."}
      </p>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Método de recuperación
          <select
            value={method}
            onChange={(event) => {
              setMethod(event.target.value as RecoveryMethod);
              setError("");
              setSuccess("");
            }}
          >
            <option value="email">Correo electrónico</option>
            <option value="phone">Mensaje SMS</option>
          </select>
        </label>
        {method === "email" ? (
          <label>
            Correo electrónico
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="tu@correo.com" />
          </label>
        ) : (
          <label>
            Celular (formato internacional)
            <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" required placeholder="+528112345678" />
          </label>
        )}
        {method === "phone" && (
          <p className="muted">El celular debe estar agregado y confirmado previamente en tu cuenta de Supabase Auth. El envío SMS debe estar configurado.</p>
        )}
        {error && <p className="notice error" role="alert">{error}</p>}
        {success && <p className="notice success" role="status">{success}</p>}
        <button className="button primary full-width" type="submit" disabled={loading}>
          {loading ? "Procesando..." : method === "email" ? "Enviar enlace de recuperación" : "Enviar código SMS"}
        </button>
      </form>
      <p className="auth-switch"><Link href="/login">← Volver al inicio de sesión</Link></p>
    </div>
  );
}
