import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, Megaphone, BookOpen } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    achievements: 0,
    activities: 0,
    announcements: 0,
    grades: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, school_level")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      const filter = profile.role === "superadmin" 
        ? {} 
        : { school_level: profile.school_level };

      const [achievements, activities, announcements, grades] = await Promise.all([
        supabase.from("achievements").select("*", { count: "exact", head: true }).match(filter),
        supabase.from("activities").select("*", { count: "exact", head: true }).match(filter),
        supabase.from("announcements").select("*", { count: "exact", head: true }).match(filter),
        supabase.from("subject_grades").select("*", { count: "exact", head: true }).match(filter),
      ]);

      setStats({
        achievements: achievements.count || 0,
        activities: activities.count || 0,
        announcements: announcements.count || 0,
        grades: grades.count || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Prestasi", value: stats.achievements, icon: Trophy, color: "text-primary" },
    { title: "Kegiatan", value: stats.activities, icon: Calendar, color: "text-secondary" },
    { title: "Pengumuman", value: stats.announcements, icon: Megaphone, color: "text-accent" },
    { title: "Data Nilai", value: stats.grades, icon: BookOpen, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang di Admin Dashboard WR Supratman</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">Total data</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Informasi</CardTitle>
            <CardDescription>
              Sistem Manajemen Konten Perguruan WR Supratman Medan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Dashboard ini menyediakan antarmuka untuk mengelola konten website sekolah.</p>
              <p>Gunakan menu di sebelah kiri untuk mengakses berbagai fitur yang tersedia.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
