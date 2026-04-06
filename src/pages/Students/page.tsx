import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  GraduationCap,
  Users,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Check,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "@/utils/api-call";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "react-toastify";

import { usePermission } from "@/utils/use-permisson";

import {
  fetchMapelByKelas,
  getMapelByKelas,
  getTingkatanLabel,
} from "@/utils/mata-pelajaran-config";

// ─── Types ────────────────────────────────────────────────────────────────────

type JenisKelamin = "L" | "P";
type StatusSiswa = "AKTIF" | "TIDAK_AKTIF";
type Semester = "GANJIL" | "GENAP";

interface Siswa {
  id: string;
  no: number;
  nama: string;
  nisn: string;
  alamat: string;
  tanggalLahir: string;
  jenisKelamin: JenisKelamin;
  kelas: string;
  telepon: string;
  email: string;
  status: StatusSiswa;
  jenjang_id: string;
}

interface OrangTua {
  id: string;
  siswaId: string;
  namaAyah: string;
  namaIbu: string;
  pekerjaanAyah: string;
  pekerjaanIbu: string;
  teleponAyah: string;
  teleponIbu: string;
  alamatOrangTua: string;
}

interface Nilai {
  id: string;
  siswaId: string;
  mataPelajaran: string;
  semester: Semester;
  tahunAjaran: string;
  nilaiHarian: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir: number;
  _gradeId?: string;
}

// ✅ Type untuk data jenjang dari API
interface JenjangItem {
  jenjang_id: string;
  nama_jenjang: string;
  kode_jenjang: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTanggal = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getNilaiColor = (nilai: number) => {
  if (nilai >= 90) return "text-emerald-600 font-bold";
  if (nilai >= 80) return "text-teal-600 font-semibold";
  if (nilai >= 70) return "text-amber-600 font-semibold";
  return "text-red-500 font-semibold";
};

const getNilaiGrade = (nilai: number) => {
  if (nilai >= 90) return "A";
  if (nilai >= 80) return "B";
  if (nilai >= 70) return "C";
  if (nilai >= 60) return "D";
  return "E";
};

const generateId = (prefix: string) =>
  `${prefix}${Date.now().toString().slice(-6)}`;

// ✅ Helper: derive jenjang_id dari nama kelas + daftar jenjang dari API
// Mapping: nama kelas → kode_jenjang yang tersimpan di DB
const getJenjangIdFromKelas = (
  kelas: string,
  jenjangList: JenjangItem[],
): string => {
  if (!kelas || !jenjangList.length) return "";

  const k = kelas.toUpperCase();

  // Deteksi tingkatan dari string kelas
  let targetKode = "";
  if (k.includes("TK") || k.includes("PG")) {
    // Contoh: "TK A", "TK B", "PG A"
    targetKode = "PGTK";
  } else if (
    k.includes("SMA") ||
    /\b(10|11|12)\b/.test(k) ||
    k.includes("MIPA") ||
    k.includes("IPS")
  ) {
    // Contoh: "SMA - 10 MIPA 1", "10 MIPA 1", "12 IPS 2"
    targetKode = "SMA";
  } else if (k.includes("SMP") || /\b[7-9][ABC]\b/.test(k)) {
    // Contoh: "7A", "8B", "9C", "SMP 7A"
    targetKode = "SMP";
  } else if (/\b[1-6][AB]\b/.test(k) || k.includes("SD")) {
    // Contoh: "1A", "6B", "SD 3A"
    targetKode = "SD";
  }

  if (!targetKode) {
    console.warn(`Tidak bisa mendeteksi tingkatan dari kelas: "${kelas}"`);
    return "";
  }

  // Cari jenjang berdasarkan kode_jenjang (case-insensitive)
  // Juga coba cocokkan via nama_jenjang sebagai fallback
  const found = jenjangList.find(
    (j) =>
      j.kode_jenjang.toUpperCase() === targetKode.toUpperCase() ||
      j.nama_jenjang.toUpperCase().includes(targetKode.toUpperCase()),
  );

  if (!found) {
    console.warn(
      `Jenjang tidak ditemukan untuk kelas: "${kelas}" (targetKode: "${targetKode}")`,
    );
    console.warn(
      "Jenjang tersedia:",
      jenjangList.map((j) => `${j.kode_jenjang} → ${j.nama_jenjang}`),
    );
  }

  return found?.jenjang_id ?? "";
};

// ─── Blank Forms ──────────────────────────────────────────────────────────────

const blankSiswa = (): Omit<Siswa, "id" | "no"> => ({
  nama: "",
  nisn: "",
  alamat: "",
  tanggalLahir: "",
  jenisKelamin: "L",
  kelas: "",
  telepon: "",
  email: "",
  status: "AKTIF",
  jenjang_id: "",
});

const blankOrangTua = (siswaId: string): Omit<OrangTua, "id"> => ({
  siswaId,
  namaAyah: "",
  namaIbu: "",
  pekerjaanAyah: "",
  pekerjaanIbu: "",
  teleponAyah: "",
  teleponIbu: "",
  alamatOrangTua: "",
});

const blankNilai = (siswaId: string): Omit<Nilai, "id"> => ({
  siswaId,
  mataPelajaran: "",
  semester: "GANJIL",
  tahunAjaran: "2024/2025",
  nilaiHarian: 0,
  nilaiUTS: 0,
  nilaiUAS: 0,
  nilaiAkhir: 0,
});

// ─── Modal Siswa ──────────────────────────────────────────────────────────────

interface ModalSiswaProps {
  open: boolean;
  mode: "add" | "edit";
  data: Omit<Siswa, "id" | "no">;
  onChange: (field: keyof Omit<Siswa, "id" | "no">, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function ModalSiswa({
  open,
  mode,
  data,
  onChange,
  onSave,
  onClose,
}: ModalSiswaProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-bold text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            {mode === "add" ? "Tambah Siswa Baru" : "Edit Data Siswa"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Nama Lengkap
            </Label>
            <Input
              value={data.nama}
              onChange={(e) => onChange("nama", e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              NISN
            </Label>
            <Input
              value={data.nisn}
              onChange={(e) => onChange("nisn", e.target.value)}
              placeholder="0051234567"
              maxLength={10}
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Tanggal Lahir
            </Label>
            <Input
              type="date"
              value={data.tanggalLahir.split("T")[0]}
              onChange={(e) => onChange("tanggalLahir", e.target.value)}
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Jenis Kelamin
            </Label>
            <Select
              value={data.jenisKelamin}
              onValueChange={(v) => onChange("jenisKelamin", v)}
            >
              <SelectTrigger className="border-slate-200 focus:border-teal-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Kelas
            </Label>
            <Select
              value={data.kelas}
              onValueChange={(v) => onChange("kelas", v)}
            >
              <SelectTrigger className="border-slate-200 focus:border-teal-400">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>── TK ──</SelectLabel>
                  <SelectItem value="TK A">TK A</SelectItem>
                  <SelectItem value="TK B">TK B</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>── SD ──</SelectLabel>
                  {[
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
                  ].map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>── SMP ──</SelectLabel>
                  {["7A", "7B", "7C", "8A", "8B", "8C", "9A", "9B", "9C"].map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ),
                  )}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>── SMA ──</SelectLabel>
                  {[
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
                  ].map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Status
            </Label>
            <Select
              value={data.status}
              onValueChange={(v) => onChange("status", v)}
            >
              <SelectTrigger className="border-slate-200 focus:border-teal-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Telepon
            </Label>
            <Input
              value={data.telepon}
              onChange={(e) => onChange("telepon", e.target.value)}
              placeholder="081234567890"
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Email
            </Label>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="email@domain.com"
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Alamat
            </Label>
            <Input
              value={data.alamat}
              onChange={(e) => onChange("alamat", e.target.value)}
              placeholder="Jl. Contoh No. 1, Kota"
              className="border-slate-200 focus:border-teal-400 focus:ring-teal-400/20"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Batal
          </Button>
          <Button
            onClick={onSave}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Orang Tua ──────────────────────────────────────────────────────────

interface ModalOrangTuaProps {
  open: boolean;
  mode: "add" | "edit";
  data: Omit<OrangTua, "id">;
  onChange: (field: keyof Omit<OrangTua, "id">, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function ModalOrangTua({
  open,
  mode,
  data,
  onChange,
  onSave,
  onClose,
}: ModalOrangTuaProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {mode === "add" ? "Tambah Data Orang Tua" : "Edit Data Orang Tua"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {[
            {
              label: "Nama Ayah",
              field: "namaAyah" as const,
              ph: "Nama lengkap ayah",
            },
            {
              label: "Nama Ibu",
              field: "namaIbu" as const,
              ph: "Nama lengkap ibu",
            },
            {
              label: "Pekerjaan Ayah",
              field: "pekerjaanAyah" as const,
              ph: "Contoh: PNS, Wiraswasta",
            },
            {
              label: "Pekerjaan Ibu",
              field: "pekerjaanIbu" as const,
              ph: "Contoh: Guru, IRT",
            },
            {
              label: "Telepon Ayah",
              field: "teleponAyah" as const,
              ph: "081200001111",
            },
            {
              label: "Telepon Ibu",
              field: "teleponIbu" as const,
              ph: "081200002222",
            },
          ].map(({ label, field, ph }) => (
            <div key={field} className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {label}
              </Label>
              <Input
                value={(data as Record<string, string>)[field] || ""}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={ph}
                className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
              />
            </div>
          ))}
          <div className="col-span-2 space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Alamat Orang Tua
            </Label>
            <Input
              value={data.alamatOrangTua}
              onChange={(e) => onChange("alamatOrangTua", e.target.value)}
              placeholder="Jl. Contoh No. 1, Kota"
              className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Batal
          </Button>
          <Button
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Nilai ──────────────────────────────────────────────────────────────

interface ModalNilaiProps {
  open: boolean;
  mode: "add" | "edit";
  data: Omit<Nilai, "id">;
  kelasSiswa: string;
  onChange: (field: keyof Omit<Nilai, "id">, value: string | number) => void;
  onSave: () => void;
  onClose: () => void;
}

function ModalNilai({
  open,
  mode,
  data,
  kelasSiswa,
  onChange,
  onSave,
  onClose,
}: ModalNilaiProps) {
  const [mapelList, setMapelList] = useState<string[]>([]);
  const [isLoadingMapel, setIsLoadingMapel] = useState(false);
  const tingkatanLabel = getTingkatanLabel(kelasSiswa);

  useEffect(() => {
    if (!open || !kelasSiswa) return;

    // ✅ Always fetch fresh data from API
    setIsLoadingMapel(true);
    fetchMapelByKelas(kelasSiswa)
      .then((result) => {
        const namaMapel = result.map((m) => m.nama);
        setMapelList(namaMapel);
        console.log(
          `✅ Loaded ${namaMapel.length} mapel for ${kelasSiswa}:`,
          namaMapel,
        );
      })
      .catch((err) => {
        console.error("Error fetching mapel:", err);
        setMapelList([]);
        toast.error("Gagal memuat daftar mata pelajaran");
      })
      .finally(() => setIsLoadingMapel(false));
  }, [open, kelasSiswa]);

  const avg = Math.round(
    (data.nilaiHarian + data.nilaiUTS + data.nilaiUAS) / 3,
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-bold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" />
            {mode === "add" ? "Tambah Data Nilai" : "Edit Data Nilai"}
          </DialogTitle>
          {kelasSiswa && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-medium">
                {tingkatanLabel}
              </span>
              <span className="text-xs text-slate-400">
                Kelas {kelasSiswa}
                {isLoadingMapel
                  ? " · memuat mapel..."
                  : ` · ${mapelList.length} mata pelajaran`}
              </span>
            </div>
          )}
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Mata Pelajaran
              </Label>
              <Select
                value={data.mataPelajaran}
                onValueChange={(v) => onChange("mataPelajaran", v)}
                disabled={isLoadingMapel}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue
                    placeholder={isLoadingMapel ? "Memuat..." : "Pilih mapel"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingMapel ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-400">
                      <div className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                      Memuat...
                    </div>
                  ) : (
                    mapelList.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Semester
              </Label>
              <Select
                value={data.semester}
                onValueChange={(v) => onChange("semester", v)}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GANJIL">Ganjil</SelectItem>
                  <SelectItem value="GENAP">Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Tahun Ajaran
              </Label>
              <Input
                value={data.tahunAjaran}
                onChange={(e) => onChange("tahunAjaran", e.target.value)}
                placeholder="2024/2025"
                className="border-slate-200"
              />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Nilai Harian", field: "nilaiHarian" as const },
              { label: "Nilai UTS", field: "nilaiUTS" as const },
              { label: "Nilai UAS", field: "nilaiUAS" as const },
            ].map(({ label, field }) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {label}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={data[field]}
                  onChange={(e) => {
                    const v = Math.min(
                      100,
                      Math.max(0, Number(e.target.value)),
                    );
                    onChange(field, v);
                    onChange(
                      "nilaiAkhir",
                      Math.round(
                        ((field === "nilaiHarian" ? v : data.nilaiHarian) +
                          (field === "nilaiUTS" ? v : data.nilaiUTS) +
                          (field === "nilaiUAS" ? v : data.nilaiUAS)) /
                          3,
                      ),
                    );
                  }}
                  className="border-slate-200 text-center font-bold"
                />
              </div>
            ))}
          </div>
          <div className="rounded-sm bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">
              Nilai Akhir (Rata-rata)
            </span>
            <span className={cn("text-2xl font-black", getNilaiColor(avg))}>
              {avg} <span className="text-base">({getNilaiGrade(avg)})</span>
            </span>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Batal
          </Button>
          <Button
            onClick={onSave}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Check className="w-4 h-4 mr-1" />
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardSiswa() {
  const { isSuperAdmin, canAccessKelas, canCreate, canEdit, canDelete } =
    usePermission();

  // ── State: Data ────────────────────────────────────────────────────────────
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [orangTuaList, setOrangTuaList] = useState<OrangTua[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);

  // ✅ NEW: State daftar jenjang dari API — dipakai sebagai fallback resolve jenjang_id
  const [jenjangList, setJenjangList] = useState<JenjangItem[]>([]);

  const [page, setPage] = useState(1);
  const limit = 10;

  // ── State: Selection ──────────────────────────────────────────────────────
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ── State: Filter Siswa ───────────────────────────────────────────────────
  const [filterNama, setFilterNama] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJK, setFilterJK] = useState("all");

  // ── State: Filter Nilai ───────────────────────────────────────────────────
  const [filterTahunAjaran, setFilterTahunAjaran] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterMapel, setFilterMapel] = useState("all");

  // ── State: Sort ───────────────────────────────────────────────────────────
  const [sortField, setSortField] = useState<keyof Siswa>("no");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── State: Modal Siswa ────────────────────────────────────────────────────
  const [modalSiswaOpen, setModalSiswaOpen] = useState(false);
  const [modalSiswaMode, setModalSiswaMode] = useState<"add" | "edit">("add");
  const [formSiswa, setFormSiswa] =
    useState<Omit<Siswa, "id" | "no">>(blankSiswa());
  const [editingSiswaId, setEditingSiswaId] = useState<string | null>(null);
  const [deleteSiswaTarget, setDeleteSiswaTarget] = useState<Siswa | null>(
    null,
  );

  // ── State: Modal OrangTua ─────────────────────────────────────────────────
  const [modalOTOpen, setModalOTOpen] = useState(false);
  const [modalOTMode, setModalOTMode] = useState<"add" | "edit">("add");
  const [formOT, setFormOT] = useState<Omit<OrangTua, "id">>(blankOrangTua(""));
  const [editingOTId, setEditingOTId] = useState<string | null>(null);
  const [deleteOTTarget, setDeleteOTTarget] = useState<OrangTua | null>(null);

  // ── State: Modal Nilai ────────────────────────────────────────────────────
  const [modalNilaiOpen, setModalNilaiOpen] = useState(false);
  const [modalNilaiMode, setModalNilaiMode] = useState<"add" | "edit">("add");
  const [formNilai, setFormNilai] = useState<Omit<Nilai, "id">>(blankNilai(""));
  const [editingNilaiId, setEditingNilaiId] = useState<string | null>(null);
  const [deleteNilaiTarget, setDeleteNilaiTarget] = useState<Nilai | null>(
    null,
  );

  // ── Derived: Filter & Sort Siswa ──────────────────────────────────────────
  const filteredSiswa = useMemo(() => {
    let result = [...siswaList];
    if (!isSuperAdmin) {
      result = result.filter((s) => canAccessKelas(s.kelas));
    }
    if (filterNama)
      result = result.filter(
        (s) =>
          s.nama.toLowerCase().includes(filterNama.toLowerCase()) ||
          s.nisn.includes(filterNama),
      );
    if (filterKelas !== "all")
      result = result.filter((s) => s.kelas === filterKelas);
    if (filterStatus !== "all")
      result = result.filter((s) => s.status === filterStatus);
    if (filterJK !== "all")
      result = result.filter((s) => s.jenisKelamin === filterJK);
    result.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = String(av).localeCompare(String(bv), "id", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [
    siswaList,
    filterNama,
    filterKelas,
    filterStatus,
    filterJK,
    sortField,
    sortDir,
    isSuperAdmin,
    canAccessKelas,
  ]);

  // ── Derived: Detail data ──────────────────────────────────────────────────
  const selectedOrangTua = useMemo(
    () =>
      selectedSiswa
        ? orangTuaList.filter((ot) => ot.siswaId === selectedSiswa.id)
        : [],
    [orangTuaList, selectedSiswa],
  );

  const nilaiSiswa = useMemo(
    () =>
      selectedSiswa
        ? nilaiList.filter((n) => n.siswaId === selectedSiswa.id)
        : [],
    [nilaiList, selectedSiswa],
  );

  const tahunAjaranList = useMemo(
    () => [...new Set(nilaiSiswa.map((n) => n.tahunAjaran))].sort().reverse(),
    [nilaiSiswa],
  );

  const filteredNilai = useMemo(() => {
    let result = [...nilaiSiswa];
    if (filterTahunAjaran !== "all")
      result = result.filter((n) => n.tahunAjaran === filterTahunAjaran);
    if (filterSemester !== "all")
      result = result.filter((n) => n.semester === filterSemester);
    if (filterMapel !== "all")
      result = result.filter((n) => n.mataPelajaran === filterMapel);
    return result;
  }, [nilaiSiswa, filterTahunAjaran, filterSemester, filterMapel]);

  const kelasList = useMemo(() => {
    const base = isSuperAdmin
      ? siswaList
      : siswaList.filter((s) => canAccessKelas(s.kelas));
    return [...new Set(base.map((s) => s.kelas))].sort();
  }, [siswaList, isSuperAdmin, canAccessKelas]);

  const mapelFilterList = useMemo(() => {
    let base = [...nilaiSiswa];
    if (filterTahunAjaran !== "all")
      base = base.filter((n) => n.tahunAjaran === filterTahunAjaran);
    if (filterSemester !== "all")
      base = base.filter((n) => n.semester === filterSemester);
    return [...new Set(base.map((n) => n.mataPelajaran))].sort();
  }, [nilaiSiswa, filterTahunAjaran, filterSemester]);

  const hasActiveNilaiFilter =
    filterTahunAjaran !== "all" ||
    filterSemester !== "all" ||
    filterMapel !== "all";

  const resetNilaiFilter = () => {
    setFilterTahunAjaran("all");
    setFilterSemester("all");
    setFilterMapel("all");
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: filteredSiswa.length,
      aktif: filteredSiswa.filter((s) => s.status === "AKTIF").length,
      laki: filteredSiswa.filter((s) => s.jenisKelamin === "L").length,
      perempuan: filteredSiswa.filter((s) => s.jenisKelamin === "P").length,
    }),
    [filteredSiswa],
  );

  const avgNilai = useMemo(() => {
    if (!filteredNilai.length) return 0;
    return Math.round(
      filteredNilai.reduce((acc, n) => acc + n.nilaiAkhir, 0) /
        filteredNilai.length,
    );
  }, [filteredNilai]);

  // ── Action: Select Siswa ──────────────────────────────────────────────────
  const handleSelectSiswa = useCallback(
    (siswa: Siswa) => {
      if (selectedSiswa?.id === siswa.id) {
        setSelectedSiswa(null);
        return;
      }
      setIsLoadingDetail(true);
      setSelectedSiswa(siswa);
      resetNilaiFilter();
      setTimeout(() => setIsLoadingDetail(false), 300);
    },
    [selectedSiswa],
  );

  // ── Action: Sort ──────────────────────────────────────────────────────────
  const handleSort = (field: keyof Siswa) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: keyof Siswa }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3 inline ml-1 text-teal-600" />
      ) : (
        <ChevronDown className="w-3 h-3 inline ml-1 text-teal-600" />
      )
    ) : (
      <ChevronUp className="w-3 h-3 inline ml-1 text-slate-300" />
    );

  // ── CRUD: Siswa ───────────────────────────────────────────────────────────
  const openAddSiswa = () => {
    setFormSiswa(blankSiswa());
    setModalSiswaMode("add");
    setEditingSiswaId(null);
    setModalSiswaOpen(true);
  };
  const openEditSiswa = (s: Siswa) => {
    const { id, no, ...rest } = s;
    setFormSiswa(rest);
    setEditingSiswaId(id);
    setModalSiswaMode("edit");
    setModalSiswaOpen(true);
  };
  const saveSiswa = async () => {
    const errors: string[] = [];
    if (!formSiswa.nama) errors.push("Nama");
    if (!formSiswa.nisn) {
      errors.push("NISN");
    } else if (!/^\d{10}$/.test(formSiswa.nisn)) {
      toast.error("NISN harus tepat 10 digit angka");
      return;
    }
    if (!formSiswa.kelas) errors.push("Kelas");
    if (!formSiswa.tanggalLahir) errors.push("Tanggal Lahir");
    if (!formSiswa.jenisKelamin) errors.push("Jenis Kelamin");
    if (!formSiswa.alamat) errors.push("Alamat");
    if (!formSiswa.status) errors.push("Status");
    if (!formSiswa.telepon) errors.push("Telepon");
    if (!formSiswa.email) errors.push("Email");
    if (errors.length > 0) {
      toast.error(`Field berikut wajib diisi: ${errors.join(", ")}`);
      return;
    }

    // ✅ Resolve jenjang_id — wajib dikirim ke backend sebagai UUID v4
    const jenjangId =
      formSiswa.jenjang_id ||
      getJenjangIdFromKelas(formSiswa.kelas, jenjangList);

    if (!jenjangId) {
      toast.error(
        "Jenjang tidak ditemukan untuk kelas ini. Pastikan data jenjang sudah tersedia.",
      );
      return;
    }

    try {
      if (modalSiswaMode === "add") {
        const newId = generateId("S");
        const newNo = Math.max(...siswaList.map((s) => s.no), 0) + 1;
        const payload = {
          id: newId,
          no: newNo,
          ...formSiswa,
          jenjang_id: jenjangId, // ✅ selalu kirim jenjang_id valid
        };
        await postRequest("/siswa", payload);
        setSiswaList((prev) => [...prev, payload]);
      } else if (editingSiswaId) {
        const payload = {
          ...formSiswa,
          jenjang_id: jenjangId, // ✅ selalu kirim jenjang_id valid
        };
        await putRequest(`/siswa/${editingSiswaId}`, payload);
        setSiswaList((prev) =>
          prev.map((s) => (s.id === editingSiswaId ? { ...s, ...payload } : s)),
        );
        if (selectedSiswa?.id === editingSiswaId) {
          setSelectedSiswa((prev) => (prev ? { ...prev, ...payload } : prev));
        }
      }
      setModalSiswaOpen(false);
      toast.success("Data siswa berhasil disimpan");
    } catch {
      // error sudah ditangani oleh handleApiError di api-call.ts
    }
  };
  const deleteSiswa = (s: Siswa) => {
    setSiswaList((prev) => prev.filter((x) => x.id !== s.id));
    setOrangTuaList((prev) => prev.filter((ot) => ot.siswaId !== s.id));
    setNilaiList((prev) => prev.filter((n) => n.siswaId !== s.id));
    if (selectedSiswa?.id === s.id) setSelectedSiswa(null);
    deleteRequest(`/siswa/${s.id}`);
    deleteRequest(`/orang-tua/siswa/${s.id}`);
    deleteRequest(`/subject-grades/siswa/${s.id}`);
    setDeleteSiswaTarget(null);
  };

  // ── CRUD: Orang Tua ───────────────────────────────────────────────────────
  const openAddOT = () => {
    if (!selectedSiswa) return;
    setFormOT(blankOrangTua(selectedSiswa.id));
    setModalOTMode("add");
    setEditingOTId(null);
    setModalOTOpen(true);
  };
  const openEditOT = (ot: OrangTua) => {
    const { id, ...rest } = ot;
    setFormOT(rest);
    setEditingOTId(id);
    setModalOTMode("edit");
    setModalOTOpen(true);
  };
  const saveOT = async () => {
    if (!formOT.namaAyah && !formOT.namaIbu) return;
    if (modalOTMode === "add") {
      setOrangTuaList((prev) => [...prev, { id: generateId("OT"), ...formOT }]);
      await postRequest(`/orang-tua/siswa/${formOT.siswaId}`, formOT);
    } else if (editingOTId) {
      setOrangTuaList((prev) =>
        prev.map((ot) => (ot.id === editingOTId ? { ...ot, ...formOT } : ot)),
      );
      await putRequest(`/orang-tua/${editingOTId}`, formOT);
    }
    setModalOTOpen(false);
  };
  const deleteOT = async (ot: OrangTua) => {
    setOrangTuaList((prev) => prev.filter((x) => x.id !== ot.id));
    await deleteRequest(`/orang-tua/${ot.id}`);
    setDeleteOTTarget(null);
  };

  // ── CRUD: Nilai ───────────────────────────────────────────────────────────
  const openAddNilai = () => {
    if (!selectedSiswa) return;
    setFormNilai(blankNilai(selectedSiswa.id));
    setModalNilaiMode("add");
    setEditingNilaiId(null);
    setModalNilaiOpen(true);
  };
  const openEditNilai = (n: Nilai) => {
    const { id, ...rest } = n;
    setFormNilai(rest);
    setEditingNilaiId(id);
    setModalNilaiMode("edit");
    setModalNilaiOpen(true);
  };

  const saveNilai = async () => {
    if (!formNilai.mataPelajaran) {
      toast.error("Mata pelajaran wajib dipilih");
      return;
    }

    const jenjangId =
      selectedSiswa?.jenjang_id ||
      getJenjangIdFromKelas(selectedSiswa?.kelas ?? "", jenjangList);

    if (!jenjangId) {
      toast.error("Jenjang siswa tidak ditemukan.");
      return;
    }

    const semesterFormatted =
      formNilai.semester === "GANJIL" ? "Ganjil" : "Genap";

    try {
      if (modalNilaiMode === "add") {
        // Cek record tahun_ajaran + semester sudah ada atau belum
        const existing = await getRequest(
          `/subject-grades?student_user_id=${selectedSiswa?.id}&tahun_ajaran=${formNilai.tahunAjaran}&semester=${semesterFormatted}`,
        );
        const existingRecord =
          (existing?.data ?? []).find(
            (r: any) =>
              r.student_user_id === selectedSiswa?.id &&
              r.tahun_ajaran === formNilai.tahunAjaran &&
              r.semester?.toLowerCase() === semesterFormatted.toLowerCase(),
          ) ?? null;

        if (existingRecord) {
          // ── Sudah ada → merge nilai_json lalu PUT
          const mergedNilaiJson = {
            ...(existingRecord.nilai_json ?? {}),
            [formNilai.mataPelajaran]: formNilai.nilaiAkhir,
          };
          await putRequest(`/subject-grades/${existingRecord.grade_id}`, {
            nilai_json: mergedNilaiJson,
            catatan: existingRecord.catatan ?? "",
            status: existingRecord.status ?? "Published",
          });
        } else {
          // ── Belum ada → POST baru
          await postRequest(`/subject-grades`, {
            student_user_id: selectedSiswa?.id ?? "",
            nama_siswa: selectedSiswa?.nama ?? "",
            jenjang_id: jenjangId,
            tahun_ajaran: formNilai.tahunAjaran,
            semester: semesterFormatted,
            status: "Published",
            catatan: "",
            nilai_json: {
              [formNilai.mataPelajaran]: formNilai.nilaiAkhir,
            },
          });
        }
      } else if (editingNilaiId) {
        // ── Edit: cari grade_id dari _gradeId yang disimpan saat flatten
        const targetItem = nilaiList.find((n) => n.id === editingNilaiId);
        const gradeId = (targetItem as any)?._gradeId;

        if (gradeId) {
          // Ambil record terbaru dari API untuk dapat nilai_json lengkap
          const existingRes = await getRequest(
            `/subject-grades?student_user_id=${selectedSiswa?.id}&tahun_ajaran=${formNilai.tahunAjaran}&semester=${semesterFormatted}`,
          );
          const gradeRecord =
            (existingRes?.data ?? []).find(
              (r: any) => r.grade_id === gradeId,
            ) ?? null;

          const mergedNilaiJson = {
            ...(gradeRecord?.nilai_json ?? {}),
            [formNilai.mataPelajaran]: formNilai.nilaiAkhir,
          };

          await putRequest(`/subject-grades/${gradeId}`, {
            nilai_json: mergedNilaiJson,
            catatan: gradeRecord?.catatan ?? "",
            status: gradeRecord?.status ?? "Published",
          });
        }
      }

      // ✅ Refetch dari API setelah save — pastikan UI sync dengan DB
      await getNilaiSiswa(selectedSiswa?.id ?? "");
      setModalNilaiOpen(false);
      toast.success("Data nilai berhasil disimpan");
    } catch {
      // error ditangani handleApiError
    }
  };

  const deleteNilai = async (n: Nilai) => {
    const gradeId = (n as any)._gradeId;
    if (!gradeId) return;

    try {
      // Ambil record lengkap dulu
      const res = await getRequest(
        `/subject-grades?student_user_id=${selectedSiswa?.id}`,
      );
      const record = (res?.data ?? []).find((r: any) => r.grade_id === gradeId);

      if (record) {
        const updatedNilaiJson = { ...record.nilai_json };
        delete updatedNilaiJson[n.mataPelajaran]; // hapus hanya key mapel ini

        if (Object.keys(updatedNilaiJson).length === 0) {
          // Jika nilai_json kosong → hapus seluruh record
          await deleteRequest(`/subject-grades/${gradeId}`);
        } else {
          // Masih ada mapel lain → update nilai_json tanpa mapel ini
          await putRequest(`/subject-grades/${gradeId}`, {
            nilai_json: updatedNilaiJson,
            catatan: record.catatan ?? "",
            status: record.status ?? "Published",
          });
        }
      }

      // Refetch setelah delete
      await getNilaiSiswa(selectedSiswa?.id ?? "");
    } catch {
      // error ditangani handleApiError
    }

    setDeleteNilaiTarget(null);
  };

  // ── API Fetch ─────────────────────────────────────────────────────────────
  const fetchSiswa = async () => {
    const res = await getRequest(`/siswa`);
    const normalized = (res.data as any[]).map((s: any) => ({
      ...s,
      jenjang_id:
        s.jenjang_id ||
        s.jenjangId ||
        s.jenjang?.id ||
        s.jenjang?.jenjang_id ||
        "",
    }));
    setSiswaList(normalized);
  };

  // ✅ NEW: Fetch daftar jenjang sekali saat mount
  // Digunakan sebagai fallback resolve jenjang_id ketika model Siswa (legacy)
  // tidak menyertakan jenjang_id di response API
  const fetchJenjang = async () => {
    try {
      const res = await getRequest("/jenjang");
      const data: JenjangItem[] = (res.data ?? []).map((j: any) => ({
        jenjang_id: j.jenjang_id ?? j.id ?? "",
        nama_jenjang: j.nama_jenjang ?? j.nama ?? "",
        kode_jenjang: j.kode_jenjang ?? j.kode ?? "",
      }));
      setJenjangList(data);
      console.log(
        "✅ Jenjang loaded:",
        data.map((j) => `${j.kode_jenjang} (${j.nama_jenjang})`),
      );
    } catch {
      console.warn(
        "⚠️ Gagal fetch jenjang — jenjang_id tidak bisa di-resolve otomatis",
      );
    }
  };

  // ── API Fetch: Nilai ──────────────────────────────────────────────────────────
  const getNilaiSiswa = async (id: string) => {
    const res = await getRequest(`/subject-grades?student_user_id=${id}`);
    const raw: any[] = res.data ?? [];

    // ✅ Flatten: 1 record API (per semester) → N rows UI (per mata pelajaran)
    // Backend simpan nilai_json: { "Matematika": 85, "IPS": 90 }
    // UI butuh: [{ mataPelajaran: "Matematika", nilaiAkhir: 85 }, ...]
    const flattened: Nilai[] = raw
      .filter((record) => record.student_user_id === id) // hanya milik siswa ini
      .flatMap((record) => {
        const nilaiJson: Record<string, number> = record.nilai_json ?? {};
        const semesterNormalized =
          record.semester?.toUpperCase() === "GENAP" ? "GENAP" : "GANJIL";

        return Object.entries(nilaiJson).map(([mapel, nilai]) => ({
          id: `${record.grade_id}_${mapel}`, // ID unik: grade_id + nama mapel
          siswaId: id,
          mataPelajaran: mapel,
          semester: semesterNormalized as Semester,
          tahunAjaran: record.tahun_ajaran ?? "",
          nilaiHarian: Number(nilai),
          nilaiUTS: Number(nilai),
          nilaiUAS: Number(nilai),
          nilaiAkhir: Number(nilai),
          // ✅ Simpan grade_id asli untuk keperluan PUT/DELETE
          _gradeId: record.grade_id,
        }));
      });

    setNilaiList(flattened as any);
  };

  const getOrangTuaSiswa = async (id: string) => {
    const res = await getRequest(`/orang-tua/siswa/${id}`);
    setOrangTuaList(res.data);
  };

  // ✅ Mount: fetch siswa + jenjang secara paralel
  useEffect(() => {
    fetchSiswa();
    fetchJenjang();
  }, []);

  useEffect(() => {
    if (!selectedSiswa?.id) return;
    getNilaiSiswa(selectedSiswa.id);
    getOrangTuaSiswa(selectedSiswa.id);
  }, [selectedSiswa]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div
        className="min-h-screen"
        style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}
      >
        <main className="max-w-[1400px] mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "Total Siswa",
                value: stats.total,
                icon: <GraduationCap className="w-5 h-5" />,
                color: "text-teal-600",
                bg: "bg-teal-50",
                border: "border-teal-100",
              },
              {
                label: "Siswa Aktif",
                value: stats.aktif,
                icon: <Check className="w-5 h-5" />,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                border: "border-emerald-100",
              },
              {
                label: "Laki-laki",
                value: stats.laki,
                icon: <Users className="w-5 h-5" />,
                color: "text-blue-600",
                bg: "bg-blue-50",
                border: "border-blue-100",
              },
              {
                label: "Perempuan",
                value: stats.perempuan,
                icon: <Users className="w-5 h-5" />,
                color: "text-pink-600",
                bg: "bg-pink-50",
                border: "border-pink-100",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-white rounded-sm border ${stat.border} p-4 flex items-center gap-3`}
              >
                <div
                  className={`w-10 h-10 rounded-sm ${stat.bg} flex items-center justify-center ${stat.color}`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── TABLE SISWA ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-teal-50 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Data Siswa
                  </h2>
                  <p className="text-xs text-slate-400">
                    Klik baris untuk lihat detail
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-teal-50 text-teal-700 border-teal-100 text-xs font-bold"
                >
                  {filteredSiswa.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={filterNama}
                    onChange={(e) => setFilterNama(e.target.value)}
                    placeholder="Cari nama / NISN…"
                    className="pl-8 h-8 text-xs w-44 border-slate-200 focus:border-teal-400"
                  />
                  {filterNama && (
                    <button
                      onClick={() => setFilterNama("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <Select value={filterKelas} onValueChange={setFilterKelas}>
                  <SelectTrigger className="h-8 text-xs w-32 border-slate-200">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {kelasList.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterJK} onValueChange={setFilterJK}>
                  <SelectTrigger className="h-8 text-xs w-32 border-slate-200">
                    <SelectValue placeholder="Jenis Kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs w-28 border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
                {canCreate && (
                  <Button
                    onClick={openAddSiswa}
                    size="sm"
                    className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Siswa
                  </Button>
                )}
              </div>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-12">
                      <span className="sr-only">No</span>
                    </TableHead>
                    {[
                      {
                        label: "Nama Siswa",
                        field: "nama" as keyof Siswa,
                        w: "min-w-[160px]",
                      },
                      {
                        label: "ID Siswa",
                        field: "no" as keyof Siswa,
                        w: "w-12",
                      },
                      {
                        label: "NISN",
                        field: "nisn" as keyof Siswa,
                        w: "w-32",
                      },
                      {
                        label: "Kelas",
                        field: "kelas" as keyof Siswa,
                        w: "w-32",
                      },
                      {
                        label: "Jenis Kelamin",
                        field: "jenisKelamin" as keyof Siswa,
                        w: "w-28",
                      },
                      {
                        label: "Tanggal Lahir",
                        field: "tanggalLahir" as keyof Siswa,
                        w: "w-36",
                      },
                      {
                        label: "Alamat",
                        field: "alamat" as keyof Siswa,
                        w: "min-w-[180px]",
                      },
                      {
                        label: "Telepon",
                        field: "telepon" as keyof Siswa,
                        w: "w-32",
                      },
                      {
                        label: "Status",
                        field: "status" as keyof Siswa,
                        w: "w-24",
                      },
                    ].map(({ label, field, w }) => (
                      <TableHead
                        key={field}
                        onClick={() => handleSort(field)}
                        className={`${w} text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-teal-600 whitespace-nowrap py-3`}
                      >
                        {label}
                        <SortIcon field={field} />
                      </TableHead>
                    ))}
                    <TableHead className="w-20 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSiswa.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-12 text-slate-400 text-sm"
                      >
                        Tidak ada data siswa ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSiswa
                      .slice(limit * (page - 1), limit * page)
                      .map((siswa, idx) => (
                        <TableRow
                          key={siswa.id}
                          onClick={() => handleSelectSiswa(siswa)}
                          className={cn(
                            "transition-colors text-sm cursor-pointer hover:bg-slate-50",
                            selectedSiswa?.id === siswa.id &&
                              "bg-teal-50 hover:bg-teal-50",
                          )}
                        >
                          <TableCell className="font-mono text-xs text-slate-500 py-2.5">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                                  siswa.jenisKelamin === "L"
                                    ? "bg-blue-400"
                                    : "bg-pink-400",
                                )}
                              >
                                {siswa.nama.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-700">
                                {siswa.nama}
                              </span>
                              {selectedSiswa?.id === siswa.id && (
                                <ChevronRight className="w-3.5 h-3.5 text-teal-500 ml-auto" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500 py-2.5">
                            {siswa.no}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600 py-2.5">
                            {siswa.nisn}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge
                              variant="outline"
                              className="text-xs border-slate-200 text-slate-600 font-medium"
                            >
                              {siswa.kelas}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-slate-600">
                            {siswa.jenisKelamin === "L"
                              ? "Laki-laki"
                              : "Perempuan"}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-slate-600 whitespace-nowrap">
                            {formatTanggal(siswa.tanggalLahir)}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-slate-500 max-w-[200px] truncate">
                            {siswa.alamat}
                          </TableCell>
                          <TableCell className="py-2.5 font-mono text-xs text-slate-500">
                            {siswa.telepon}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge
                              className={cn(
                                "text-xs font-semibold border-0",
                                siswa.status === "AKTIF"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {siswa.status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="py-2.5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-teal-50 hover:text-teal-600"
                                  onClick={() => openEditSiswa(siswa)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-red-50 hover:text-red-500"
                                  onClick={() => setDeleteSiswaTarget(siswa)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={12}>
                      <div className="flex w-full justify-end items-center">
                        <Pagination className="justify-end w-auto mx-0">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                className="cursor-pointer select-none"
                                onClick={() =>
                                  page > 1 &&
                                  setPage((prev) => Math.max(prev - 1, 1))
                                }
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <span className="px-4 text-sm font-medium text-muted-foreground">
                                Hal. {page}
                              </span>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext
                                className="cursor-pointer select-none"
                                onClick={() =>
                                  filteredSiswa.length / limit > page &&
                                  setPage((prev) => prev + 1)
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          {/* ── DETAIL SECTION ────────────────────────────────────────────────── */}
          {selectedSiswa ? (
            <div className="space-y-5">
              {/* Detail Header */}
              <div className="flex items-center gap-3 bg-teal-600 rounded-sm p-4 text-white">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0",
                    selectedSiswa.jenisKelamin === "L"
                      ? "bg-teal-400"
                      : "bg-teal-300",
                  )}
                >
                  {selectedSiswa.nama.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-base leading-none">
                    {selectedSiswa.nama}
                  </p>
                  <p className="text-teal-200 text-xs mt-1 font-mono">
                    {selectedSiswa.nisn} · {selectedSiswa.kelas} ·{" "}
                    {selectedSiswa.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-teal-200 hover:text-white hover:bg-teal-500"
                  onClick={() => setSelectedSiswa(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* ── TABLE NILAI ──────────────────────────────────────────────── */}
                <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-6 h-6 rounded-sm bg-violet-50 flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">
                        Nilai Akademik
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-violet-50 text-violet-700 border-violet-100 text-xs font-bold"
                      >
                        {filteredNilai.length}
                      </Badge>
                      {filteredNilai.length > 0 && (
                        <span
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200",
                            getNilaiColor(avgNilai),
                          )}
                        >
                          Rata-rata: {avgNilai} ({getNilaiGrade(avgNilai)})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {tahunAjaranList.length > 0 && (
                        <Select
                          value={filterTahunAjaran}
                          onValueChange={(v) => {
                            setFilterTahunAjaran(v);
                            setFilterMapel("all");
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs w-[116px] border-slate-200">
                            <CalendarDays className="w-3 h-3 text-slate-400 shrink-0 mr-1" />
                            <SelectValue placeholder="T.A." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua T.A.</SelectItem>
                            {tahunAjaranList.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Select
                        value={filterSemester}
                        onValueChange={(v) => {
                          setFilterSemester(v);
                          setFilterMapel("all");
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-24 border-slate-200">
                          <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="GANJIL">Ganjil</SelectItem>
                          <SelectItem value="GENAP">Genap</SelectItem>
                        </SelectContent>
                      </Select>

                      {mapelFilterList.length > 0 && (
                        <Select
                          value={filterMapel}
                          onValueChange={setFilterMapel}
                        >
                          <SelectTrigger className="h-7 text-xs w-32 border-slate-200">
                            <SelectValue placeholder="Mapel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Mapel</SelectItem>
                            {mapelFilterList.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {hasActiveNilaiFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-slate-400 hover:text-slate-600 gap-1 px-2"
                          onClick={resetNilaiFilter}
                        >
                          <X className="w-3 h-3" />
                          Reset
                        </Button>
                      )}

                      {canCreate && (
                        <Button
                          onClick={openAddNilai}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-violet-200 text-violet-600 hover:bg-violet-50 gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Tambah
                        </Button>
                      )}
                    </div>
                  </div>

                  {hasActiveNilaiFilter && (
                    <div className="px-5 py-2 bg-violet-50 border-b border-violet-100 flex items-center gap-2 text-xs text-violet-600 flex-wrap">
                      <span className="font-semibold">Filter aktif:</span>
                      {filterTahunAjaran !== "all" && (
                        <span className="bg-white rounded px-1.5 py-0.5 border border-violet-200">
                          T.A. {filterTahunAjaran}
                        </span>
                      )}
                      {filterSemester !== "all" && (
                        <span className="bg-white rounded px-1.5 py-0.5 border border-violet-200">
                          Semester {filterSemester}
                        </span>
                      )}
                      {filterMapel !== "all" && (
                        <span className="bg-white rounded px-1.5 py-0.5 border border-violet-200">
                          {filterMapel}
                        </span>
                      )}
                      <span className="ml-auto text-violet-400">
                        {filteredNilai.length} data ditemukan
                      </span>
                    </div>
                  )}

                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            {[
                              "Mata Pelajaran",
                              "Semester",
                              "T.A.",
                              "Harian",
                              "UTS",
                              "UAS",
                              "Akhir",
                              "Grade",
                            ].map((h) => (
                              <TableHead
                                key={h}
                                className="text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5 whitespace-nowrap text-center first:text-left"
                              >
                                {h}
                              </TableHead>
                            ))}
                            <TableHead className="text-right text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredNilai.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="text-center py-8 text-slate-400 text-xs"
                              >
                                {hasActiveNilaiFilter
                                  ? "Tidak ada nilai untuk filter yang dipilih"
                                  : "Belum ada data nilai"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredNilai.map((n) => (
                              <TableRow
                                key={n.id}
                                className="text-xs hover:bg-violet-50/50"
                              >
                                <TableCell className="py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                                  {n.mataPelajaran}
                                </TableCell>
                                <TableCell className="py-2.5 text-center text-slate-500">
                                  {n.semester}
                                </TableCell>
                                <TableCell className="py-2.5 text-center text-slate-400 font-mono">
                                  {n.tahunAjaran}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "py-2.5 text-center",
                                    getNilaiColor(n.nilaiHarian),
                                  )}
                                >
                                  {n.nilaiHarian}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "py-2.5 text-center",
                                    getNilaiColor(n.nilaiUTS),
                                  )}
                                >
                                  {n.nilaiUTS}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "py-2.5 text-center",
                                    getNilaiColor(n.nilaiUAS),
                                  )}
                                >
                                  {n.nilaiUAS}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "py-2.5 text-center text-sm font-black",
                                    getNilaiColor(n.nilaiAkhir),
                                  )}
                                >
                                  {n.nilaiAkhir}
                                </TableCell>
                                <TableCell className="py-2.5 text-center">
                                  <span
                                    className={cn(
                                      "inline-flex w-8 h-6 items-center justify-center rounded-sm text-xs font-black",
                                      n.nilaiAkhir >= 90
                                        ? "bg-emerald-100 text-emerald-700"
                                        : n.nilaiAkhir >= 80
                                          ? "bg-teal-100 text-teal-700"
                                          : n.nilaiAkhir >= 70
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-red-100 text-red-600",
                                    )}
                                  >
                                    {getNilaiGrade(n.nilaiAkhir)}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-violet-100 hover:text-violet-600"
                                        onClick={() => openEditNilai(n)}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-red-100 hover:text-red-500"
                                        onClick={() => setDeleteNilaiTarget(n)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* ── TABLE ORANG TUA ─────────────────────────────────────────── */}
                <div className="bg-white rounded-sm h-fit border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-sm bg-blue-50 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">
                        Data Orang Tua
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-100 text-xs font-bold"
                      >
                        {selectedOrangTua.length}
                      </Badge>
                    </div>
                    {canCreate && (
                      <Button
                        onClick={openAddOT}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Tambah
                      </Button>
                    )}
                  </div>
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-5 h-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            {[
                              "Nama Ayah",
                              "Pekerjaan Ayah",
                              "Nama Ibu",
                              "Pekerjaan Ibu",
                              "Telepon Ayah",
                              "Alamat",
                            ].map((h) => (
                              <TableHead
                                key={h}
                                className="text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5 whitespace-nowrap"
                              >
                                {h}
                              </TableHead>
                            ))}
                            <TableHead className="text-right text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5">
                              Aksi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrangTua.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-slate-400 text-xs"
                              >
                                Belum ada data orang tua
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedOrangTua.map((ot) => (
                              <TableRow
                                key={ot.id}
                                className="text-xs hover:bg-blue-50/50"
                              >
                                <TableCell className="py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                                  {ot.namaAyah}
                                </TableCell>
                                <TableCell className="py-2.5 text-slate-500">
                                  {ot.pekerjaanAyah}
                                </TableCell>
                                <TableCell className="py-2.5 font-semibold text-slate-700 whitespace-nowrap">
                                  {ot.namaIbu}
                                </TableCell>
                                <TableCell className="py-2.5 text-slate-500">
                                  {ot.pekerjaanIbu}
                                </TableCell>
                                <TableCell className="py-2.5 font-mono text-slate-500">
                                  {ot.teleponAyah}
                                </TableCell>
                                <TableCell className="py-2.5 text-slate-500 max-w-[140px] truncate">
                                  {ot.alamatOrangTua}
                                </TableCell>
                                <TableCell className="py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {canEdit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-blue-100 hover:text-blue-600"
                                        onClick={() => openEditOT(ot)}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                    )}
                                    {canDelete && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-red-100 hover:text-red-500"
                                        onClick={() => setDeleteOTTarget(ot)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-sm py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center mb-1">
                <ChevronRight className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                Pilih siswa untuk melihat detail
              </p>
              <p className="text-xs">
                Klik baris pada tabel siswa di atas untuk menampilkan data orang
                tua dan nilai
              </p>
            </div>
          )}
        </main>

        {/* ── Modals ────────────────────────────────────────────────────────── */}

        <ModalSiswa
          open={modalSiswaOpen}
          mode={modalSiswaMode}
          data={formSiswa}
          onChange={(f, v) => setFormSiswa((prev) => ({ ...prev, [f]: v }))}
          onSave={saveSiswa}
          onClose={() => setModalSiswaOpen(false)}
        />

        <ModalOrangTua
          open={modalOTOpen}
          mode={modalOTMode}
          data={formOT}
          onChange={(f, v) => setFormOT((prev) => ({ ...prev, [f]: v }))}
          onSave={saveOT}
          onClose={() => setModalOTOpen(false)}
        />

        <ModalNilai
          open={modalNilaiOpen}
          mode={modalNilaiMode}
          data={formNilai}
          kelasSiswa={selectedSiswa?.kelas ?? ""}
          onChange={(f, v) => setFormNilai((prev) => ({ ...prev, [f]: v }))}
          onSave={saveNilai}
          onClose={() => setModalNilaiOpen(false)}
        />

        {/* Delete Siswa */}
        <AlertDialog
          open={!!deleteSiswaTarget}
          onOpenChange={() => setDeleteSiswaTarget(null)}
        >
          <AlertDialogContent className="bg-white border border-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-slate-800">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Hapus Data Siswa
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">
                Apakah Anda yakin ingin menghapus data siswa{" "}
                <span className="font-semibold text-slate-700">
                  {deleteSiswaTarget?.nama}
                </span>
                ? Semua data orang tua dan nilai terkait juga akan dihapus
                permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-200 text-slate-600">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteSiswaTarget && deleteSiswa(deleteSiswaTarget)
                }
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Orang Tua */}
        <AlertDialog
          open={!!deleteOTTarget}
          onOpenChange={() => setDeleteOTTarget(null)}
        >
          <AlertDialogContent className="bg-white border border-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-slate-800">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Hapus Data Orang Tua
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">
                Hapus data orang tua{" "}
                <span className="font-semibold text-slate-700">
                  {deleteOTTarget?.namaAyah} & {deleteOTTarget?.namaIbu}
                </span>
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-200 text-slate-600">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteOTTarget && deleteOT(deleteOTTarget)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Nilai */}
        <AlertDialog
          open={!!deleteNilaiTarget}
          onOpenChange={() => setDeleteNilaiTarget(null)}
        >
          <AlertDialogContent className="bg-white border border-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-slate-800">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Hapus Data Nilai
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">
                Hapus nilai{" "}
                <span className="font-semibold text-slate-700">
                  {deleteNilaiTarget?.mataPelajaran}
                </span>{" "}
                semester {deleteNilaiTarget?.semester} T.A.{" "}
                {deleteNilaiTarget?.tahunAjaran}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-200 text-slate-600">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteNilaiTarget && deleteNilai(deleteNilaiTarget)
                }
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
