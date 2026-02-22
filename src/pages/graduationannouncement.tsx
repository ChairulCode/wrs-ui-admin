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

const GraduationAnnouncement = () => {
  const { userLoginInfo, isLoading: contextLoading } = useAppContext();

  // --- States ---
  const [data, setData] = useState<any[]>([]);
  const [jenjangList, setJenjangList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJenjang, setSelectedJenjang] = useState("semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  // --- Form States ---
  const [formData, setFormData] = useState({
    nomor_siswa: "",
    nama_siswa: "",
    jenjang_id: "",
    tahun_ajaran: "2024/2025",
    status_lulus: true,
    keterangan: "",
  });

  // Fungsi untuk cek apakah user adalah Super Admin atau Admin
  const isSuperAdminOrAdmin = () => {
    const role = userLoginInfo?.userInfo?.role;
    return role === "Super Administrator" || role === "Admin";
  };

  // Fungsi untuk mendapatkan jenjang yang diizinkan berdasarkan role
  const getAllowedJenjang = () => {
    const role = userLoginInfo?.userInfo?.role;

    // Super Administrator dan Admin bisa akses SEMUA
    if (role === "Super Administrator" || role === "Admin") {
      return "ALL"; // Return special flag untuk akses semua
    }

    // Mapping role ke jenjang - sesuaikan dengan nama jenjang di database
    if (role === "Kepala Sekolah SMA") return ["SMA"];
    if (role === "Kepala Sekolah SMP") return ["SMP"];
    if (role === "Kepala Sekolah SD") return ["SD"];
    if (role === "Kepala Sekolah PG-TK") return ["PG-TK", "PGTK", "TK"]; // Handle berbagai variasi nama

    return [];
  };

  // Fungsi untuk cek apakah user bisa akses jenjang tertentu
  const canAccessJenjang = (namaJenjang: string) => {
    const allowedJenjang = getAllowedJenjang();

    // Jika Super Admin atau Admin, return true untuk semua
    if (allowedJenjang === "ALL") {
      return true;
    }

    // Untuk role lain, cek apakah jenjang ada di allowed list
    if (Array.isArray(allowedJenjang)) {
      // Normalisasi nama jenjang untuk handling case-insensitive
      const normalizedJenjang = namaJenjang?.toUpperCase() || "";
      return allowedJenjang.some((allowed) =>
        normalizedJenjang.includes(allowed.toUpperCase()),
      );
    }

    return false;
  };

  const allowedJenjangDisplay = getAllowedJenjang();

  // --- Fetch Jenjang ---
  const fetchJenjang = async () => {
    try {
      const response = await api.get("/jenjang");
      const allJenjang = response.data.data || [];

      // Jika Super Admin/Admin, tampilkan semua jenjang
      if (isSuperAdminOrAdmin()) {
        setJenjangList(allJenjang);
      } else {
        // Filter jenjang berdasarkan role user
        const filteredJenjang = allJenjang.filter((j: any) =>
          canAccessJenjang(j.nama_jenjang),
        );
        setJenjangList(filteredJenjang);
      }
    } catch (error) {
      console.error("Gagal mengambil data jenjang:", error);
    }
  };

  // --- Fetch Data Graduation ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/graduation", {
        params: {
          search: searchTerm,
          jenjang_id: selectedJenjang === "semua" ? undefined : selectedJenjang,
        },
      });

      const allData = response.data.data || [];

      // Jika Super Admin/Admin, tampilkan semua data
      if (isSuperAdminOrAdmin()) {
        setData(allData);
      } else {
        // Filter data berdasarkan jenjang yang diizinkan
        const filteredData = allData.filter((item: any) =>
          canAccessJenjang(item.jenjang?.nama_jenjang),
        );
        setData(filteredData);
      }
    } catch (error) {
      console.error("Gagal load data");
    } finally {
      setLoading(false);
    }
  };

  // PERBAIKAN: Tunggu userLoginInfo ter-load sebelum fetch data
  useEffect(() => {
    // Hanya fetch jika userLoginInfo sudah ada dan tidak loading
    if (userLoginInfo && !contextLoading) {
      fetchJenjang();
    }
  }, [userLoginInfo, contextLoading]);

  // PERBAIKAN: Tambahkan dependency userLoginInfo
  useEffect(() => {
    // Hanya fetch jika userLoginInfo sudah ada dan tidak loading
    if (userLoginInfo && !contextLoading) {
      const delayDebounceFn = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [selectedJenjang, searchTerm, userLoginInfo, contextLoading]);

  // --- Handlers ---
  const handleOpenModal = (item: any = null) => {
    if (item) {
      // Cek apakah user bisa edit data ini (kecuali Super Admin/Admin)
      if (
        !isSuperAdminOrAdmin() &&
        !canAccessJenjang(item.jenjang?.nama_jenjang)
      ) {
        toast.error(
          "Anda tidak memiliki akses untuk mengedit data jenjang ini",
        );
        return;
      }

      setSelectedData(item);
      setFormData({
        nomor_siswa: item.nomor_siswa,
        nama_siswa: item.nama_siswa,
        jenjang_id: item.jenjang_id,
        tahun_ajaran: item.tahun_ajaran,
        status_lulus: item.status_lulus,
        keterangan: item.keterangan || "",
      });
    } else {
      setSelectedData(null);
      setFormData({
        nomor_siswa: "",
        nama_siswa: "",
        jenjang_id: jenjangList.length > 0 ? jenjangList[0].jenjang_id : "",
        tahun_ajaran: "2024/2025",
        status_lulus: true,
        keterangan: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi: Cek apakah jenjang yang dipilih diizinkan (kecuali Super Admin/Admin)
    if (!isSuperAdminOrAdmin()) {
      const selectedJenjangData = jenjangList.find(
        (j) => j.jenjang_id === formData.jenjang_id,
      );

      if (
        selectedJenjangData &&
        !canAccessJenjang(selectedJenjangData.nama_jenjang)
      ) {
        toast.error("Anda tidak memiliki akses untuk jenjang ini");
        return;
      }
    }

    try {
      if (selectedData) {
        await api.put(`/graduation/${selectedData.kelulusan_id}`, formData);
        toast.success("Data berhasil diupdate");
      } else {
        await api.post("/graduation", formData);
        toast.success("Data berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || "Gagal menyimpan data";
      toast.error(serverMsg);
    }
  };

  const handleDelete = async (id: string, jenjangNama: string) => {
    // Cek permission sebelum delete (kecuali Super Admin/Admin)
    if (!isSuperAdminOrAdmin() && !canAccessJenjang(jenjangNama)) {
      toast.error("Anda tidak memiliki akses untuk menghapus data jenjang ini");
      return;
    }

    if (!confirm("Hapus data ini?")) return;
    try {
      await api.delete(`/graduation/${id}`);
      toast.success("Data dihapus");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus");
    }
  };

  // PERBAIKAN: Tampilkan loading state saat context masih loading
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Data Kelulusan
            </h1>
            <p className="text-muted-foreground">
              Kelola status kelulusan siswa.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Data
            </Button>
          </div>
        </div>

        {/* Info Role User */}
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
                <p className="text-sm font-semibold text-foreground">
                  {userLoginInfo?.userInfo?.role || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userLoginInfo?.userInfo?.username || "User"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Akses Jenjang:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {isSuperAdminOrAdmin() ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Semua Jenjang
                  </span>
                ) : Array.isArray(allowedJenjangDisplay) ? (
                  allowedJenjangDisplay.map((jenjang) => (
                    <span
                      key={jenjang}
                      className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                    >
                      {jenjang}
                    </span>
                  ))
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-muted-foreground">Total Jenjang</p>
                <p className="font-bold text-lg text-primary">
                  {isSuperAdminOrAdmin()
                    ? jenjangList.length
                    : Array.isArray(allowedJenjangDisplay)
                      ? allowedJenjangDisplay.length
                      : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search */}
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
                <TableHead>Jenjang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="animate-spin mx-auto h-6 w-6" />
                  </TableCell>
                </TableRow>
              ) : data && data.length > 0 ? (
                data.map((item: any) => {
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
                        <div className="flex items-center gap-2">
                          {item.jenjang?.nama_jenjang || "-"}
                          {!hasAccess && (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status_lulus ? "bg-green-500" : "bg-red-500"
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
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                  >
                    <p>Data tidak ditemukan.</p>
                    {!isSuperAdminOrAdmin() &&
                      Array.isArray(allowedJenjangDisplay) && (
                        <p className="text-xs mt-2">
                          Anda hanya dapat melihat data untuk jenjang:{" "}
                          {allowedJenjangDisplay.join(", ")}
                        </p>
                      )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedData ? "Edit" : "Tambah"} Data Kelulusan
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">No. Siswa</Label>
              <Input
                className="col-span-3"
                value={formData.nomor_siswa}
                onChange={(e) =>
                  setFormData({ ...formData, nomor_siswa: e.target.value })
                }
                required
              />
            </div>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Jenjang</Label>
              <Select
                value={formData.jenjang_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, jenjang_id: val })
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
            {/* Status Lulus */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <Select
                value={formData.status_lulus ? "true" : "false"}
                onValueChange={(val) =>
                  setFormData({ ...formData, status_lulus: val === "true" })
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
            <DialogFooter>
              <Button type="submit" disabled={jenjangList.length === 0}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GraduationAnnouncement;
