import { Pool } from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function renameColumns() {
    console.log("Executing SQL to rename columns from snake_case to camelCase...");

    // NOTE: Double quotes are required around the camelCase name so Postgres doesn't fold it to lowercase.
    const queries = `
    DO $$ BEGIN
        -- user table
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user' AND column_name='email_verified') THEN
            ALTER TABLE "user" RENAME COLUMN email_verified TO "emailVerified";
            ALTER TABLE "user" RENAME COLUMN created_at TO "createdAt";
            ALTER TABLE "user" RENAME COLUMN updated_at TO "updatedAt";
        END IF;

        -- session table
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='session' AND column_name='expires_at') THEN
            ALTER TABLE "session" RENAME COLUMN expires_at TO "expiresAt";
            ALTER TABLE "session" RENAME COLUMN created_at TO "createdAt";
            ALTER TABLE "session" RENAME COLUMN updated_at TO "updatedAt";
            ALTER TABLE "session" RENAME COLUMN ip_address TO "ipAddress";
            ALTER TABLE "session" RENAME COLUMN user_agent TO "userAgent";
            ALTER TABLE "session" RENAME COLUMN user_id TO "userId";
        END IF;

        -- account table
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='account' AND column_name='account_id') THEN
            ALTER TABLE "account" RENAME COLUMN account_id TO "accountId";
            ALTER TABLE "account" RENAME COLUMN provider_id TO "providerId";
            ALTER TABLE "account" RENAME COLUMN user_id TO "userId";
            ALTER TABLE "account" RENAME COLUMN access_token TO "accessToken";
            ALTER TABLE "account" RENAME COLUMN refresh_token TO "refreshToken";
            ALTER TABLE "account" RENAME COLUMN id_token TO "idToken";
            ALTER TABLE "account" RENAME COLUMN access_token_expires_at TO "accessTokenExpiresAt";
            ALTER TABLE "account" RENAME COLUMN refresh_token_expires_at TO "refreshTokenExpiresAt";
            ALTER TABLE "account" RENAME COLUMN created_at TO "createdAt";
            ALTER TABLE "account" RENAME COLUMN updated_at TO "updatedAt";
        END IF;

        -- verification table
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verification' AND column_name='expires_at') THEN
            ALTER TABLE "verification" RENAME COLUMN expires_at TO "expiresAt";
            ALTER TABLE "verification" RENAME COLUMN created_at TO "createdAt";
            ALTER TABLE "verification" RENAME COLUMN updated_at TO "updatedAt";
        END IF;
    END $$;
  `;

    try {
        await pool.query(queries);
        console.log("Successfully renamed columns!");
    } catch (e) {
        console.error("Failed to rename columns:", e);
    } finally {
        await pool.end();
    }
}

renameColumns();
