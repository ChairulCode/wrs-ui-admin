import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Search, Trash2, Edit, Loader2 } from "lucide-react";
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

// IMPORT INI YANG PALING PENTING
import api from "@/lib/axios";

const GraduationAnnouncement = () => {
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

  // --- Fetch Jenjang ---
  const fetchJenjang = async () => {
    try {
      // PERBAIKAN: Cukup tulis endpoint akhirnya saja
      // URL Base dan Token sudah diurus otomatis oleh file axios.ts
      const response = await api.get("/jenjang");
      setJenjangList(response.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data jenjang:", error);
      // Jangan toast error di sini agar tidak spamming jika gagal load awal
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
      setData(response.data.data || []);
    } catch (error) {
      console.error("Gagal load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJenjang();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [selectedJenjang, searchTerm]);

  // --- Handlers ---
  const handleOpenModal = (item: any = null) => {
    if (item) {
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
    try {
      if (selectedData) {
        // PERBAIKAN: Tidak perlu getAuthConfig(), tidak perlu URL lengkap
        await api.put(`/graduation/${selectedData.kelulusan_id}`, formData);
        toast.success("Data berhasil diupdate");
      } else {
        await api.post("/graduation", formData);
        toast.success("Data berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      // Menangkap pesan error dari backend
      const serverMsg = error.response?.data?.message || "Gagal menyimpan data";
      toast.error(serverMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data ini?")) return;
    try {
      await api.delete(`/graduation/${id}`);
      toast.success("Data dihapus");
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus");
    }
  };

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
                data.map((item: any) => (
                  <TableRow key={item.kelulusan_id}>
                    <TableCell className="font-medium">
                      {item.nomor_siswa}
                    </TableCell>
                    <TableCell>{item.nama_siswa}</TableCell>
                    <TableCell>{item.jenjang?.nama_jenjang || "-"}</TableCell>
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
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.kelulusan_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Data tidak ditemukan.
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
                      Data jenjang kosong
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Tambahan: Input Status Lulus */}
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
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GraduationAnnouncement;
