"use client";

import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { findStaffByCredentials, saveStaffSession, staffMembers } from "@/lib/auth/staff";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(staffMembers[0].email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const member = findStaffByCredentials(email, password);
    if (!member) {
      setError("Проверьте email и пароль сотрудника");
      return;
    }
    saveStaffSession(member);
    const params = new URLSearchParams(window.location.search);
    router.replace(params.get("next") || "/");
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

              <button className="btn-primary mt-6 w-full" type="submit">Войти <ArrowRight className="h-4 w-4" /></button>
            </form>

            <section className="mt-5 rounded-2xl border bg-white p-5 shadow-card">
              <h3 className="font-semibold text-slate-950">Тестовые сотрудники</h3>
              <div className="mt-4 grid gap-3">
                {staffMembers.map((member) => (
                  <button key={member.id} className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50" onClick={() => { setEmail(member.email); setPassword(member.password); setError(""); }}>
                    <span><span className="block text-sm font-semibold text-slate-900">{member.name}</span><span className="block text-xs text-slate-500">{member.email}</span></span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">пароль {member.password}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
