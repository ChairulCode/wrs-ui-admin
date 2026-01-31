import React, { useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Plus } from "lucide-react";

const API_URL = "http://localhost:3000/api/v1/sosial";

// 1. Definisikan Interface agar tidak error 'never'
interface SocialMedia {
  social_media_id: string | number;
  platform: string;
  username: string;
  url: string;
  level: string;
  is_active: boolean;
}

// --- KOMPONEN SKELETON LOADING ---
const SocialSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div className="h-6 w-48 bg-slate-200 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="h-20 w-full bg-slate-200 rounded-2xl"
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Social = () => {
  // 2. Gunakan tipe data <SocialMedia[]>
  const [socialData, setSocialData] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Update fungsi helper: Menggunakan 'authToken' sesuai Local Storage Anda
  const getAuthConfig = () => {
    const token = localStorage.getItem("authToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const [formData, setFormData] = useState<SocialMedia>({
    social_media_id: "",
    platform: "",
    username: "",
    url: "",
    level: "",
    is_active: true,
  });

  // 4. Tambahkan Config Header pada GET request agar tidak "Missing Authorization"
  const fetchSocials = async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(API_URL, config);
      setSocialData(response.data.data || []);
    } catch (error: any) {
      console.error("Gagal load data", error);
      // Jika token expired (401 atau 403), infokan ke user
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("Sesi Anda berakhir, silakan login kembali.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocials();
  }, []);

  const handleOpenModal = (
    level: string,
    platform: string,
    existingData: SocialMedia | null = null,
  ) => {
    if (existingData) {
      setFormData({
        social_media_id: existingData.social_media_id,
        platform: existingData.platform,
        username: existingData.username,
        url: existingData.url,
        level: existingData.level,
        is_active: existingData.is_active,
      });
    } else {
      setFormData({
        social_media_id: "",
        platform: platform,
        username: "",
        url: "",
        level: level,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const config = getAuthConfig();

      if (formData.social_media_id) {
        // Mode Edit
        await axios.put(
          `${API_URL}/${formData.social_media_id}`,
          formData,
          config,
        );
      } else {
        // Mode Tambah Baru
        await axios.post(API_URL, formData, config);
      }

      alert("Data berhasil disimpan!");
      setIsModalOpen(false);
      fetchSocials();
    } catch (error: any) {
      alert(
        "Gagal menyimpan: " + (error.response?.data?.message || error.message),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus link ini?")) {
      try {
        const config = getAuthConfig();
        await axios.delete(`${API_URL}/${id}`, config);
        fetchSocials();
      } catch (error) {
        alert("Gagal menghapus");
      }
    }
  };

  const levels = [
    { title: "Media Sosial SMA", id: "SMA" },
    { title: "Media Sosial SMP", id: "SMP" },
    { title: "Media Sosial SD", id: "SD" },
    { title: "Media Sosial PG/TK", id: "PGTK" },
  ];

  const platforms = [
    {
      name: "Instagram",
      color: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]", // Gradasi khas Instagram
      hover: "hover:shadow-[#fd1d1d]/20",
    },
    {
      name: "Youtube",
      color: "from-[#FF0000] to-[#cc0000]", // Merah YouTube
      hover: "hover:shadow-[#FF0000]/20",
    },
    {
      name: "Facebook",
      color: "from-[#1877F2] to-[#0d65d9]", // Biru Facebook
      hover: "hover:shadow-[#1877F2]/20",
    },
    {
      name: "Tiktok",
      color: "from-[#000000] via-[#25F4EE] to-[#FE2C55]", // Hitam-Cyan-Pink TikTok
      hover: "hover:shadow-[#FE2C55]/20",
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen p-8">
        {loading ? (
          <SocialSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {levels.map((lvl) => (
              <div key={lvl.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {/* <span className="p-2 border-2 border-yellow-400 rounded-lg text-yellow-500 font-bold">
                    ↗
                  </span> */}
                  <h2 className="text-xl font-extrabold text-slate-800">
                    {lvl.title}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {platforms.map((p) => {
                    const data = socialData.find(
                      (s) => s.level === lvl.id && s.platform === p.name,
                    );
                    return (
                      <div key={p.name} className="relative group">
                        <button
                          onClick={() =>
                            handleOpenModal(lvl.id, p.name, data || null)
                          }
                          className={`w-full bg-gradient-to-r ${p.color} text-white py-4 px-4 rounded-2xl font-bold shadow-md transition hover:scale-[1.02] active:scale-95 text-left`}
                        >
                          <div className="flex justify-between items-start">
                            <span>{p.name}</span>
                            {data ? (
                              <Edit3 size={14} className="opacity-50" />
                            ) : (
                              <Plus size={14} />
                            )}
                          </div>
                          <div className="text-[10px] font-normal truncate mt-1 opacity-90">
                            {data ? `@${data.username}` : "Belum diatur"}
                          </div>
                        </button>

                        {data && (
                          <button
                            onClick={() => handleDelete(data.social_media_id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formData.social_media_id
                ? "Edit Media Sosial"
                : "Tambah Media Sosial"}
            </DialogTitle>
            <DialogDescription>
              Silahkan atur tautan {formData.platform} untuk jenjang{" "}
              {formData.level}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Username (Penting agar tidak kosong di database) */}
            <div className="space-y-2">
              <Label htmlFor="username">Username / Nama Akun</Label>
              <Input
                id="username"
                type="text"
                placeholder="Contoh: perguruan_wrsupratman"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL Lengkap</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://instagram.com/..."
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
              />
            </div>
            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Social;
