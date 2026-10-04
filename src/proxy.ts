// Next.js 16 renamed `middleware.ts` to `proxy.ts`.
// On Next.js 15, rename this file to `middleware.ts` and the function to `middleware`.
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|sw.js|manifest.webmanifest|icons/|brand/|games/|stock-icons/).*)",
  ],
};
