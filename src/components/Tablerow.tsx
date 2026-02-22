import { useState } from "react";
import { Eye, Check, X, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { patchRequest, deleteRequest } from "@/utils/api-call";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// components/TableRow.tsx
interface TableRowProps {
  data: any;
  onDetail: () => void;
  onApprove?: () => void; // Optional
  onReject?: () => void; // Optional
  onDelete?: () => void; // Optional
  refetch: () => void;
}

const TableRow = ({ data, onDetail, refetch }: TableRowProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: "approved" | "rejected") => {
    setLoading(true);
    try {
      await patchRequest(`/pendaftaran/${data.id}/status`, { status });
      toast.success(
        `Pendaftaran berhasil ${status === "approved" ? "diterima" : "ditolak"}`,
      );
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah status");
    } finally {
      setLoading(false);
      setShowApproveDialog(false);
      setShowRejectDialog(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteRequest(`/pendaftaran/${data.id}`);
      toast.success("Pendaftaran berhasil dihapus");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus pendaftaran");
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Menunggu", class: "bg-yellow-100 text-yellow-700" },
      approved: { label: "Diterima", class: "bg-green-100 text-green-700" },
      rejected: { label: "Ditolak", class: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${config?.class}`}
      >
        {config?.label || status}
      </span>
    );
  };

  return (
    <>
      <tr className="border-b hover:bg-muted/50 transition-colors">
        <td className="p-4 font-medium">{data.noPendaftaran}</td>
        <td className="p-4">{data.namaSiswa}</td>
        <td className="p-4">
          <a
            href={`mailto:${data.emailOrangtua}`}
            className="text-primary hover:underline text-sm"
          >
            {data.emailOrangtua || "-"}
          </a>
        </td>
        <td className="p-4">{data.kelas}</td>
        <td className="p-4">{data.telpSiswa}</td>
        <td className="p-4">
          {format(new Date(data.createdAt), "dd MMM yyyy", { locale: id })}
        </td>
        <td className="p-4">{getStatusBadge(data.statusPendaftaran)}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onDetail}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {data.statusPendaftaran === "pending" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setShowApproveDialog(true)}
                      className="text-green-600"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Terima
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowRejectDialog(true)}
                      className="text-red-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Tolak
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </td>
      </tr>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terima Pendaftaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menerima pendaftaran{" "}
              <strong>{data.namaSiswa}</strong>? Tindakan ini akan mengubah
              status menjadi "Diterima".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange("approved")}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Memproses..." : "Ya, Terima"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Pendaftaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menolak pendaftaran{" "}
              <strong>{data.namaSiswa}</strong>? Tindakan ini akan mengubah
              status menjadi "Ditolak".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange("rejected")}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Memproses..." : "Ya, Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pendaftaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pendaftaran{" "}
              <strong>{data.namaSiswa}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TableRow;
