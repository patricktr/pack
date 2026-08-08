"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION, createSessionToken, verifyPassword } from "@/lib/auth";

function safeFrom(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function loginAction(formData: FormData): Promise<void> {
  const password = formData.get("password");
  const from = safeFrom(formData.get("from"));
  if (typeof password !== "string" || !password) {
    redirect(`/login?error=1&from=${encodeURIComponent(from)}`);
  }
  const ok = await verifyPassword(password);
  if (!ok) {
    redirect(`/login?error=1&from=${encodeURIComponent(from)}`);
  }
  const token = await createSessionToken();
  const store = await cookies();
  store.set(SESSION.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION.maxAge,
  });
  redirect(from);
}
