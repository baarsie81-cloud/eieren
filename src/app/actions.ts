"use server";

import { redirect } from "next/navigation";
import { assertTrustedOrigin, clearSessionCookie } from "@/lib/auth/guards";

export async function logoutAction() {
  await assertTrustedOrigin();
  await clearSessionCookie();
  redirect("/login");
}
