import "server-only";
import { getSession } from "@/lib/auth";

export async function requireUser() {
  const user = await getSession();
  if (!user) throw new Error("Unauthorized");
  return user;
}
