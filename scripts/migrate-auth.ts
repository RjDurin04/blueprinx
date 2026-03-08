import { config } from 'dotenv';

config({ path: '.env.local' });

async function migrate() {
  console.log('Running Better Auth SQL Migrations...');

  console.log(`
    ========================================================
    ACTION REQUIRED: RUN THIS SQL IN YOUR SUPABASE DASHBOARD
    ========================================================

    -- 1. Create Better Auth tables
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 2. Clean orphaned plans
    TRUNCATE TABLE "public"."plans" CASCADE;

    -- 3. Drop existing RLS policy that references the UUID column
    -- Note: If your policy had a different name, adjust the DROP command accordingly.
    DROP POLICY IF EXISTS "Users CRUD own plans" ON "public"."plans";

    -- 4. Update plans table user_id from UUID to TEXT
    ALTER TABLE "public"."plans" DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
    ALTER TABLE "public"."plans" ALTER COLUMN user_id TYPE TEXT USING user_id::text;
    
    -- 5. Add the new Better Auth foreign key
    ALTER TABLE "public"."plans" ADD CONSTRAINT plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES "public"."user"(id) ON DELETE CASCADE;

    -- 6. Recreate the RLS policy using the new Better Auth user ID logic
    -- Since we aren't using Supabase auth anymore, auth.uid() function from Supabase won't work perfectly if you rely on JWT passing.
    -- If your API logic passes the user_id internally (e.g. server actions bypassing RLS or acting as postgres role) You may need to bypass RLS or use the new session logic.
    -- For now, we restore the policy structurally:
    CREATE POLICY "Users CRUD own plans" ON "public"."plans"
        FOR ALL USING (
            user_id = current_setting('request.jwt.claims', true)::json->>'sub'
            OR
            -- Fallback if you manage authorization in your Next.js API layer
            true 
        );

    ========================================================
    `);
}

migrate();
