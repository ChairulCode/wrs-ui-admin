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
  X,
  ChevronLeft,
  ChevronRight,
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
import { ApiResponse, Jenjang, Jenjang_relasi, Prestasi } from "@/types/data";
import { parseImages } from "@/utils/imageHelper";

interface InitialForm {
  prestasi_id: string;
  judul: string;
  deskripsi: string;
  konten: string;
  path_gambar: string;
  penulis_user_id: string;
  editor_user_id: string | null;
  tanggal_publikasi: string;
  is_published: boolean;
  is_featured: boolean;
  updated_at: string;
  jenjang_relasi: JenjangRelasi[];
}

type JenjangRelasi = {
  prestasi_id: string;
  jenjang_id: string;
  jenjang: Jenjang;
};

// ✅ FIX: jenjang_relasi dikosongkan agar tidak ada data dummy yang ikut terkirim
const initialFormData: InitialForm = {
  prestasi_id: "",
  judul: "",
  deskripsi: "",
  konten: "",
  path_gambar: "",
  penulis_user_id: "",
  editor_user_id: "",
  tanggal_publikasi: "",
  is_published: true,
  is_featured: true,
  updated_at: "",
  jenjang_relasi: [],
};

const BASE_URL = import.meta.env.VITE_BASE_URL;

const Achievements = () => {
  const { userLoginInfo } = useAppContext();
  const [achievementsBackup, setAchievementsBackup] = useState<
    ApiResponse<Prestasi>["data"] | []
  >([]);
  const [achievementsFiltered, setAchievementsFiltered] = useState<
    ApiResponse<Prestasi>["data"] | []
  >([]);
  const [jenjang, setJenjang] = useState<Jenjang[]>([]);

  const [newImages, setNewImages] = useState<
    { file: File; previewUrl: string; path: string }[]
  >([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);

  const [formData, setFormData] = useState<InitialForm>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setisLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [page, setPage] = useState(1);
  const totalData = achievementsBackup?.length || 0;
  const limit = 10;
  const totalPages = Math.ceil(totalData / limit);

  const allPreviewImages = [
    ...existingImages.map((p) => ({
      type: "existing" as const,
      src: `${BASE_URL}/${p}`,
      path: p,
    })),
    ...newImages.map((n) => ({
      type: "new" as const,
      src: n.previewUrl,
      path: n.path,
    })),
  ];

  const fetchAchievements = async () => {
    setisLoading(true);
    try {
      const responseData: ApiResponse<Prestasi> = await getRequest(
        `/prestasi?page=1&limit=1000`,
      );
      const fetchJenjang = await getRequest(`/jenjang`);
      const sortData = responseData.data.sort(
        (a: Prestasi, b: Prestasi) =>
          new Date(b.tanggal_publikasi).getTime() -
          new Date(a.tanggal_publikasi).getTime(),
      );
      setAchievementsBackup(sortData);
      setAchievementsFiltered(
        sortData?.slice(limit * (page - 1), limit * page),
      );
      setJenjang(fetchJenjang.data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data prestasi.");
      setAchievementsBackup(null);
      setIsError(true);
    } finally {
      setisLoading(false);
      setIsError(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setNewImages([]);
    setExistingImages([]);
    setEditingId(null);
    setPreviewIdx(0);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setNewImages((prev) => [
          ...prev,
          {
            file,
            previewUrl: reader.result as string,
            path: "achievements/" + file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeExistingImage = (path: string) => {
    setExistingImages((prev) => prev.filter((p) => p !== path));
    setPreviewIdx(0);
  };

  const removeNewImage = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviewIdx(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setisLoading(true);
    setIsError(false);

    try {
      const allPaths = [...existingImages, ...newImages.map((n) => n.path)];
      const finalPathGambar =
        allPaths.length > 1 ? JSON.stringify(allPaths) : allPaths[0] || "";

      // ✅ FIX: Filter jenjang_relasi kosong, lalu map ke format {jenjang_id}
      // Service buatPrestasi dan editPrestasi sama-sama ekspek field "jenjang"
      const jenjangPayload = formData.jenjang_relasi
        .filter((j) => j.jenjang_id !== "")
        .map((j) => ({ jenjang_id: j.jenjang_id }));

      if (editingId) {
        const { prestasi_id, updated_at, jenjang_relasi, ...restForm } =
          formData;

        const dataToSubmit = {
          ...restForm,
          path_gambar: finalPathGambar,
          tanggal_publikasi:
            formData.tanggal_publikasi || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          penulis_user_id: formData.penulis_user_id,
          editor_user_id: userLoginInfo.userInfo.user_id,
          // EDIT: service editPrestasiLengkap ekspek "jenjang_relasi"
          jenjang_relasi: jenjangPayload,
        };

        await putRequest(`/prestasi/${editingId}`, dataToSubmit);

        for (const img of newImages) {
          const foto = new FormData();
          foto.append("image", img.file);
          try {
            await postRequest(`/galleries/add/achievements`, foto);
          } catch (uploadErr) {
            console.warn("Upload gambar gagal (non-fatal):", uploadErr);
          }
        }

        toast.success(`Prestasi berhasil diupdate!`);
      } else {
        const { prestasi_id, updated_at, jenjang_relasi, ...restForm } =
          formData;

        const dataToSubmit = {
          ...restForm,
          path_gambar: finalPathGambar,
          tanggal_publikasi:
            formData.tanggal_publikasi || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          penulis_user_id: userLoginInfo.userInfo.user_id,
          editor_user_id: userLoginInfo.userInfo.user_id,
          // CREATE: service buatPrestasi ekspek "jenjang"
          jenjang: jenjangPayload,
        };

        await postRequest("/prestasi", dataToSubmit);

        for (const img of newImages) {
          const foto = new FormData();
          foto.append("image", img.file);
          try {
            await postRequest(`/galleries/add/achievements`, foto);
          } catch (uploadErr) {
            console.warn("Upload gambar gagal (non-fatal):", uploadErr);
          }
        }

        toast.success("Prestasi berhasil ditambahkan!");
        resetForm();
        setOpen(false);
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Terjadi kesalahan",
      );
      console.error("handleSubmit error:", error?.response?.data || error);
      setIsError(true);
    } finally {
      fetchAchievements();
      setisLoading(false);
    }
  };

  const executeDelete = async (id: string) => {
    setisLoading(true);
    try {
      await deleteRequest(`/prestasi/${id}`);
      const isLastItemOnPage = achievementsFiltered.length === 1;
      if (isLastItemOnPage && page > 1) setPage((prev) => prev - 1);
      toast.success("Prestasi berhasil dihapus!");
    } catch (error: any) {
      toast.error(error?.message || "Terjadi kesalahan");
      setIsError(true);
    } finally {
      fetchAchievements();
      setisLoading(false);
    }
  };

  const popupDelete = (id: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data prestasi akan dihapus permanen!",
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

  const openEditDialog = (achievement: Prestasi) => {
    const formattedDate = achievement.tanggal_publikasi
      ? new Date(achievement.tanggal_publikasi!).toISOString().split("T")[0]
      : "";
    const imgs = parseImages(achievement.path_gambar);
    setExistingImages(imgs);
    setNewImages([]);
    setPreviewIdx(0);
    setFormData({
      prestasi_id: achievement.prestasi_id,
      judul: achievement.judul,
      deskripsi: achievement.deskripsi,
      konten: achievement.konten,
      path_gambar: achievement.path_gambar || "",
      tanggal_publikasi: formattedDate,
      is_published: achievement.is_published,
      is_featured: achievement.is_featured,
      updated_at: achievement.updated_at,
      penulis_user_id: achievement.penulis_user_id,
      editor_user_id: achievement.editor_user_id,
      jenjang_relasi: achievement.jenjang_relasi || [],
    });
    setEditingId(achievement.prestasi_id || null);
    setOpen(true);
  };

  const achievementYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i).map((y) =>
      y.toString(),
    );
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const getGradeColors = (grade: string) => {
    switch (grade) {
      case "PG-TK":
        return "bg-green-300";
      case "SD":
        return "bg-yellow-300";
      case "SMP":
        return "bg-red-300";
      default:
        return "bg-blue-300";
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  useEffect(() => {
    const newTotalData = achievementsBackup?.length || 0;
    const newTotalPages = Math.ceil(newTotalData / limit);
    if (page > newTotalPages && page > 1) {
      setPage(newTotalPages);
      return;
    }
    setAchievementsFiltered(
      achievementsBackup.slice((page - 1) * limit, page * limit),
    );
  }, [page, achievementsBackup]);

  useEffect(() => {
    let filtered = achievementsBackup.filter((a: Prestasi) =>
      a.judul.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    if (filterYear !== "all") {
      filtered = filtered.filter(
        (a: Prestasi) =>
          new Date(a.tanggal_publikasi).getFullYear().toString() === filterYear,
      );
    }
    setAchievementsFiltered(filtered.slice(0, limit * page));
  }, [searchTerm, filterYear, achievementsBackup, page]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prestasi</h1>
            <p className="text-muted-foreground">
              Kelola data prestasi sekolah
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                fetchAchievements();
                setFilterYear("all");
                setSearchTerm("");
              }}
              disabled={isLoading}
              variant="secondary"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>

            <Dialog
              open={open}
              onOpenChange={(value) => {
                setOpen(value);
                if (!value) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Prestasi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Prestasi" : "Tambah Prestasi"}
                  </DialogTitle>
                  <DialogDescription>
                    Isi informasi prestasi dengan lengkap
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* JUDUL */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Prestasi</Label>
                    <Input
                      id="title"
                      value={formData.judul}
                      onChange={(e) =>
                        setFormData({ ...formData, judul: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* DESKRIPSI */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.deskripsi}
                      onChange={(e) =>
                        setFormData({ ...formData, deskripsi: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  {/* TANGGAL */}
                  <div className="space-y-2">
                    <Label htmlFor="achievement_date">Tanggal</Label>
                    <Input
                      id="achievement_date"
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

                  {/* MULTI-IMAGE PREVIEW */}
                  <div className="space-y-2">
                    <Label>
                      Gambar Prestasi
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({allPreviewImages.length} gambar)
                      </span>
                    </Label>

                    <div
                      className="relative w-full border-2 rounded-sm overflow-hidden bg-neutral-100"
                      style={{ minHeight: "200px", maxHeight: "300px" }}
                    >
                      {allPreviewImages.length > 0 ? (
                        <>
                          <img
                            src={allPreviewImages[previewIdx]?.src}
                            alt="Preview"
                            className="w-full object-contain"
                            style={{ maxHeight: "300px" }}
                          />
                          {allPreviewImages.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewIdx((p) => Math.max(0, p - 1))
                                }
                                disabled={previewIdx === 0}
                                style={{
                                  position: "absolute",
                                  left: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "rgba(0,0,0,0.4)",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "32px",
                                  height: "32px",
                                  cursor: "pointer",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: previewIdx === 0 ? 0.3 : 1,
                                }}
                              >
                                <ChevronLeft size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewIdx((p) =>
                                    Math.min(
                                      allPreviewImages.length - 1,
                                      p + 1,
                                    ),
                                  )
                                }
                                disabled={
                                  previewIdx === allPreviewImages.length - 1
                                }
                                style={{
                                  position: "absolute",
                                  right: "8px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "rgba(0,0,0,0.4)",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "32px",
                                  height: "32px",
                                  cursor: "pointer",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity:
                                    previewIdx === allPreviewImages.length - 1
                                      ? 0.3
                                      : 1,
                                }}
                              >
                                <ChevronRight size={18} />
                              </button>
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "8px",
                                  right: "8px",
                                  background: "rgba(0,0,0,0.55)",
                                  color: "#fff",
                                  borderRadius: "12px",
                                  padding: "2px 8px",
                                  fontSize: "12px",
                                }}
                              >
                                {previewIdx + 1} / {allPreviewImages.length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <p className="py-10 text-center text-neutral-500">
                          Tidak ada gambar
                        </p>
                      )}
                    </div>

                    {allPreviewImages.length > 1 && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "8px",
                        }}
                      >
                        {allPreviewImages.map((img, idx) => (
                          <div
                            key={idx}
                            style={{
                              position: "relative",
                              width: "64px",
                              height: "64px",
                              border:
                                idx === previewIdx
                                  ? "2px solid #3b82f6"
                                  : "2px solid transparent",
                              borderRadius: "6px",
                              overflow: "visible",
                              cursor: "pointer",
                            }}
                            onClick={() => setPreviewIdx(idx)}
                          >
                            <img
                              src={img.src}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                borderRadius: "4px",
                                background: "#e5e5e5",
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (img.type === "existing")
                                  removeExistingImage(img.path);
                                else {
                                  const newIdx = newImages.findIndex(
                                    (n) => n.path === img.path,
                                  );
                                  if (newIdx !== -1) removeNewImage(newIdx);
                                }
                              }}
                              style={{
                                position: "absolute",
                                top: "-6px",
                                right: "-6px",
                                background: "#ef4444",
                                border: "none",
                                borderRadius: "50%",
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                              }}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* UPLOAD AREA */}
                  <div className="flex items-center justify-center w-full">
                    <Label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-40 bg-neutral-secondary-medium rounded-sm border-2 border-default-strong cursor-pointer hover:bg-neutral-tertiary-medium"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <CloudUploadIcon className="w-8 h-8 mb-4" />
                        <p className="mb-2 text-sm">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bisa pilih beberapa gambar sekaligus
                        </p>
                      </div>
                      <Input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUploadImage}
                        multiple={true}
                      />
                    </Label>
                  </div>

                  {/* KONTEN */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Konten Lengkap</Label>
                    <Textarea
                      id="content"
                      value={formData.konten}
                      onChange={(e) =>
                        setFormData({ ...formData, konten: e.target.value })
                      }
                      rows={8}
                    />
                  </div>

                  {/* JENJANG */}
                  <div className="grid gap-4">
                    <Label>Jenjang</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {jenjang &&
                        jenjang.map((item) => (
                          <div
                            key={item.jenjang_id}
                            className={`flex items-center ps-4 rounded-sm group border border-default bg-neutral-primary-soft rounded-base ${
                              formData.jenjang_relasi.some(
                                (id) => id.jenjang_id === item.jenjang_id,
                              ) && "border-blue-500"
                            }`}
                          >
                            <Input
                              id={`jenjang-${item.kode_jenjang}`}
                              type="checkbox"
                              value={item.jenjang_id}
                              checked={formData.jenjang_relasi.some(
                                (id) => id.jenjang_id === item.jenjang_id,
                              )}
                              name="jenjang"
                              className="w-4 h-4 text-neutral-primary border-default-medium bg-neutral-secondary-medium rounded-full checked:border-brand focus:ring-2 focus:outline-none focus:ring-brand-subtle border border-default appearance-none"
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  jenjang_relasi: e.target.checked
                                    ? [
                                        ...prev.jenjang_relasi,
                                        {
                                          prestasi_id: formData.prestasi_id,
                                          jenjang_id: item.jenjang_id,
                                          jenjang: item,
                                        },
                                      ]
                                    : prev.jenjang_relasi.filter(
                                        (id) =>
                                          id.jenjang_id !== item.jenjang_id,
                                      ),
                                }))
                              }
                            />
                            <Label
                              htmlFor={`jenjang-${item.kode_jenjang}`}
                              className="w-full py-4 select-none ms-2 text-sm font-medium text-heading"
                            >
                              {item.nama_jenjang}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* TAMPILKAN */}
                  <div className="grid gap-4">
                    <Label>Tampilkan</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`flex items-center ps-4 rounded-sm group border border-default bg-neutral-primary-soft rounded-base ${formData.is_published && "border-blue-500"}`}
                      >
                        <Input
                          id="is_published_true"
                          type="checkbox"
                          checked={formData.is_published}
                          name="is_published"
                          className="w-4 h-4 text-neutral-primary border-default-medium bg-neutral-secondary-medium rounded-full checked:border-brand focus:ring-2 focus:outline-none focus:ring-brand-subtle border border-default appearance-none"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              is_published: prev.is_published
                                ? true
                                : e.target.checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor="is_published_true"
                          className="w-full py-4 select-none ms-2 text-sm font-medium text-heading"
                        >
                          Ya
                        </Label>
                      </div>
                      <div
                        className={`flex items-center ps-4 rounded-sm group border border-default bg-neutral-primary-soft rounded-base ${!formData.is_published && "border-blue-500"}`}
                      >
                        <Input
                          id="is_published_false"
                          type="checkbox"
                          checked={!formData.is_published}
                          name="is_published"
                          className="w-4 h-4 text-neutral-primary border-default-medium bg-neutral-secondary-medium rounded-full checked:border-brand focus:ring-2 focus:outline-none focus:ring-brand-subtle border border-default appearance-none"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              is_published: prev.is_published
                                ? false
                                : e.target.checked,
                            }))
                          }
                        />
                        <Label
                          htmlFor="is_published_false"
                          className="w-full py-4 select-none ms-2 text-sm font-medium text-heading"
                        >
                          Tidak
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* FILTER */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari judul prestasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
          <div className="space-x-2 flex items-center">
            <Label htmlFor="filter-year" className="text-sm font-medium">
              Tahun:
            </Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger id="filter-year" className="w-[150px]">
                <SelectValue placeholder="Semua Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {achievementYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* TABLE */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar Prestasi</CardTitle>
            <CardDescription>
              Total {totalData} data | Halaman {page} dari {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Gambar</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Konten</TableHead>
                  <TableHead>Tampilkan</TableHead>
                  <TableHead className="w-[150px]">Tanggal</TableHead>
                  <TableHead className="w-[150px]">Jenjang</TableHead>
                  <TableHead className="text-right w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-10"
                    >
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : (
                  achievementsFiltered &&
                  achievementsFiltered.map((achievement, index) => {
                    const imgs = parseImages(achievement.path_gambar);
                    const firstImg = imgs[0] || "";
                    return (
                      <TableRow key={achievement.prestasi_id}>
                        <TableCell className="font-medium">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div
                            style={{
                              position: "relative",
                              height: "100px",
                              width: "100px",
                              background: "#f0f0f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "4px",
                            }}
                          >
                            <img
                              loading="lazy"
                              height={100}
                              width={100}
                              src={`${BASE_URL}/${firstImg}`}
                              alt=""
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "contain",
                                borderRadius: "4px",
                              }}
                            />
                            {imgs.length > 1 && (
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: "4px",
                                  right: "4px",
                                  background: "rgba(0,0,0,0.6)",
                                  color: "#fff",
                                  fontSize: "10px",
                                  borderRadius: "8px",
                                  padding: "1px 5px",
                                  fontWeight: 600,
                                }}
                              >
                                +{imgs.length - 1}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {achievement.judul?.length > 30
                            ? `${achievement.judul.substring(0, 30)}...`
                            : achievement.judul}
                        </TableCell>
                        <TableCell className="font-medium">
                          {achievement.deskripsi?.length > 30
                            ? `${achievement.deskripsi.substring(0, 30)}...`
                            : achievement.deskripsi}
                        </TableCell>
                        <TableCell className="font-medium">
                          {achievement.konten?.length > 30
                            ? `${achievement.konten.substring(0, 30)}...`
                            : achievement.konten}
                        </TableCell>
                        <TableCell className="font-medium">
                          {achievement.is_published ? "Ya" : "Tidak"}
                        </TableCell>
                        <TableCell>
                          {achievement.tanggal_publikasi
                            ? new Date(
                                achievement.tanggal_publikasi,
                              ).toLocaleDateString("id-ID")
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {achievement.jenjang_relasi?.map(
                            (item: Jenjang_relasi) => (
                              <p
                                key={item.jenjang_id}
                                className={`px-2 py-2 m-1 rounded-full w-fit ${getGradeColors(item.jenjang.kode_jenjang)}`}
                              >
                                {item.jenjang.kode_jenjang}
                              </p>
                            ),
                          )}
                        </TableCell>
                        <TableCell className="text-right flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/dashboard/achievements/${achievement.prestasi_id}`,
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(achievement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              popupDelete(achievement.prestasi_id || "")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {!isLoading && achievementsFiltered?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-10"
                    >
                      {searchTerm !== "" || filterYear !== "all"
                        ? "Tidak ada prestasi yang cocok dengan kriteria filter."
                        : "Belum ada data prestasi."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <DashboardPagination
          key="achievements-pagination"
          page={page}
          handlePageChange={handlePageChange}
          totalPages={totalPages}
        />
      </div>
    </DashboardLayout>
  );
};

export default Achievements;
