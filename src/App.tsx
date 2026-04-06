import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About/about"; // Pastikan path file ini sudah benar sesuai struktur folder Anda
import Achievements from "./pages/Achievements/Achievements";
import Activities from "./pages/Activities/Activities";
import Announcements from "./pages/Announcements/Announcements";
import GradePromotions from "./pages/graduationannouncement";
import Pendaftaran from "./pages/Pendaftaran";

import SubjectGrades from "./pages/SubjectGrades";
import Carousels from "./pages/Carousels";
import NotFound from "./pages/NotFound";
import RoleManagementPage from "./pages/Roles";
import UserManagementPage from "./pages/User";
import KegiatanDetailPage from "./pages/Activities/AcitivitiesDetail";
import { ToastProvider } from "./components/ui/toast";
import Students from "./pages/Students/page";
import DashboardMataPelajaran from "./pages/kelola-mapel";
import Ekstrakurikuler from "./pages/Ekstrakurikuler/Ekstrakurikuler";
import Fasilitas from "./pages/Facilities/index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastProvider />
      <BrowserRouter>
        <Routes>
          {/* ── REDIRECT UTAMA ── */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* ── AUTHENTICATION ── */}
          <Route path="/auth/*" element={<Auth />} />

          {/* ── DASHBOARD ROUTES ── */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* FIX: Mengubah /dashboard/sosial menjadi /dashboard/about 
              dan menambahkan route dengan parameter :level agar useParams() di AboutPage bekerja
          */}
          <Route path="/dashboard/about" element={<About />} />
          <Route path="/dashboard/about/:level" element={<About />} />

          {/* Rute lama sosial (opsional, jika masih ingin bisa diakses lewat /sosial) */}
          <Route path="/dashboard/sosial" element={<About />} />

          {/* ── MANAJEMEN KONTEN ── */}
          <Route path="/dashboard/achievements" element={<Achievements />} />
          <Route path="/dashboard/students" element={<Students />} />
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
          <Route path="/dashboard/pendaftaran" element={<Pendaftaran />} />
          <Route
            path="/dashboard/mata-pelajaran"
            element={<DashboardMataPelajaran />}
          />
          <Route path="/dashboard/fasilitas" element={<Fasilitas />} />
          <Route
            path="/dashboard/ekstrakurikuler"
            element={<Ekstrakurikuler />}
          />

          {/* ── SYSTEM & USERS ── */}
          <Route path="/dashboard/users" element={<UserManagementPage />} />
          <Route path="/dashboard/roles" element={<RoleManagementPage />} />

          {/* ── 404 NOT FOUND ── */}
          {/* Pastikan rute wildcard "*" berada paling bawah di dalam daftar Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
