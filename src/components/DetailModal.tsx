import { useQuery } from "@tanstack/react-query";
import { getRequest, patchRequest } from "@/utils/api-call";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  User,
  Users,
  Heart,
  FileText,
  Download,
  ExternalLink,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/utils/api-call";
import { toast } from "sonner";

interface DetailModalProps {
  id: string;
  open: boolean;
  onClose: () => void;
  refetch: () => void;
}

const DetailModal = ({ id, open, onClose, refetch }: DetailModalProps) => {
  const {
    data,
    isLoading,
    isError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ["pendaftaran-detail", id],
    queryFn: async () => {
      const response = await getRequest(`/pendaftaran/${id}`);

      // 🔍 DEBUGGING - CEK STRUKTUR RESPONSE
      console.log("=== FULL RESPONSE ===");
      console.log("response:", response);
      console.log("response.data:", response.data);

      console.log("=== EMAIL CHECKS ===");
      console.log("response.emailOrangtua:", response.emailOrangtua);
      console.log("response.data.emailOrangtua:", response.data?.emailOrangtua);

      console.log("=== ALL KEYS IN RESPONSE ===");
      if (response.data) {
        console.log("Keys:", Object.keys(response.data));
      }

      // Return data yang benar
      // Backend kembalikan response.data berisi object pendaftaran
      return response.data || response;
    },
    enabled: !!id && open,
  });

  // ✅ MUTATION UNTUK KIRIM EMAIL
  const emailMutation = useMutation({
    mutationFn: async () => {
      // Memanggil API Backend
      return await postRequest(`/pendaftaran/send-notif/${id}`, {});
    },
    onSuccess: () => {
      toast.success("Email notifikasi berhasil terkirim!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal kirim email");
    },
  });

  // ✅ MUTATION UNTUK UPDATE STATUS
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return await patchRequest(`/pendaftaran/${id}/status`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      toast.success("Status berhasil diperbarui!");
      refetchDetail(); // Refresh data di dalam modal
      refetch(); // Refresh tabel di halaman utama
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Gagal update status");
    },
  });

  // ✅ HANDLER KIRIM EMAIL - DENGAN FIELD NAME YANG BENAR
  const handleSendEmail = () => {
    console.log("=== DEBUG SEND EMAIL ===");
    console.log("Status Pendaftaran:", data?.statusPendaftaran);
    console.log("Email Orang Tua:", data?.emailOrangtua); // ✅ Huruf 't' kecil

    // Validasi email (dengan field name yang benar)
    if (!data?.emailOrangtua) {
      // ✅ Huruf 't' kecil
      toast.error("Email orang tua tidak tersedia!");
      return;
    }

    // Validasi status
    if (!data?.statusPendaftaran) {
      toast.error("Status pendaftaran tidak ditemukan!");
      return;
    }

    // Mapping status untuk konfirmasi
    const statusText =
      {
        pending: "PENDING (Dalam Verifikasi)",
        approved: "DITERIMA",
        rejected: "DITOLAK",
      }[data.statusPendaftaran] || data.statusPendaftaran.toUpperCase();

    // Konfirmasi sebelum kirim (dengan field name yang benar)
    const confirmMessage = `Kirim email notifikasi ke ${data.emailOrangtua} dengan status: ${statusText}?`;

    if (window.confirm(confirmMessage)) {
      emailMutation.mutate();
    }
  };

  // Fungsi format tanggal yang lebih aman
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (!isValid(date)) return "-";
    return format(date, "dd MMMM yyyy", { locale: idLocale });
  };

  const getFileUrl = (path: string | undefined) => {
    if (!path) return "#";
    const filename = path.split(/[\\/]/).pop();
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl}/pendaftaran/2026-02/${filename}`;
  };

  // 🔍 DEBUGGING - Log data yang sudah diproses
  console.log("=== PROCESSED DATA ===");
  console.log("data object:", data);
  console.log("data.emailOrangtua:", data?.emailOrangtua); // ✅ Huruf 't' kecil
  console.log("data.statusPendaftaran:", data?.statusPendaftaran);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detail Pendaftaran</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{data?.noPendaftaran || "-"}</span>
            <span>•</span>
            <span>Didaftarkan pada {formatDate(data?.createdAt)}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* ✅ Email Orang Tua di Header dengan Status Badge */}
            {data?.emailOrangtua ? ( // ✅ Huruf 't' kecil
              <div className="space-y-3">
                {/* Email Section */}
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-blue-600 font-medium">
                      Email Orang Tua
                    </p>
                    <p className="text-sm font-semibold text-blue-900 truncate">
                      {data.emailOrangtua} {/* ✅ Huruf 't' kecil */}
                    </p>
                  </div>
                  {/* <Button
                    size="sm"
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={emailMutation.isPending}
                    onClick={handleSendEmail}
                  >
                    {emailMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-1" />
                    )}
                    {emailMutation.isPending
                      ? "Mengirim..."
                      : "Kirim Notifikasi"}
                  </Button> */}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Status Pendaftaran Saat Ini
                    </p>
                    <div className="flex items-center gap-2">
                      {data.statusPendaftaran === "approved" && (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          ✓ DITERIMA
                        </span>
                      )}
                      {data.statusPendaftaran === "rejected" && (
                        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                          ✗ DITOLAK
                        </span>
                      )}
                      {data.statusPendaftaran === "pending" && (
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          ⏱ PENDING
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Email akan dikirim sesuai status ini
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ Email Orang Tua tidak ditemukan. Periksa console untuk
                  debugging.
                </p>
              </div>
            )}

            <Tabs defaultValue="siswa" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="siswa">
                  <User className="w-4 h-4 mr-2" />
                  Siswa
                </TabsTrigger>
                <TabsTrigger value="ayah">
                  <Users className="w-4 h-4 mr-2" />
                  Ayah
                </TabsTrigger>
                <TabsTrigger value="ibu">
                  <Heart className="w-4 h-4 mr-2" />
                  Ibu
                </TabsTrigger>
                <TabsTrigger value="dokumen">
                  <FileText className="w-4 h-4 mr-2" />
                  Dokumen
                </TabsTrigger>
              </TabsList>

              {/* Tab Data Siswa */}
              <TabsContent value="siswa" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Nama Lengkap" value={data?.namaSiswa} />
                  <InfoField label="Kelas" value={data?.kelas} />
                  <InfoField label="Tempat Lahir" value={data?.tempatLahir} />
                  <InfoField
                    label="Tanggal Lahir"
                    value={formatDate(data?.tanggalLahir)}
                  />
                  <InfoField label="Jenis Kelamin" value={data?.jenisKelamin} />
                  <InfoField label="Agama" value={data?.belajarAgama} />
                  <InfoField
                    label="Golongan Darah"
                    value={data?.golonganDarah}
                  />
                  <InfoField label="Anak Ke" value={data?.anakKe} />
                  <InfoField
                    label="Jumlah Saudara"
                    value={data?.jumlahSaudara}
                  />
                  <InfoField label="Status Anak" value={data?.status} />
                  <InfoField
                    label="Tinggal Bersama"
                    value={data?.tinggalBersama}
                  />
                  <InfoField label="NISN" value={data?.nisn} />
                  <InfoField
                    label="Alamat Lengkap"
                    value={data?.alamatSiswa}
                    className="col-span-1 md:col-span-2"
                  />
                  <InfoField label="Telepon" value={data?.telpSiswa} />
                  <InfoField
                    label="Lulusan Dari"
                    value={data?.lulusanDariSekolah}
                  />
                </div>

                {data?.nomorIjazah && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                      <FileText className="w-4 h-4" />
                      Data Ijazah / Sekolah Asal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoField
                        label="Nomor Ijazah"
                        value={data?.nomorIjazah}
                      />
                      <InfoField
                        label="Tanggal Ijazah"
                        value={formatDate(data?.tglIjazah)}
                      />
                      <InfoField
                        label="Tahun Ijazah"
                        value={data?.tahunIjazah}
                      />
                      <InfoField
                        label="Jumlah Nilai US"
                        value={data?.jumlahNilaiUS}
                      />
                      {data?.pindahanDariSekolah && (
                        <>
                          <InfoField
                            label="Pindahan Dari"
                            value={data?.pindahanDariSekolah}
                          />
                          <InfoField
                            label="Alamat Sekolah Asal"
                            value={data?.alamatSekolahAsal}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab Data Ayah */}
              <TabsContent value="ayah" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Nama Lengkap" value={data?.namaAyah} />
                  <InfoField
                    label="Tempat Lahir"
                    value={data?.tempatLahirAyah}
                  />
                  <InfoField
                    label="Tanggal Lahir"
                    value={formatDate(data?.tanggalLahirAyah)}
                  />
                  <InfoField label="Agama" value={data?.agamaAyah} />
                  <InfoField
                    label="Pendidikan Terakhir"
                    value={data?.pendidikanAyah}
                  />
                  <InfoField label="Pekerjaan" value={data?.pekerjaanAyah} />
                  <InfoField label="Telepon" value={data?.telpAyah} />

                  <InfoField
                    label="Email Orang Tua"
                    value={data?.emailOrangtua}
                    isEmail={true}
                  />

                  <InfoField
                    label="Alamat Lengkap"
                    value={data?.alamatAyah}
                    className="col-span-1 md:col-span-2"
                  />
                </div>
              </TabsContent>

              {/* Tab Data Ibu */}
              <TabsContent value="ibu" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Nama Lengkap" value={data?.namaIbu} />
                  <InfoField
                    label="Tempat Lahir"
                    value={data?.tempatLahirIbu}
                  />
                  <InfoField
                    label="Tanggal Lahir"
                    value={formatDate(data?.tanggalLahirIbu)}
                  />
                  <InfoField label="Agama" value={data?.agamaIbu} />
                  <InfoField
                    label="Pendidikan Terakhir"
                    value={data?.pendidikanIbu}
                  />
                  <InfoField label="Pekerjaan" value={data?.pekerjaanIbu} />
                  <InfoField label="Telepon" value={data?.telpIbu} />
                  <InfoField
                    label="Alamat Lengkap"
                    value={data?.alamatIbu}
                    className="col-span-1 md:col-span-2"
                  />
                </div>
              </TabsContent>

              {/* Tab Dokumen */}
              <TabsContent value="dokumen" className="space-y-4 mt-6">
                <div className="grid gap-4">
                  <DocumentCard
                    title="Akte Kelahiran"
                    url={getFileUrl(data?.akteLahirUrl)}
                  />
                  <DocumentCard
                    title="Kartu Keluarga"
                    url={getFileUrl(data?.kartuKeluargaUrl)}
                  />
                  <DocumentCard
                    title="Bukti Transfer"
                    url={getFileUrl(data?.buktiTransferUrl)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper Components
const InfoField = ({
  label,
  value,
  className = "",
  isEmail = false,
}: {
  label: string;
  value: any;
  className?: string;
  isEmail?: boolean;
}) => (
  <div className={className}>
    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
      {label}
    </p>
    {isEmail && value ? (
      <a
        href={`mailto:${value}`}
        className="font-medium text-sm md:text-base text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        onClick={(e) => {
          e.preventDefault();
          window.open(`mailto:${value}`, "_blank");
        }}
      >
        <Mail className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{value}</span>
      </a>
    ) : (
      <p className="font-medium text-sm md:text-base break-words">
        {value || "-"}
      </p>
    )}
  </div>
);

const DocumentCard = ({ title, url }: { title: string; url: string }) => (
  <div className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card hover:bg-accent/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          Dokumen pendukung pendaftaran
        </p>
      </div>
    </div>
    <div className="flex gap-2 w-full sm:w-auto">
      <Button
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-none"
        onClick={() => window.open(url, "_blank")}
        disabled={url === "#"}
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Lihat
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={url === "#"}
        onClick={() => {
          const link = document.createElement("a");
          link.href = url;
          link.download = title;
          link.click();
        }}
      >
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
    </div>
  </div>
);

export default DetailModal;
