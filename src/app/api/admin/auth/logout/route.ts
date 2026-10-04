import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true, message: "Logged out successfully" });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
