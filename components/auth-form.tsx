"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = { mode: "login" | "signup" };

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const nombre = String(form.get("nombre") ?? "").trim();
    const apellido = String(form.get("apellido") ?? "").trim();

    try {
      const supabase = createClient();

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre,
              apellido,
              full_name: [nombre, apellido].filter(Boolean).join(" ")
            },
            emailRedirectTo: window.location.origin + "/auth/callback?next=/dashboard"
          }
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage("La cuenta se creó. Revisa tu correo y confirma la dirección para poder iniciar sesión.");
          return;
        }

        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const safeNext =
        requestedNext && /^\/[A-Za-z0-9/_-]*$/.test(requestedNext) && !requestedNext.startsWith("//")
          ? requestedNext
          : "/dashboard";
      router.replace(safeNext);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la autenticación. Inténtalo otra vez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand-mark">F</div>
      <p className="eyebrow">{isSignup ? "EMPIEZA HOY" : "QUÉ BUENO VERTE"}</p>
      <h1>{isSignup ? "Crea tu cuenta" : "Bienvenido de nuevo"}</h1>
      <p className="muted">
        {isSignup
          ? "Organiza tus cuentas, registra movimientos y avanza hacia tus metas."
          : "Inicia sesión para consultar tu información financiera."}
      </p>

      <form className="stack-form" onSubmit={handleSubmit}>
        {isSignup && (
          <div className="form-grid two">
            <label>Nombre<input name="nombre" autoComplete="given-name" required minLength={2} maxLength={80} /></label>
            <label>Apellido<input name="apellido" autoComplete="family-name" required minLength={2} maxLength={100} /></label>
          </div>
        )}
        <label>
          Correo electrónico
          <input name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : 1}
            required
          />
          {isSignup && <span className="field-hint">Usa al menos 8 caracteres.</span>}
        </label>
        {!isSignup && <p className="auth-forgot"><Link href="/forgot-password">¿Olvidaste tu contraseña?</Link></p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        {message && <p className="notice success" role="status">{message}</p>}
        <button className="button primary full-width" type="submit" disabled={loading}>
          {loading ? "Procesando..." : isSignup ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>

      <p className="auth-switch">
        {isSignup ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes una cuenta?"}{" "}
        <Link href={isSignup ? "/login" : "/register"}>{isSignup ? "Inicia sesión" : "Regístrate"}</Link>
      </p>
      <p className="auth-legal">Tus datos financieros están protegidos mediante autenticación y políticas de acceso por usuario.</p>
    </div>
  );
}