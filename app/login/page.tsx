import Link from "next/link";
import AuthForm from "@/components/auth-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">← Finora</Link>
      <div>
        {params.error === "configuration" && (
          <p className="notice error">Falta configurar la URL o la clave pública de Supabase en el archivo .env.local.</p>
        )}
        {params.error === "auth_callback" && (
          <p className="notice error">El enlace de autenticación no es válido o ha caducado. Solicita uno nuevo.</p>
        )}
        <AuthForm mode="login" />
      </div>
    </main>
  );
}