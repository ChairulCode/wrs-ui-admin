import axios from "axios";
import { toast } from "react-toastify";

const apiInstance = axios.create({
  baseURL: "http://localhost:3000/api/v1/",
  withCredentials: true,
});

apiInstance.interceptors.request.use((config) => {
  const userToken = localStorage.getItem("authToken");

  // HANYA tambahkan header jika token ditemukan
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  } else {
    // Pastikan header Authorization bersih jika tidak ada token
    delete config.headers.Authorization;
  }
  return config;
});

export const handleApiError = (error: any, toastId?: string | number) => {
  const serverMessage =
    error.response?.data?.serverMessage || error.response?.data?.message;
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message;
  console.log("Detail Error Server:", serverMessage);

  const ignoredErrors = [
    { status: 401, message: "Missing Authorization header" },
    { status: 401, message: "Token expired" },
  ];

  const isIgnored = ignoredErrors.some(
    (e) => e.status === status && message.includes(e.message),
  );

  if (!isIgnored && toastId) {
    toast.update(toastId, {
      render: message,
      type: "error",
      position: "top-right",
      autoClose: 1000,
      closeOnClick: true,
      isLoading: false,
      theme: "colored",
    });
  }

  console.error("API Error:", error);
};

const getRequest = async (endpoint: string) => {
  try {
    const res = await apiInstance.get(endpoint);
    // Jika server membungkus data dalam 'data' atau 'requestedData'
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error; // Lempar error agar ditangkap di checkingSession
  }
};

const postRequest = async (endpoint: string, data: any) => {
  const toastInit = toast.loading("Mengirimkan info ke server ...");
  try {
    const res = await apiInstance.post(endpoint, data);

    toast.update(toastInit, {
      render: res.data.message || "Sukses",
      type: "success",
      isLoading: false,
      autoClose: 1000,
      theme: "colored",
    });

    // Mengembalikan properti 'data' saja agar sesuai dengan log console Anda
    return res.data.data;
  } catch (error) {
    handleApiError(error, toastInit);
    throw error;
  }
};

const putRequest = async (endpoint: string, data: any) => {
  const toastInit = toast.loading("Request update info ke server ...");
  try {
    const headers =
      data instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" };

    const res = await apiInstance.put(endpoint, data, { headers });
    toast.update(toastInit, {
      render: res.data.message,
      type: "success",
      isLoading: false,
      autoClose: 1000,
      theme: "colored",
    });
    return res.data;
  } catch (error) {
    handleApiError(error, toastInit);
  }
};

const patchRequest = async (endpoint: string, data: any) => {
  const toastInit = toast.loading("Request update info ke server ...");
  try {
    const headers =
      data instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : { "Content-Type": "application/json" };

    const res = await apiInstance.patch(endpoint, data, { headers });
    toast.update(toastInit, {
      render: res.data.message,
      type: "success",
      isLoading: false,
      autoClose: 1000,
      theme: "colored",
    });
    return res.data;
  } catch (error) {
    handleApiError(error, toastInit);
  }
};

const deleteRequest = async (endpoint: string, data: any = {}) => {
  try {
    const res = await apiInstance.delete(endpoint, { data });
    toast.success(res.data.message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
  }
};

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      toast.error("Server tidak terhubung!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    } else {
      handleApiError(error);
    }
    return Promise.reject(error);
  },
);

export {
  getRequest,
  postRequest,
  patchRequest,
  deleteRequest,
  putRequest,
  apiInstance,
};
