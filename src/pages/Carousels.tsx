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
  urutan: 0,
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

// ✅ Helper: sanitize nama file — ganti spasi & karakter special jadi underscore
const sanitizeFileName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
};

const CarouselsPage = () => {
  const { userLoginInfo } = useAppContext();
  const [carouselsBackup, setCarouselsBackup] = useState<
    ApiResponse<Carousel>["data"] | []
  >([]);
  const [carouselsFiltered, setCarouselsFiltered] = useState<
    ApiResponse<Carousel>["data"] | []
  >([]);
  const [jenjang, setJenjang] = useState<Jenjang[]>([]);
  const [gambar, setGambar] = useState<File | null>(null);
  const [formData, setFormData] = useState<InitialForm>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setisLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [page, setPage] = useState(1);
  const totalData = carouselsBackup?.length || 0;
  const limit = 10;
  const totalPages = Math.ceil(totalData / limit);

  const fetchCarousels = async () => {
    setisLoading(true);
    try {
      const responseData: ApiResponse<Carousel> = await getRequest(
        `/carousels?page=1&limit=1000`,
      );
      if (!responseData.data) throw new Error(responseData.message);
      const fetchJenjang = await getRequest(`/jenjang`);
      const sortData = responseData.data.sort(
        (a: Carousel, b: Carousel) => a.urutan - b.urutan,
      );
      setCarouselsBackup(sortData);
      setCarouselsFiltered(sortData?.slice(limit * (page - 1), limit * page));
      setJenjang(fetchJenjang.data);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data carousel.");
      setCarouselsBackup(null);
      setIsError(true);
    } finally {
      setisLoading(false);
      setIsError(false);
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
    setIsError(false);

    try {
      if (editingId) {
        const { updated_at, penulis_user_id, ...restForm } = formData;
        const dataToSubmit = {
          ...restForm,
          updated_at: new Date().toISOString(),
          editor_user_id: userLoginInfo.userInfo.user_id,
          penulis_user_id: formData.penulis_user_id,
        };
        await putRequest(`/carousels/${editingId}`, dataToSubmit);

        if (gambar) {
          const foto = new FormData();
          foto.append("image", gambar);
          foto.append("alt", formData.path_gambar);
          await postRequest("/galleries/add/carousels", foto);
          toast.success(`Foto berhasil diupdate!`);
        }
        toast.success(`Carousel berhasil diupdate!`);
      } else {
        const { updated_at, ...restForm } = formData;
        const dataToSubmit = {
          ...restForm,
          tanggal_publikasi: formData.tanggal_publikasi
            ? formData.tanggal_publikasi
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          penulis_user_id: userLoginInfo.userInfo.user_id,
          editor_user_id: userLoginInfo.userInfo.user_id,
        };
        await postRequest("/carousels", dataToSubmit);

        if (gambar) {
          const foto = new FormData();
          foto.append("image", gambar);
          await postRequest("/galleries/add/carousels", foto);
          toast.success(`Foto berhasil diunggah!`);
        }
        toast.success("Carousel berhasil ditambahkan!");
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
      fetchCarousels();
      setisLoading(false);
    }
  };

  const executeDelete = async (id: string) => {
    setisLoading(true);
    try {
      await deleteRequest(`/carousels/${id}`);
      const isLastItemOnPage = carouselsFiltered.length === 1;
      if (isLastItemOnPage && page > 1) setPage((prev) => prev - 1);
      toast.success("Carousel berhasil dihapus!");
    } catch (error: any) {
      toast.error(error?.message || "Terjadi kesalahan");
      setIsError(true);
    } finally {
      fetchCarousels();
      setisLoading(false);
    }
  };

  const popupDelete = (id: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data carousel akan dihapus permanen!",
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

  const openEditDialog = (carousel: Carousel) => {
    const formattedDate = carousel.tanggal_publikasi
      ? new Date(carousel.tanggal_publikasi!).toISOString().split("T")[0]
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
    setGambar(null);
    setOpen(true);
  };

  const carouselsYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i).map((y) =>
      y.toString(),
    );
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ✅ FIX: sanitize nama file — ganti spasi & karakter special jadi underscore
      const safeName = sanitizeFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          path_gambar: "carousels/" + safeName,
        }));
        setGambar(file);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchCarousels();
  }, []);

  useEffect(() => {
    const newTotalData = carouselsBackup?.length || 0;
    const newTotalPages = Math.ceil(newTotalData / limit);
    if (page > newTotalPages && page > 1) {
      setPage(newTotalPages);
      return;
    }
    setCarouselsFiltered(
      carouselsBackup.slice((page - 1) * limit, page * limit),
    );
  }, [page, carouselsBackup]);

  useEffect(() => {
    let filtered = carouselsBackup.filter((c: Carousel) =>
      c.judul.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    if (filterYear !== "all") {
      filtered = filtered.filter(
        (c: Carousel) =>
          new Date(c.tanggal_publikasi).getFullYear().toString() === filterYear,
      );
    }
    setCarouselsFiltered(filtered.slice(0, limit * page));
  }, [searchTerm, filterYear, carouselsBackup, page]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carousel</h1>
            <p className="text-muted-foreground">
              Kelola data carousel sekolah
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                fetchCarousels();
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
                  Tambah Carousel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Carousel" : "Tambah Carousel"}
                  </DialogTitle>
                  <DialogDescription>
                    Isi informasi carousel dengan lengkap
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* JUDUL */}
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

                  {/* URUTAN */}
                  <div className="space-y-2">
                    <Label htmlFor="order">Urutan</Label>
                    <Input
                      type="number"
                      id="order"
                      value={formData.urutan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          urutan: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  {/* TANGGAL */}
                  <div className="space-y-2">
                    <Label htmlFor="carousels_date">Tanggal</Label>
                    <Input
                      id="carousels_date"
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

                  {/* GAMBAR PREVIEW */}
                  <div className="space-y-2">
                    <Label htmlFor="image">Gambar Carousel</Label>
                    <div
                      className="flex items-center justify-center w-full border-2 rounded-sm overflow-hidden max-h-[300px]"
                      style={{ minHeight: "120px", background: "#f5f5f5" }}
                    >
                      {gambar ? (
                        <img
                          src={URL.createObjectURL(gambar)}
                          alt="Preview"
                          className="w-full h-auto object-contain"
                        />
                      ) : formData.path_gambar ? (
                        <img
                          src={`${BASE_URL}/${encodeURIComponent(formData.path_gambar).replace(/%2F/g, "/")}`}
                          alt="Gambar Carousel"
                          className="w-full h-auto object-contain"
                        />
                      ) : (
                        <p className="py-10 text-neutral-500">
                          Tidak ada gambar
                        </p>
                      )}
                    </div>
                    {/* Tampilkan nama file yang akan disimpan */}
                    {formData.path_gambar && (
                      <p className="text-xs text-muted-foreground">
                        Path: {formData.path_gambar}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-center w-full">
                    <Label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium rounded-sm border-2 border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium"
                    >
                      <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                        <CloudUploadIcon className="w-8 h-8 mb-4" />
                        <p className="mb-2 text-sm">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs">
                          SVG, PNG, JPG or GIF (MAX. 800x400px)
                        </p>
                      </div>
                      <Input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUploadImage}
                        multiple={false}
                      />
                    </Label>
                  </div>

                  {/* KONTEN */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Konten</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="jenjang_select">Jenjang</Label>
                    <Select
                      value={formData.jenjang_id || "none"}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          jenjang_id: val === "none" ? null : val,
                        })
                      }
                    >
                      <SelectTrigger id="jenjang_select">
                        <SelectValue placeholder="Pilih Jenjang (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Semua Jenjang</SelectItem>
                        {jenjang.map((item) => (
                          <SelectItem
                            key={item.jenjang_id}
                            value={item.jenjang_id}
                          >
                            {item.nama_jenjang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* TAMPILKAN */}
                  <div className="grid gap-4">
                    <Label>Tampilkan</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`flex items-center ps-4 rounded-sm border border-default bg-neutral-primary-soft rounded-base ${formData.is_published && "border-blue-500"}`}
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
                        className={`flex items-center ps-4 rounded-sm border border-default bg-neutral-primary-soft rounded-base ${!formData.is_published && "border-blue-500"}`}
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
              placeholder="Cari judul carousel..."
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
                {carouselsYears.map((year) => (
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
            <CardTitle>Daftar Carousel</CardTitle>
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
                  <TableHead>Urutan</TableHead>
                  <TableHead>Konten</TableHead>
                  <TableHead>Tampilkan</TableHead>
                  <TableHead className="w-[150px]">Tanggal</TableHead>
                  <TableHead className="text-right w-[100px]">Aksi</TableHead>
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
                ) : (
                  carouselsFiltered &&
                  carouselsFiltered.map((carousel, index) => (
                    <TableRow key={carousel.carousel_id}>
                      <TableCell className="font-medium">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div
                          style={{
                            height: "100px",
                            width: "100px",
                            overflow: "hidden",
                            background: "#f0f0f0",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <img
                            loading="lazy"
                            height={100}
                            width={100}
                            src={`${BASE_URL}/${encodeURIComponent(carousel.path_gambar).replace(/%2F/g, "/")}`}
                            alt=""
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {carousel.judul?.length > 30
                          ? `${carousel.judul.substring(0, 30)}...`
                          : carousel.judul}
                      </TableCell>
                      <TableCell className="font-medium">
                        {carousel.urutan}
                      </TableCell>
                      <TableCell className="font-medium">
                        {carousel.konten?.length > 30
                          ? `${carousel.konten.substring(0, 30)}...`
                          : carousel.konten}
                      </TableCell>
                      <TableCell className="font-medium">
                        {carousel.is_published ? "Ya" : "Tidak"}
                      </TableCell>
                      <TableCell>
                        {carousel.tanggal_publikasi
                          ? new Date(
                              carousel.tanggal_publikasi,
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/dashboard/carousels/${carousel.carousel_id}`,
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(carousel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            popupDelete(carousel.carousel_id || "")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && carouselsFiltered?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      {searchTerm !== "" || filterYear !== "all"
                        ? "Tidak ada carousel yang cocok dengan kriteria filter."
                        : "Belum ada data carousel."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <DashboardPagination
          key="carousels-pagination"
          page={page}
          handlePageChange={handlePageChange}
          totalPages={totalPages}
        />
      </div>
    </DashboardLayout>
  );
};

export default CarouselsPage;
