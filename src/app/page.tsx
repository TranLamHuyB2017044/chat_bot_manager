import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser } from "@/types/auth";

export default async function RootPage() {
  const cookieStore = await cookies();
  const userStr = cookieStore.get("bt_user")?.value;

  if (!userStr) {
    redirect("/login");
  }

  try {
    const user = JSON.parse(userStr) as AuthUser;
    redirect(user.role === 0 ? "/admin" : "/dashboard");
  } catch {
    redirect("/login");
  }
}
