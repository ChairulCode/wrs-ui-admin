import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  UserCog,
  UserPen,
  UserPlus,
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
import { useAppContext, UserInfo } from "@/utils/app-context";
import { toast } from "react-toastify";
import { getRequest } from "@/utils/api-call";

const getUserPermission = async (id) => {
  const res = await getRequest(`/users/${id}`);
  console.log("res", res);
  return res.data;
};

const DashboardSidebar = ({ profile }: { profile: UserInfo | null }) => {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { isUserLoggedIn, logout } = useAppContext();
  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Kelola Pendaftaran",
      url: "/dashboard/pendaftaran",
      icon: UserPlus,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Kelola Sosial Media",
      url: "/dashboard/sosial",
      icon: FileText,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Kelola Prestasi",
      url: "/dashboard/achievements",
      icon: Trophy,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "kelola Kegiatan",
      url: "/dashboard/activities",
      icon: Calendar,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Kelola Pengumuman",
      url: "/dashboard/announcements",
      icon: Megaphone,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Pengumuman kelulusan",
      url: "/dashboard/kenaikan-kelas",
      icon: TrendingUp,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Nilai Mapel",
      url: "/dashboard/subject-grades",
      icon: BookOpen,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Kelola Carousel",
      url: "/dashboard/carousels",
      icon: Image,
      roles: [
        "Super Administrator",
        "Admin",
        "Kepala Sekolah PG-TK",
        "Kepala Sekolah SD",
        "Kepala Sekolah SMP",
        "Kepala Sekolah SMA",
      ],
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: UserPen,
      roles: ["Super Administrator", "Admin"],
    },
    {
      title: "Roles",
      url: "/dashboard/roles",
      icon: UserCog,
      roles: ["Super Administrator", "Admin"],
    },
  ];

  const userPermission = getUserPermission(profile.userInfo.user_id);

  const filteredMenuItems = menuItems.filter(
    (item) => profile && item.roles.includes(profile.userInfo.role),
  );
  console.log(profile.userInfo.role);

  if (!isUserLoggedIn) {
    navigate("/auth");
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border shadow-sm">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-3 text-xl font-bold py-6 px-4">
            <div className="p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            {open && <span>WR Supratman</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="gap-1.5">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="h-11 rounded-lg transition-all duration-200 hover:shadow-sm"
                  >
                    <NavLink
                      to={item.url}
                      className={`${
                        pathname === item.url
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-base">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem className="mt-4">
                <SidebarMenuButton
                  onClick={logout}
                  className="h-11 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-base">Logout</span>
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
  const { checkingSession, userLoginInfo, isLoading } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    checkingSession();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userLoginInfo) {
    toast.error("Anda bukan admin", {
      autoClose: 500,
    });
    navigate("/auth");
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar profile={userLoginInfo} />

        <div className="flex-1 flex flex-col w-full">
          <header className="sticky top-0 z-10 flex h-20 items-center gap-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 shadow-sm">
            <SidebarTrigger className="h-10 w-10" />
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {userLoginInfo.userInfo.role === "Super Administrator"
                  ? "Superadmin"
                  : `Admin`}
              </h2>
              <p className="text-base text-muted-foreground mt-0.5">
                {userLoginInfo.userInfo.username}
              </p>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-background via-muted/30 to-background">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
