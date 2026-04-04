import { useState, useMemo, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Search,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  RefreshCw,
  ShieldAlert,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "@/utils/api-call";
import { toast } from "react-toastify";
import { clearMapelCache } from "@/utils/mata-pelajaran-config";
import { usePermission } from "@/utils/use-permisson";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tingkatan =
  | "PG_TK"
  | "SD_KELAS_RENDAH"
  | "SD_KELAS_TINGGI"
  | "SMP"
  | "SMA_MIPA"
  | "SMA_IPS";

interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  tingkatan: Tingkatan;
  urutan: number;
  isActive: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TINGKATAN_LIST: {
  value: Tingkatan;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    value: "PG_TK",
    label: "PG / TK",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
  {
    value: "SD_KELAS_RENDAH",
    label: "SD Kelas Rendah (1–3)",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    value: "SD_KELAS_TINGGI",
    label: "SD Kelas Tinggi (4–6)",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    value: "SMP",
    label: "SMP",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    value: "SMA_MIPA",
    label: "SMA MIPA",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    value: "SMA_IPS",
    label: "SMA IPS",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
];

const TINGKATAN_MAP = Object.fromEntries(
  TINGKATAN_LIST.map((t) => [t.value, t]),
);

// ✅ Mapping role → tingkatan yang boleh diakses
// Konsisten dengan ROLE_KELAS_MAP di use-permission.ts
const ROLE_TINGKATAN_MAP: Record<string, Tingkatan[]> = {
  "Super Administrator": [
    "PG_TK",
    "SD_KELAS_RENDAH",
    "SD_KELAS_TINGGI",
    "SMP",
    "SMA_MIPA",
    "SMA_IPS",
  ],
  Admin: [
    "PG_TK",
    "SD_KELAS_RENDAH",
    "SD_KELAS_TINGGI",
    "SMP",
    "SMA_MIPA",
    "SMA_IPS",
  ],
  "Kepala Sekolah PGTK": ["PG_TK"],
  "Kepala Sekolah SD": ["SD_KELAS_RENDAH", "SD_KELAS_TINGGI"],
  "Kepala Sekolah SMP": ["SMP"],
  "Kepala Sekolah SMA": ["SMA_MIPA", "SMA_IPS"],
};

const blankForm = (
  tingkatan: Tingkatan,
): Omit<MataPelajaran, "id" | "isActive"> => ({
  kode: "",
  nama: "",
  tingkatan,
  urutan: 1,
});

// ─── Modal Form ───────────────────────────────────────────────────────────────

function ModalForm({
  open,
  mode,
  data,
  allowedTingkatan,
  onChange,
  onSave,
  onClose,
}: {
  open: boolean;
  mode: "add" | "edit";
  data: Omit<MataPelajaran, "id" | "isActive">;
  allowedTingkatan: Tingkatan[];
  onChange: (
    field: keyof Omit<MataPelajaran, "id" | "isActive">,
    value: string | number,
  ) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const tingkatan = TINGKATAN_MAP[data.tingkatan];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-bold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" />
            {mode === "add" ? "Tambah Mata Pelajaran" : "Edit Mata Pelajaran"}
          </DialogTitle>
          {tingkatan && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full w-fit mt-1 font-medium border",
                tingkatan.bg,
                tingkatan.color,
                tingkatan.border,
              )}
            >
              {tingkatan.label}
            </span>
          )}
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Tingkatan
            </Label>
            <Select
              value={data.tingkatan}
              onValueChange={(v) => onChange("tingkatan", v)}
              // ✅ Saat edit — tidak bisa ganti tingkatan
              // Saat tambah — hanya tampil tingkatan yang boleh diakses role ini
              disabled={mode === "edit"}
            >
              <SelectTrigger className="border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedTingkatan.map((tv) => {
                  const t = TINGKATAN_MAP[tv];
                  return (
                    <SelectItem key={tv} value={tv}>
                      {t.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {mode === "edit" && (
              <p className="text-xs text-slate-400">
                Tingkatan tidak bisa diubah
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Kode Mapel
            </Label>
            <Input
              value={data.kode}
              onChange={(e) => onChange("kode", e.target.value.toUpperCase())}
              placeholder="Contoh: MIPA-01, TK-03"
              className="border-slate-200 focus:border-violet-400 font-mono"
            />
            <p className="text-xs text-slate-400">
              Huruf kapital, angka, dan tanda hubung
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Nama Mata Pelajaran
            </Label>
            <Input
              value={data.nama}
              onChange={(e) => onChange("nama", e.target.value)}
              placeholder="Contoh: Matematika, Motorik Kasar"
              className="border-slate-200 focus:border-violet-400"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Urutan Tampil
            </Label>
            <Input
              type="number"
              min={1}
              max={99}
              value={data.urutan}
              onChange={(e) => onChange("urutan", Number(e.target.value))}
              className="border-slate-200 focus:border-violet-400 w-24"
            />
            <p className="text-xs text-slate-400">
              Angka kecil tampil lebih dulu
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-200 text-slate-600"
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

export default function DashboardMataPelajaran() {
  // ✅ Ambil role dari usePermission — konsisten dengan use-permission.ts
  const { role, isSuperAdmin } = usePermission();

  // Tingkatan yang boleh diakses role ini
  const allowedTingkatan: Tingkatan[] = useMemo(
    () => ROLE_TINGKATAN_MAP[role] ?? [],
    [role],
  );

  // Tingkatan info yang boleh diakses (untuk render)
  const allowedTingkatanList = useMemo(
    () => TINGKATAN_LIST.filter((t) => allowedTingkatan.includes(t.value)),
    [allowedTingkatan],
  );

  const [allMapel, setAllMapel] = useState<MataPelajaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter & search
  // Default active: tingkatan pertama yang diizinkan (bukan "all" untuk Kepala Sekolah)
  const [activeTingkatan, setActiveTingkatan] = useState<Tingkatan | "all">(
    allowedTingkatan.length === 1 ? allowedTingkatan[0] : "all",
  );
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // ── Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<Omit<MataPelajaran, "id" | "isActive">>(
    blankForm(allowedTingkatan[0] ?? "PG_TK"),
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<MataPelajaran | null>(null);

  // ── Toggle loading per item
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Fetch — hanya tingkatan yang diizinkan
  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const res = await getRequest("/mata-pelajaran/all");
      const raw: MataPelajaran[] = [];
      for (const tingkatan of Object.keys(res.data)) {
        // ✅ Filter: hanya ambil tingkatan yang boleh diakses role ini
        if (!allowedTingkatan.includes(tingkatan as Tingkatan)) continue;
        const items = res.data[tingkatan]?.mataPelajaran ?? [];
        raw.push(...items);
      }
      setAllMapel(raw);
    } catch {
      toast.error("Gagal memuat data mata pelajaran");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (allowedTingkatan.length > 0) fetchAll();
  }, [role]); // refetch jika role berubah

  // ── Derived: filtered list
  const filtered = useMemo(() => {
    let r = [...allMapel];
    if (activeTingkatan !== "all")
      r = r.filter((m) => m.tingkatan === activeTingkatan);
    if (!showInactive) r = r.filter((m) => m.isActive);
    if (search)
      r = r.filter(
        (m) =>
          m.nama.toLowerCase().includes(search.toLowerCase()) ||
          m.kode.toLowerCase().includes(search.toLowerCase()),
      );
    return r.sort((a, b) => {
      if (a.tingkatan !== b.tingkatan)
        return a.tingkatan.localeCompare(b.tingkatan);
      return a.urutan - b.urutan;
    });
  }, [allMapel, activeTingkatan, showInactive, search]);

  // ── Stats — hanya untuk tingkatan yang diizinkan
  const stats = useMemo(
    () =>
      allowedTingkatanList.map((t) => ({
        ...t,
        total: allMapel.filter((m) => m.tingkatan === t.value).length,
        aktif: allMapel.filter((m) => m.tingkatan === t.value && m.isActive)
          .length,
      })),
    [allMapel, allowedTingkatanList],
  );

  // ── CRUD
  const openAdd = (defaultTingkatan?: Tingkatan) => {
    const t =
      defaultTingkatan ??
      (activeTingkatan !== "all" ? activeTingkatan : allowedTingkatan[0]);
    const existing = allMapel.filter((m) => m.tingkatan === t);
    setForm({ ...blankForm(t), urutan: existing.length + 1 });
    setModalMode("add");
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (m: MataPelajaran) => {
    setForm({
      kode: m.kode,
      nama: m.nama,
      tingkatan: m.tingkatan,
      urutan: m.urutan,
    });
    setEditingId(m.id);
    setModalMode("edit");
    setModalOpen(true);
  };

  const saveMapel = async () => {
    if (!form.kode.trim()) {
      toast.error("Kode mapel wajib diisi");
      return;
    }
    if (!form.nama.trim()) {
      toast.error("Nama mapel wajib diisi");
      return;
    }
    if (!/^[A-Z0-9\-]+$/.test(form.kode)) {
      toast.error("Kode hanya boleh huruf kapital, angka, tanda hubung");
      return;
    }
    // ✅ Guard: pastikan tingkatan yang disimpan boleh diakses role ini
    if (!allowedTingkatan.includes(form.tingkatan)) {
      toast.error("Anda tidak punya akses ke tingkatan ini");
      return;
    }
    try {
      if (modalMode === "add") {
        const res = await postRequest("/mata-pelajaran", form);
        setAllMapel((prev) => [...prev, res.data]);
        toast.success(`${form.nama} berhasil ditambahkan`);
      } else if (editingId) {
        const res = await putRequest(`/mata-pelajaran/${editingId}`, {
          nama: form.nama,
          urutan: form.urutan,
        });
        setAllMapel((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, ...res.data } : m)),
        );
        toast.success(`${form.nama} berhasil diperbarui`);
      }
      clearMapelCache();
      setModalOpen(false);
    } catch {}
  };

  const toggleActive = async (m: MataPelajaran) => {
    setTogglingId(m.id);
    try {
      if (m.isActive) {
        await deleteRequest(`/mata-pelajaran/${m.id}`);
        setAllMapel((prev) =>
          prev.map((x) => (x.id === m.id ? { ...x, isActive: false } : x)),
        );
        toast.info(`${m.nama} dinonaktifkan`);
      } else {
        await putRequest(`/mata-pelajaran/${m.id}`, { isActive: true });
        setAllMapel((prev) =>
          prev.map((x) => (x.id === m.id ? { ...x, isActive: true } : x)),
        );
        toast.success(`${m.nama} diaktifkan kembali`);
      }
      clearMapelCache();
    } catch {
    } finally {
      setTogglingId(null);
    }
  };

  const hardDelete = async (m: MataPelajaran) => {
    try {
      await deleteRequest(`/mata-pelajaran/${m.id}`);
      setAllMapel((prev) => prev.filter((x) => x.id !== m.id));
      clearMapelCache();
      toast.success(`${m.nama} dihapus`);
    } catch {}
    setDeleteTarget(null);
  };

  // ── Group by tingkatan untuk display
  const grouped = useMemo(() => {
    const map = new Map<Tingkatan, MataPelajaran[]>();
    for (const m of filtered) {
      if (!map.has(m.tingkatan)) map.set(m.tingkatan, []);
      map.get(m.tingkatan)!.push(m);
    }
    return map;
  }, [filtered]);

  // ── Guard: role tidak dikenali
  if (allowedTingkatan.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
          <ShieldAlert className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-semibold text-slate-500">Akses ditolak</p>
          <p className="text-xs">
            Role kamu tidak memiliki akses ke halaman ini
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="min-h-screen"
        style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}
      >
        <main className="max-w-[1200px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                Kelola Mata Pelajaran
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {allowedTingkatan.length === 6
                  ? "Semua jenjang — perubahan langsung berlaku di form input nilai"
                  : `Jenjang: ${allowedTingkatanList.map((t) => t.label).join(", ")}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchAll();
                  clearMapelCache();
                }}
                className="h-8 text-xs border-slate-200 text-slate-500 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </Button>
              <Button
                onClick={() => openAdd()}
                size="sm"
                className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Mapel
              </Button>
            </div>
          </div>

          {/* Stats — hanya tingkatan yang diizinkan */}
          <div
            className={cn(
              "grid gap-3",
              allowedTingkatan.length === 1
                ? "grid-cols-1 max-w-xs"
                : allowedTingkatan.length === 2
                  ? "grid-cols-2 max-w-sm"
                  : allowedTingkatan.length <= 4
                    ? "grid-cols-4"
                    : "grid-cols-6",
            )}
          >
            {stats.map((t) => (
              <button
                key={t.value}
                onClick={() =>
                  setActiveTingkatan(
                    allowedTingkatan.length === 1
                      ? t.value // single tingkatan tidak bisa di-toggle ke "all"
                      : activeTingkatan === t.value
                        ? "all"
                        : t.value,
                  )
                }
                className={cn(
                  "rounded-sm border p-3 text-left transition-all hover:shadow-sm",
                  activeTingkatan === t.value
                    ? `${t.bg} ${t.border} shadow-sm`
                    : "bg-white border-slate-200 hover:border-slate-300",
                )}
              >
                <div
                  className={cn(
                    "text-2xl font-black",
                    activeTingkatan === t.value ? t.color : "text-slate-700",
                  )}
                >
                  {t.aktif}
                </div>
                <div
                  className={cn(
                    "text-xs font-semibold mt-0.5 leading-tight",
                    activeTingkatan === t.value ? t.color : "text-slate-500",
                  )}
                >
                  {t.label}
                </div>
                {t.total !== t.aktif && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    {t.total - t.aktif} nonaktif
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-sm border border-slate-200 px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau kode mapel..."
                className="pl-8 h-8 text-xs border-slate-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Tingkatan pill — hanya untuk multi-tingkatan */}
            {allowedTingkatan.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveTingkatan("all")}
                  className={cn(
                    "h-7 px-3 rounded-full text-xs font-medium border transition-colors",
                    activeTingkatan === "all"
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                  )}
                >
                  Semua
                </button>
                {allowedTingkatanList.map((t) => (
                  <button
                    key={t.value}
                    onClick={() =>
                      setActiveTingkatan(
                        activeTingkatan === t.value ? "all" : t.value,
                      )
                    }
                    className={cn(
                      "h-7 px-3 rounded-full text-xs font-medium border transition-colors",
                      activeTingkatan === t.value
                        ? `${t.bg} ${t.color} ${t.border}`
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Toggle nonaktif */}
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                "flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-colors",
                showInactive
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300",
              )}
            >
              {showInactive ? (
                <ToggleRight className="w-3.5 h-3.5" />
              ) : (
                <ToggleLeft className="w-3.5 h-3.5" />
              )}
              Tampilkan nonaktif
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="bg-white rounded-sm border border-slate-200 py-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                <p className="text-sm">Memuat data mata pelajaran...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-sm border border-dashed border-slate-200 py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <BookOpen className="w-10 h-10 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">
                Tidak ada mata pelajaran ditemukan
              </p>
              <p className="text-xs">
                {search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada data untuk jenjang ini"}
              </p>
              <Button
                onClick={() => openAdd()}
                size="sm"
                className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Mapel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allowedTingkatanList
                .filter((t) => grouped.has(t.value))
                .map((t) => {
                  const items = grouped.get(t.value)!;
                  return (
                    <div
                      key={t.value}
                      className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* Tingkatan header */}
                      <div
                        className={cn(
                          "px-5 py-3 border-b flex items-center justify-between",
                          t.bg,
                          t.border.replace("border-", "border-b-"),
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", t.color)}>
                            {t.label}
                          </span>
                          <Badge
                            className={cn(
                              "text-xs font-bold border-0",
                              t.bg,
                              t.color,
                            )}
                          >
                            {items.filter((m) => m.isActive).length} aktif
                            {items.filter((m) => !m.isActive).length > 0 &&
                              ` · ${items.filter((m) => !m.isActive).length} nonaktif`}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => openAdd(t.value)}
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-7 text-xs gap-1",
                            t.color,
                            "hover:bg-white/60",
                          )}
                        >
                          <Plus className="w-3 h-3" />
                          Tambah
                        </Button>
                      </div>

                      {/* Mapel list */}
                      <div className="divide-y divide-slate-100">
                        {items.map((m) => (
                          <div
                            key={m.id}
                            className={cn(
                              "flex items-center gap-3 px-5 py-3 transition-colors",
                              !m.isActive && "opacity-50 bg-slate-50",
                              m.isActive && "hover:bg-slate-50/50",
                            )}
                          >
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0 cursor-grab" />
                            <span className="w-6 text-center text-xs font-mono text-slate-400 shrink-0">
                              {m.urutan}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-mono px-1.5 py-0.5 rounded border shrink-0",
                                m.isActive
                                  ? `${t.bg} ${t.color} ${t.border}`
                                  : "bg-slate-100 text-slate-400 border-slate-200",
                              )}
                            >
                              {m.kode}
                            </span>
                            <span
                              className={cn(
                                "text-sm font-medium flex-1",
                                m.isActive
                                  ? "text-slate-700"
                                  : "text-slate-400 line-through",
                              )}
                            >
                              {m.nama}
                            </span>
                            {!m.isActive && (
                              <span className="text-xs bg-slate-100 text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded font-medium shrink-0">
                                Nonaktif
                              </span>
                            )}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => toggleActive(m)}
                                disabled={togglingId === m.id}
                                title={
                                  m.isActive
                                    ? "Nonaktifkan"
                                    : "Aktifkan kembali"
                                }
                                className={cn(
                                  "h-7 w-7 rounded flex items-center justify-center transition-colors",
                                  m.isActive
                                    ? "text-emerald-500 hover:bg-emerald-50"
                                    : "text-slate-400 hover:bg-slate-100",
                                )}
                              >
                                {togglingId === m.id ? (
                                  <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                ) : m.isActive ? (
                                  <ToggleRight className="w-4 h-4" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => openEdit(m)}
                                title="Edit"
                                className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(m)}
                                title="Hapus permanen"
                                className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="text-center text-xs text-slate-400 py-2">
              Menampilkan {filtered.length} mata pelajaran
              {showInactive &&
                ` (termasuk ${filtered.filter((m) => !m.isActive).length} nonaktif)`}
            </div>
          )}
        </main>

        <ModalForm
          open={modalOpen}
          mode={modalMode}
          data={form}
          allowedTingkatan={allowedTingkatan}
          onChange={(f, v) => setForm((prev) => ({ ...prev, [f]: v }))}
          onSave={saveMapel}
          onClose={() => setModalOpen(false)}
        />

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent className="bg-white border border-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-slate-800">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Hapus Mata Pelajaran
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 space-y-2">
                <p>
                  Yakin hapus{" "}
                  <span className="font-semibold text-slate-700">
                    {deleteTarget?.nama}
                  </span>{" "}
                  secara permanen?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-700">
                  <strong>⚠️ Perhatian:</strong> Data nilai siswa yang sudah ada
                  tidak akan terhapus karena menyimpan nama mapel sebagai teks.
                  Tapi mapel ini tidak akan muncul lagi di dropdown input nilai
                  baru.
                  <br />
                  <br />
                  Pertimbangkan <strong>nonaktifkan</strong> daripada hapus
                  permanen.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="border-slate-200 text-slate-600">
                Batal
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  if (deleteTarget)
                    toggleActive({ ...deleteTarget, isActive: true });
                  setDeleteTarget(null);
                }}
                className="border-amber-200 text-amber-600 hover:bg-amber-50 text-xs"
              >
                <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                Nonaktifkan saja
              </Button>
              <AlertDialogAction
                onClick={() => deleteTarget && hardDelete(deleteTarget)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Hapus Permanen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
