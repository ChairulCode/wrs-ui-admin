import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCcw,
  CloudUploadIcon,
  X,
  ImageIcon,
} from "lucide-react";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
  apiInstance,
} from "@/utils/api-call";
import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";
import DashboardPagination from "@/components/sections/dashboardPagination";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:3000";
const MAX_GAMBAR = 3;

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface FasilitasGambar {
  gambar_id: string;
  fasilitas_id: string;
  path_gambar: string; // contoh: "facilities/nama-file.webp"
  urutan: number;
  created_at: string;
}

interface Fasilitas {
  fasilitas_id: string;
  nama: string;
  deskripsi: string | null;
  icon: string | null;
  urutan: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  gambar: FasilitasGambar[];
}

interface FasilitasForm {
  nama: string;
  deskripsi: string;
  icon: string;
  urutan: string;
  is_active: boolean;
}

const initialForm: FasilitasForm = {
  nama: "",
  deskripsi: "",
  icon: "",
  urutan: "",
  is_active: true,
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const Facilities = () => {
  const { userLoginInfo } = useAppContext();

  // Data
  const [fasilitasAll, setFasilitasAll] = useState<Fasilitas[]>([]);
  const [fasilitasFiltered, setFasilitasFiltered] = useState<Fasilitas[]>([]);

  // Form & dialog
  const [formData, setFormData] = useState<FasilitasForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Gambar
  const [newImageFiles, setNewImageFiles] = useState<
    { file: File; previewUrl: string }[]
  >([]);
  const [existingGambar, setExistingGambar] = useState<FasilitasGambar[]>([]);
  const [deletingGambarIds, setDeletingGambarIds] = useState<string[]>([]);

  // UI
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalData = fasilitasAll.length;
  const totalPages = Math.ceil(totalData / limit) || 1;

  // Hitung total gambar aktif (existing yang tidak ditandai hapus + gambar baru)
  const totalGambarAktif =
    existingGambar.filter((g) => !deletingGambarIds.includes(g.gambar_id))
      .length + newImageFiles.length;

  // ─── FETCH ─────────────────────────────────────────────────────────────────

  const fetchFasilitas = async () => {
    setIsLoading(true);
    try {
      const res = await getRequest(`/fasilitas?page=1&limit=1000`);
      const sorted: Fasilitas[] = (res.data || []).sort(
        (a: Fasilitas, b: Fasilitas) => (a.urutan ?? 999) - (b.urutan ?? 999),
      );
      setFasilitasAll(sorted);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data fasilitas.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RESET ─────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData(initialForm);
    setNewImageFiles([]);
    setExistingGambar([]);
    setDeletingGambarIds([]);
    setEditingId(null);
  };

  // ─── DIALOG ────────────────────────────────────────────────────────────────

  const openCreateDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (fasilitas: Fasilitas) => {
    resetForm();
    setFormData({
      nama: fasilitas.nama,
      deskripsi: fasilitas.deskripsi || "",
      icon: fasilitas.icon || "",
      urutan: fasilitas.urutan?.toString() || "",
      is_active: fasilitas.is_active,
    });
    setExistingGambar(fasilitas.gambar || []);
    setEditingId(fasilitas.fasilitas_id);
    setOpen(true);
  };

  // ─── GAMBAR HANDLERS ───────────────────────────────────────────────────────

  const handleSelectGambar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const sisa = MAX_GAMBAR - totalGambarAktif;
    if (sisa <= 0) {
      toast.error(`Maksimal ${MAX_GAMBAR} gambar per fasilitas.`);
      e.target.value = "";
      return;
    }

    const filesToAdd = files.slice(0, sisa);
    if (files.length > sisa) {
      toast.warning(`Hanya ${sisa} gambar lagi yang bisa ditambahkan.`);
    }

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImageFiles((prev) => [
          ...prev,
          { file, previewUrl: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const tandaiHapusExisting = (gambar_id: string) => {
    setDeletingGambarIds((prev) => [...prev, gambar_id]);
  };

  const batalHapusExisting = (gambar_id: string) => {
    setDeletingGambarIds((prev) => prev.filter((id) => id !== gambar_id));
  };

  const hapusGambarBaru = (idx: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error("Nama fasilitas wajib diisi.");
      return;
    }
    setIsLoading(true);

    try {
      const payload = {
        nama: formData.nama.trim(),
        deskripsi: formData.deskripsi.trim() || null,
        icon: formData.icon.trim() || null,
        urutan: formData.urutan ? parseInt(formData.urutan) : null,
        is_active: formData.is_active,
      };

      if (editingId) {
        // 1. Update teks fasilitas
        await putRequest(`/fasilitas/${editingId}`, payload);

        // 2. Hapus gambar yang ditandai
        for (const gambar_id of deletingGambarIds) {
          try {
            await deleteRequest(`/fasilitas/${editingId}/gambar/${gambar_id}`);
          } catch (err) {
            console.warn("Gagal hapus gambar:", err);
          }
        }

        // 3. Upload gambar baru — field name "image" sesuai uploadDynamic
        for (const item of newImageFiles) {
          const fd = new FormData();
          fd.append("image", item.file);
          try {
            await apiInstance.post(`/fasilitas/${editingId}/gambar`, fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (err) {
            console.warn("Gagal upload gambar:", err);
          }
        }

        toast.success("Fasilitas berhasil diupdate!");
      } else {
        // 1. Buat fasilitas baru
        const created = await postRequest(`/fasilitas`, payload);
        const newId: string | undefined = created?.fasilitas_id;

        // 2. Upload gambar jika ada
        if (newId && newImageFiles.length > 0) {
          for (const item of newImageFiles) {
            const fd = new FormData();
            fd.append("image", item.file);
            try {
              await apiInstance.post(`/fasilitas/${newId}/gambar`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            } catch (err) {
              console.warn("Gagal upload gambar:", err);
            }
          }
        }

        toast.success("Fasilitas berhasil ditambahkan!");
      }

      resetForm();
      setOpen(false);
      await fetchFasilitas();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Terjadi kesalahan",
      );
      console.error("handleSubmit error:", error?.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── DELETE ────────────────────────────────────────────────────────────────

  const executeDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteRequest(`/fasilitas/${id}`);
      toast.success("Fasilitas berhasil dihapus!");
      if (fasilitasFiltered.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (error: any) {
      toast.error(error?.message || "Terjadi kesalahan saat menghapus.");
    } finally {
      await fetchFasilitas();
      setIsLoading(false);
    }
  };

  const popupDelete = (id: string, nama: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Fasilitas "${nama}" beserta semua gambarnya akan dihapus permanen!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) executeDelete(id);
    });
  };

  // ─── EFFECTS ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchFasilitas();
  }, []);

  useEffect(() => {
    const filtered = fasilitasAll.filter((f) =>
      f.nama.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFasilitasFiltered(filtered.slice((page - 1) * limit, page * limit));
  }, [searchTerm, fasilitasAll, page]);

  // ─── GUARD ROLE ────────────────────────────────────────────────────────────

  if (userLoginInfo?.userInfo?.role !== "Super Administrator") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <p className="text-5xl">🔒</p>
            <h2 className="text-xl font-bold">Akses Ditolak</h2>
            <p className="text-muted-foreground">
              Halaman ini hanya dapat diakses oleh Super Administrator.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fasilitas</h1>
            <p className="text-muted-foreground">
              Kelola data fasilitas sekolah (maks. {MAX_GAMBAR} gambar per
              fasilitas)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchFasilitas}
              disabled={isLoading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Fasilitas
            </Button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama fasilitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
        </div>

        {/* TABLE */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar Fasilitas</CardTitle>
            <CardDescription>
              Total {totalData} data | Halaman {page} dari {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead className="w-[100px]">Gambar</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-[60px]">Icon</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="w-[80px]">Urutan</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : fasilitasFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      {searchTerm
                        ? "Tidak ada fasilitas yang cocok."
                        : "Belum ada data fasilitas."}
                    </TableCell>
                  </TableRow>
                ) : (
                  fasilitasFiltered.map((fasilitas, index) => {
                    const firstImg = fasilitas.gambar?.[0];
                    return (
                      <TableRow key={fasilitas.fasilitas_id}>
                        <TableCell className="font-medium">
                          {(page - 1) * limit + index + 1}
                        </TableCell>

                        {/* GAMBAR */}
                        <TableCell>
                          <div className="relative w-[72px] h-[72px] bg-muted rounded-md overflow-hidden flex items-center justify-center">
                            {firstImg ? (
                              <>
                                <img
                                  loading="lazy"
                                  src={`${SERVER_BASE_URL}/${firstImg.path_gambar}`}
                                  alt={fasilitas.nama}
                                  className="w-full h-full object-cover"
                                />
                                {fasilitas.gambar.length > 1 && (
                                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                                    +{fasilitas.gambar.length - 1}
                                  </span>
                                )}
                              </>
                            ) : (
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="font-medium">
                          {fasilitas.nama.length > 40
                            ? `${fasilitas.nama.substring(0, 40)}...`
                            : fasilitas.nama}
                        </TableCell>

                        <TableCell className="text-2xl">
                          {fasilitas.icon || "-"}
                        </TableCell>

                        <TableCell className="text-muted-foreground text-sm">
                          {fasilitas.deskripsi
                            ? fasilitas.deskripsi.length > 50
                              ? `${fasilitas.deskripsi.substring(0, 50)}...`
                              : fasilitas.deskripsi
                            : "-"}
                        </TableCell>

                        <TableCell className="text-center">
                          {fasilitas.urutan ?? "-"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              fasilitas.is_active ? "default" : "secondary"
                            }
                          >
                            {fasilitas.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(fasilitas)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                popupDelete(
                                  fasilitas.fasilitas_id,
                                  fasilitas.nama,
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <DashboardPagination
          key="fasilitas-pagination"
          page={page}
          handlePageChange={(newPage) => {
            if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
          }}
          totalPages={totalPages}
        />

        {/* DIALOG TAMBAH / EDIT */}
        <Dialog
          open={open}
          onOpenChange={(val) => {
            if (!val) resetForm();
            setOpen(val);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Fasilitas" : "Tambah Fasilitas"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Ubah data fasilitas yang sudah ada."
                  : "Isi form berikut untuk menambahkan fasilitas baru."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              {/* NAMA */}
              <div className="space-y-2">
                <Label htmlFor="nama">
                  Nama Fasilitas <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama"
                  placeholder="Contoh: Laboratorium Komputer"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  required
                />
              </div>

              {/* ICON */}
              <div className="space-y-2">
                <Label htmlFor="icon">
                  Icon{" "}
                  <span className="text-muted-foreground text-xs">
                    (emoji, contoh: 💻 🔬 📚)
                  </span>
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="icon"
                    placeholder="💻"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="max-w-[120px] text-2xl text-center"
                    maxLength={10}
                  />
                  {formData.icon && (
                    <span className="text-4xl">{formData.icon}</span>
                  )}
                </div>
              </div>

              {/* DESKRIPSI */}
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Deskripsikan fasilitas ini..."
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  rows={4}
                />
              </div>

              {/* URUTAN */}
              <div className="space-y-2">
                <Label htmlFor="urutan">
                  Urutan Tampil{" "}
                  <span className="text-muted-foreground text-xs">
                    (angka kecil tampil lebih dulu)
                  </span>
                </Label>
                <Input
                  id="urutan"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={formData.urutan}
                  onChange={(e) =>
                    setFormData({ ...formData, urutan: e.target.value })
                  }
                  className="max-w-[120px]"
                />
              </div>

              {/* STATUS */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-3">
                  <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-md border cursor-pointer transition-colors select-none ${
                      formData.is_active
                        ? "border-blue-500 bg-blue-50"
                        : "border-border"
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, is_active: true })
                    }
                  >
                    <input
                      type="radio"
                      checked={formData.is_active}
                      readOnly
                      className="accent-blue-500"
                    />
                    <span className="text-sm font-medium">Aktif</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-md border cursor-pointer transition-colors select-none ${
                      !formData.is_active
                        ? "border-blue-500 bg-blue-50"
                        : "border-border"
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, is_active: false })
                    }
                  >
                    <input
                      type="radio"
                      checked={!formData.is_active}
                      readOnly
                      className="accent-blue-500"
                    />
                    <span className="text-sm font-medium">Nonaktif</span>
                  </div>
                </div>
              </div>

              {/* GAMBAR */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Gambar Fasilitas{" "}
                    <span className="text-muted-foreground text-xs">
                      (maks. {MAX_GAMBAR} gambar)
                    </span>
                  </Label>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      totalGambarAktif >= MAX_GAMBAR
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {totalGambarAktif} / {MAX_GAMBAR}
                  </span>
                </div>

                {/* Preview existing gambar */}
                {existingGambar.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Gambar tersimpan:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {existingGambar.map((g) => {
                        const ditandaiHapus = deletingGambarIds.includes(
                          g.gambar_id,
                        );
                        return (
                          <div
                            key={g.gambar_id}
                            className="relative w-[90px] h-[90px]"
                          >
                            <img
                              src={`${SERVER_BASE_URL}/${g.path_gambar}`}
                              alt=""
                              className={`w-full h-full object-cover rounded-md border ${
                                ditandaiHapus ? "opacity-30 grayscale" : ""
                              }`}
                            />
                            {!ditandaiHapus ? (
                              <button
                                type="button"
                                onClick={() => tandaiHapusExisting(g.gambar_id)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                              >
                                <X size={10} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => batalHapusExisting(g.gambar_id)}
                                title="Batalkan penghapusan"
                                className="absolute -top-1.5 -right-1.5 bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-600 text-[9px] font-bold"
                              >
                                ↩
                              </button>
                            )}
                            <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] rounded px-1">
                              #{g.urutan}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preview gambar baru */}
                {newImageFiles.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Gambar baru (belum tersimpan):
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {newImageFiles.map((img, idx) => (
                        <div key={idx} className="relative w-[90px] h-[90px]">
                          <img
                            src={img.previewUrl}
                            alt=""
                            className="w-full h-full object-cover rounded-md border-2 border-blue-400"
                          />
                          <button
                            type="button"
                            onClick={() => hapusGambarBaru(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Area upload — hanya tampil jika belum mencapai batas */}
                {totalGambarAktif < MAX_GAMBAR ? (
                  <Label
                    htmlFor="fasilitas-upload"
                    className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CloudUploadIcon className="w-8 h-8" />
                      <p className="text-sm">
                        <span className="font-semibold">Klik untuk upload</span>{" "}
                        atau drag & drop
                      </p>
                      <p className="text-xs">
                        JPEG, PNG, WEBP — Maks. 5MB per file
                      </p>
                    </div>
                    <Input
                      id="fasilitas-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleSelectGambar}
                    />
                  </Label>
                ) : (
                  <p className="text-xs text-red-500 text-center py-2">
                    Batas {MAX_GAMBAR} gambar telah tercapai. Hapus gambar yang
                    ada untuk menambah yang baru.
                  </p>
                )}
              </div>

              {/* TOMBOL */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Tambah Fasilitas"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Facilities;
