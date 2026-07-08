import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStaffAdminSetupToken } from "@/lib/supabase/config";

type StaffInput = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  adminToken?: string;
  active?: boolean;
};
type StaffProfileRow = {
  id: string;
  email: string;
  full_name: string;
  short_name: string;
  phone: string;
  active: boolean;
  created_at: string;
};

const shortName = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CRM";

function verifyAdminToken(request: Request) {
  const expected = getStaffAdminSetupToken();
  if (!expected) return { ok: false, error: "STAFF_ADMIN_SETUP_TOKEN не настроен" };
  const provided = request.headers.get("x-staff-admin-token") || "";
  return provided && provided === expected ? { ok: true } : { ok: false, error: "Неверный код администратора" };
}

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, configured: false, staff: [], error: "Supabase admin key не настроен" }, { status: 503 });
  }

  const token = verifyAdminToken(request);
  if (!token.ok) {
    return NextResponse.json({ ok: false, configured: true, staff: [], error: token.error }, { status: 403 });
  }

  const { data, error } = await (supabase.from("staff_profiles") as any)
    .select("id,email,full_name,short_name,phone,active,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, configured: true, error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    configured: true,
    staff: ((data ?? []) as StaffProfileRow[]).map((member) => ({
      id: member.id,
      name: member.full_name,
      shortName: member.short_name,
      email: member.email,
      phone: member.phone || "",
      status: member.active ? "Активен" : "Неактивен",
      lastLogin: "Supabase Auth",
    })),
  });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, configured: false, error: "Supabase admin key не настроен" }, { status: 503 });
  }

  const token = verifyAdminToken(request);
  if (!token.ok) {
    return NextResponse.json({ ok: false, configured: true, error: token.error }, { status: 403 });
  }

  const input = await request.json() as StaffInput;
  const name = input.name?.trim() || "";
  const email = input.email?.trim().toLowerCase() || "";
  const password = input.password?.trim() || "";

  if (!name) return NextResponse.json({ ok: false, error: "Укажите имя сотрудника" }, { status: 400 });
  if (!email || !email.includes("@")) return NextResponse.json({ ok: false, error: "Укажите корректный email" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ ok: false, error: "Пароль должен быть не короче 6 символов" }, { status: 400 });

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone: input.phone?.trim() || "" },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ ok: false, error: authError?.message || "Не удалось создать пользователя" }, { status: 400 });
  }

  const profile = {
    id: authData.user.id,
    email,
    full_name: name,
    short_name: shortName(name),
    phone: input.phone?.trim() || "",
    active: input.active ?? true,
  };

  const { error: profileError } = await (supabase.from("staff_profiles") as any).insert(profile);
  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    staff: {
      id: profile.id,
      name,
      shortName: profile.short_name,
      email,
      phone: input.phone?.trim() || "",
      status: profile.active ? "Активен" : "Неактивен",
      lastLogin: "еще не входил",
    },
  });
}
