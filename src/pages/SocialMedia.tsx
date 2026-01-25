import { useEffect, useState } from "react";
import {
  Facebook,
  Instagram,
  Youtube,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Music,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/lib/api";

/* ================= TYPES ================= */

const REQUIRED_PLATFORMS = [
  "Facebook",
  "Instagram",
  "Youtube",
  "Tiktok",
] as const;

type Platform = (typeof REQUIRED_PLATFORMS)[number];
type SchoolLevel = "PGTK" | "SD" | "SMP" | "SMA";

interface SocialMedia {
  social_media_id: string;
  platform: Platform;
  username: string;
  url: string;
  level: SchoolLevel;
}

/* ================= COMPONENT ================= */

const SocialMediaDashboard = () => {
  const [activeLevel, setActiveLevel] = useState<SchoolLevel>("PGTK");
  const [socialMedias, setSocialMedias] = useState<SocialMedia[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    platform: "" as Platform | "",
    username: "",
    url: "",
  });

  /* ================= FETCH ================= */

  const fetchSocialMedias = async () => {
    try {
      setLoading(true);
      const res = await api.get("/social-media");
      setSocialMedias(res.data.data);
    } catch (error) {
      console.error("Failed to fetch social media:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialMedias();
  }, []);

  /* ================= FILTER ================= */

  const levelSocialMedias = Array.isArray(socialMedias)
    ? socialMedias.filter((sm) => sm.level === activeLevel)
    : [];

  const usedPlatforms = levelSocialMedias.map((sm) => sm.platform);

  const availablePlatforms = REQUIRED_PLATFORMS.filter(
    (p) => editingId || !usedPlatforms.includes(p),
  );

  /* ================= ICONS ================= */

  const platformIcons = {
    Facebook: <Facebook className="h-5 w-5" />,
    Instagram: <Instagram className="h-5 w-5" />,
    Youtube: <Youtube className="h-5 w-5" />,
    Tiktok: <Music className="h-5 w-5" />,
  };

  const platformColors = {
    Facebook: "bg-blue-500",
    Instagram: "bg-pink-500",
    Youtube: "bg-red-500",
    Tiktok: "bg-black",
  };

  /* ================= HANDLERS ================= */

  const handleSubmit = async () => {
    if (!formData.platform) return;

    try {
      if (editingId) {
        await api.put(`/social-media/${editingId}`, {
          ...formData,
        });
      } else {
        await api.post("/social-media", {
          ...formData,
          level: activeLevel,
        });
      }

      setFormData({ platform: "", username: "", url: "" });
      setEditingId(null);
      setIsOpen(false);
      fetchSocialMedias();
    } catch (error) {
      console.error("Failed to save social media:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    }
  };

  const handleEdit = (sm: SocialMedia) => {
    setEditingId(sm.social_media_id);
    setFormData({
      platform: sm.platform,
      username: sm.username,
      url: sm.url,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus social media ini?")) return;

    try {
      await api.delete(`/social-media/${id}`);
      fetchSocialMedias();
    } catch (error) {
      console.error("Failed to delete social media:", error);
      alert("Gagal menghapus data. Silakan coba lagi.");
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ platform: "", username: "", url: "" });
    setIsOpen(true);
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Media Sosial Sekolah</h1>
            <p className="text-muted-foreground">
              Kelola link media sosial website untuk setiap jenjang
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {["PGTK", "SD", "SMP", "SMA"].map((lvl) => (
            <Button
              key={lvl}
              size="sm"
              variant={activeLevel === lvl ? "default" : "outline"}
              onClick={() => setActiveLevel(lvl as SchoolLevel)}
            >
              {lvl === "PGTK" ? "PG/TK" : lvl}
            </Button>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levelSocialMedias.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Belum ada social media untuk jenjang{" "}
                {activeLevel === "PGTK" ? "PG/TK" : activeLevel}
              </div>
            ) : (
              levelSocialMedias.map((sm) => (
                <Card key={sm.social_media_id}>
                  <CardHeader
                    className={`${platformColors[sm.platform]} text-white`}
                  >
                    <div className="flex gap-3 items-center">
                      {platformIcons[sm.platform]}
                      <div>
                        <CardTitle>{sm.platform}</CardTitle>
                        <CardDescription className="text-white/80">
                          {sm.username}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex gap-2 pt-4">
                    <a
                      href={sm.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Kunjungi
                      </Button>
                    </a>
                    <Button variant="outline" onClick={() => handleEdit(sm)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleDelete(sm.social_media_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Tambah"} Social Media -{" "}
              {activeLevel === "PGTK" ? "PG/TK" : activeLevel}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(v) =>
                  setFormData({ ...formData, platform: v as Platform })
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlatforms.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="@username"
              />
            </div>

            <div>
              <Label>URL</Label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SocialMediaDashboard;
