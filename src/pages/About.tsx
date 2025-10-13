import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface AboutData {
  id: string;
  school_level: string;
  title: string;
  content: string;
  vision: string | null;
  mission: string | null;
}

const About = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [schoolLevel, setSchoolLevel] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    vision: "",
    mission: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_level")
      .eq("id", user.id)
      .single();

    if (profile && profile.school_level) {
      setSchoolLevel(profile.school_level);
      fetchAboutData(profile.school_level);
    }
  };

  const fetchAboutData = async (level: string) => {
    const { data } = await supabase
      .from("about")
      .select("*")
      .eq("school_level", level as any)
      .maybeSingle();

    if (data) {
      setAboutData(data);
      setFormData({
        title: data.title,
        content: data.content,
        vision: data.vision || "",
        mission: data.mission || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (aboutData) {
        const { error } = await supabase
          .from("about")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", aboutData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("about")
          .insert({
            title: formData.title,
            content: formData.content,
            vision: formData.vision,
            mission: formData.mission,
            school_level: schoolLevel as any,
          });

        if (error) throw error;
      }

      toast.success("Data berhasil disimpan!");
      setEditing(false);
      fetchAboutData(schoolLevel);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profil Sekolah</h1>
            <p className="text-muted-foreground">Kelola informasi profil sekolah {schoolLevel.toUpperCase()}</p>
          </div>
          {aboutData && !editing && (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
            <CardDescription>Isi informasi lengkap tentang sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={!editing && aboutData !== null}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Konten</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  disabled={!editing && aboutData !== null}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision">Visi</Label>
                <Textarea
                  id="vision"
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  disabled={!editing && aboutData !== null}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission">Misi</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  disabled={!editing && aboutData !== null}
                  rows={4}
                />
              </div>

              {(editing || !aboutData) && (
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                  {editing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        if (aboutData) {
                          setFormData({
                            title: aboutData.title,
                            content: aboutData.content,
                            vision: aboutData.vision || "",
                            mission: aboutData.mission || "",
                          });
                        }
                      }}
                    >
                      Batal
                    </Button>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default About;
