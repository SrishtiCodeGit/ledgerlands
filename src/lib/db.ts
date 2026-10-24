import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Created on first use so builds and pages that never touch the database don't need DATABASE_URL.
let client: NeonQueryFunction<false, false> | undefined;

export function sql(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    client = neon(url);
  }
  return client;
}
