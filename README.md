# Blueprinx v1.0

![Blueprinx Header](https://via.placeholder.com/1200x400?text=Blueprinx+v1.0+-+Turn+your+idea+into+a+plan)

**Blueprinx** is an AI-powered architectural planning tool that turns your plain-English app ideas into comprehensive, 25-component development specifications. By handling the complex technical groundwork—from Business Rules and User States to Edge Cases and API specs—Blueprinx lets you skip the blank page and start building faster.

## 🚀 Features

- **AI-Driven Architecture Generation**: Powered by advanced LLMs via OpenRouter, translating prompts into deeply Exhaustive architectural blueprints.
- **Robust Background Processing**: Uses **Trigger.dev** for reliable, long-running generation tasks with automatic retries and stream recovery.
- **Secure Authentication**: Built on **Better Auth** using JWT sessions. Supports Email/Password (with EmailJS verifications) and Social Logins (Google, GitHub).
- **Modern UI**: Built with **React 19**, **Next.js 15**, and **Tailwind CSS v4** featuring highly polished aesthetics and **Framer Motion** animations.
- **State Management**: Zero-boilerplate global state with **Zustand**.
- **Rate Limiting Engine**: Secured by **Upstash Redis** to ensure fair usage of AI endpoints.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: [Better Auth](https://better-auth.com/) + pg adapter
- **Background Jobs**: [Trigger.dev v3](https://trigger.dev/)
- **AI/LLM Routing**: [OpenRouter](https://openrouter.ai/) (Models: Trinity, GLM-4.5)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + Shadcn
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Transactional Emails**: [EmailJS](https://www.emailjs.com/)

## 📂 Project Structure

```text
fullstack-monorepo/
├── src/
│   ├── app/           # Next.js 15 App Router pages (/, /dashboard, /blueprint, /login)
│   ├── components/    # Reusable React & Shadcn UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Core library files (db config, auth, rate-limit, prompts)
│   ├── stores/        # Zustand state stores
│   ├── trigger/       # Trigger.dev background worker tasks (generatePlan.ts)
│   └── types/         # Global TypeScript definitions
├── public/            # Static assets
└── package.json       # Project dependencies & scripts
```

## ⚙️ Getting Started

### Prerequisites

You will need the following accounts/services configured to run Blueprinx locally:

- Node.js (v18+)
- [Supabase](https://supabase.com/) Project for PostgreSQL Database
- [Trigger.dev](https://trigger.dev/) Account for background jobs
- [Upstash Redis](https://upstash.com/) for rate-limiting
- [OpenRouter](https://openrouter.ai/) Account for AI generation models
- [EmailJS](https://www.emailjs.com/) for auth emails (Verification/Password Reset)
- OAuth credentials for GitHub/Google (optional)

### Environment Variables

Create a `.env.local` file at the root of the project with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_direct_postgres_connection_string

# Better Auth Configuration
BETTER_AUTH_SECRET=a_secure_random_string
BETTER_AUTH_URL=http://localhost:3000

# OpenRouter (AI Generation)
OPENROUTER_API_KEY=your_openrouter_api_key

# Trigger.dev
TRIGGER_SECRET_KEY=your_trigger_dev_key

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# EmailJS (Authentication Emails)
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_PUBLIC_KEY=your_emailjs_public_key
EMAILJS_PRIVATE_KEY=your_emailjs_private_key
EMAILJS_TEMPLATE_ID_VERIFY=your_verification_template_id
EMAILJS_TEMPLATE_ID_RESET=your_reset_template_id

# Social OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Installation

1. Install dependencies using your preferred package manager (pnpm recommended):
   ```bash
   pnpm install
   ```

2. Start the Next.js development server:
   ```bash
   pnpm dev
   ```

3. In a separate terminal session, run the Trigger.dev background worker:
   ```bash
   npx trigger.dev@latest dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

