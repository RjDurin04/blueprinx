import { Pool } from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createTable() {
    console.log("Creating jwks table...");
    const query = `
    CREATE TABLE IF NOT EXISTS "jwks" (
        id TEXT PRIMARY KEY,
        "publicKey" TEXT NOT NULL,
        "privateKey" TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
    try {
        await pool.query(query);
        console.log("Successfully created jwks table!");
    } catch (e) {
        console.error("Failed to create table:", e);
    } finally {
        await pool.end();
    }
}

createTable();
