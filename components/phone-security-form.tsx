"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

export default function PhoneSecurityForm() {
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    createClient().auth.getUser().then(({ data, error: userError }) => {
      if (active && !userError && data.user) {
        setPhone(data.user.phone ?? "");
        setVerified(Boolean(data.user.phone_confirmed_at));
      }
    });
    return () => { active = false; };
  }, []);

  async function requestVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalizedPhone = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setError("Escribe el celular en formato internacional, por ejemplo +528112345678.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ phone: normalizedPhone });
      if (updateError) throw updateError;
      setPendingPhone(normalizedPhone);
      setMessage("Enviamos un código por SMS. Introdúcelo para confirmar que el celular es tuyo.");
    } catch {
      setError("No se pudo enviar el SMS. Comprueba que Phone y el proveedor SMS estén configurados en Supabase.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(token.trim())) {
      setError("El código debe tener seis dígitos.");
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await createClient().auth.verifyOtp({
        phone: pendingPhone,
        token: token.trim(),
        type: "phone_change"
      });
      if (verifyError) throw verifyError;
      setPhone(pendingPhone);
      setPendingPhone("");
      setToken("");
      setVerified(true);
      setMessage("Celular confirmado. Ya puedes solicitar la recuperación por SMS.");
    } catch {
      setError("No se pudo verificar el código. Revisa el SMS más reciente e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Celular de recuperación</h2><p>Confirma un número propio para recuperar tu acceso por SMS.</p></div></div>
      <form className="stack-form" onSubmit={requestVerification}>
        <label>Celular (formato internacional)<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setVerified(false); }} required placeholder="+528112345678" /></label>
        <button className="button primary" type="submit" disabled={loading}>{loading ? "Enviando..." : verified ? "Cambiar o volver a verificar celular" : "Enviar código de verificación"}</button>
      </form>
      {pendingPhone && (
        <form className="stack-form" onSubmit={confirmPhone}>
          <label>Código SMS<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
          <button className="button secondary" type="submit" disabled={loading}>{loading ? "Verificando..." : "Confirmar celular"}</button>
        </form>
      )}
      {verified && <p className="notice" role="status">Celular confirmado para esta cuenta.</p>}
      {message && <p className="notice" role="status">{message}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
    </section>
  );
}
