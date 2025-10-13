import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Achievements from "./pages/Achievements";
import Activities from "./pages/Activities";
import Announcements from "./pages/Announcements";
import GradePromotions from "./pages/GradePromotions";
import SubjectGrades from "./pages/SubjectGrades";
import Carousels from "./pages/Carousels";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/about" element={<About />} />
          <Route path="/dashboard/achievements" element={<Achievements />} />
          <Route path="/dashboard/activities" element={<Activities />} />
          <Route path="/dashboard/announcements" element={<Announcements />} />
          <Route path="/dashboard/grade-promotions" element={<GradePromotions />} />
          <Route path="/dashboard/subject-grades" element={<SubjectGrades />} />
          <Route path="/dashboard/carousels" element={<Carousels />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
