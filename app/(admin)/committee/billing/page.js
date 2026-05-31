// app/(admin)/committee/billing/page.js — 福委會帳單管理
import { cookies } from "next/headers";
import {
  COOKIE_NAME, ENDPOINTS, SERVICES,
  apiFetch, jsonOrEmpty, serviceUrl,
} from "@/lib/api";
import BillingDashboard from "@/components/BillingDashboard";

export const dynamic = "force-dynamic";

async function getStatements() {
  if (!SERVICES.billing) return [];
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  try {
    const res = await apiFetch(serviceUrl(SERVICES.billing, ENDPOINTS.billingStatements), { token });
    if (!res.ok) return [];
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.statements || [];
  } catch {
    return [];
  }
}

async function getVendors() {
  if (!SERVICES.vendor) return [];
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  try {
    const res = await apiFetch(serviceUrl(SERVICES.vendor, ENDPOINTS.vendors), { token });
    if (!res.ok) return [];
    const data = await jsonOrEmpty(res);
    return Array.isArray(data) ? data : data.vendors || [];
  } catch {
    return [];
  }
}

export default async function BillingPage() {
  const [statements, vendors] = await Promise.all([getStatements(), getVendors()]);
  return <BillingDashboard statements={statements} vendors={vendors} />;
}