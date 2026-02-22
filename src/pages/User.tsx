import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, RefreshCcw, Eye } from "lucide-react";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "@/utils/api-call";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";
import { useNavigate } from "react-router-dom";
import { ApiResponse, Role, User } from "@/types/data";

interface InitialForm {
  email: string;
  username: string;
  nama_lengkap: string;
  role_id: number;
  jabatan?: string;
  login_terakhir?: string;
  role: Role; // Ini Object, bukan string!
}

const initialFormData: InitialForm = {
  email: "",
  username: "",
  nama_lengkap: "",
  role_id: 0,
  jabatan: "",
  login_terakhir: "",
  role: { role_id: 0, nama_role: "", role_permission: [] },
};

const UsersManagementPage = () => {
  const { userLoginInfo } = useAppContext();
  const [usersBackup, setUsersBackup] = useState<User[]>([]);
  const [usersFiltered, setUsersFiltered] = useState<User[]>([]);
  const [formData, setFormData] = useState<InitialForm>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setisLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const totalData = usersBackup?.length || 0;
  const totalPages = Math.ceil(totalData / limit);

  const fetchUsers = async () => {
    setisLoading(true);
    try {
      const responseData: ApiResponse<User> = await getRequest(`/users`);
      const sortData = responseData.data.sort((a: User, b: User) =>
        a.nama_lengkap.localeCompare(b.nama_lengkap),
      );
      setUsersBackup(sortData);
      setUsersFiltered(sortData.slice(0, limit));
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data user.");
    } finally {
      setisLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setisLoading(true);

    try {
      if (editingId) {
        await putRequest(`/users/${editingId}`, {
          ...formData,
          editor_user_id: userLoginInfo.userInfo.user_id,
        });
        toast.success(`User berhasil diupdate!`);
      } else {
        await postRequest("/users", {
          ...formData,
          penulis_user_id: userLoginInfo.userInfo.user_id,
        });
        toast.success("User berhasil ditambahkan!");
      }
      setOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setisLoading(false);
    }
  };

  const executeDelete = async (id: string) => {
    setisLoading(true);
    try {
      await deleteRequest(`/users/${id}`);
      toast.success("User berhasil dihapus!");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setisLoading(false);
    }
  };

  const popupDelete = (id: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
    }).then((result) => {
      if (result.isConfirmed) executeDelete(id);
    });
  };

  const openEditDialog = (user: User) => {
    setFormData({
      email: user.email,
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role_id: user.role_id,
      jabatan: user.jabatan,
      login_terakhir: user.login_terakhir,
      role: user.role, // Memasukkan object role lengkap
    });
    setEditingId(user.user_id || null);
    setOpen(true);
  };

  // FIX: Fungsi ini sekarang balikin Object Role, bukan cuma string
  const handleRoleChange = (roleName: string) => {
    const roleMap: Record<string, number> = {
      "Super Administrator": 1,
      "Kepala Sekolah PG-TK": 2,
      "Kepala Sekolah SD": 3,
      "Kepala Sekolah SMP": 4,
      "Kepala Sekolah SMA": 5,
    };

    setFormData((prev) => ({
      ...prev,
      role_id: roleMap[roleName] || 0,
      role: {
        ...prev.role,
        nama_role: roleName,
      },
    }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const startIndex = (page - 1) * limit;
    const filtered = usersBackup.filter((u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setUsersFiltered(filtered.slice(startIndex, startIndex + limit));
  }, [page, usersBackup, searchTerm]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Kelola data user</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchUsers}
              disabled={isLoading}
              variant="secondary"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Tambah User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit User" : "Tambah User"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Nama Lengkap</Label>
                    <Input
                      id="fullname"
                      value={formData.nama_lengkap}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nama_lengkap: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={formData.role.nama_role}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Super Administrator">
                            Super Administrator
                          </SelectItem>
                          <SelectItem value="Kepala Sekolah PG-TK">
                            Kepala Sekolah PG-TK
                          </SelectItem>
                          <SelectItem value="Kepala Sekolah SD">
                            Kepala Sekolah SD
                          </SelectItem>
                          <SelectItem value="Kepala Sekolah SMP">
                            Kepala Sekolah SMP
                          </SelectItem>
                          <SelectItem value="Kepala Sekolah SMA">
                            Kepala Sekolah SMA
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : (
                  usersFiltered.map((u, i) => (
                    <TableRow key={u.user_id}>
                      <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                      <TableCell>{u.nama_lengkap}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role.nama_role}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => popupDelete(u.user_id || "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UsersManagementPage;
