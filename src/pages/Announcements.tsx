import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_date: string;
  is_important: boolean;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schoolLevel, setSchoolLevel] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    announcement_date: "",
    is_important: false,
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

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .order("role", { ascending: false })
      .limit(1)
      .single();

    if (profile && roleData) {
      setSchoolLevel(profile.school_level || "");
      fetchAnnouncements(roleData.role, profile.school_level);
    }
  };

  const fetchAnnouncements = async (role: string, level: string | null) => {
    const query = supabase.from("announcements").select("*").order("announcement_date", { ascending: false });
    
    if (role === "admin" && level) {
      query.eq("school_level", level as any);
    }

    const { data } = await query;
    if (data) setAnnouncements(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Pengumuman berhasil diupdate!");
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert({
            ...formData,
            school_level: schoolLevel as any,
          });

        if (error) throw error;
        toast.success("Pengumuman berhasil ditambahkan!");
      }

      setOpen(false);
      resetForm();
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Pengumuman berhasil dihapus!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      announcement_date: "",
      is_important: false,
    });
    setEditingId(null);
  };

  const openEditDialog = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      announcement_date: announcement.announcement_date,
      is_important: announcement.is_important,
    });
    setEditingId(announcement.id);
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pengumuman</h1>
            <p className="text-muted-foreground">Kelola data pengumuman sekolah</p>
          </div>
          <Dialog open={open} onOpenChange={(value) => {
            setOpen(value);
            if (!value) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Pengumuman" : "Tambah Pengumuman"}</DialogTitle>
                <DialogDescription>Isi informasi pengumuman dengan lengkap</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Pengumuman</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Konten</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcement_date">Tanggal</Label>
                  <Input
                    id="announcement_date"
                    type="date"
                    value={formData.announcement_date}
                    onChange={(e) => setFormData({ ...formData, announcement_date: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_important"
                    checked={formData.is_important}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_important: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_important" className="cursor-pointer">
                    Tandai sebagai pengumuman penting
                  </Label>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar Pengumuman</CardTitle>
            <CardDescription>Total {announcements.length} pengumuman</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Konten</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>{new Date(announcement.announcement_date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      {announcement.is_important && (
                        <Badge variant="destructive">Penting</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md truncate">{announcement.content}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(announcement)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {announcements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada data pengumuman
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

export default Announcements;
