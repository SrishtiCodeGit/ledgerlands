// Applies db/schema.sql to the database in DATABASE_URL, one statement at a time.
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
const sql = neon(process.env.DATABASE_URL);

const text = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = text
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const s of statements) await sql.query(s);
console.log(`Applied ${statements.length} statements.`);
