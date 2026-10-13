import { Wallet } from "lucide-react";
import { registrationMode } from "@/lib/registration";
import LoginForm from "@/components/forms/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const allowRegister = registrationMode() === "open";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--accent-weak)", color: "var(--accent-2)" }}>
            <Wallet size={22} />
          </span>
          <div>
            <div className="font-bold text-lg leading-tight">Budget Tracker</div>
            <div className="muted text-xs">50 / 30 / 20 monitor</div>
          </div>
        </div>

        <LoginForm allowRegister={allowRegister} />
      </div>
    </div>
  );
}
