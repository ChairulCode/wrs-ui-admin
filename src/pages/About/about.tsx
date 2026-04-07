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
  RefreshCcw,
  CloudUploadIcon,
  X,
  Info,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "@/utils/api-call";
import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";
import { useNavigate } from "react-router-dom";

interface Jenjang {
  jenjang_id: string;
  nama_jenjang: string;
  kode_jenjang: string;
}

interface AboutData {
  about_id: string;
  hero_badge?: string;
  hero_title: string;
  hero_subtitle?: string;
  hero_image?: string;
  hero_meta_pills?: string[];
  description_text?: string;
  visi_quote?: string;
  highlights?: { icon: string; label: string }[];
  fasilitas_items?: { icon: string; nama: string }[];
  cta_title?: string;
  cta_description?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  is_published: boolean;
  jenjang_id?: string;
  jenjang?: Jenjang;
  penulis_user_id: string;
  editor_user_id?: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  about_id?: string;
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  description_text: string;
  visi_quote: string;
  cta_title: string;
  cta_description: string;
  cta_button_text: string;
  cta_button_url: string;
  is_published: boolean;
  jenjang_id?: string | null;
  penulis_user_id: string;
  editor_user_id?: string;
}

const initialFormData: FormData = {
  hero_badge: "TENTANG KAMI",
  hero_title: "",
  hero_subtitle: "",
  hero_image: "",
  description_text: "",
  visi_quote: "",
  cta_title: "",
  cta_description: "",
  cta_button_text: "Daftar Sekarang",
  cta_button_url: "/pendaftaran",
  is_published: true,
  penulis_user_id: "",
};

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ROLE_JENJANG_MAP: Record<string, string[] | null> = {
  superadmin: null,
  "admin pgtk": ["PGTK"],
  "admin sd": ["SD"],
  "admin smp": ["SMP"],
  "admin sma": ["SMA"],
};

const getAllowedJenjangCodes = (role: string): string[] | null => {
  if (role in ROLE_JENJANG_MAP) return ROLE_JENJANG_MAP[role];
  if (role.includes("super")) return null;
  for (const [key, value] of Object.entries(ROLE_JENJANG_MAP)) {
    if (key !== "superadmin" && role.includes(key.replace("admin ", ""))) {
      return value;
    }
  }
  return [];
};

const About = () => {
  const { userLoginInfo } = useAppContext();
  const [aboutList, setAboutList] = useState<AboutData[]>([]);
  const [jenjangList, setJenjangList] = useState<Jenjang[]>([]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [heroImagePreview, setHeroImagePreview] = useState<string>("");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const navigate = useNavigate();

  // Dynamic arrays for form builders
  const [metaPills, setMetaPills] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<
    { icon: string; label: string }[]
  >([]);
  const [fasilitasItems, setFasilitasItems] = useState<
    { icon: string; nama: string }[]
  >([]);

  const userRole = userLoginInfo?.userInfo?.role?.toLowerCase() || "";
  const isSuperAdmin = userRole.includes("super");
  const allowedJenjangCodes = useMemo(
    () => getAllowedJenjangCodes(userRole),
    [userRole],
  );

  const filteredJenjangForForm = useMemo(() => {
    if (allowedJenjangCodes === null) return jenjangList;
    return jenjangList.filter((j) =>
      allowedJenjangCodes.includes(j.kode_jenjang),
    );
  }, [jenjangList, allowedJenjangCodes]);

  // FIX 1: Cek apakah admin sudah punya about untuk semua jenjang yang diizinkan
  const hasReachedAboutLimit = useMemo(() => {
    if (isSuperAdmin) return false;
    if (!allowedJenjangCodes || allowedJenjangCodes.length === 0) return false;

    return allowedJenjangCodes.every((code) => {
      const jenjang = jenjangList.find((j) => j.kode_jenjang === code);
      if (!jenjang) return false;
      return aboutList.some((a) => a.jenjang_id === jenjang.jenjang_id);
    });
  }, [isSuperAdmin, allowedJenjangCodes, jenjangList, aboutList]);

  const fetchAbout = async () => {
    setIsLoading(true);
    try {
      const responseData = await getRequest(`/about?page=1&limit=100`);
      const fetchJenjang = await getRequest(`/jenjang`);
      setAboutList(responseData.data || []);
      setJenjangList(fetchJenjang.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data about.");
    } finally {
      setIsLoading(false);
    }
  };

  // FIX 1 & Bonus: resetForm auto-select jenjang untuk non-superadmin
  const resetForm = () => {
    const defaultJenjangId =
      !isSuperAdmin && filteredJenjangForForm.length > 0
        ? filteredJenjangForForm[0].jenjang_id
        : null;

    setFormData({ ...initialFormData, jenjang_id: defaultJenjangId });
    setEditingId(null);
    setHeroImagePreview("");
    setHeroImageFile(null);
    setMetaPills([]);
    setHighlights([]);
    setFasilitasItems([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setHeroImagePreview(reader.result as string);
      setHeroImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  // Meta Pills handlers
  const addMetaPill = () => {
    setMetaPills([...metaPills, ""]);
  };

  const removeMetaPill = (index: number) => {
    setMetaPills(metaPills.filter((_, i) => i !== index));
  };

  const updateMetaPill = (index: number, value: string) => {
    const updated = [...metaPills];
    updated[index] = value;
    setMetaPills(updated);
  };

  // Highlights handlers
  const addHighlight = () => {
    setHighlights([...highlights, { icon: "", label: "" }]);
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const updateHighlight = (
    index: number,
    field: "icon" | "label",
    value: string,
  ) => {
    const updated = [...highlights];
    updated[index][field] = value;
    setHighlights(updated);
  };

  // Fasilitas handlers
  const addFasilitas = () => {
    setFasilitasItems([...fasilitasItems, { icon: "", nama: "" }]);
  };

  const removeFasilitas = (index: number) => {
    setFasilitasItems(fasilitasItems.filter((_, i) => i !== index));
  };

  const updateFasilitas = (
    index: number,
    field: "icon" | "nama",
    value: string,
  ) => {
    const updated = [...fasilitasItems];
    updated[index][field] = value;
    setFasilitasItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let uploadedImagePath = formData.hero_image;

      // Upload hero image jika ada file baru
      if (heroImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", heroImageFile);
        try {
          const uploadRes = await postRequest(
            `/galleries/add/about`,
            imageFormData,
          );
          uploadedImagePath = uploadRes?.data?.path || uploadRes?.path || "";
        } catch (uploadErr) {
          console.warn("Upload gambar gagal:", uploadErr);
        }
      }

      // Filter empty values
      const filteredMetaPills = metaPills.filter((pill) => pill.trim() !== "");
      const filteredHighlights = highlights.filter(
        (h) => h.icon.trim() !== "" && h.label.trim() !== "",
      );
      const filteredFasilitas = fasilitasItems.filter(
        (f) => f.icon.trim() !== "" && f.nama.trim() !== "",
      );

      const payload = {
        hero_badge: formData.hero_badge || null,
        hero_title: formData.hero_title,
        hero_subtitle: formData.hero_subtitle || null,
        hero_image: uploadedImagePath || null,
        hero_meta_pills: filteredMetaPills,
        description_text: formData.description_text || null,
        visi_quote: formData.visi_quote || null,
        highlights: filteredHighlights,
        fasilitas_items: filteredFasilitas,
        cta_title: formData.cta_title || null,
        cta_description: formData.cta_description || null,
        cta_button_text: formData.cta_button_text || null,
        cta_button_url: formData.cta_button_url || null,
        is_published: formData.is_published,
        jenjang_id: formData.jenjang_id || null,
        penulis_user_id: editingId
          ? formData.penulis_user_id
          : userLoginInfo.userInfo.user_id,
        editor_user_id: editingId ? userLoginInfo.userInfo.user_id : null,
      };

      if (editingId) {
        await putRequest(`/about/${editingId}`, payload);
        toast.success("About berhasil diupdate!");
      } else {
        await postRequest("/about", payload);
        toast.success("About berhasil ditambahkan!");
      }

      resetForm();
      setOpen(false);
      fetchAbout();
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
      await deleteRequest(`/about/${id}`);
      toast.success("About berhasil dihapus!");
      fetchAbout();
    } catch (error: any) {
      toast.error(error?.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const popupDelete = (id: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data about akan dihapus permanen!",
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

  const openEditDialog = (about: AboutData) => {
    setFormData({
      about_id: about.about_id,
      hero_badge: about.hero_badge || "",
      hero_title: about.hero_title,
      hero_subtitle: about.hero_subtitle || "",
      hero_image: about.hero_image || "",
      description_text: about.description_text || "",
      visi_quote: about.visi_quote || "",
      cta_title: about.cta_title || "",
      cta_description: about.cta_description || "",
      cta_button_text: about.cta_button_text || "",
      cta_button_url: about.cta_button_url || "",
      is_published: about.is_published,
      jenjang_id: about.jenjang_id || null,
      penulis_user_id: about.penulis_user_id,
      editor_user_id: about.editor_user_id,
    });

    // Set dynamic arrays
    setMetaPills(about.hero_meta_pills || []);
    setHighlights(about.highlights || []);
    setFasilitasItems(about.fasilitas_items || []);

    if (about.hero_image) {
      setHeroImagePreview(`${BASE_URL}/${about.hero_image}`);
    }

    setEditingId(about.about_id);
    setOpen(true);
  };

  const getGradeColors = (grade: string) => {
    switch (grade) {
      case "PGTK":
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
    fetchAbout();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kelola Halaman About
            </h1>
            <p className="text-muted-foreground">
              Kelola konten halaman About sekolah
              {!isSuperAdmin && allowedJenjangCodes && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium">
                  {allowedJenjangCodes.map((kode) => (
                    <span
                      key={kode}
                      className={`px-2 py-0.5 rounded-full ${getGradeColors(kode)}`}
                    >
                      {kode}
                    </span>
                  ))}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => fetchAbout()}
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
              {/* FIX 1: Sembunyikan tombol Tambah jika admin sudah punya about untuk jenjangnya */}
              {!hasReachedAboutLimit && (
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah About
                  </Button>
                </DialogTrigger>
              )}

              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit About" : "Tambah About"}
                  </DialogTitle>
                  <DialogDescription>
                    Isi informasi halaman about dengan lengkap
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* JENJANG */}
                  <div className="space-y-2">
                    <Label htmlFor="jenjang_id">
                      Jenjang
                      {!isSuperAdmin && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          (sesuai akses role Anda)
                        </span>
                      )}
                    </Label>
                    <select
                      id="jenjang_id"
                      value={formData.jenjang_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jenjang_id: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                      // FIX 2: Disabled dropdown jika non-superadmin hanya punya 1 pilihan
                      disabled={
                        !isSuperAdmin && filteredJenjangForForm.length <= 1
                      }
                    >
                      {/* FIX 2: Opsi Global hanya tampil untuk superadmin */}
                      {isSuperAdmin && (
                        <option value="">Global / Halaman Utama</option>
                      )}
                      {filteredJenjangForForm.map((j) => (
                        <option key={j.jenjang_id} value={j.jenjang_id}>
                          {j.nama_jenjang}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* HERO SECTION */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Hero Section</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="hero_badge">Hero Badge</Label>
                        <Input
                          id="hero_badge"
                          value={formData.hero_badge}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hero_badge: e.target.value,
                            })
                          }
                          placeholder="TENTANG KAMI"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hero_title">Hero Title *</Label>
                        <Input
                          id="hero_title"
                          value={formData.hero_title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hero_title: e.target.value,
                            })
                          }
                          required
                          placeholder="Perguruan WR Supratman"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                        <Textarea
                          id="hero_subtitle"
                          value={formData.hero_subtitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              hero_subtitle: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Membentuk generasi unggul..."
                        />
                      </div>

                      {/* META PILLS - DYNAMIC FORM BUILDER */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Hero Meta Pills (Badge)</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addMetaPill}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Tambah Badge
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {metaPills.map((pill, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={pill}
                                onChange={(e) =>
                                  updateMetaPill(index, e.target.value)
                                }
                                placeholder={`Badge ${index + 1} (contoh: Terakreditasi A)`}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeMetaPill(index)}
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {metaPills.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">
                              Belum ada badge. Klik "Tambah Badge" untuk
                              menambahkan.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Hero Image</Label>
                        {heroImagePreview && (
                          <div className="relative w-full rounded-md overflow-hidden border bg-gray-50">
                            <div className="aspect-[16/9] w-full">
                              <img
                                src={heroImagePreview}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setHeroImagePreview("");
                                setHeroImageFile(null);
                              }}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        <Label
                          htmlFor="hero-image-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <CloudUploadIcon className="w-8 h-8 mb-2 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {heroImagePreview
                              ? "Ganti Hero Image"
                              : "Upload Hero Image"}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Rekomendasi: 1920x1080px (16:9)
                          </span>
                          <Input
                            id="hero-image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION SECTION */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Description Section
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="description_text">Description Text</Label>
                      <Textarea
                        id="description_text"
                        value={formData.description_text}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description_text: e.target.value,
                          })
                        }
                        rows={6}
                        placeholder="Perguruan WR Supratman telah berdiri sejak..."
                      />
                    </div>
                  </div>

                  {/* VISI SECTION */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Visi Section</h3>
                    <div className="space-y-2">
                      <Label htmlFor="visi_quote">Visi Quote</Label>
                      <Textarea
                        id="visi_quote"
                        value={formData.visi_quote}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            visi_quote: e.target.value,
                          })
                        }
                        rows={4}
                        placeholder="Menjadi lembaga pendidikan terdepan..."
                      />
                    </div>
                  </div>

                  {/* HIGHLIGHTS SECTION - DYNAMIC FORM BUILDER */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Keunggulan (Highlights)
                      </h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addHighlight}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Tambah Keunggulan
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {highlights.map((highlight, index) => (
                        <div
                          key={index}
                          className="flex gap-2 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            <div className="col-span-1">
                              <Label className="text-xs mb-1">Icon/Emoji</Label>
                              <Input
                                value={highlight.icon}
                                onChange={(e) =>
                                  updateHighlight(index, "icon", e.target.value)
                                }
                                placeholder="🎓"
                                className="text-center text-2xl"
                                maxLength={2}
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs mb-1">
                                Label/Keterangan
                              </Label>
                              <Input
                                value={highlight.label}
                                onChange={(e) =>
                                  updateHighlight(
                                    index,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                placeholder="Tenaga Pengajar Berpengalaman"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeHighlight(index)}
                            className="self-end"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {highlights.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                          Belum ada keunggulan. Klik "Tambah Keunggulan" untuk
                          menambahkan.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* FASILITAS SECTION - DYNAMIC FORM BUILDER */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Fasilitas</h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addFasilitas}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Tambah Fasilitas
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {fasilitasItems.map((fasilitas, index) => (
                        <div
                          key={index}
                          className="flex gap-2 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            <div className="col-span-1">
                              <Label className="text-xs mb-1">Icon/Emoji</Label>
                              <Input
                                value={fasilitas.icon}
                                onChange={(e) =>
                                  updateFasilitas(index, "icon", e.target.value)
                                }
                                placeholder="🏫"
                                className="text-center text-2xl"
                                maxLength={2}
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs mb-1">
                                Nama Fasilitas
                              </Label>
                              <Input
                                value={fasilitas.nama}
                                onChange={(e) =>
                                  updateFasilitas(index, "nama", e.target.value)
                                }
                                placeholder="Ruang Kelas Ber-AC"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFasilitas(index)}
                            className="self-end"
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {fasilitasItems.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                          Belum ada fasilitas. Klik "Tambah Fasilitas" untuk
                          menambahkan.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA SECTION */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">CTA Section</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cta_title">CTA Title</Label>
                        <Input
                          id="cta_title"
                          value={formData.cta_title}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta_title: e.target.value,
                            })
                          }
                          placeholder="Siap Bergabung Bersama Kami?"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cta_description">CTA Description</Label>
                        <Textarea
                          id="cta_description"
                          value={formData.cta_description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta_description: e.target.value,
                            })
                          }
                          rows={3}
                          placeholder="Daftarkan putra-putri Anda sekarang..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cta_button_text">Button Text</Label>
                          <Input
                            id="cta_button_text"
                            value={formData.cta_button_text}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta_button_text: e.target.value,
                              })
                            }
                            placeholder="Daftar Sekarang"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cta_button_url">Button URL</Label>
                          <Input
                            id="cta_button_url"
                            value={formData.cta_button_url}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta_button_url: e.target.value,
                              })
                            }
                            placeholder="/pendaftaran"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PUBLISH STATUS */}
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_published"
                        checked={formData.is_published}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_published: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <Label htmlFor="is_published">Publish halaman ini</Label>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* TABLE */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar About</CardTitle>
            <CardDescription>
              Total {aboutList.length} halaman about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead>Hero Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Update</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-10"
                    >
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : aboutList.length > 0 ? (
                  aboutList.map((about, index) => (
                    <TableRow key={about.about_id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {about.jenjang ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getGradeColors(about.jenjang.kode_jenjang)}`}
                          >
                            {about.jenjang.nama_jenjang}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Global
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {about.hero_title}
                      </TableCell>
                      <TableCell>
                        {about.is_published ? (
                          <span className="text-green-600 text-sm">
                            Published
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Draft</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(about.updated_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(about)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => popupDelete(about.about_id)}
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
                      className="text-center text-muted-foreground py-10"
                    >
                      Belum ada data about.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default About;
