// Saves an early-access signup as a private JSON file in Vercel Blob.
// One file per email (signups/<hash>.json), so signing up twice updates the same record.
import { put } from "@vercel/blob";
import { createHash } from "node:crypto";
import { checkSignup } from "@/lib/early-access";

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send the signup as JSON." }, { status: 400 });
  }

  const result = checkSignup(body);
  if (result.kind === "spam") return Response.json({ ok: true });
  if (result.kind === "invalid") return Response.json({ error: result.error }, { status: 400 });

  const key = createHash("sha256").update(result.signup.email).digest("hex").slice(0, 32);
  try {
    await put(`signups/${key}.json`, JSON.stringify(result.signup, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    console.error("early-access save failed", err instanceof Error ? err.message : err);
    return Response.json({ error: "Couldn't save right now." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
