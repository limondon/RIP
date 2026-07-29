"use client";

import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStaffSession, saveStaffSession, toStaffMember } from "@/lib/auth/staff";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reason") !== "access") return;
    clearStaffSession();
    getBrowserSupabaseClient()?.auth.signOut();
    setError("Этот аккаунт не активирован для работы в CRM.");
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError("Вход пока не настроен. Проверьте подключение Supabase в Vercel.");
      return;
    }

    setSubmitting(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError || !data.user) {
      setError("Проверьте email и пароль сотрудника");
      return;
    }

    saveStaffSession(toStaffMember({
      id: data.user.id,
      email: data.user.email || email.trim(),
      name: typeof data.user.user_metadata.full_name === "string" ? data.user.user_metadata.full_name : undefined,
    }));
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
  };

  return (
    <main className="min-h-screen bg-[#eef2f6]">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between bg-navy-950 p-6 text-white md:p-10">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600"><LockKeyhole className="h-5 w-5" /></div>
            <div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">вход сотрудников</div></div>
          </div>
          <div className="my-16 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">CRM мастерской</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Каждый сотрудник входит под своим именем</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">Так в истории заказа будет понятно, кто создал заказ, принял оплату или изменил статус.</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            {["Заказы", "Оплаты", "История действий"].map((item) => <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4">{item}</div>)}
          </div>
        </section>

        <section className="flex items-center justify-center p-5 md:p-10">
          <div className="w-full max-w-xl">
            <form className="rounded-2xl border bg-white p-6 shadow-card md:p-8" onSubmit={submit}>
              <div className="mb-7">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserRound className="h-6 w-6" /></span>
                <h2 className="mt-5 text-2xl font-bold text-slate-950">Войти в CRM</h2>
                <p className="mt-2 text-sm text-slate-500">Используйте аккаунт сотрудника, который ведет заказы.</p>
              </div>

              <div className="space-y-4">
                <label><span className="field-label">Email сотрудника</span><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
                <label><span className="field-label">Пароль</span><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Введите пароль" /></label>
              </div>

              {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

              <button className="btn-primary mt-6 w-full" type="submit" disabled={submitting}>{submitting ? "Проверяем..." : "Войти"} <ArrowRight className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
