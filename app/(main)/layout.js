// app/(main)/layout.js
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function MainLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.AUTH_COOKIE_NAME || "token")?.value;
  const role = cookieStore.get("role")?.value;

  if (!token) redirect("/login");

  // vendor 只能用商家畫面
  if (role === "vendor") redirect("/vendor");

  // admin 和 employee 都能進員工/訂單/通知/申訴頁面

  return (
    <div className="min-h-screen bg-[var(--neutral-bg)]">
      <Navbar />
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}