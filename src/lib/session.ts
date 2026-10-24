import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type Me = { userId: string; email: string; verifiedEmails: string[] };

// The signed-in person, or a redirect to sign in. Every page, and every Server Function that reads or changes plans, calls this.
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function requireMe(): Promise<Me> {
  await requireUserId();
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const verifiedEmails = user.emailAddresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress.toLowerCase());
  const email = (user.primaryEmailAddress?.emailAddress ?? verifiedEmails[0] ?? "").toLowerCase();
  return { userId: user.id, email, verifiedEmails };
}
