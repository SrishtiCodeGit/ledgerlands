// Checks an early-access signup from the Steward bot. Pure so it can be tested on its own.
export const INVEST_OPTIONS = ["Stocks", "Funds and ETFs", "Crypto", "Gold", "Bonds", "Just getting started"] as const;

export type Signup = {
  name: string;
  email: string;
  phone: string;
  invests: string[];
  consent: true;
  source: "steward-bot";
  signedUpAt: string;
};

export type CheckResult =
  | { kind: "ok"; signup: Signup }
  | { kind: "spam" }
  | { kind: "invalid"; error: string };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}

export function checkSignup(body: unknown, now = new Date()): CheckResult {
  if (!body || typeof body !== "object") return { kind: "invalid", error: "Send the signup as JSON." };
  const b = body as Record<string, unknown>;

  // Hidden trap field: people never fill it, simple spam bots do.
  if (clean(b.website, 200)) return { kind: "spam" };

  const name = clean(b.name, 60);
  const email = clean(b.email, 254).toLowerCase();
  const phone = clean(b.phone, 24);
  const allowed = new Set<string>(INVEST_OPTIONS);
  const invests = Array.isArray(b.invests)
    ? b.invests.filter((x): x is string => typeof x === "string" && allowed.has(x)).slice(0, INVEST_OPTIONS.length)
    : [];

  if (!name) return { kind: "invalid", error: "Name is required." };
  if (!EMAIL.test(email)) return { kind: "invalid", error: "That email doesn't look right." };
  const digits = phone.replace(/\D/g, "");
  if (phone && (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15)) {
    return { kind: "invalid", error: "That phone number doesn't look right." };
  }
  if (b.consent !== true) return { kind: "invalid", error: "Consent is required." };

  return {
    kind: "ok",
    signup: { name, email, phone, invests, consent: true, source: "steward-bot", signedUpAt: now.toISOString() },
  };
}
