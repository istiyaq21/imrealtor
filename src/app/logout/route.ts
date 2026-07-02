import { NextResponse } from "next/server";
import { signOut } from "@/app/auth/actions";

export async function GET(request: Request) {
  await signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
