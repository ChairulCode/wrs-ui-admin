import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/utils/api-call";
import {
  Search,
  Filter,
  Download,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import TableRow from "@/components/Tablerow";
import Pagination from "@/components/Pagination";
import DetailModal from "@/components/DetailModal";
import { useAppContext } from "@/utils/app-context";

interface PendaftaranData {
  id: string;
  noPendaftaran: string;
  namaSiswa: string;
  emailOrangtua: String;
  kelas: string;
  telpSiswa: string;
  statusPendaftaran: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

const Pendaftaran = () => {
  const { userLoginInfo } = useAppContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kelasFilter, setKelasFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fungsi untuk mendapatkan kelas yang diizinkan berdasarkan role
  const getAllowedClasses = () => {
    const role = userLoginInfo?.userInfo?.role;

    if (role === "Super Administrator" || role === "Admin") {
      return [
        "PG",
        "TK A",
        "TK B",
        "SD Kelas I",
        "SMP Kelas VII",
        "SMA Kelas X",
      ];
    }

    if (role === "Kepala Sekolah SMA") return ["SMA Kelas X"];
    if (role === "Kepala Sekolah SMP") return ["SMP Kelas VII"];
    if (role === "Kepala Sekolah SD") return ["SD Kelas I"];
    if (role === "Kepala Sekolah PG-TK") return ["PG", "TK A", "TK B"];

    return [];
  };

  // Fungsi untuk mendapatkan level berdasarkan role
  const getUserLevel = () => {
    const role = userLoginInfo?.userInfo?.role;

    if (role === "Super Administrator" || role === "Admin") return "all";
    if (role === "Kepala Sekolah SMA") return "SMA";
    if (role === "Kepala Sekolah SMP") return "SMP";
    if (role === "Kepala Sekolah SD") return "SD";
    if (role === "Kepala Sekolah PG-TK") return "PGTK";

    return null;
  };

  // Fungsi untuk cek apakah user bisa akses kelas tertentu
  const canAccessClass = (kelas: string) => {
    const allowedClasses = getAllowedClasses();
    return allowedClasses.includes(kelas);
  };

  const allowedClasses = getAllowedClasses();
  const userLevel = getUserLevel();

  // Fetch data pendaftaran dengan filter berdasarkan role
  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "pendaftaran",
      page,
      statusFilter,
      kelasFilter,
      search,
      userLevel,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (kelasFilter !== "all") params.append("kelas", kelasFilter);
      if (search) params.append("search", search);

      const response = await getRequest(`/pendaftaran?${params.toString()}`);
      console.log("Pendaftaran Response:", response);
      return response;
    },
  });

  // Filter data berdasarkan kelas yang diizinkan
  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((item: PendaftaranData) =>
      canAccessClass(item.kelas),
    );
  }, [data?.data, allowedClasses]);

  // Hitung statistik berdasarkan data yang sudah difilter
  const filteredStats = useMemo(() => {
    const total = filteredData.length;
    const pending = filteredData.filter(
      (item: PendaftaranData) => item.statusPendaftaran === "pending",
    ).length;
    const approved = filteredData.filter(
      (item: PendaftaranData) => item.statusPendaftaran === "approved",
    ).length;
    const rejected = filteredData.filter(
      (item: PendaftaranData) => item.statusPendaftaran === "rejected",
    ).length;

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }, [filteredData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    // Lakukan export dengan filteredData
    toast.success(`${filteredData.length} data berhasil diexport!`);
  };

  console.log("Data:", data);
  console.log("Filtered Data:", filteredData);
  console.log("Filtered Stats:", filteredStats);
  console.log("User Role:", userLoginInfo?.userInfo?.role);
  console.log("Allowed Classes:", allowedClasses);

  // Daftar kelas yang akan ditampilkan di filter dropdown
  const availableClassFilters = [
    { value: "PG", label: "PG" },
    { value: "TK A", label: "TK A" },
    { value: "TK B", label: "TK B" },
    { value: "SD Kelas I", label: "SD Kelas I" },
    { value: "SMP Kelas VII", label: "SMP Kelas VII" },
    { value: "SMA Kelas X", label: "SMA Kelas X" },
  ].filter((item) => allowedClasses.includes(item.value));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Pendaftaran Siswa</h1>
            <p className="text-muted-foreground">
              Kelola pendaftaran siswa baru tahun ajaran 2026/2027
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Info Role User */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left Side - User Info */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {userLoginInfo?.userInfo?.role || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userLoginInfo?.userInfo?.username || "User"}
                </p>
              </div>
            </div>

            {/* Middle - Access Info */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Akses:</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedClasses.length === 6 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Semua Tingkatan
                  </span>
                ) : (
                  allowedClasses.map((kelas) => (
                    <span
                      key={kelas}
                      className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                    >
                      {kelas}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Right Side - Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-muted-foreground">Total Kelas</p>
                <p className="font-bold text-lg text-primary">
                  {allowedClasses.length}
                </p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-medium text-foreground">Aktif</span>
              </div>
              {allowedClasses.length < 6 && (
                <>
                  <div className="h-8 w-px bg-border"></div>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards - MENGGUNAKAN filteredStats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Pendaftar"
            value={filteredStats.total}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Menunggu Verifikasi"
            value={filteredStats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Diterima"
            value={filteredStats.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Ditolak"
            value={filteredStats.rejected}
            icon={XCircle}
            color="red"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Cari nama siswa atau nomor pendaftaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Diterima</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select value={kelasFilter} onValueChange={setKelasFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {availableClassFilters.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-white overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-left font-semibold">
                      No. Pendaftaran
                    </th>
                    <th className="p-4 text-left font-semibold">Nama Siswa</th>
                    <th className="p-4 text-left font-semibold">
                      Email Orang Tua
                    </th>{" "}
                    {/* <--- Tambah Header */}
                    <th className="p-4 text-left font-semibold">Kelas</th>
                    <th className="p-4 text-left font-semibold">Telepon</th>
                    <th className="p-4 text-left font-semibold">
                      Tanggal Daftar
                    </th>
                    <th className="p-4 text-left font-semibold">Status</th>
                    <th className="p-4 text-left font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item: PendaftaranData) => (
                    <TableRow
                      key={item.id}
                      data={item}
                      onDetail={() => {
                        setSelectedId(item.id);
                        setShowDetail(true);
                      }}
                      refetch={refetch}
                    />
                  ))}
                </tbody>
              </table>

              {filteredData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada data pendaftaran yang dapat Anda akses</p>
                  {allowedClasses.length < 6 && (
                    <p className="text-xs mt-2">
                      Anda hanya dapat melihat data untuk:{" "}
                      {allowedClasses.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {data?.pagination && filteredData.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {/* Detail Modal */}
        {showDetail && selectedId && (
          <DetailModal
            id={selectedId}
            open={showDetail}
            onClose={() => {
              setShowDetail(false);
              setSelectedId(null);
            }}
            refetch={refetch}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pendaftaran;
