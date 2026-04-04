// src/utils/use-permission.ts

import { useAppContext } from "./app-context";

// ─── Mapping Role → Kelas yang boleh diakses ─────────────────────────────────
const ROLE_KELAS_MAP: Record<string, string[]> = {
  "Kepala Sekolah PGTK": ["TK A", "TK B"],
  "Kepala Sekolah SD": [
    "1A",
    "1B",
    "2A",
    "2B",
    "3A",
    "3B",
    "4A",
    "4B",
    "5A",
    "5B",
    "6A",
    "6B",
  ],
  "Kepala Sekolah SMP": ["7A", "7B", "7C", "8A", "8B", "8C", "9A", "9B", "9C"],
  "Kepala Sekolah SMA": [
    "10 MIPA 1",
    "10 MIPA 2",
    "10 IPS 1",
    "10 IPS 2",
    "11 MIPA 1",
    "11 MIPA 2",
    "11 IPS 1",
    "11 IPS 2",
    "12 MIPA 1",
    "12 MIPA 2",
    "12 IPS 1",
    "12 IPS 2",
  ],
};

export const usePermission = () => {
  const { userLoginInfo, userPermissions } = useAppContext();

  // ✅ FIX: Struktur UserInfo kamu adalah userLoginInfo.userInfo.role
  //    bukan userLoginInfo.role langsung
  const role = userLoginInfo?.userInfo?.role ?? "";

  const isSuperAdmin = role === "Super Administrator";

  // Kelas yang boleh diakses — array kosong berarti superadmin (akses semua)
  const allowedKelas: string[] = isSuperAdmin
    ? []
    : (ROLE_KELAS_MAP[role] ?? []);

  // Cek apakah boleh akses kelas tertentu
  const canAccessKelas = (kelas: string): boolean => {
    if (isSuperAdmin) return true;
    return allowedKelas.includes(kelas);
  };

  // Cek permission spesifik dari DB
  const hasPermission = (permName: string): boolean => {
    if (isSuperAdmin) return true;
    return userPermissions?.includes(permName) ?? false;
  };

  // ✅ FIX: Karena endpoint permissions belum ada di backend (404),
  //    jangan bergantung pada userPermissions.length.
  //    Logika: superadmin → selalu bisa semua.
  //    Kepala Sekolah → selalu bisa semua CRUD (cukup dibatasi lewat kelas saja).
  //    Kalau nanti backend sudah siap, ganti bagian ini dengan hasPermission().
  const canCreate = isSuperAdmin || role.startsWith("Kepala Sekolah");
  const canEdit = isSuperAdmin || role.startsWith("Kepala Sekolah");
  const canDelete = isSuperAdmin || role.startsWith("Kepala Sekolah");

  return {
    isSuperAdmin,
    allowedKelas,
    canAccessKelas,
    hasPermission,
    canCreate,
    canEdit,
    canDelete,
    role,
  };
};
