import { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Trash,
  PlusCircle,
  Pencil,
  Search,
  Loader2,
  Lock,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { useAppContext } from "@/utils/app-context";

const API_BASE_URL = "http://localhost:3000/api/v1";

interface MapelItem {
  mapel: string;
  nilai: number;
}

const SubjectGrades = () => {
  const { userLoginInfo, isLoading: contextLoading } = useAppContext();

  // --- STATE DATA UTAMA ---
  const [data, setData] = useState([]);
  const [jenjangs, setJenjangs] = useState([]);

  // --- STATE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch] = useState("");

  // --- STATE FORM ---
  const [formData, setFormData] = useState({
    student_user_id: "",
    jenjang_id: "",
    tahun_ajaran: "2025/2026",
    semester: "Ganjil",
    status: "Published",
    catatan: "",
    nama_siswa: "",
  });

  const [mapelList, setMapelList] = useState<MapelItem[]>([
    { mapel: "", nilai: 0 },
  ]);

  // Fungsi untuk cek apakah user adalah Super Admin atau Admin
  const isSuperAdminOrAdmin = () => {
    const role = userLoginInfo?.userInfo?.role;
    return role === "Super Administrator" || role === "Admin";
  };

  // Fungsi untuk mendapatkan jenjang yang diizinkan berdasarkan role
  const getAllowedJenjang = () => {
    const role = userLoginInfo?.userInfo?.role;

    // Super Administrator dan Admin bisa akses SEMUA
    if (role === "Super Administrator" || role === "Admin") {
      return "ALL";
    }

    // Mapping role ke jenjang
    if (role === "Kepala Sekolah SMA") return ["SMA"];
    if (role === "Kepala Sekolah SMP") return ["SMP"];
    if (role === "Kepala Sekolah SD") return ["SD"];
    if (role === "Kepala Sekolah PG-TK") return ["PG-TK", "PGTK", "TK"];

    return [];
  };

  // Fungsi untuk cek apakah user bisa akses jenjang tertentu
  const canAccessJenjang = (namaJenjang: string) => {
    const allowedJenjang = getAllowedJenjang();

    if (allowedJenjang === "ALL") {
      return true;
    }

    if (Array.isArray(allowedJenjang)) {
      const normalizedJenjang = namaJenjang?.toUpperCase() || "";
      return allowedJenjang.some((allowed) =>
        normalizedJenjang.includes(allowed.toUpperCase()),
      );
    }

    return false;
  };

  const allowedJenjangDisplay = getAllowedJenjang();

  useEffect(() => {
    if (userLoginInfo && !contextLoading) {
      fetchTableData();
      fetchMasterData();
    }
  }, [userLoginInfo, contextLoading]);

  const getToken = () => localStorage.getItem("authToken");

  // Fungsi untuk mengambil ID User dari JWT Token
  const getUserIdFromToken = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload.userInfo?.user_id || null;
    } catch (e) {
      console.error("Gagal parsing token:", e);
      return null;
    }
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/subject-grades`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { search: search },
      });

      const allData = res.data.data || [];

      // Filter data berdasarkan jenjang yang diizinkan
      if (isSuperAdminOrAdmin()) {
        setData(allData);
      } else {
        const filteredData = allData.filter((item: any) =>
          canAccessJenjang(item.jenjang?.nama_jenjang),
        );
        setData(filteredData);
      }
    } catch (err) {
      toast.error("Gagal memuat data nilai.");
    }
  };

  const fetchMasterData = async () => {
    try {
      const token = getToken();
      const resJenjang = await axios.get(`${API_BASE_URL}/jenjang`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allJenjang = resJenjang.data.data || [];

      // Filter jenjang berdasarkan role user
      if (isSuperAdminOrAdmin()) {
        setJenjangs(allJenjang);
      } else {
        const filteredJenjang = allJenjang.filter((j: any) =>
          canAccessJenjang(j.nama_jenjang),
        );
        setJenjangs(filteredJenjang);
      }
    } catch (err) {
      console.error("Gagal ambil master data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi akses jenjang
    if (!isSuperAdminOrAdmin()) {
      const selectedJenjangData = jenjangs.find(
        (j: any) => j.jenjang_id === formData.jenjang_id,
      );

      if (
        selectedJenjangData &&
        !canAccessJenjang(selectedJenjangData.nama_jenjang)
      ) {
        toast.error("Anda tidak memiliki akses untuk jenjang ini");
        return;
      }
    }

    const currentUserId = getUserIdFromToken();

    if (!currentUserId) return toast.error("Sesi habis, silakan login ulang.");

    setLoading(true);

    const nilai_json = mapelList.reduce((acc: any, curr) => {
      if (curr.mapel.trim()) acc[curr.mapel] = Number(curr.nilai);
      return acc;
    }, {});

    try {
      const config = { headers: { Authorization: `Bearer ${getToken()}` } };

      const basePayload = {
        student_user_id: formData.student_user_id,
        jenjang_id: formData.jenjang_id,
        tahun_ajaran: formData.tahun_ajaran,
        semester: formData.semester,
        status: formData.status,
        catatan: formData.catatan,
        nama_siswa: formData.nama_siswa,
        nilai_json: nilai_json,
      };

      if (isEditMode) {
        await axios.put(
          `${API_BASE_URL}/subject-grades/${currentId}`,
          { ...basePayload, editor_user_id: currentUserId },
          config,
        );
        toast.success("Data berhasil diperbarui!");
      } else {
        await axios.post(
          `${API_BASE_URL}/subject-grades`,
          { ...basePayload, penulis_user_id: currentUserId },
          config,
        );
        toast.success("Data berhasil disimpan!");
      }

      closeModal();
      fetchTableData();
    } catch (err: any) {
      console.error("Error API:", err.response?.data);
      toast.error(err.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any, jenjangNama: string) => {
    // Cek permission sebelum delete
    if (!isSuperAdminOrAdmin() && !canAccessJenjang(jenjangNama)) {
      toast.error("Anda tidak memiliki akses untuk menghapus data jenjang ini");
      return;
    }

    if (!window.confirm("Hapus data ini?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/subject-grades/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Data dihapus!");
      fetchTableData();
    } catch (err) {
      toast.error("Gagal menghapus data.");
    }
  };

  const openEditModal = (item: any) => {
    // Cek akses sebelum edit
    if (
      !isSuperAdminOrAdmin() &&
      !canAccessJenjang(item.jenjang?.nama_jenjang)
    ) {
      toast.error("Anda tidak memiliki akses untuk mengedit data jenjang ini");
      return;
    }

    setIsEditMode(true);
    setCurrentId(item.grade_id);
    setFormData({
      student_user_id: item.student_user_id,
      jenjang_id: item.jenjang_id,
      tahun_ajaran: item.tahun_ajaran,
      semester: item.semester,
      status: item.status,
      catatan: item.catatan || "",
      nama_siswa: item.nama_siswa || "",
    });

    const convertedMapel = Object.entries(item.nilai_json || {}).map(
      ([key, val]) => ({ mapel: key, nilai: val as number }),
    );
    setMapelList(
      convertedMapel.length > 0 ? convertedMapel : [{ mapel: "", nilai: 0 }],
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({
      student_user_id: "",
      jenjang_id: "",
      tahun_ajaran: "2025/2026",
      semester: "Ganjil",
      status: "Published",
      catatan: "",
      nama_siswa: "",
    });
    setMapelList([{ mapel: "", nilai: 0 }]);
  };

  // Loading state saat context masih loading
  if (contextLoading || !userLoginInfo) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-muted-foreground">Memuat data user...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Manajemen Nilai 🎓
            </h1>
            <p className="text-sm text-gray-500">
              Input data nilai siswa secara manual sesuai jenjang.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari berdasarkan ID atau Nama..."
                className="pl-10 pr-4 py-2 border rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTableData()}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors"
            >
              <PlusCircle size={20} /> Tambah
            </button>
          </div>
        </div>

        {/* Info Role User */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-100">
                {isSuperAdminOrAdmin() ? (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                ) : (
                  <Lock className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {userLoginInfo?.userInfo?.role || "Unknown"}
                </p>
                <p className="text-xs text-gray-500">
                  {userLoginInfo?.userInfo?.username || "User"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Akses Jenjang:</span>
              <div className="flex flex-wrap gap-1.5">
                {isSuperAdminOrAdmin() ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Semua Jenjang
                  </span>
                ) : Array.isArray(allowedJenjangDisplay) ? (
                  allowedJenjangDisplay.map((jenjang) => (
                    <span
                      key={jenjang}
                      className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                    >
                      {jenjang}
                    </span>
                  ))
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-gray-600">Total Jenjang</p>
                <p className="font-bold text-lg text-blue-600">
                  {isSuperAdminOrAdmin()
                    ? jenjangs.length
                    : Array.isArray(allowedJenjangDisplay)
                      ? allowedJenjangDisplay.length
                      : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4">Jenjang</th>
                  <th className="p-4">Periode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length > 0 ? (
                  data.map((item: any) => {
                    const hasAccess =
                      isSuperAdminOrAdmin() ||
                      canAccessJenjang(item.jenjang?.nama_jenjang);

                    return (
                      <tr
                        key={item.grade_id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold">{item.nama_siswa}</div>
                              <div className="text-[10px] text-gray-400">
                                {item.student_user_id}
                              </div>
                            </div>
                            {!hasAccess && (
                              <Lock className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {item.jenjang?.nama_jenjang}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">
                          {item.tahun_ajaran} - {item.semester}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              item.status === "Published"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              disabled={!hasAccess}
                              className={`p-2 rounded-lg ${
                                hasAccess
                                  ? "text-blue-600 hover:bg-blue-50"
                                  : "text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(
                                  item.grade_id,
                                  item.jenjang?.nama_jenjang,
                                )
                              }
                              disabled={!hasAccess}
                              className={`p-2 rounded-lg ${
                                hasAccess
                                  ? "text-red-500 hover:bg-red-50"
                                  : "text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500 text-sm"
                    >
                      <p>Tidak ada data nilai yang dapat Anda akses.</p>
                      {!isSuperAdminOrAdmin() &&
                        Array.isArray(allowedJenjangDisplay) && (
                          <p className="text-xs mt-2">
                            Anda hanya dapat melihat data untuk jenjang:{" "}
                            {allowedJenjangDisplay.join(", ")}
                          </p>
                        )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-xl font-bold">
                  {isEditMode ? "📝 Edit Data Nilai" : "✨ Tambah Data Nilai"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={28} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UUID SISWA */}
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      User ID Siswa (UUID)
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none"
                      placeholder="Masukkan UUID Siswa"
                      value={formData.student_user_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          student_user_id: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  {/* NAMA SISWA */}
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      Nama Lengkap Siswa
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none"
                      placeholder="Nama di Rapor"
                      value={formData.nama_siswa}
                      onChange={(e) =>
                        setFormData({ ...formData, nama_siswa: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* JENJANG */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold">
                    Pilih Jenjang 🏫
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {jenjangs.length > 0 ? (
                      jenjangs.map((j: any) => (
                        <button
                          key={j.jenjang_id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              jenjang_id: j.jenjang_id,
                            })
                          }
                          className={`px-4 py-2 text-xs font-bold rounded-xl border-2 transition-all ${
                            formData.jenjang_id === j.jenjang_id
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : "border-gray-100 text-gray-400 hover:border-gray-200"
                          }`}
                        >
                          {j.nama_jenjang}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Tidak ada jenjang yang dapat diakses
                      </p>
                    )}
                  </div>
                </div>

                {/* PERIODE AKADEMIK */}
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-2xl">
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">
                      Tahun Ajaran
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded-lg text-sm"
                      value={formData.tahun_ajaran}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tahun_ajaran: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 mb-1">
                      Semester
                    </label>
                    <select
                      className="w-full border p-2 rounded-lg text-sm"
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>

                {/* MAPEL LIST */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold">
                      Rincian Nilai 📝
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setMapelList([...mapelList, { mapel: "", nilai: 0 }])
                      }
                      className="text-blue-600 text-xs font-bold hover:bg-blue-50 px-3 py-1 rounded-lg border border-blue-200"
                    >
                      + Tambah Mapel
                    </button>
                  </div>
                  <div className="space-y-2">
                    {mapelList.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2"
                      >
                        <input
                          placeholder="Mata Pelajaran (Contoh: Matematika)"
                          className="flex-1 p-3 rounded-xl border text-sm focus:border-blue-300 outline-none"
                          value={item.mapel}
                          onChange={(e) => {
                            const newMapel = [...mapelList];
                            newMapel[index].mapel = e.target.value;
                            setMapelList(newMapel);
                          }}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Nilai"
                          className="w-24 p-3 rounded-xl border text-center text-sm focus:border-blue-300 outline-none"
                          value={item.nilai}
                          onChange={(e) => {
                            const newMapel = [...mapelList];
                            newMapel[index].nilai = Number(e.target.value);
                            setMapelList(newMapel);
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setMapelList(
                              mapelList.filter((_, i) => i !== index),
                            )
                          }
                          className="text-red-300 hover:text-red-500 p-2"
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CATATAN */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Catatan Wali Kelas
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none min-h-[80px]"
                    placeholder="Contoh: Tingkatkan prestasi di bidang numerasi."
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || jenjangs.length === 0}
                    className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all"
                  >
                    {loading && <Loader2 className="animate-spin" size={20} />}
                    {isEditMode ? "Update Data" : "Simpan Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SubjectGrades;
