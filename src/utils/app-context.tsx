import { createContext, useContext, useState, useEffect } from "react";
import { getRequest, postRequest } from "./api-call";
import moment from "moment";
import { ToastContainer, toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

moment.locale("id");

interface JwtUserPayload {
  user_id: string;
  email: string;
  role_id: number;
  iat: number;
  exp: number;
}

interface KontenWeb {
  konten_id: string;
  konten_key: string;
  konten_value: string;
}

interface LoginForm {
  email: string;
  password: string;
}

export interface UserInfo {
  userInfo: {
    allowedJenjangIds: any;
    jenjang_id: any;
    user_id: string;
    username: string;
    email: string;
    role: string;
  };
  iat: number;
  exp: number;
}

interface AppContextType {
  getWebContentValue: (key: string, defaultValue?: string) => string;
  login: (formData: {
    email: string;
    password: string;
  }) => Promise<UserInfo | null>;
  logout: () => Promise<void>;
  checkingSession: () => Promise<boolean>;

  userLoginInfo: UserInfo | null;
  isUserLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  // userPermissions tetap ada di context untuk nanti kalau backend sudah siap
  userPermissions: string[];

  setUserPermissions: React.Dispatch<React.SetStateAction<string[]>>;
  setIsUserLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setuserLoginInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  setisAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setwebContents: React.Dispatch<React.SetStateAction<KontenWeb[]>>;
}

// Context & hook di luar component — ini benar
const Context_for_App = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(Context_for_App);
  if (context === null) {
    throw new Error(
      "useAppContext harus digunakan di dalam AppContextProvider",
    );
  }
  return context;
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // ✅ Semua useState wajib di dalam component
  const [userLoginInfo, setuserLoginInfo] = useState<UserInfo | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdmin, setisAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [webContents, setwebContents] = useState<KontenWeb[]>([]);

  // ✅ loadUserPermissions di dalam component
  //    Sekarang tidak crash kalau endpoint belum ada — fallback ke []
  const loadUserPermissions = async () => {
    try {
      const res = await getRequest("/users/permissions/my-permissions");
      const permNames = (res?.data ?? []).map(
        (p: any) => p.nama_permission ?? p,
      );
      setUserPermissions(permNames);
    } catch {
      // Endpoint belum ada di backend — tidak masalah, pakai array kosong
      // use-permission.ts sudah handle fallback ini
      setUserPermissions([]);
    }
  };

  const login = async (formData: LoginForm) => {
    try {
      const response = await postRequest(`/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      console.log("Data yang diterima context:", response);

      if (response && response.token && response.token.apiKey) {
        const token = response.token.apiKey;

        localStorage.setItem("authToken", token);
        console.log("Token berhasil disimpan ke LocalStorage");

        setuserLoginInfo(response.userInfo);
        setIsUserLoggedIn(true);

        // Coba load permissions, tidak masalah kalau gagal (endpoint belum ada)
        await loadUserPermissions();

        const roleName = response.userInfo.role;
        setisAdmin(
          [
            "Super Administrator",
            "Kepala Sekolah PG-TK",
            "Kepala Sekolah SD",
            "Kepala Sekolah SMP",
            "Kepala Sekolah SMA",
          ].includes(roleName),
        );

        return response;
      } else {
        console.error(
          "Struktur token tidak ditemukan. Cek isi 'response' di atas.",
        );
        return null;
      }
    } catch (error) {
      console.error("Login Error:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("authToken");
      setIsUserLoggedIn(false);
      setisAdmin(false);
      setUserPermissions([]);
      toast.success("Berhasil logout", { theme: "colored" });
      window.location.href = "/auth";
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const checkingSession = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsUserLoggedIn(false);
        setIsLoading(false);
        return false;
      }

      const authRes = await getRequest("/auth/auth-status");

      if (authRes) {
        const { exp } = jwtDecode<JwtUserPayload>(token);
        const now = Math.floor(Date.now() / 1000);

        if (exp < now) {
          logout();
          return false;
        }

        setuserLoginInfo(authRes.data);
        setIsUserLoggedIn(true);

        // Coba load permissions, tidak masalah kalau gagal
        await loadUserPermissions();

        return true;
      }
      return false;
    } catch (error) {
      console.error("Session check failed", error);
      setIsUserLoggedIn(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getWebContentValue = (key: string, defaultValue = "") => {
    const found = webContents.find((k) => k.konten_key === key);
    return found?.konten_value ?? defaultValue;
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      checkingSession();
    } else {
      setIsLoading(false);
    }
  }, []);

  const contextValue: AppContextType = {
    login,
    logout,
    checkingSession,
    getWebContentValue,

    userPermissions,
    userLoginInfo,
    isUserLoggedIn,
    isAdmin,
    isLoading,

    setUserPermissions,
    setIsUserLoggedIn,
    setuserLoginInfo,
    setisAdmin,
    setIsLoading,
    setwebContents,
  };

  return (
    <Context_for_App.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </Context_for_App.Provider>
  );
};
