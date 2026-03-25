import { useEffect, useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Smile,
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
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:3000";
const MAX_GAMBAR = 3;

const KATEGORI_OPTIONS = [
  "Seni & Budaya",
  "Olahraga",
  "Akademik",
  "Pramuka",
  "Teknologi",
  "Keagamaan",
  "Lainnya",
];

// ── INTERFACES ────────────────────────────────────────────────────────────────

interface EkskulGambar {
  gambar_id: string;
  ekskul_id: string;
  path_gambar: string;
  urutan: number;
  created_at: string;
}

interface Ekskul {
  ekskul_id: string;
  nama: string;
  deskripsi: string | null;
  kategori: string | null;
  hari_latihan: string | null;
  icon: string | null;
  urutan: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  gambar: EkskulGambar[];
}

interface EkskulForm {
  nama: string;
  deskripsi: string;
  kategori: string;
  hari_latihan: string;
  icon: string;
  urutan: string;
  is_active: boolean;
}

const initialForm: EkskulForm = {
  nama: "",
  deskripsi: "",
  kategori: "",
  hari_latihan: "",
  icon: "",
  urutan: "",
  is_active: true,
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const Ekstrakurikuler = () => {
  const { userLoginInfo } = useAppContext();

  const [ekskulAll, setEkskulAll] = useState<Ekskul[]>([]);
  const [ekskulFiltered, setEkskulFiltered] = useState<Ekskul[]>([]);
  const [formData, setFormData] = useState<EkskulForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [newImageFiles, setNewImageFiles] = useState<
    { file: File; previewUrl: string }[]
  >([]);
  const [existingGambar, setExistingGambar] = useState<EkskulGambar[]>([]);
  const [deletingGambarIds, setDeletingGambarIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalData = ekskulAll.length;
  const totalPages = Math.ceil(totalData / limit) || 1;
  const totalGambarAktif =
    existingGambar.filter((g) => !deletingGambarIds.includes(g.gambar_id))
      .length + newImageFiles.length;

  // Tutup emoji picker saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const fetchEkskul = async () => {
    setIsLoading(true);
    try {
      const res = await getRequest(`/ekstrakurikuler?page=1&limit=1000`);
      const sorted: Ekskul[] = (res.data || []).sort(
        (a: Ekskul, b: Ekskul) => (a.urutan ?? 999) - (b.urutan ?? 999),
      );
      setEkskulAll(sorted);
    } catch (e) {
      toast.error("Gagal memuat data ekstrakurikuler.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setNewImageFiles([]);
    setExistingGambar([]);
    setDeletingGambarIds([]);
    setEditingId(null);
    setShowEmojiPicker(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (ekskul: Ekskul) => {
    resetForm();
    setFormData({
      nama: ekskul.nama,
      deskripsi: ekskul.deskripsi || "",
      kategori: ekskul.kategori || "",
      hari_latihan: ekskul.hari_latihan || "",
      icon: ekskul.icon || "",
      urutan: ekskul.urutan?.toString() || "",
      is_active: ekskul.is_active,
    });
    setExistingGambar(ekskul.gambar || []);
    setEditingId(ekskul.ekskul_id);
    setOpen(true);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setFormData((prev) => ({ ...prev, icon: emojiData.emoji }));
    setShowEmojiPicker(false);
  };

  const handleSelectGambar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const sisa = MAX_GAMBAR - totalGambarAktif;
    if (sisa <= 0) {
      toast.error(`Maksimal ${MAX_GAMBAR} gambar.`);
      e.target.value = "";
      return;
    }
    const filesToAdd = files.slice(0, sisa);
    if (files.length > sisa)
      toast.warning(`Hanya ${sisa} gambar lagi yang bisa ditambahkan.`);
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setNewImageFiles((prev) => [
          ...prev,
          { file, previewUrl: reader.result as string },
        ]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const tandaiHapusExisting = (gambar_id: string) =>
    setDeletingGambarIds((prev) => [...prev, gambar_id]);
  const batalHapusExisting = (gambar_id: string) =>
    setDeletingGambarIds((prev) => prev.filter((id) => id !== gambar_id));
  const hapusGambarBaru = (idx: number) =>
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error("Nama ekstrakurikuler wajib diisi.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        nama: formData.nama.trim(),
        deskripsi: formData.deskripsi.trim() || null,
        kategori: formData.kategori || null,
        hari_latihan: formData.hari_latihan.trim() || null,
        icon: formData.icon.trim() || null,
        urutan: formData.urutan ? parseInt(formData.urutan) : null,
        is_active: formData.is_active,
      };
      if (editingId) {
        await putRequest(`/ekstrakurikuler/${editingId}`, payload);
        for (const gambar_id of deletingGambarIds) {
          try {
            await deleteRequest(
              `/ekstrakurikuler/${editingId}/gambar/${gambar_id}`,
            );
          } catch {}
        }
        for (const item of newImageFiles) {
          const fd = new FormData();
          fd.append("image", item.file);
          try {
            await apiInstance.post(`/ekstrakurikuler/${editingId}/gambar`, fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch {}
        }
        toast.success("Ekstrakurikuler berhasil diupdate!");
      } else {
        const created = await postRequest(`/ekstrakurikuler`, payload);
        const newId: string | undefined = created?.ekskul_id;
        if (newId && newImageFiles.length > 0) {
          for (const item of newImageFiles) {
            const fd = new FormData();
            fd.append("image", item.file);
            try {
              await apiInstance.post(`/ekstrakurikuler/${newId}/gambar`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            } catch {}
          }
        }
        toast.success("Ekstrakurikuler berhasil ditambahkan!");
      }
      resetForm();
      setOpen(false);
      await fetchEkskul();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Terjadi kesalahan",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteRequest(`/ekstrakurikuler/${id}`);
      toast.success("Ekstrakurikuler berhasil dihapus!");
      if (ekskulFiltered.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (error: any) {
      toast.error(error?.message || "Terjadi kesalahan saat menghapus.");
    } finally {
      await fetchEkskul();
      setIsLoading(false);
    }
  };

  const popupDelete = (id: string, nama: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: `Ekstrakurikuler "${nama}" beserta semua gambarnya akan dihapus permanen!`,
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

  useEffect(() => {
    fetchEkskul();
  }, []);

  useEffect(() => {
    const filtered = ekskulAll.filter((e) =>
      e.nama.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setEkskulFiltered(filtered.slice((page - 1) * limit, page * limit));
  }, [searchTerm, ekskulAll, page]);

  // ── ROLE GUARD ─────────────────────────────────────────────────────────────
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Ekstrakurikuler
            </h1>
            <p className="text-muted-foreground">
              Kelola data ekstrakurikuler sekolah (maks. {MAX_GAMBAR} gambar)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchEkskul}
              disabled={isLoading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Ekskul
            </Button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama ekstrakurikuler..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
        </div>

        {/* TABLE */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar Ekstrakurikuler</CardTitle>
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
                  <TableHead>Kategori</TableHead>
                  <TableHead>Hari Latihan</TableHead>
                  <TableHead className="w-[80px]">Urutan</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : ekskulFiltered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      {searchTerm
                        ? "Tidak ada ekskul yang cocok."
                        : "Belum ada data ekstrakurikuler."}
                    </TableCell>
                  </TableRow>
                ) : (
                  ekskulFiltered.map((ekskul, index) => {
                    const firstImg = ekskul.gambar?.[0];
                    return (
                      <TableRow key={ekskul.ekskul_id}>
                        <TableCell className="font-medium">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="relative w-[72px] h-[72px] bg-muted rounded-md overflow-hidden flex items-center justify-center">
                            {firstImg ? (
                              <>
                                <img
                                  loading="lazy"
                                  src={`${SERVER_BASE_URL}/${firstImg.path_gambar}`}
                                  alt={ekskul.nama}
                                  className="w-full h-full object-cover"
                                />
                                {ekskul.gambar.length > 1 && (
                                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                                    +{ekskul.gambar.length - 1}
                                  </span>
                                )}
                              </>
                            ) : (
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {ekskul.nama.length > 35
                            ? `${ekskul.nama.substring(0, 35)}...`
                            : ekskul.nama}
                        </TableCell>
                        <TableCell className="text-2xl">
                          {ekskul.icon || "-"}
                        </TableCell>
                        <TableCell>
                          {ekskul.kategori ? (
                            <Badge variant="outline">{ekskul.kategori}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ekskul.hari_latihan || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {ekskul.urutan ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={ekskul.is_active ? "default" : "secondary"}
                          >
                            {ekskul.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(ekskul)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                popupDelete(ekskul.ekskul_id, ekskul.nama)
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
          key="ekskul-pagination"
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
                {editingId ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Ubah data ekstrakurikuler yang sudah ada."
                  : "Isi form berikut untuk menambahkan ekstrakurikuler baru."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              {/* NAMA */}
              <div className="space-y-2">
                <Label htmlFor="nama">
                  Nama Ekstrakurikuler <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama"
                  placeholder="Contoh: Paskibraka"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  required
                />
              </div>

              {/* KATEGORI */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(val) =>
                    setFormData({ ...formData, kategori: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {KATEGORI_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* HARI LATIHAN */}
              <div className="space-y-2">
                <Label htmlFor="hari_latihan">
                  Hari Latihan{" "}
                  <span className="text-muted-foreground text-xs">
                    (contoh: Senin & Rabu, 15.00–17.00)
                  </span>
                </Label>
                <Input
                  id="hari_latihan"
                  placeholder="Senin & Rabu, 15.00–17.00"
                  value={formData.hari_latihan}
                  onChange={(e) =>
                    setFormData({ ...formData, hari_latihan: e.target.value })
                  }
                />
              </div>

              {/* ICON — dengan Emoji Picker */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="flex items-center gap-3">
                  {/* Input manual tetap tersedia */}
                  <Input
                    id="icon"
                    placeholder="🎨"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="max-w-[100px] text-2xl text-center"
                    maxLength={10}
                  />

                  {/* Tombol buka emoji picker */}
                  <div className="relative" ref={emojiPickerRef}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className="flex items-center gap-1.5"
                    >
                      <Smile className="h-4 w-4" />
                      Pilih Emoji
                    </Button>

                    {/* Emoji Picker dari library */}
                    {showEmojiPicker && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          left: 0,
                          zIndex: 9999,
                        }}
                      >
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          autoFocusSearch={true}
                          theme={Theme.AUTO}
                          searchPlaceholder="Cari emoji..."
                          lazyLoadEmojis={true}
                          width={320}
                          height={400}
                        />
                      </div>
                    )}
                  </div>

                  {/* Preview icon yang dipilih */}
                  {formData.icon && (
                    <div className="flex items-center gap-2">
                      <span className="text-4xl">{formData.icon}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: "" })}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        title="Hapus icon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Klik "Pilih Emoji" untuk membuka emoji picker, atau ketik
                  langsung di kolom input.
                </p>
              </div>

              {/* DESKRIPSI */}
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Deskripsikan kegiatan ekstrakurikuler ini..."
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
                  {[true, false].map((val) => (
                    <div
                      key={String(val)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-md border cursor-pointer select-none ${formData.is_active === val ? "border-blue-500 bg-blue-50" : "border-border"}`}
                      onClick={() =>
                        setFormData({ ...formData, is_active: val })
                      }
                    >
                      <input
                        type="radio"
                        checked={formData.is_active === val}
                        readOnly
                        className="accent-blue-500"
                      />
                      <span className="text-sm font-medium">
                        {val ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GAMBAR */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    Gambar{" "}
                    <span className="text-muted-foreground text-xs">
                      (maks. {MAX_GAMBAR} gambar)
                    </span>
                  </Label>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${totalGambarAktif >= MAX_GAMBAR ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                  >
                    {totalGambarAktif} / {MAX_GAMBAR}
                  </span>
                </div>
                {existingGambar.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Gambar tersimpan:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {existingGambar.map((g) => {
                        const ditandai = deletingGambarIds.includes(
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
                              className={`w-full h-full object-cover rounded-md border ${ditandai ? "opacity-30 grayscale" : ""}`}
                            />
                            {!ditandai ? (
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
                {totalGambarAktif < MAX_GAMBAR ? (
                  <Label
                    htmlFor="ekskul-upload"
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
                      id="ekskul-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleSelectGambar}
                    />
                  </Label>
                ) : (
                  <p className="text-xs text-red-500 text-center py-2">
                    Batas {MAX_GAMBAR} gambar telah tercapai.
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
                      : "Tambah Ekskul"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Ekstrakurikuler;
