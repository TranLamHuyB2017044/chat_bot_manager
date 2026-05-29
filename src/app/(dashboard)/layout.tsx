import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar  from "@/components/dashboard/Topbar";
import type { AuthUser } from "@/types/auth";

async function getUserFromCookies(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const userStr = cookieStore.get("bt_user")?.value;
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-surface-page dark:bg-dark-page">
      <Sidebar role={user.role} />
      <div
        className="flex flex-col flex-1 min-w-0"
        style={{ marginLeft: "var(--sidebar-width)" }}
      >
        <Topbar user={user} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
