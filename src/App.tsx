import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
<<<<<<< HEAD
import About from "./pages/Social";
import Achievements from "./pages/Achievements/Achievements";
import Activities from "./pages/Activities/Activities";
import Announcements from "./pages/Announcements/Announcements";
import GradePromotions from "./pages/graduationannouncement";
=======
import About from "./pages/About";
import Achievements from "./pages/Achievements/Achievements";
import Activities from "./pages/Activities/Activities";
import Announcements from "./pages/Announcements/Announcements";
import GradePromotions from "./pages/GradePromotions";
>>>>>>> e7d98b4189bc814cc708844ee82c37cc9087fce8
import SubjectGrades from "./pages/SubjectGrades";
import Carousels from "./pages/Carousels";
import NotFound from "./pages/NotFound";
import PrestasiDetail from "./pages/Achievements/AchievementDetail";
import RoleManagementPage from "./pages/Roles";
import UserManagementPage from "./pages/User";
import KegiatanDetailPage from "./pages/Activities/AcitivitiesDetail";
import { ToastProvider } from "./components/ui/toast";

const queryClient = new QueryClient();

const App = () => (
<<<<<<< HEAD
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastProvider />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/sosial" element={<About />} />
          <Route path="/dashboard/achievements" element={<Achievements />} />
          <Route
            path="/dashboard/achievements/:prestasi_id"
            element={<PrestasiDetail />}
          />
          <Route path="/dashboard/activities" element={<Activities />} />
          <Route
            path="/dashboard/activities/:kegiatan_id"
            element={<KegiatanDetailPage />}
          />
          <Route path="/dashboard/announcements" element={<Announcements />} />
          <Route
            path="/dashboard/kenaikan-kelas"
            element={<GradePromotions />}
          />
          <Route path="/dashboard/subject-grades" element={<SubjectGrades />} />
          <Route path="/dashboard/carousels" element={<Carousels />} />
          <Route path="/dashboard/users" element={<UserManagementPage />} />
          <Route path="/dashboard/roles" element={<RoleManagementPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
=======
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<ToastProvider />
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<Navigate to='/auth' replace />} />
					<Route path='/auth' element={<Auth />} />
					<Route path='/dashboard' element={<Dashboard />} />
					<Route path='/dashboard/about' element={<About />} />
					<Route path='/dashboard/achievements' element={<Achievements />} />
					<Route path='/dashboard/achievements/:prestasi_id' element={<PrestasiDetail />} />
					<Route path='/dashboard/activities' element={<Activities />} />
					<Route path='/dashboard/activities/:kegiatan_id' element={<KegiatanDetailPage />} />
					<Route path='/dashboard/announcements' element={<Announcements />} />
					<Route path='/dashboard/grade-promotions' element={<GradePromotions />} />
					<Route path='/dashboard/subject-grades' element={<SubjectGrades />} />
					<Route path='/dashboard/carousels' element={<Carousels />} />
					<Route path='/dashboard/users' element={<UserManagementPage />} />
					<Route path='/dashboard/roles' element={<RoleManagementPage />} />
					{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
					<Route path='*' element={<NotFound />} />
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
>>>>>>> e7d98b4189bc814cc708844ee82c37cc9087fce8
);

export default App;
