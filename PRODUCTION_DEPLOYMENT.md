# Blueprinx — Production Deployment Guide (Vercel)

This guide covers everything required to deploy Blueprinx to Vercel. The app uses **Better Auth** (not Supabase Auth) for authentication, **Supabase** for database + Realtime, **Trigger.dev** for background jobs, and **OpenRouter** for AI generation.

---

## ⚠️ Pre-Deployment Checklist

Before deploying, you **must** address these items:

### 1. Rotate All Secrets

Your `.env.local` secrets may have been committed to git history. Rotate **every key** listed below, even if the file is now gitignored:

| Secret | Where to Rotate |
|--------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection String |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `BETTER_AUTH_SECRET` | Generate new: `openssl rand -base64 32` |
| `GITHUB_CLIENT_SECRET` | GitHub → Settings → Developer Settings → OAuth Apps |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials |
| `EMAILJS_PRIVATE_KEY` | [emailjs.com](https://dashboard.emailjs.com/) → Account → API Keys |
| `TRIGGER_SECRET_KEY` | [cloud.trigger.dev](https://cloud.trigger.dev) → Project → API Keys |

### 2. Replace the In-Memory Rate Limiter ✅ **(Completed)**

The rate limiter (`src/lib/rate-limit.ts`) has been successfully migrated to Upstash Redis (`@upstash/ratelimit`). It now provides distributed rate limiting (5 requests per hour) that works correctly across Vercel serverless functions.

**Action Required for Production:**
Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are added to your Vercel Environment Variables.

### 3. Verify Supabase RLS Policies

Ensure Row Level Security is enabled on the `plans` table with policies that restrict access to `auth.uid() = user_id`. Without RLS, the anon key grants read access to all plans.

---

## Step 1: Vercel Environment Variables

In your **Vercel Dashboard** → **Settings** → **Environment Variables**, add every variable from your `.env.local` (use the newly rotated values):

| Variable | Visibility | Notes |
|----------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | `https://[PROJECT_ID].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | Full DB admin — never expose client-side |
| `DATABASE_URL` | Private | Postgres connection string (use Supabase pooler) |
| `OPENROUTER_API_KEY` | Private | AI model API key |
| `BETTER_AUTH_URL` | Private | Set to your production URL: `https://your-domain.com` |
| `BETTER_AUTH_SECRET` | Private | JWT signing key — generate with `openssl rand -base64 32` |
| `TRIGGER_SECRET_KEY` | Private | Trigger.dev project API key |
| `GITHUB_CLIENT_ID` | Private | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Private | GitHub OAuth app secret |
| `GOOGLE_CLIENT_ID` | Private | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Private | Google OAuth client secret |
| `EMAILJS_SERVICE_ID` | Private | EmailJS service identifier |
| `EMAILJS_TEMPLATE_ID_VERIFY` | Private | Template for verification emails |
| `EMAILJS_TEMPLATE_ID_RESET` | Private | Template for password reset emails |
| `EMAILJS_PUBLIC_KEY` | Private | EmailJS public key |
| `EMAILJS_PRIVATE_KEY` | Private | EmailJS private key |
| `NEXT_PUBLIC_SITE_URL` | Public | Your production URL: `https://your-domain.com` |

> **Critical**: `BETTER_AUTH_URL` must match your production domain exactly. Better Auth uses this to set cookie domains and generate callback URLs.

---

## Step 2: Better Auth Configuration

Better Auth handles all authentication (email/password, Google, GitHub). OAuth providers must be configured to know your production domain.

### Google Cloud Console

Go to **Google Cloud Console** → **APIs & Services** → **Credentials** → Edit your OAuth 2.0 Client ID:

1. **Authorized JavaScript origins**: Add `https://your-domain.com`
2. **Authorized redirect URIs**: Add `https://your-domain.com/api/auth/callback/google`
   - This is Better Auth's callback path (not Supabase's)

### GitHub Developer Settings

Go to **GitHub** → **Settings** → **Developer Settings** → **OAuth Apps** → Edit your app:

1. **Homepage URL**: `https://your-domain.com`
2. **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
   - This is Better Auth's callback path (not Supabase's)

---

## Step 3: Supabase Configuration

Supabase is used **only for database and Realtime** — not for authentication.

1. **Enable Realtime** on the `plans` table:
   - Supabase Dashboard → Database → Replication → Enable for `plans` table

2. **Verify RLS** on the `plans` table:
   - Supabase Dashboard → Authentication → Policies
   - Ensure policies exist for SELECT, INSERT, UPDATE, DELETE scoped to `user_id`

3. **Connection Pooling**: Use the **pooler connection string** (port 6543) for `DATABASE_URL`, not the direct connection (port 5432). Serverless functions open many short-lived connections.

---

## Step 4: Trigger.dev Configuration

1. Go to [cloud.trigger.dev](https://cloud.trigger.dev)
2. Create a production environment for your project
3. Deploy your Trigger.dev tasks: `npx trigger.dev@latest deploy`
4. Ensure the production environment has these env vars set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`

> Trigger.dev runs your background tasks in its own infrastructure. It needs its own copy of the Supabase and OpenRouter credentials.

---

## Step 5: CSRF Origin Allowlist

Update `src/app/api/ai/generate/route.ts` line 12–16 to include your production domain:

```typescript
const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean);
```

If `NEXT_PUBLIC_SITE_URL` is set correctly in Vercel env vars, this is already handled. Verify it's set to `https://your-domain.com` (no trailing slash).

---

## Step 6: EmailJS Templates

Ensure your EmailJS templates contain valid links that point to your production domain:

- **Verification template** (`EMAILJS_TEMPLATE_ID_VERIFY`): The `verification_link` variable is generated by Better Auth using `BETTER_AUTH_URL`
- **Reset template** (`EMAILJS_TEMPLATE_ID_RESET`): The `reset_link` variable is generated by Better Auth using `BETTER_AUTH_URL`

As long as `BETTER_AUTH_URL` is set correctly, the links will point to production automatically.

---

## Production Auth Flow

When a user clicks "Continue with Google" in production:

1. User is on `https://your-domain.com` and clicks the button
2. Better Auth redirects to Google's OAuth consent screen
3. Google authenticates and redirects back to `https://your-domain.com/api/auth/callback/google`
4. Better Auth creates/updates the user in your Supabase database via the `DATABASE_URL` Postgres connection
5. Better Auth sets a JWT session cookie and redirects the user to the app

---

## Post-Deploy Verification

After deploying, verify:

- [ ] Homepage loads without console errors
- [ ] Google OAuth login works end-to-end
- [ ] GitHub OAuth login works end-to-end
- [ ] Email/password registration sends verification email
- [ ] Password reset sends reset email with correct production link
- [ ] Plan generation triggers and streams content via Realtime
- [ ] Dashboard shows plans with correct statuses
- [ ] Unauthenticated users are redirected to login on protected routes
