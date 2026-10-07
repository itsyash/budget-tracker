import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar userEmail={user?.email ?? null} userName={user?.name ?? null} />
      <div className="md:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
