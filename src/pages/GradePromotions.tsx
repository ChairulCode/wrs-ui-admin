import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface GradePromotion {
  id: string;
  academic_year: string;
  student_name: string;
  current_grade: string;
  promoted_grade: string;
  status: string;
  notes: string | null;
}

const GradePromotions = () => {
  const [promotions, setPromotions] = useState<GradePromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schoolLevel, setSchoolLevel] = useState<string>("");
  const [formData, setFormData] = useState({
    academic_year: "",
    student_name: "",
    current_grade: "",
    promoted_grade: "",
    status: "promoted",
    notes: "",
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
      fetchPromotions(roleData.role, profile.school_level);
    }
  };

  const fetchPromotions = async (role: string, level: string | null) => {
    const query = supabase.from("grade_promotions").select("*").order("academic_year", { ascending: false });
    
    if (role === "admin" && level) {
      query.eq("school_level", level as any);
    }

    const { data } = await query;
    if (data) setPromotions(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("grade_promotions")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Data berhasil diupdate!");
      } else {
        const { error } = await supabase
          .from("grade_promotions")
          .insert({
            ...formData,
            school_level: schoolLevel as any,
          });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan!");
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
        .from("grade_promotions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Data berhasil dihapus!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const resetForm = () => {
    setFormData({
      academic_year: "",
      student_name: "",
      current_grade: "",
      promoted_grade: "",
      status: "promoted",
      notes: "",
    });
    setEditingId(null);
  };

  const openEditDialog = (promotion: GradePromotion) => {
    setFormData({
      academic_year: promotion.academic_year,
      student_name: promotion.student_name,
      current_grade: promotion.current_grade,
      promoted_grade: promotion.promoted_grade,
      status: promotion.status,
      notes: promotion.notes || "",
    });
    setEditingId(promotion.id);
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kenaikan Kelas</h1>
            <p className="text-muted-foreground">Kelola data kenaikan kelas siswa</p>
          </div>
          <Dialog open={open} onOpenChange={(value) => {
            setOpen(value);
            if (!value) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Data" : "Tambah Data Kenaikan Kelas"}</DialogTitle>
                <DialogDescription>Isi data kenaikan kelas siswa</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Tahun Ajaran</Label>
                  <Input
                    id="academic_year"
                    placeholder="2024/2025"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student_name">Nama Siswa</Label>
                  <Input
                    id="student_name"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_grade">Kelas Sekarang</Label>
                    <Input
                      id="current_grade"
                      placeholder="Kelas 1"
                      value={formData.current_grade}
                      onChange={(e) => setFormData({ ...formData, current_grade: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="promoted_grade">Kelas Tujuan</Label>
                    <Input
                      id="promoted_grade"
                      placeholder="Kelas 2"
                      value={formData.promoted_grade}
                      onChange={(e) => setFormData({ ...formData, promoted_grade: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
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
            <CardTitle>Daftar Kenaikan Kelas</CardTitle>
            <CardDescription>Total {promotions.length} data</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Kelas Asal</TableHead>
                  <TableHead>Kelas Tujuan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell className="font-medium">{promotion.academic_year}</TableCell>
                    <TableCell>{promotion.student_name}</TableCell>
                    <TableCell>{promotion.current_grade}</TableCell>
                    <TableCell>{promotion.promoted_grade}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(promotion)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(promotion.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {promotions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada data kenaikan kelas
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

export default GradePromotions;
