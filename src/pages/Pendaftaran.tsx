import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/utils/api-call";
import {
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
import StatCard from "@/components/StatCard";
import TableRow from "@/components/Tablerow";
import Pagination from "@/components/Pagination";
import DetailModal from "@/components/DetailModal";
import { useAppContext } from "@/utils/app-context";

interface PendaftaranData {
  id: string;
  noPendaftaran: string;
  namaSiswa: string;
  emailOrangtua: string;
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

  const role = userLoginInfo?.userInfo?.role;

  const getAllowedClasses = () => {
    if (role === "Super Administrator" || role === "Admin") {
      return ["PG", "TK", "SD", "SMP", "SMA"];
    }
    if (role === "Kepala Sekolah SMA") return ["SMA"];
    if (role === "Kepala Sekolah SMP") return ["SMP"];
    if (role === "Kepala Sekolah SD") return ["SD"];
    if (role === "Kepala Sekolah PG-TK") return ["PG", "TK"];
    return [];
  };

  const getUserLevel = () => {
    if (role === "Super Administrator" || role === "Admin") return "all";
    if (role === "Kepala Sekolah SMA") return "SMA";
    if (role === "Kepala Sekolah SMP") return "SMP";
    if (role === "Kepala Sekolah SD") return "SD";
    if (role === "Kepala Sekolah PG-TK") return "PGTK";
    return null;
  };

  const canAccessClass = (kelas: string) => {
    const allowedClasses = getAllowedClasses();
    return allowedClasses.some((allowed) => kelas.startsWith(allowed));
  };

  const allowedClasses = getAllowedClasses();
  const userLevel = getUserLevel();

  // ── Query tabel (dengan filter aktif)
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
      return response;
    },
  });

  // ✅ Query statistik — backend sudah filter per role via JWT
  // Tidak perlu kirim role dari frontend karena backend baca dari req.user
  const { data: statsData } = useQuery({
    queryKey: ["pendaftaran-statistik", userLevel],
    queryFn: async () => {
      const response = await getRequest(`/pendaftaran/statistik`);
      return response;
    },
  });

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((item: PendaftaranData) =>
      canAccessClass(item.kelas),
    );
  }, [data?.data, userLoginInfo]);

  // ✅ Stats sudah filtered per role dari backend
  const stats = useMemo(() => {
    if (statsData?.data) return statsData.data;
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }, [statsData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const availableClassFilters = [
    { value: "PG", label: "PG" },
    { value: "TK", label: "TK" },
    { value: "SD", label: "SD (Semua)" },
    { value: "SMP", label: "SMP (Semua)" },
    { value: "SMA", label: "SMA (Semua)" },
  ].filter((item) => getAllowedClasses().some((a) => item.value.startsWith(a)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Pendaftaran Siswa</h1>
            <p className="text-muted-foreground">
              Kelola pendaftaran siswa baru
            </p>
          </div>
        </div>

        {/* Info Role */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
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

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Akses:</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedClasses.length === 5 ? (
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
              {allowedClasses.length < 5 && (
                <>
                  <div className="h-8 w-px bg-border"></div>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Statistics Cards — sudah filtered per role dari backend */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Pendaftar"
            value={stats.total ?? 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Menunggu Verifikasi"
            value={stats.pending ?? 0}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Diterima"
            value={stats.approved ?? 0}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Ditolak"
            value={stats.rejected ?? 0}
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
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
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
            <Select
              value={kelasFilter}
              onValueChange={(value) => {
                setKelasFilter(value);
                setPage(1);
              }}
            >
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
                    </th>
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
                  {allowedClasses.length < 5 && (
                    <p className="text-xs mt-2">
                      Anda hanya dapat melihat data untuk:{" "}
                      {allowedClasses.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {data?.pagination && filteredData.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}

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
