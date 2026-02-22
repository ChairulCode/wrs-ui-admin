import { createContext, useContext, useState, useEffect } from "react";
import { getRequest, postRequest } from "./api-call";
import moment from "moment";
import { ToastContainer, toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

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
  checkingSession: () => Promise<void>;

  userLoginInfo: UserInfo | null;
  isUserLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;

  setIsUserLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setuserLoginInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  setisAdmin: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setwebContents: React.Dispatch<React.SetStateAction<KontenWeb[]>>;
}

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
  const [userLoginInfo, setuserLoginInfo] = useState<UserInfo | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdmin, setisAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (formData: LoginForm) => {
    try {
      const response = await postRequest(`/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      // DEBUG untuk memastikan data masuk
      console.log("Data yang diterima context:", response);

      // Perbaikan Path: Langsung ke response.token karena response sudah merupakan isi dari res.data
      if (response && response.token && response.token.apiKey) {
        const token = response.token.apiKey;

        // SIMPAN KE LOCAL STORAGE
        localStorage.setItem("authToken", token);
        console.log("Token berhasil disimpan ke LocalStorage");

        // Update State menggunakan data userInfo dari response
        setuserLoginInfo(response.userInfo);
        setIsUserLoggedIn(true);

        // Cek Admin berdasarkan nama role
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

      // Request status auth
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

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      checkingSession();
    } else {
      setIsLoading(false); // Langsung matikan loading jika tidak ada token
    }
  }, []);

  const contextValue: AppContextType = {
    login,
    logout,
    checkingSession,

    userLoginInfo,
    isUserLoggedIn,
    isAdmin,
    isLoading,

    setIsUserLoggedIn,
    setuserLoginInfo,
    setisAdmin,
    setIsLoading,
  };

  return (
    <Context_for_App.Provider
      value={contextValue} // Menggunakan objek yang sudah divalidasi tipenya
    >
      {children}
      <ToastContainer />
    </Context_for_App.Provider>
  );
};
