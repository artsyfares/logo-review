import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * We don't have a Clerk webhook syncing users into our DB yet (that's a
 * later hardening task), so ensure a local `users` row exists on demand
 * the first time an authenticated request needs one.
 */
export async function ensureCurrentUser(): Promise<{ id: string }> {
  const user = await currentUser();
  if (!user) {
    throw new Error("ensureCurrentUser called without an authenticated user");
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";

  await db.insert(users).values({ id: user.id, email }).onConflictDoNothing();

  return { id: user.id };
}
