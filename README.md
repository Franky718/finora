# Finora

Finora is a Spanish-language personal finance MVP built with Next.js App Router, React, TypeScript, and Supabase.

## Included
- Supabase Auth: email/password sign-up, sign-in, email-confirmation callback, password reset, and sign-out.
- Protected routes via Next.js 16 \`proxy.ts\` plus server-side claim validation.
- Dashboard with account balances, monthly income/expenses, recent movements, and savings goals.
- Create accounts, record transactions, add categories, create goals, and register savings contributions.
- PostgreSQL RLS, a mapping between Supabase Auth UUIDs and the existing numeric \`public.usuarios.id\`, server-assigned row ownership, and database triggers that update account balances and savings-goal progress.
- The four SQL migrations applied to the connected Supabase project are versioned in \`supabase/migrations/\`.

## Run locally on Windows
1. Install Node.js 22 or later.
2. Clone the repository and enter the folder:
   \`\`\`powershell
   git clone https://github.com/Franky718/finora.git
   cd finora
   \`\`\`
3. Install dependencies and prepare environment variables:
   \`\`\`powershell
   npm install
   Copy-Item .env.example .env.local
   \`\`\`
4. In \`.env.local\`, set \`NEXT_PUBLIC_SUPABASE_URL\` and \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\`. The project URL is prefilled. Copy the publishable key from Supabase Dashboard → Project Settings → API Keys. Use a publishable key (or legacy anon key); never put a secret/service_role key in a browser environment variable.
5. In Supabase Dashboard → Authentication → URL Configuration, set the local Site URL to \`http://localhost:3000\` and add \`http://localhost:3000/auth/callback\` to Redirect URLs. Add your real production callback URL when deploying.
6. Start Finora:
   \`\`\`powershell
   npm run dev
   \`\`\`
7. Open http://localhost:3000/register, create an account, and confirm your email if email confirmation is enabled.

## Common commands
- \`npm run dev\` — local development
- \`npm run typecheck\` — TypeScript checks
- \`npm run build\` — production build
- \`npm start\` — start the production build

## Security and product scope
- Passwords are managed by Supabase Auth. Finora does not read or compare \`password_hash\`.
- Database access is enforced by RLS; hiding a UI element is not considered authorization.
- This MVP records balances in MXN to avoid adding different currencies into one total.
- This is not a regulated banking application. Review backups, monitoring, rate limits, recovery, and financial business rules before using real sensitive records.

## Connected Supabase project
Project reference: \`woysaefrlybupzaxodxx\`. The SQL migrations have already been applied to that connected database and the security advisor was checked after implementation.
