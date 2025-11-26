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
	fetchWebContenData: () => Promise<void>;
	getWebContentValue: (key: string, defaultValue?: string) => string;
	login: (formData: { email: string; password: string }) => Promise<UserInfo | null>;
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
		throw new Error("useAppContext harus digunakan di dalam AppContextProvider");
	}

	return context;
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [userLoginInfo, setuserLoginInfo] = useState<UserInfo | null>(null);
	const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
	const [isAdmin, setisAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [webContents, setwebContents] = useState<KontenWeb[] | []>([]);

	const fetchWebContenData = async () => {
		const resData = await getRequest("/konten-web");
		console.log("konten:", resData);

		setwebContents(resData);
	};

	const getWebContentValue = (key: string, defaultValue = "fetching from server...") => {
		return webContents.find((item) => item.konten_key === key)?.konten_value || defaultValue;
	};

	const login = async (formData: LoginForm) => {
		try {
			const userRes = await postRequest(`/auth/login`, {
				email: formData.email,
				password: formData.password,
			});

			if (!userRes) {
				throw new Error("Email atau password salah.");
			}

			localStorage.setItem("authToken", userRes.data.token.apiKey);
			const userInfo = userRes;
			setuserLoginInfo({ ...userInfo.data.userInfo, loggedIn: userInfo.loggedIn });
			setIsUserLoggedIn(true);
			setisAdmin(["Super Administrator", "Administrator"].includes(userInfo.data.role));
			await checkingSession();
			console.log(userLoginInfo);

			return userLoginInfo;
		} catch (error) {
			console.error("Login failed", error);
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
			const authRes = await getRequest("/auth/auth-status");
			const token = localStorage.getItem("authToken");

			if (!token) {
				throw new Error("No token found");
			}
			const { exp } = jwtDecode<JwtUserPayload>(token);
			console.log("expiry date", moment(exp * 1000).fromNow());
			const now = Math.floor(Date.now() / 1000);

			if (exp < now) {
				console.warn("Token has expired!");
				logout();
				return false;
			}
			setuserLoginInfo({ ...authRes.data, loggedIn: authRes.loggedIn });
			setIsUserLoggedIn(authRes.loggedIn ? true : false);
		} catch (error) {
			console.error("Session check failed", error);
			setIsUserLoggedIn(false);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		console.log("checking Session");
		checkingSession();
	}, []);

	const contextValue: AppContextType = {
		fetchWebContenData,
		getWebContentValue,
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
		setwebContents,
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
