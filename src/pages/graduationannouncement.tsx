import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Loader2,
  Lock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAppContext } from "@/utils/app-context";

// ─── Helper: ISO / YYYYMMDD → YYYY-MM-DD untuk input[type=date] ─────────────
const toDateInput = (raw?: string): string => {
  if (!raw) return "";
  if (raw.includes("T") || raw.includes("-")) return raw.substring(0, 10);
  if (raw.length === 8)
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return "";
};

const toISODate = (dateInput: string): string => dateInput;

const KELAS_LABEL: Record<string, string> = {
  XII_MIPA: "XII IPA",
  XII_IPS: "XII IPS",
};

interface KelulusanItem {
  kelulusan_id: string;
  nomor_siswa: string;
  nama_siswa: string;
  kelas: "XII_MIPA" | "XII_IPS";
  tanggal_lahir?: string | null;
  tahun_ajaran: string;
  status_lulus: boolean;
  keterangan?: string | null;
  jenjang_id: string;
  jenjang?: { jenjang_id: string; nama_jenjang: string } | null;
}

interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface FormData {
  nomor_siswa: string;
  nama_siswa: string;
  jenjang_id: string;
  tahun_ajaran: string;
  kelas: string;
  tanggal_lahir: string;
  status_lulus: boolean;
  keterangan: string;
}

const INITIAL_FORM: FormData = {
  nomor_siswa: "",
  nama_siswa: "",
  jenjang_id: "",
  tahun_ajaran: "2024/2025",
  kelas: "XII_MIPA",
  tanggal_lahir: "",
  status_lulus: true,
  keterangan: "",
};

const GraduationAnnouncement = () => {
  const { userLoginInfo, isLoading: contextLoading } = useAppContext();

  const [data, setData] = useState<KelulusanItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [jenjangList, setJenjangList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenjang, setSelectedJenjang] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<KelulusanItem | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ── Permission helpers ────────────────────────────────────────────────────
  const isSuperAdminOrAdmin = () => {
    const role = userLoginInfo?.userInfo?.role;
    return role === "Super Administrator" || role === "Admin";
  };

  const getAllowedJenjang = (): "ALL" | string[] => {
    const role = userLoginInfo?.userInfo?.role;
    if (role === "Super Administrator" || role === "Admin") return "ALL";
    if (role === "Kepala Sekolah SMA") return ["SMA"];
    if (role === "Kepala Sekolah SMP") return ["SMP"];
    if (role === "Kepala Sekolah SD") return ["SD"];
    if (role === "Kepala Sekolah PGTK") return ["PGTK", "PGTK", "TK"];
    return [];
  };

  const canAccessJenjang = (namaJenjang?: string) => {
    const allowed = getAllowedJenjang();
    if (allowed === "ALL") return true;
    if (!namaJenjang) return false;
    const norm = namaJenjang.toUpperCase();
    return (allowed as string[]).some((a) => norm.includes(a.toUpperCase()));
  };

  const allowedJenjangDisplay = getAllowedJenjang();

  // ── Fetch jenjang ─────────────────────────────────────────────────────────
  const fetchJenjang = async () => {
    try {
      const res = await api.get("/jenjang");
      const all: any[] = res.data.data || [];
      setJenjangList(
        isSuperAdminOrAdmin()
          ? all
          : all.filter((j) => canAccessJenjang(j.nama_jenjang)),
      );
    } catch {
      /* skip */
    }
  };

  const fetchData = async (page = currentPage) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: PAGE_LIMIT,
        search: searchTerm || undefined,
        jenjang_id: selectedJenjang !== "semua" ? selectedJenjang : undefined,
      };

      const res = await api.get("/graduation", { params });
      const all: KelulusanItem[] = res.data.data || [];

      const filtered = isSuperAdminOrAdmin()
        ? all
        : all.filter((item) => canAccessJenjang(item.jenjang?.nama_jenjang));

      setData(filtered);
      setMeta(res.data.metadata ?? null);
    } catch {
      toast.error("Gagal memuat data kelulusan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLoginInfo && !contextLoading) fetchJenjang();
  }, [userLoginInfo, contextLoading]);

  useEffect(() => {
    if (!userLoginInfo || contextLoading) return;
    setCurrentPage(1);
    const t = setTimeout(() => fetchData(1), 400);
    return () => clearTimeout(t);
  }, [selectedJenjang, searchTerm, userLoginInfo, contextLoading]);

  useEffect(() => {
    if (!userLoginInfo || contextLoading) return;
    fetchData(currentPage);
  }, [currentPage]);

  const handleOpenModal = (item: KelulusanItem | null = null) => {
    if (item) {
      if (
        !isSuperAdminOrAdmin() &&
        !canAccessJenjang(item.jenjang?.nama_jenjang)
      ) {
        toast.error(
          "Anda tidak memiliki akses untuk mengedit data jenjang ini.",
        );
        return;
      }
      setSelectedData(item);
      setFormData({
        nomor_siswa: item.nomor_siswa,
        nama_siswa: item.nama_siswa,
        jenjang_id: item.jenjang_id,
        tahun_ajaran: item.tahun_ajaran,
        kelas: item.kelas ?? "XII_MIPA",
        tanggal_lahir: toDateInput(item.tanggal_lahir ?? ""),
        status_lulus: item.status_lulus,
        keterangan: item.keterangan ?? "",
      });
    } else {
      setSelectedData(null);
      setFormData({
        ...INITIAL_FORM,
        jenjang_id: jenjangList[0]?.jenjang_id ?? "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      nomor_siswa: formData.nomor_siswa,
      nama_siswa: formData.nama_siswa,
      jenjang_id: formData.jenjang_id,
      tahun_ajaran: formData.tahun_ajaran,
      kelas: formData.kelas,
      tanggal_lahir: toISODate(formData.tanggal_lahir),
      status_lulus: formData.status_lulus,
      keterangan: formData.keterangan || null,
    };

    try {
      if (selectedData) {
        await api.put(`/graduation/${selectedData.kelulusan_id}`, payload);
        toast.success("Data kelulusan berhasil diupdate.");
      } else {
        await api.post("/graduation", payload);
        toast.success("Data kelulusan berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      fetchData(currentPage);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, jenjangNama?: string) => {
    if (!isSuperAdminOrAdmin() && !canAccessJenjang(jenjangNama)) {
      toast.error(
        "Anda tidak memiliki akses untuk menghapus data jenjang ini.",
      );
      return;
    }
    if (!confirm("Hapus data kelulusan ini?")) return;
    try {
      await api.delete(`/graduation/${id}`);
      toast.success("Data kelulusan berhasil dihapus.");
      const newTotal = (meta?.totalItems ?? 1) - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / PAGE_LIMIT));
      const targetPage = Math.min(currentPage, maxPage);
      if (targetPage !== currentPage) setCurrentPage(targetPage);
      else fetchData(currentPage);
    } catch {
      toast.error("Gagal menghapus data.");
    }
  };

  if (contextLoading || !userLoginInfo) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-muted-foreground">Memuat data user...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Data Kelulusan
            </h1>
            <p className="text-muted-foreground">
              Kelola status kelulusan siswa.
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Data
          </Button>
        </div>

        {/* Info Role */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                {isSuperAdminOrAdmin() ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {userLoginInfo?.userInfo?.role ?? "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userLoginInfo?.userInfo?.username ?? "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Akses Jenjang:
              </span>
              {isSuperAdminOrAdmin() ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium">
                  <CheckCircle className="w-3 h-3" /> Semua Jenjang
                </span>
              ) : Array.isArray(allowedJenjangDisplay) ? (
                allowedJenjangDisplay.map((j) => (
                  <span
                    key={j}
                    className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                  >
                    {j}
                  </span>
                ))
              ) : null}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau nomor siswa..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedJenjang} onValueChange={setSelectedJenjang}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Semua Jenjang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenjang</SelectItem>
              {jenjangList.map((j) => (
                <SelectItem key={j.jenjang_id} value={j.jenjang_id}>
                  {j.nama_jenjang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabel */}
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Siswa</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Tahun Ajaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="animate-spin mx-auto h-6 w-6" />
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((item) => {
                  const hasAccess =
                    isSuperAdminOrAdmin() ||
                    canAccessJenjang(item.jenjang?.nama_jenjang);
                  return (
                    <TableRow key={item.kelulusan_id}>
                      <TableCell className="font-medium">
                        {item.nomor_siswa}
                      </TableCell>
                      <TableCell>{item.nama_siswa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {KELAS_LABEL[item.kelas] ?? item.kelas ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.jenjang?.nama_jenjang ?? "-"}
                          {!hasAccess && (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      {/* Kolom tahun ajaran — penting agar admin mudah lihat */}
                      <TableCell>
                        <Badge variant="secondary">{item.tahun_ajaran}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status_lulus
                              ? "bg-green-500 hover:bg-green-500"
                              : "bg-red-500 hover:bg-red-500"
                          }
                        >
                          {item.status_lulus ? "Lulus" : "Belum Lulus"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(item)}
                          disabled={!hasAccess}
                        >
                          <Edit
                            className={`h-4 w-4 ${hasAccess ? "text-blue-600" : "text-muted-foreground"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDelete(
                              item.kelulusan_id,
                              item.jenjang?.nama_jenjang,
                            )
                          }
                          disabled={!hasAccess}
                        >
                          <Trash2
                            className={`h-4 w-4 ${hasAccess ? "text-destructive" : "text-muted-foreground"}`}
                          />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Data tidak ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Menampilkan {(meta.currentPage - 1) * meta.limit + 1}–
              {Math.min(meta.currentPage * meta.limit, meta.totalItems)} dari{" "}
              {meta.totalItems} data
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3">
                {meta.currentPage} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= meta.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Form ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedData ? "Edit" : "Tambah"} Data Kelulusan
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Nomor Siswa — FIX: batasi 10 digit angka saja */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">No. Siswa</Label>
              <div className="col-span-3 space-y-1">
                <Input
                  placeholder="10 digit nomor induk"
                  value={formData.nomor_siswa}
                  maxLength={10}
                  inputMode="numeric"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      // Hanya angka, maksimal 10 karakter — sama seperti di client
                      nomor_siswa: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maksimal 10 digit angka ({formData.nomor_siswa.length}/10)
                </p>
              </div>
            </div>

            {/* Nama Siswa */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nama Siswa</Label>
              <Input
                className="col-span-3"
                value={formData.nama_siswa}
                onChange={(e) =>
                  setFormData({ ...formData, nama_siswa: e.target.value })
                }
                required
              />
            </div>

            {/* Kelas */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kelas</Label>
              <Select
                value={formData.kelas}
                onValueChange={(v) => setFormData({ ...formData, kelas: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XII_MIPA">XII IPA</SelectItem>
                  <SelectItem value="XII_IPS">XII IPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tanggal Lahir */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tanggal Lahir</Label>
              <div className="col-span-3 space-y-1">
                <Input
                  type="date"
                  value={formData.tanggal_lahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal_lahir: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Digunakan untuk verifikasi saat siswa cek kelulusan.
                </p>
              </div>
            </div>

            {/* Jenjang */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Jenjang</Label>
              <Select
                value={formData.jenjang_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, jenjang_id: v })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih Jenjang" />
                </SelectTrigger>
                <SelectContent>
                  {jenjangList.length > 0 ? (
                    jenjangList.map((j) => (
                      <SelectItem key={j.jenjang_id} value={j.jenjang_id}>
                        {j.nama_jenjang}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Tidak ada jenjang yang dapat diakses
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Tahun Ajaran — FIX: format hint yang jelas */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tahun Ajaran</Label>
              <div className="col-span-3 space-y-1">
                <Input
                  placeholder="Contoh: 2024/2025"
                  value={formData.tahun_ajaran}
                  onChange={(e) =>
                    setFormData({ ...formData, tahun_ajaran: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Format: YYYY/YYYY — contoh: 2024/2025 atau 2025/2026. Akan
                  otomatis tampil di halaman pengumuman client.
                </p>
              </div>
            </div>

            {/* Status Lulus */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <Select
                value={formData.status_lulus ? "true" : "false"}
                onValueChange={(v) =>
                  setFormData({ ...formData, status_lulus: v === "true" })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Lulus</SelectItem>
                  <SelectItem value="false">Belum Lulus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Keterangan */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Keterangan</Label>
              <Input
                className="col-span-3"
                placeholder="Opsional"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={jenjangList.length === 0 || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GraduationAnnouncement;
