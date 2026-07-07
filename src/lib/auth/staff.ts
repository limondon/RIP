export const STAFF_COOKIE = "pamyat-crm-staff-id";
export const STAFF_STORAGE_KEY = "pamyat-crm-current-staff";

export type StaffMember = {
  id: string;
  name: string;
  shortName: string;
  email: string;
  password: string;
  active: boolean;
};

export const staffMembers: StaffMember[] = [
  { id: "staff-andrey", name: "Андрей Лимон", shortName: "АЛ", email: "andrey@pamyat-crm.local", password: "1111", active: true },
  { id: "staff-maria", name: "Мария Иванова", shortName: "МИ", email: "maria@pamyat-crm.local", password: "2222", active: true },
  { id: "staff-ivan", name: "Иван Тимофеев", shortName: "ИТ", email: "ivan@pamyat-crm.local", password: "3333", active: true },
];

export function findStaffByCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return staffMembers.find((member) => member.active && member.email.toLowerCase() === normalizedEmail && member.password === password) ?? null;
}

export function findStaffById(id: string | undefined) {
  return staffMembers.find((member) => member.active && member.id === id) ?? null;
}

export function getStoredStaffMember(): StaffMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pick<StaffMember, "id">;
    return findStaffById(parsed.id);
  } catch {
    window.localStorage.removeItem(STAFF_STORAGE_KEY);
    return null;
  }
}

export function saveStaffSession(member: StaffMember) {
  window.localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify({ id: member.id, name: member.name, shortName: member.shortName, email: member.email }));
  document.cookie = `${STAFF_COOKIE}=${member.id}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearStaffSession() {
  window.localStorage.removeItem(STAFF_STORAGE_KEY);
  document.cookie = `${STAFF_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
