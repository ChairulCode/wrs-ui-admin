import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  FileText,
  Trophy,
  Calendar,
  Megaphone,
  TrendingUp,
  BookOpen,
  Image,
  LogOut,
  GraduationCap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";

interface Profile {
  role: "viewer" | "admin" | "superadmin";
  school_level?: "tk" | "sd" | "smp" | "sma";
  full_name: string;
}

const DashboardSidebar = ({ profile }: { profile: Profile | null }) => {
  const { open } = useSidebar();
  const navigate = useNavigate();

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "superadmin"] },
    { title: "Profil Sekolah", url: "/dashboard/about", icon: FileText, roles: ["admin", "superadmin"] },
    { title: "Prestasi", url: "/dashboard/achievements", icon: Trophy, roles: ["admin", "superadmin"] },
    { title: "Kegiatan", url: "/dashboard/activities", icon: Calendar, roles: ["admin", "superadmin"] },
    { title: "Pengumuman", url: "/dashboard/announcements", icon: Megaphone, roles: ["admin", "superadmin"] },
    { title: "Kenaikan Kelas", url: "/dashboard/grade-promotions", icon: TrendingUp, roles: ["admin", "superadmin"] },
    { title: "Nilai Mapel", url: "/dashboard/subject-grades", icon: BookOpen, roles: ["admin", "superadmin"] },
    { title: "Carousel", url: "/dashboard/carousels", icon: Image, roles: ["superadmin"] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil logout");
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-lg font-semibold py-4">
            <GraduationCap className="h-5 w-5" />
            {open && <span>WR Supratman</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive ? "bg-primary/10 text-primary font-medium" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("school_level, full_name")
        .eq("id", session.user.id)
        .single();

      // Fetch user role from user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .order("role", { ascending: false })
        .limit(1)
        .single();

      if (profileData && roleData) {
        setProfile({
          ...profileData,
          role: roleData.role as "viewer" | "admin" | "superadmin"
        } as Profile);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar profile={profile} />
        <div className="flex-1 flex flex-col w-full">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {profile.role === "superadmin" ? "Superadmin" : `Admin ${profile.school_level?.toUpperCase()}`}
              </h2>
              <p className="text-sm text-muted-foreground">{profile.full_name}</p>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-muted/30 to-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
