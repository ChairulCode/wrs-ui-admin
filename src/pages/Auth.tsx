import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { useAppContext } from "@/utils/app-context";
import { apiInstance } from "@/utils/api-call";

const Auth = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();

  // Perbaikan: Ambil searchParams di level atas komponen
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "forgot" | "reset">(
    "login",
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    newPassword: "",
    token: "",
  });

  // Effect untuk mendeteksi token dari link email secara otomatis
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    console.log("Token dari URL:", tokenFromUrl); // tambah ini
    if (tokenFromUrl) {
      setAuthMode("reset");
      setFormData((prev) => ({ ...prev, token: tokenFromUrl }));
      toast.info("Token terdeteksi, silakan masukkan password baru Anda.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result) {
        toast.success("Login Berhasil");
        // Gunakan window.location.replace agar state aplikasi benar-benar bersih (fresh load)
        window.location.replace("/dashboard");
      } else {
        toast.error("Email atau Password salah");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiInstance.post("auth/forgot-password", {
        email: formData.email,
      });

      if (response) {
        toast.success("Link reset password telah dikirim ke email");
        // User diarahkan menunggu input token jika mereka tidak menutup halaman ini
        setAuthMode("reset");
      }
    } catch (error: any) {
      console.error("Forgot Password Error:", error.response);
      toast.error(error.response?.data?.message || "Email tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  // DI FILE Auth.tsx (Frontend Admin)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ini sudah benar, mengirim token di URL
      await apiInstance.post(`auth/reset-password?token=${formData.token}`, {
        password: formData.newPassword,
      });

      toast.success("Password berhasil diperbarui, silakan login.");
      setAuthMode("login");
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Token tidak valid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20">
        <CardHeader className="space-y-4 text-center pb-8 pt-10">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-md opacity-40" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg">
                <GraduationCap className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">
              {authMode === "login" && "Login Admin"}
              {authMode === "forgot" && "Lupa Password"}
              {authMode === "reset" && "Reset Password"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {authMode === "login" && "Dashboard WR Supratman"}
              {authMode === "forgot" &&
                "Masukkan email untuk menerima token reset"}
              {authMode === "reset" &&
                "Masukkan token dari email dan password baru Anda"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {/* FORM LOGIN */}
          {authMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative"> 
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="masukkan email"
                    className="pl-10 h-12"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot")}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="masukkan password"
                    className="pl-10 pr-12 h-12"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Memproses..." : "Login"}
              </Button>
            </form>
          )}

          {/* FORM LUPA PASSWORD */}
          {authMode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Terdaftar</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="email@students.mikroskil.ac.id"
                    className="pl-10 h-12"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Login
              </button>
            </form>
          )}

          {/* FORM RESET PASSWORD */}
          {authMode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token">Token Verifikasi</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="token"
                    placeholder="Masukkan token dari email"
                    className={`pl-10 h-12 ${searchParams.get("token") ? "bg-muted cursor-not-allowed" : ""}`}
                    value={formData.token}
                    onChange={(e) =>
                      setFormData({ ...formData, token: e.target.value })
                    }
                    readOnly={!!searchParams.get("token")} // Kunci input jika token dari URL
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Min. 8 karakter"
                    className="pl-10 h-12"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Menyimpan..." : "Update Password"}
              </Button>
              {!searchParams.get("token") && (
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Batal
                </button>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
