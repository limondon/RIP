"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { clearStaffSession, getStoredStaffMember, type StaffMember } from "@/lib/auth/staff";

export function StaffMenu() {
  const [staff, setStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    setStaff(getStoredStaffMember());
  }, []);

  const logout = () => {
    clearStaffSession();
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-700 text-sm font-semibold">{staff?.shortName ?? "CRM"}</div>
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{staff?.name ?? "Сотрудник CRM"}</div><div className="text-xs text-slate-400">сотрудник CRM</div></div>
      <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Выйти" onClick={logout}><LogOut className="h-4 w-4" /></button>
    </div>
  );
}
