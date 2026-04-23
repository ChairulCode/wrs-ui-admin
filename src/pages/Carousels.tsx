import { useEffect, useState, useMemo } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCcw,
  Eye,
  CloudUploadIcon,
} from "lucide-react";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "@/utils/api-call";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";
import { useNavigate } from "react-router-dom";
import DashboardPagination from "@/components/sections/dashboardPagination";
import { ApiResponse, Jenjang, Carousel } from "@/types/data";

interface InitialForm {
  judul: string;
  urutan: number;
  konten: string;
  path_gambar: string;
  penulis_user_id: string;
  editor_user_id: string | null;
  tanggal_publikasi: string;
  is_published: boolean;
  is_featured: boolean;
  updated_at: string;
  jenjang_id: string | null;
}

const initialFormData: InitialForm = {
  judul: "",
  urutan: 1,
  konten: "",
  path_gambar: "",
  penulis_user_id: "",
  editor_user_id: "",
  tanggal_publikasi: "",
  is_published: true,
  is_featured: true,
  updated_at: "",
  jenjang_id: null,
};

const BASE_URL = import.meta.env.VITE_BASE_URL;

const sanitizeFileName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
};

const CarouselsPage = () => {
  const [carouselsBackup, setCarouselsBackup] = useState<Carousel[]>([]);
  const [carouselsFiltered, setCarouselsFiltered] = useState<Carousel[]>([]);
  const [jenjang, setJenjang] = useState<Jenjang[]>([]);
  const [gambar, setGambar] = useState<File | null>(null);
  const [formData, setFormData] = useState<InitialForm>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setisLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const totalDataSaatIni = carouselsBackup.length;
  const isLimitReached = totalDataSaatIni >= 10;
  const { userLoginInfo } = useAppContext();
  const userRole = userLoginInfo?.userInfo?.role?.toLowerCase() || "";
  const isSuperAdmin = userRole.includes("super");
  const userJenjang = userLoginInfo?.userInfo?.jenjang_id;
  const firstAllowedJenjang = userLoginInfo?.userInfo?.allowedJenjangIds?.[0];
  useEffect(() => {
    const fetchJenjang = async () => {
      try {
        const res = await getRequest("/jenjang"); // Pastikan endpoint ini ada di backend
        setJenjang(res.data);
      } catch (error) {
        console.error("Gagal ambil data jenjang", error);
      }
    };

    fetchCarousels();
    if (isSuperAdmin) fetchJenjang(); // Hanya ambil jika superadmin
  }, [isSuperAdmin]);
  // 1. Fetch Data dengan Sorting (Urutan terkecil/terbaru di atas)
  const fetchCarousels = async () => {
    setisLoading(true);

    // TAMBAHKAN INI
    console.log("User Info:", userLoginInfo?.userInfo);
    console.log("Role:", userLoginInfo?.userInfo?.role);
    try {
      const responseData: ApiResponse<Carousel> = await getRequest(
        `/carousels?page=1&limit=1000`,
      );

      // DEBUG DISINI: Lihat isi data di Console Browser (F12)
      console.log("Response dari API:", responseData);

      if (!responseData.data || !Array.isArray(responseData.data)) {
        setCarouselsBackup([]); // Pastikan jadi array kosong, bukan null
        return;
      }

      setCarouselsBackup(responseData.data);
    } catch (e) {
      console.error("Error Fetch:", e);
      toast.error("Gagal memuat data.");
    } finally {
      setisLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setGambar(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setisLoading(true);

    if (!editingId && carouselsBackup.length >= 10) {
      toast.error(
        "Batas maksimal carousel adalah 10 data. Hapus data lama untuk menambah baru.",
      );
      return;
    }

    try {
      // 1. Upload Gambar jika ada file baru
      let finalImagePath = formData.path_gambar;

      if (gambar) {
        console.log("🖼️ Uploading image:", gambar.name);

        const foto = new FormData();
        foto.append("image", gambar);

        try {
          const uploadRes = await postRequest("/galleries/add/carousels", foto);

          console.log("📤 Upload Response:", uploadRes);

          // ✅ PERBAIKAN: Response langsung punya "path", tanpa wrapper "data"
          // Coba akses uploadRes.data.path dulu, kalau tidak ada pakai uploadRes.path
          const uploadedPath = uploadRes?.data?.path || uploadRes?.path;

          if (uploadedPath) {
            finalImagePath = uploadedPath;
            console.log("✅ Path updated to:", finalImagePath);
          } else {
            console.warn("⚠️ Upload response tidak punya path!");
            toast.warning(
              "Upload berhasil tapi path tidak ditemukan, menggunakan path default",
            );
          }
        } catch (uploadError) {
          console.error("❌ Upload ERROR:", uploadError);
          toast.error("Gagal upload gambar!");
        }
      }

      console.log("📦 Final path_gambar:", finalImagePath);
      const userJenjangId =
        userLoginInfo?.userInfo?.jenjang_id ||
        userLoginInfo?.userInfo?.allowedJenjangIds?.[0];

      const payload: any = {
        judul: formData.judul,
        konten: formData.konten,
        path_gambar: finalImagePath,
        is_published: Boolean(formData.is_published),
        is_featured: Boolean(formData.is_featured),
        jenjang_id: isSuperAdmin
          ? formData.jenjang_id
          : userJenjang || firstAllowedJenjang,
        tanggal_publikasi: formData.tanggal_publikasi
          ? new Date(formData.tanggal_publikasi).toISOString()
          : new Date().toISOString(),
        penulis_user_id: userLoginInfo?.userInfo?.user_id,
        editor_user_id: userLoginInfo?.userInfo?.user_id,
      };

      // Hanya sertakan urutan jika sedang EDIT.
      // Jika TAMBAH BARU, biarkan backend yang menghitung.
      if (editingId) {
        payload.urutan = Number(formData.urutan);
      }

      console.log("📦 Data yang akan dikirim ke server:", payload);

      if (editingId) {
        await putRequest(`/carousels/${editingId}`, payload);
        toast.success("Update Berhasil!");
      } else {
        await postRequest("/carousels", payload);
        toast.success("Tambah Berhasil!");
      }

      setOpen(false);
      resetForm();
      await fetchCarousels();
    } catch (error: any) {
      console.error("FULL ERROR OBJECT:", error);

      const backendErrors = error?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err: any) => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error?.response?.data?.message || "Gagal menyimpan data");
      }
    } finally {
      setisLoading(false);
    }
  };

  // 2. Logic Filtering & Pagination (Mencegah data hilang saat ganti page/filter)
  useEffect(() => {
    let result = [...carouselsBackup];

    if (searchTerm) {
      result = result.filter((c) =>
        c.judul.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterYear !== "all") {
      result = result.filter(
        (c) =>
          new Date(c.tanggal_publikasi).getFullYear().toString() === filterYear,
      );
    }

    const startIndex = (page - 1) * limit;
    setCarouselsFiltered(result.slice(startIndex, startIndex + limit));
  }, [searchTerm, filterYear, carouselsBackup, page]);
  // Tambahkan di dalam komponen
  useEffect(() => {
    return () => {
      if (gambar) URL.revokeObjectURL(URL.createObjectURL(gambar));
    };
  }, [gambar]);

  const totalPages =
    Math.ceil(
      carouselsBackup.filter(
        (c) =>
          c.judul.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (filterYear === "all" ||
            new Date(c.tanggal_publikasi).getFullYear().toString() ===
              filterYear),
      ).length / limit,
    ) || 1;

  // Initial Load
  useEffect(() => {
    fetchCarousels();
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGambar(file); // path_gambar diupdate dari response server setelah upload
    }
  };
  const filteredData = useMemo(() => {
    let result = [...carouselsBackup];

    if (searchTerm) {
      result = result.filter((c) =>
        c.judul.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterYear !== "all") {
      result = result.filter(
        (c) =>
          new Date(c.tanggal_publikasi).getFullYear().toString() === filterYear,
      );
    }

    const startIndex = (page - 1) * limit;
    return result.slice(startIndex, startIndex + limit);
  }, [searchTerm, filterYear, carouselsBackup, page]);

  // Hapus useEffect yang men-set setCarouselsFiltered

  // Delete Logic
  const executeDelete = async (id: string) => {
    setisLoading(true);
    try {
      await deleteRequest(`/carousels/${id}`);
      toast.success("Carousel berhasil dihapus!");
      fetchCarousels();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menghapus");
    } finally {
      setisLoading(false);
    }
  };

  const popupDelete = (id: string) => {
    Swal.fire({
      title: "Yakin?",
      text: "Data akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Ya, Hapus!",
    }).then((result) => {
      if (result.isConfirmed) executeDelete(id);
    });
  };

  const openEditDialog = (carousel: Carousel) => {
    const formattedDate = carousel.tanggal_publikasi
      ? new Date(carousel.tanggal_publikasi).toISOString().split("T")[0]
      : "";

    setFormData({
      judul: carousel.judul,
      urutan: carousel.urutan,
      konten: carousel.konten,
      path_gambar: carousel.path_gambar || "",
      tanggal_publikasi: formattedDate,
      is_published: carousel.is_published,
      is_featured: carousel.is_featured,
      updated_at: carousel.updated_at,
      penulis_user_id: carousel.penulis_user_id,
      editor_user_id: carousel.editor_user_id,
      jenjang_id: carousel.jenjang_id || null,
    });
    setEditingId(carousel.carousel_id || null);
    setOpen(true);
  };

  const carouselsYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carousel</h1>
            <p className="text-muted-foreground">
              Kelola data carousel sekolah
              <span
                className={`ml-2 font-medium ${isLimitReached ? "text-red-500" : "text-green-600"}`}
              >
                ({carouselsBackup.length}/10)
              </span>
            </p>
            <div
              className="border-l-4 pl-4 py-1"
              style={{ borderColor: "#ddc588" }}
            >
              <p
                className="text-sm italic opacity-90"
                style={{ color: "#ddc588" }}
              >
                Disarankan mengunggah 10 gambar carousel untuk stabilitas
                animasi swipe.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchCarousels}
              disabled={isLoading}
              variant="secondary"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>

            <Dialog
              open={open}
              onOpenChange={(val) => {
                setOpen(val);
                if (!val) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button disabled={isLimitReached || isLoading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isLimitReached ? "Slot Penuh (Maks 10)" : "Tambah Carousel"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Carousel" : "Tambah Carousel"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Carousel</Label>
                    <Input
                      id="title"
                      value={formData.judul}
                      onChange={(e) =>
                        setFormData({ ...formData, judul: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Bungkus seluruh blok dengan editingId agar benar-benar hilang saat Tambah */}
                    {editingId ? (
                      <div className="space-y-2">
                        <Label htmlFor="order">Urutan Tampil</Label>
                        <Input
                          type="number"
                          id="order"
                          value={formData.urutan}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              urutan: Math.max(1, Number(e.target.value)),
                            })
                          }
                          min={1}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                          *Ubah angka untuk mengatur posisi gambar
                        </p>
                      </div>
                    ) : (
                      /* Opsional: Bisa diisi div kosong atau info lain 
       agar layout grid grid-cols-2 tetap konsisten 
    */
                      <div className="space-y-2">
                        <Label className="opacity-50">Urutan</Label>
                        <Input
                          disabled
                          placeholder="Otomatis"
                          className="bg-gray-50"
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                          *Urutan akan diatur otomatis oleh sistem
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="date">Tanggal</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.tanggal_publikasi}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tanggal_publikasi: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Gambar Preview</Label>
                    <div className="border rounded-md p-2 flex justify-center bg-gray-50 min-h-[150px] items-center">
                      {gambar ? (
                        <img
                          src={URL.createObjectURL(gambar)}
                          className="max-h-[200px] object-contain"
                        />
                      ) : formData.path_gambar ? (
                        <img
                          src={`${BASE_URL}/${formData.path_gambar}`}
                          className="max-h-[200px] object-contain"
                        />
                      ) : (
                        <span className="text-gray-400">Belum ada gambar</span>
                      )}
                    </div>
                    <Label
                      htmlFor="dropzone-file"
                      className="cursor-pointer border-2 border-dashed flex flex-col items-center p-6 rounded-md hover:bg-gray-50"
                    >
                      <CloudUploadIcon className="mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Klik untuk upload gambar
                      </span>
                      <Input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUploadImage}
                      />
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Konten</Label>
                    <Textarea
                      id="content"
                      value={formData.konten}
                      onChange={(e) =>
                        setFormData({ ...formData, konten: e.target.value })
                      }
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tampilkan di Web?</Label>
                    <Select
                      value={formData.is_published ? "true" : "false"}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          is_published: val === "true",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ya, Tampilkan</SelectItem>
                        <SelectItem value="false">Sembunyikan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Memproses..." : "Simpan Carousel"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari judul..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 max-w-sm"
            />
          </div>
          <Select
            value={filterYear}
            onValueChange={(val) => {
              setFilterYear(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun</SelectItem>
              {carouselsYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div> */}

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Gambar</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((c, i) => (
                    <TableRow key={c.carousel_id}>
                      <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                      <TableCell>
                        <img
                          src={`${BASE_URL}/${c.path_gambar}`}
                          className="w-16 h-10 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{c.judul}</TableCell>
                      <TableCell>{c.urutan}</TableCell>
                      <TableCell>
                        {c.is_published ? "Aktif" : "Nonaktif"}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => popupDelete(c.carousel_id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Data tidak ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <DashboardPagination
          page={page}
          handlePageChange={handlePageChange}
          totalPages={totalPages}
        />
      </div>
    </DashboardLayout>
  );
};

export default CarouselsPage;
