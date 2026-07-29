export const STAFF_STORAGE_KEY = "pamyat-crm-current-staff";

export type StaffMember = {
  id: string;
  name: string;
  shortName: string;
  email: string;
  active: boolean;
};

export function toStaffMember(input: { id: string; email: string; name?: string; active?: boolean }): StaffMember {
  const name = input.name?.trim() || input.email.split("@")[0] || "Сотрудник CRM";
  const shortName = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CRM";
  return { id: input.id, name, shortName, email: input.email, active: input.active ?? true };
}

export function getStoredStaffMember(): StaffMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StaffMember;
    return parsed.id && parsed.email ? parsed : null;
  } catch {
    window.localStorage.removeItem(STAFF_STORAGE_KEY);
    return null;
  }
}

export function saveStaffSession(member: StaffMember) {
  window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify({ id: member.id, name: member.name, shortName: member.shortName, email: member.email }));
}

export function clearStaffSession() {
  window.localStorage.removeItem(STAFF_STORAGE_KEY);
}
