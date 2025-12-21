import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Trophy, Calendar, Megaphone, TrendingUp, BookOpen, Image, LogOut, GraduationCap, UserCog, UserPen } from "lucide-react";
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

const DashboardSidebar = ({ profile }: { profile: UserInfo | null }) => {
	const { open } = useSidebar();
	const navigate = useNavigate();
	const pathname = useLocation().pathname;
	const { isUserLoggedIn, logout } = useAppContext();
	const menuItems = [
		{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: [ "Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Profil Sekolah", url: "/dashboard/about", icon: FileText, roles: [ "Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Prestasi", url: "/dashboard/achievements", icon: Trophy, roles: [ "Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Kegiatan", url: "/dashboard/activities", icon: Calendar, roles: [ "Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Pengumuman", url: "/dashboard/announcements", icon: Megaphone, roles: [ "Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Kenaikan Kelas", url: "/dashboard/grade-promotions", icon: TrendingUp, roles: [ "Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Nilai Mapel", url: "/dashboard/subject-grades", icon: BookOpen, roles: [ "Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Carousel", url: "/dashboard/carousels", icon: Image, roles: ["Super Administrator",'Kepala Sekolah PG-TK','Kepala Sekolah SD','Kepala Sekolah SMP','Kepala Sekolah SMA'] },
		{ title: "Users", url: "/dashboard/users", icon: UserPen, roles: ["Super Administrator"] },
		{ title: "Roles", url: "/dashboard/roles", icon: UserCog, roles: ["Super Administrator"] },
	];

	const filteredMenuItems = menuItems.filter((item) => profile && item.roles.includes(profile.userInfo.role));

	if (!isUserLoggedIn) {
		navigate("/auth");
	}

	return (
		<Sidebar collapsible='icon' className='border-r border-border'>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className='flex items-center gap-2 text-lg font-semibold py-4'>
						<GraduationCap className='h-5 w-5' />
						{open && <span>WR Supratman</span>}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{filteredMenuItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<NavLink to={item.url} className={`${pathname === item.url ? "bg-primary text-muted" : ""}`}>
											<item.icon className={`h-4 w-4 ${pathname === item.url ? "text-muted" : ""}`} />
											<span>{item.title}</span>
										</NavLink>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
							<SidebarMenuItem>
								<SidebarMenuButton onClick={logout}>
									<LogOut className='h-4 w-4' />
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
	const { checkingSession, userLoginInfo } = useAppContext();
	const navigate = useNavigate();

	useEffect(() => {
		checkingSession();
	}, [navigate]);

	if (!userLoginInfo) {
		return <div className='flex items-center justify-center min-h-screen'>Loading...</div>;
	}

	return (
		<SidebarProvider>
			<div className='flex min-h-screen w-full'>
				<DashboardSidebar profile={userLoginInfo} />

				<div className='flex-1 flex flex-col w-full'>
					<header className='sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6'>
						<SidebarTrigger />
						<div className='flex-1'>
							<h2 className='text-lg font-semibold'>{userLoginInfo.userInfo.role === "Super Administrator" ? "Superadmin" : `Admin `}</h2>
							<p className='text-sm text-muted-foreground'>{userLoginInfo.userInfo.username}</p>
						</div>
					</header>
					<main className='flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-muted/30 to-background'>{children}</main>
				</div>
			</div>
		</SidebarProvider>
	);
};

export default DashboardLayout;
