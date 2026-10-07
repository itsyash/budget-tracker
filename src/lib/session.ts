import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bt_session";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-insecure-secret-change-me"
);

export type SessionUser = { id: number; email: string; name?: string | null };

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email, name: user.name ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: Number(payload.id),
      email: String(payload.email),
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
