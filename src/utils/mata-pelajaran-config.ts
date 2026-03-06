// src/utils/mata-pelajaran-config.ts
//
// ─── VERSI API + FALLBACK ─────────────────────────────────────────────────────
// Mengambil data dari GET /api/v1/mata-pelajaran?kelas=xxx
// Jika API gagal, otomatis pakai data statis sebagai fallback.
// Ada cache in-memory sehingga tidak fetch ulang setiap buka modal.
// ─────────────────────────────────────────────────────────────────────────────

import { getRequest } from "./api-call";

// ── Tipe ──────────────────────────────────────────────────────────────────────

export interface MataPelajaran {
  kode: string;
  nama: string;
  urutan: number;
}

// ── Cache in-memory ───────────────────────────────────────────────────────────
const _cache = new Map<string, MataPelajaran[]>();

// ── Fallback statis (jika API gagal / down) ───────────────────────────────────
const FALLBACK: Record<string, string[]> = {
  PG_TK: [
    "Nilai Agama dan Budi Pekerti",
    "Jati Diri",
    "Dasar Literasi & STEAM",
    "Motorik Kasar",
    "Motorik Halus",
    "Kognitif",
    "Bahasa",
    "Sosial Emosional",
    "Seni",
  ],
  SD_KELAS_RENDAH: [
    "Pendidikan Agama & Budi Pekerti",
    "PPKn",
    "Bahasa Indonesia",
    "Matematika",
    "Seni Budaya & Prakarya",
    "Pendidikan Jasmani Olahraga & Kesehatan",
    "Bahasa Inggris",
  ],
  SD_KELAS_TINGGI: [
    "Pendidikan Agama & Budi Pekerti",
    "PPKn",
    "Bahasa Indonesia",
    "Matematika",
    "MIPA",
    "IPS",
    "Seni Budaya & Prakarya",
    "Pendidikan Jasmani Olahraga & Kesehatan",
    "Bahasa Inggris",
  ],
  SMP: [
    "Pendidikan Agama & Budi Pekerti",
    "PPKn",
    "Bahasa Indonesia",
    "Matematika",
    "MIPA",
    "IPS",
    "Bahasa Inggris",
    "Seni Budaya",
    "Pendidikan Jasmani Olahraga & Kesehatan",
    "Prakarya",
    "Informatika",
  ],
  SMA_MIPA: [
    "Pendidikan Agama & Budi Pekerti",
    "PPKn",
    "Bahasa Indonesia",
    "Matematika",
    "Fisika",
    "Kimia",
    "Biologi",
    "Bahasa Inggris",
    "Sejarah Indonesia",
    "Seni Budaya",
    "Pendidikan Jasmani Olahraga & Kesehatan",
    "Prakarya & Kewirausahaan",
    "Informatika",
  ],
  SMA_IPS: [
    "Pendidikan Agama & Budi Pekerti",
    "PPKn",
    "Bahasa Indonesia",
    "Matematika",
    "Ekonomi",
    "Sosiologi",
    "Geografi",
    "Sejarah",
    "Bahasa Inggris",
    "Seni Budaya",
    "Pendidikan Jasmani Olahraga & Kesehatan",
    "Prakarya & Kewirausahaan",
    "Informatika",
  ],
};

const _getTingkatan = (kelas: string): string => {
  const k = kelas.trim();
  if (k.startsWith("TK") || k.startsWith("PG")) return "PG_TK";
  if (["1A", "1B", "2A", "2B", "3A", "3B"].includes(k))
    return "SD_KELAS_RENDAH";
  if (["4A", "4B", "5A", "5B", "6A", "6B"].includes(k))
    return "SD_KELAS_TINGGI";
  if (k.match(/^[789]/)) return "SMP";
  if (k.includes("MIPA")) return "SMA_MIPA";
  if (k.includes("IPS")) return "SMA_IPS";
  return "SMP";
};

const _fallbackToObj = (kelas: string): MataPelajaran[] =>
  (FALLBACK[_getTingkatan(kelas)] ?? []).map((nama, i) => ({
    kode: `FB-${i + 1}`,
    nama,
    urutan: i + 1,
  }));

// ── Public: Async (pakai API) ─────────────────────────────────────────────────

/**
 * Fetch mapel dari backend, dengan cache dan fallback statis.
 * Gunakan di dalam React component / useEffect / async handler.
 *
 * @example
 * const mapel = await fetchMapelByKelas("10 IPA 1");
 */
export const fetchMapelByKelas = async (
  kelas: string,
): Promise<MataPelajaran[]> => {
  if (!kelas) return [];
  if (_cache.has(kelas)) return _cache.get(kelas)!;

  try {
    const res = await getRequest(
      `/mata-pelajaran?kelas=${encodeURIComponent(kelas)}`,
    );
    const mapel: MataPelajaran[] = res?.data?.mataPelajaran ?? [];
    if (mapel.length > 0) _cache.set(kelas, mapel); // hanya cache data valid
    return mapel.length > 0 ? mapel : _fallbackToObj(kelas);
  } catch {
    console.warn(`[MataPelajaran] API gagal — pakai fallback untuk "${kelas}"`);
    return _fallbackToObj(kelas);
  }
};

// ── Public: Sync (pakai cache/fallback) ──────────────────────────────────────

/**
 * Versi sinkron — pakai cache jika sudah pernah di-fetch, atau fallback statis.
 * Gunakan untuk inisialisasi awal sebelum fetch selesai.
 */
export const getMapelByKelas = (kelas: string): string[] => {
  if (_cache.has(kelas)) return _cache.get(kelas)!.map((m) => m.nama);
  return _fallbackToObj(kelas).map((m) => m.nama);
};

// ── Public: Utilities ─────────────────────────────────────────────────────────

/** Clear semua cache (berguna saat logout) */
export const clearMapelCache = () => _cache.clear();

/** Label tingkatan yang readable untuk UI */
export const getTingkatanLabel = (kelas: string): string => {
  const map: Record<string, string> = {
    PG_TK: "PG / TK",
    SD_KELAS_RENDAH: "SD Kelas Rendah (1–3)",
    SD_KELAS_TINGGI: "SD Kelas Tinggi (4–6)",
    SMP: "SMP",
    SMA_MIPA: "SMA MIPA",
    SMA_IPS: "SMA IPS",
  };
  return map[_getTingkatan(kelas)] ?? "Umum";
};
