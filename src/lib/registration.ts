export type RegMode = "open" | "invite" | "closed";

export function registrationMode(): RegMode {
  const m = (process.env.REGISTRATION_MODE || "invite").toLowerCase();
  return (["open", "invite", "closed"].includes(m) ? m : "invite") as RegMode;
}

export function invitedEmails(): string[] {
  return (process.env.INVITE_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function canRegister(email: string): boolean {
  const mode = registrationMode();
  if (mode === "closed") return false;
  if (mode === "open") return true;
  return invitedEmails().includes(email.trim().toLowerCase());
}

export function registrationOpen(): boolean {
  return registrationMode() !== "closed";
}
