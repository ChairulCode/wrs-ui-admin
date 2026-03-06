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
import { Trash2, Edit3, Plus, Lock, ExternalLink } from "lucide-react";
import { useAppContext } from "@/utils/app-context";

const API_URL = "http://localhost:3000/api/v1/sosial";

interface SocialMedia {
  social_media_id: string | number;
  platform: string;
  username: string;
  url: string;
  level: string;
  is_active: boolean;
}

// ─── SVG Brand Icons ──────────────────────────────────────────────────────────
const SocialIcon = ({
  platform,
  size = 20,
}: {
  platform: string;
  size?: number;
}) => {
  switch (platform.toLowerCase()) {
    case "instagram":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case "youtube":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
        </svg>
      );
    case "facebook":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    default:
      return <ExternalLink size={size} />;
  }
};

// ─── Platform config ──────────────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<
  string,
  {
    iconBg: string; // background lingkaran icon
    accentBorder: string; // border berwarna brand
    pillBg: string; // pill "Aktif"
    glow: string; // shadow warna brand saat hover
  }
> = {
  instagram: {
    iconBg: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
    accentBorder: "rgba(253,29,29,0.35)",
    pillBg: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
    glow: "rgba(253,29,29,0.25)",
  },
  youtube: {
    iconBg: "#FF0000",
    accentBorder: "rgba(255,0,0,0.35)",
    pillBg: "#FF0000",
    glow: "rgba(255,0,0,0.2)",
  },
  facebook: {
    iconBg: "#1877F2",
    accentBorder: "rgba(24,119,242,0.35)",
    pillBg: "#1877F2",
    glow: "rgba(24,119,242,0.2)",
  },
  tiktok: {
    iconBg: "#010101",
    accentBorder: "rgba(254,44,85,0.35)",
    pillBg: "linear-gradient(135deg,#25F4EE,#FE2C55)",
    glow: "rgba(254,44,85,0.2)",
  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SocialSkeleton = () => (
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-lg" />
          <div className="h-6 w-48 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Social = () => {
  const { userLoginInfo } = useAppContext();
  const [socialData, setSocialData] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SocialMedia>({
    social_media_id: "",
    platform: "",
    username: "",
    url: "",
    level: "",
    is_active: true,
  });

  const getAuthConfig = () => {
    const token = localStorage.getItem("authToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchSocials = async () => {
    try {
      const res = await axios.get(API_URL, getAuthConfig());
      setSocialData(res.data.data || []);
    } catch (error: any) {
      console.error("Gagal load data", error);
      if (error.response?.status === 401 || error.response?.status === 403)
        alert("Sesi Anda berakhir, silakan login kembali.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocials();
  }, []);

  const getAllowedLevels = () => {
    const role = userLoginInfo?.userInfo?.role;
    if (role === "Super Administrator" || role === "Admin")
      return ["SMA", "SMP", "SD", "PGTK"];
    if (role === "Kepala Sekolah SMA") return ["SMA"];
    if (role === "Kepala Sekolah SMP") return ["SMP"];
    if (role === "Kepala Sekolah SD") return ["SD"];
    if (role === "Kepala Sekolah PG-TK") return ["PGTK"];
    return [];
  };

  const canEditLevel = (level: string) => getAllowedLevels().includes(level);

  const handleOpenModal = (
    level: string,
    platform: string,
    existing: SocialMedia | null = null,
  ) => {
    if (!canEditLevel(level)) {
      alert("Anda tidak memiliki akses untuk mengelola tingkatan ini.");
      return;
    }
    setFormData(
      existing
        ? { ...existing }
        : {
            social_media_id: "",
            platform,
            username: "",
            url: "",
            level,
            is_active: true,
          },
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditLevel(formData.level)) {
      alert("Anda tidak memiliki akses untuk mengelola tingkatan ini.");
      return;
    }
    setIsSubmitting(true);
    try {
      const cfg = getAuthConfig();
      if (formData.social_media_id)
        await axios.put(
          `${API_URL}/${formData.social_media_id}`,
          formData,
          cfg,
        );
      else await axios.post(API_URL, formData, cfg);
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

  const handleDelete = async (id: string | number, level: string) => {
    if (!canEditLevel(level)) {
      alert("Anda tidak memiliki akses untuk menghapus data tingkatan ini.");
      return;
    }
    if (!window.confirm("Apakah Anda yakin ingin menghapus link ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthConfig());
      fetchSocials();
    } catch {
      alert("Gagal menghapus");
    }
  };

  const levels = [
    { title: "Media Sosial SMA", id: "SMA" },
    { title: "Media Sosial SMP", id: "SMP" },
    { title: "Media Sosial SD", id: "SD" },
    { title: "Media Sosial PG/TK", id: "PGTK" },
  ];
  const platforms = ["Instagram", "Youtube", "Facebook", "Tiktok"];

  const allowedLevels = getAllowedLevels();
  const filteredLevels = levels.filter((lvl) => allowedLevels.includes(lvl.id));

  return (
    <DashboardLayout>
      <>
        <style>{`
          /* ── Kartu platform ── */
          .sc-wrap   { position: relative; }
          .sc-card   {
            position: relative; width: 100%;
            border-radius: 16px; border: 1.5px solid;
            padding: 14px 12px 12px;
            display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
            cursor: pointer; text-align: left;
            transition: transform .18s, box-shadow .18s, background .18s;
            /* glass transparan */
            background: rgba(255,255,255,0.07);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          .sc-card:hover:not([disabled]) {
            transform: translateY(-3px);
            background: rgba(255,255,255,0.13);
          }
          .sc-card:active:not([disabled]) { transform: scale(0.98); }
          .sc-card[disabled] { opacity: 0.45; cursor: not-allowed; }

          /* top row */
          .sc-top {
            width: 100%; display: flex;
            align-items: center; justify-content: space-between;
          }
          .sc-icon-circle {
            width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
          }
          .sc-action {
            width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.15);
          }

          /* teks */
          .sc-name {
            font-size: 13px; font-weight: 800;
            color: black;
            text-shadow: 0 1px 3px rgba(0,0,0,0.35);
            letter-spacing: -0.01em;
          }
          .sc-user {
            font-size: 10px; font-weight: 600;
            color: black;
            text-shadow: 0 1px 3px rgba(0,0,0,0.4);
            max-width: 100%; overflow: hidden;
            text-overflow: ellipsis; white-space: nowrap;
          }
          .sc-user.empty {
            color: black;
            font-style: italic; font-weight: 400;
          }

          /* pill "Aktif" */
          .sc-pill {
            font-size: 9px; font-weight: 800;
            letter-spacing: .08em; text-transform: uppercase;
            padding: 2px 8px; border-radius: 999px;
            color: #fff; white-space: nowrap;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          }

          /* baris bawah: username + pill */
          .sc-bottom {
            width: 100%; display: flex;
            align-items: center; justify-content: space-between; gap: 6px;
          }

          /* tombol delete */
          .sc-del {
            position: absolute; top: -8px; right: -8px;
            width: 22px; height: 22px; border-radius: 50%;
            background: #ef4444; color: #fff;
            border: 2px solid #fff;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity .15s;
            cursor: pointer; z-index: 10;
          }
          .sc-wrap:hover .sc-del { opacity: 1; }

          /* section header */
          .sc-head {
            display: flex; align-items: center; gap: 8px; margin-bottom: 2px;
          }
          .sc-head-title {
            font-size: 15px; font-weight: 800;
            color: #1a1a1a; letter-spacing: -0.02em;
          }
          .sc-locked-badge {
            display: inline-flex; align-items: center; gap: 4px;
            font-size: 10px; font-weight: 600; color: #999;
            background: #f3f3f3; border: 1px solid #e5e5e5;
            padding: 2px 8px; border-radius: 999px;
          }

          /* role banner */
          .sc-role-banner {
            background: #fdf8ed; border: 1px solid #e8d89a;
            border-radius: 12px; padding: 12px 16px; margin-bottom: 28px;
          }
          .sc-role-banner p   { margin: 0; font-size: 13px; color: #5a4a20; }
          .sc-role-banner p+p { margin-top: 2px; font-size: 11px; color: #8a7040; }

          /* section container */
          .sc-section-bg {
            background: transparent;
            border-radius: 20px;
            padding: 20px;
          }

          /* fade-up animation */
          @keyframes scUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .sc-item { animation: scUp .22s ease both; }
        `}</style>

        <div className="min-h-screen p-8">
          <div className="max-w-6xl mx-auto">
            {/* Role Banner */}
            <div className="sc-role-banner">
              <p>
                <strong>Role Anda:</strong>{" "}
                {userLoginInfo?.userInfo?.role || "Unknown"}
              </p>
              <p>
                {allowedLevels.length === 4
                  ? "Anda memiliki akses ke semua tingkatan."
                  : `Anda hanya dapat mengelola: ${allowedLevels.join(", ")}`}
              </p>
            </div>

            {loading ? (
              <SocialSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                {filteredLevels.map((lvl, lvlIdx) => {
                  const hasAccess = canEditLevel(lvl.id);
                  return (
                    <div
                      key={lvl.id}
                      className="sc-item flex flex-col gap-4"
                      style={{ animationDelay: `${lvlIdx * 60}ms` }}
                    >
                      {/* Section header */}
                      <div className="sc-head">
                        <h2 className="sc-head-title">{lvl.title}</h2>
                        {!hasAccess && (
                          <span className="sc-locked-badge">
                            <Lock size={10} /> Terkunci
                          </span>
                        )}
                      </div>

                      {/* Dark background untuk grid kartu */}
                      <div className="sc-section-bg">
                        <div className="grid grid-cols-2 gap-3">
                          {platforms.map((pName) => {
                            const cfg = PLATFORM_CONFIG[pName.toLowerCase()];
                            const data = socialData.find(
                              (s) => s.level === lvl.id && s.platform === pName,
                            );
                            const isSet = Boolean(data);

                            return (
                              <div key={pName} className="sc-wrap">
                                <button
                                  className="sc-card"
                                  disabled={!hasAccess}
                                  onClick={() =>
                                    hasAccess
                                      ? handleOpenModal(
                                          lvl.id,
                                          pName,
                                          data || null,
                                        )
                                      : alert(
                                          "Anda tidak memiliki akses untuk mengelola tingkatan ini.",
                                        )
                                  }
                                  style={{
                                    borderColor:
                                      cfg?.accentBorder ??
                                      "rgba(255,255,255,0.15)",
                                    boxShadow: isSet
                                      ? `0 4px 20px ${cfg?.glow ?? "rgba(0,0,0,0.15)"}, inset 0 1px 0 rgba(255,255,255,0.08)`
                                      : "0 1px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                                  }}
                                >
                                  {/* Icon + action */}
                                  <div className="sc-top">
                                    <div
                                      className="sc-icon-circle"
                                      style={{
                                        background: cfg?.iconBg ?? "#555",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "#fff",
                                          filter:
                                            "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                                        }}
                                      >
                                        <SocialIcon
                                          platform={pName}
                                          size={17}
                                        />
                                      </span>
                                    </div>
                                    <div className="sc-action">
                                      {!hasAccess ? (
                                        <Lock
                                          size={11}
                                          color="rgba(255,255,255,0.5)"
                                        />
                                      ) : isSet ? (
                                        <Edit3
                                          size={11}
                                          color="rgba(255,255,255,0.7)"
                                        />
                                      ) : (
                                        <Plus
                                          size={11}
                                          color="rgba(255,255,255,0.7)"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Nama platform */}
                                  <span className="sc-name">{pName}</span>

                                  {/* Username / status */}
                                  {isSet ? (
                                    <div className="sc-bottom">
                                      <span className="sc-user">
                                        @{data!.username}
                                      </span>
                                      <span
                                        className="sc-pill"
                                        style={{
                                          background: cfg?.pillBg ?? "#555",
                                        }}
                                      >
                                        Aktif
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="sc-user empty">
                                      Belum diatur
                                    </span>
                                  )}
                                </button>

                                {/* Delete button */}
                                {isSet && hasAccess && (
                                  <button
                                    className="sc-del"
                                    onClick={() =>
                                      handleDelete(
                                        data!.social_media_id,
                                        lvl.id,
                                      )
                                    }
                                    title="Hapus"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Modal ── */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {formData.platform &&
                  (() => {
                    const cfg =
                      PLATFORM_CONFIG[formData.platform.toLowerCase()];
                    return (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: cfg?.iconBg ?? "#555",
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        <SocialIcon platform={formData.platform} size={14} />
                      </span>
                    );
                  })()}
                {formData.social_media_id
                  ? "Edit Media Sosial"
                  : "Tambah Media Sosial"}
              </DialogTitle>
              <DialogDescription>
                Atur tautan <strong>{formData.platform}</strong> untuk jenjang{" "}
                <strong>{formData.level}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="pt-2 flex gap-3">
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
                  className="w-full"
                  disabled={isSubmitting}
                  style={{
                    background:
                      PLATFORM_CONFIG[formData.platform.toLowerCase()]
                        ?.pillBg ?? "#1a1a1a",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    </DashboardLayout>
  );
};

export default Social;
