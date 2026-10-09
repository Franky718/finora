# Supabase Auth setup for Finora

The database schema, RLS policies, owner-mapping triggers, and balance/progress triggers are applied to project \`woysaefrlybupzaxodxx\`. Matching migration files are stored under \`supabase/migrations/\`.

## One-time dashboard configuration
1. Open Supabase Dashboard → Authentication → Providers → Email and make sure email/password sign-in is enabled.
2. Open Authentication → URL Configuration.
3. For local development, set Site URL to \`http://localhost:3000\`.
4. Add \`http://localhost:3000/auth/callback\` to Redirect URLs.
5. In production, add the exact HTTPS callback URL for the deployed domain too.
6. If email confirmation is enabled, configure the email provider/template and test confirmation from a real address you control.

## Local application configuration
Copy \`.env.example\` to \`.env.local\` and set:
- \`NEXT_PUBLIC_SUPABASE_URL\`: \`https://woysaefrlybupzaxodxx.supabase.co\`
- \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\`: the project's publishable key from Project Settings → API Keys.

Only use the publishable key in client-exposed environment variables. Do not add a \`service_role\` or secret key to this project’s frontend environment.

## Database security model
- Auth signup creates a row in \`auth.users\` and a linked row in \`public.usuarios\`; the internal trigger stores only the Auth UUID mapping and profile fields.
- Client-side password hashes are no longer required for new users. Existing \`password_hash\` column is kept for schema compatibility but direct client access to \`public.usuarios\` and \`public.sesiones\` is revoked.
- Every financial table has RLS policies. Write triggers assign the current user's legacy numeric ID, ignoring user-supplied ownership values.
- Transaction insert/update/delete triggers maintain account balances. Savings contributions update goal progress.

## Reapply migrations in another project
Use a Supabase CLI version compatible with the current database. Initialize/link the project, then inspect the remote migration history before running \`supabase db push\`; do not apply these migrations to the current production project a second time without checking migration versions.
