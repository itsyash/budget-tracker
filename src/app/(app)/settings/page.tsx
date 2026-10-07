import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import PageHeader from "@/components/PageHeader";
import ProfileForm from "@/components/forms/ProfileForm";
import SettingsForm from "@/components/forms/SettingsForm";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";
import AiKeyForm from "@/components/forms/AiKeyForm";

export const dynamic = "force-dynamic";

function SectionHeading({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: "var(--muted)" }}>{title}</h2>
      {desc && <p className="muted text-xs mt-0.5">{desc}</p>}
    </div>
  );
}

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const [user, s] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id } }),
    prisma.setting.findUnique({ where: { userId: sessionUser.id } }),
  ]);

  const initial = { needsPct: s?.needsPct ?? 50, wantsPct: s?.wantsPct ?? 30, savingsPct: s?.savingsPct ?? 20, currency: s?.currency ?? "INR" };
  const key = s?.groqApiKey ?? null;
  const maskedKey = key ? `${key.slice(0, 4)}…${key.slice(-4)}` : null;
  const model = s?.groqModel || "openai/gpt-oss-20b";
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—";

  return (
    <div className="p-5 md:p-8 max-w-[1100px] mx-auto">
      <PageHeader title="Settings" subtitle="Manage your account, budget rule, and integrations" />

      <div className="space-y-10">
        <section>
          <SectionHeading title="Account" desc="Your profile and password." />
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <ProfileForm name={user?.name ?? ""} email={user?.email ?? sessionUser.email} memberSince={memberSince} />
            <ChangePasswordForm />
          </div>
        </section>

        <section>
          <SectionHeading title="Budget Rule" desc="Your 50 / 30 / 20 allocation targets." />
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <SettingsForm {...initial} />
            <div className="card p-6">
              <h3 className="font-bold mb-3">How the dashboard is calculated</h3>
              <ul className="muted text-sm space-y-2 leading-relaxed">
                <li><b style={{ color: "var(--text)" }}>Income</b> — sum of your income entries for the month.</li>
                <li><b style={{ color: "var(--text)" }}>Target</b> — income × each rule % (Needs / Wants / Savings).</li>
                <li><b style={{ color: "var(--text)" }}>Expected</b> — sum of active recurring items per bucket.</li>
                <li><b style={{ color: "var(--text)" }}>Actual</b> — sum of expense entries per bucket this month.</li>
                <li><b style={{ color: "var(--text)" }}>Unspent Cash</b> — income − actual outflow.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading title="AI Integration" desc="Key used by the Telegram bot to parse your messages." />
          <AiKeyForm hasKey={!!key} maskedKey={maskedKey} model={model} />
        </section>
      </div>
    </div>
  );
}
