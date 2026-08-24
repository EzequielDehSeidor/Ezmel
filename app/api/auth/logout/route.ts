import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/supabase/env";
import { MOCK_COOKIE_NAME } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (isMockMode()) {
    const store = await cookies();
    store.delete(MOCK_COOKIE_NAME);
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
