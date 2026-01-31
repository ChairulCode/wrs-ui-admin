import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCcw,
  Eye,
  Cloud,
  CloudUploadIcon,
} from "lucide-react";
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
=======
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, RefreshCcw, Eye, Cloud, CloudUploadIcon } from "lucide-react";
import { deleteRequest, getRequest, postRequest, putRequest } from "@/utils/api-call";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
>>>>>>> e7d98b4189bc814cc708844ee82c37cc9087fce8
import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";
import { useNavigate } from "react-router-dom";
import { ApiResponse, Jenjang, Jenjang_relasi, Role, User } from "@/types/data";

interface InitialForm {
<<<<<<< HEAD
  email: string;
  username: string;
  nama_lengkap: string;
  role_id: number;
  jabatan?: string;
  login_terakhir?: string;
  role: Role;
}

const initialFormData: InitialForm = {
  email: "",
  username: "",
  nama_lengkap: "",
  role_id: 0,
  jabatan: "",
  login_terakhir: "",
  role: { role_id: 0, nama_role: "", role_permission: [] },
=======
	email: string;
	username: string;
	nama_lengkap: string;
	role_id: number;
	jabatan?: string;
	login_terakhir?: string;
	role: Role;
}

const initialFormData: InitialForm = {
	email: "",
	username: "",
	nama_lengkap: "",
	role_id: 0,
	jabatan: "",
	login_terakhir: "",
	role: { role_id: 0, nama_role: "", role_permission: [] },
>>>>>>> e7d98b4189bc814cc708844ee82c37cc9087fce8
};

/**
 * PR
 * 1. BAGIAN POPUP(FIELD JENJANG DAN TAMPILKAN MASIH BELUM TERBACA DATA API NYA, KARENA TIDAK ADA ASYNC JADI DIPAKAI DATA AWAL)
 */

const UsersManagementPage = () => {
<<<<<<< HEAD
  const { userLoginInfo } = useAppContext();
  const [usersBackup, setUsersBackup] = useState<
    ApiResponse<User>["data"] | []
  >([]);
  const [usersFiltered, setUsersFiltered] = useState<
    ApiResponse<User>["data"] | []
  >([]);
  const [formData, setFormData] = useState<InitialForm>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isLoading, setisLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Filter/Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");

  const [page, setPage] = useState(1);
  const totalData = usersBackup?.length || 0;
  const limit = 10;
  const totalPages = Math.ceil(totalData / limit);

  const fetchUsers = async () => {
    setisLoading(true);
    try {
      const responseData: ApiResponse<User> = await getRequest(`/users`);
      console.log(responseData);

      // const sortData = responseData.data.sort((a: User, b: User) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      const sortData = responseData.data.sort((a: User, b: User) =>
        a.nama_lengkap.localeCompare(b.nama_lengkap),
      );
      setUsersBackup(sortData);
      setUsersFiltered(sortData?.slice(limit * (page - 1), limit * page));
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data user.");
      setUsersBackup(null);
      setIsError(true);
    } finally {
      setisLoading(false);
      setIsError(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setisLoading(true);
    setIsError(false);

    try {
      if (editingId) {
        const dataToSubmit = {
          ...formData,
          updated_at: new Date().toISOString(),
          editor_user_id: userLoginInfo.userInfo.user_id,
        };
        const uploadUsersData = await putRequest(
          `/users/${editingId}`,
          dataToSubmit,
        );
        toast.success(`User dengan id ${editingId} berhasil diupdate!`);
      } else {
        const dataToSubmit = {
          ...formData,
          tanggal_publikasi: formData.login_terakhir
            ? formData.login_terakhir
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          penulis_user_id: userLoginInfo.userInfo.user_id,
          editor_user_id: userLoginInfo.userInfo.user_id,
        };
        const uploadAchievementData = await postRequest("/users", dataToSubmit);
        toast.success("User berhasil ditambahkan!");
        resetForm();
        setOpen(false);
      }
      setisLoading(false);
    } catch (error) {
      toast.error(error.message || "Terjadi kesalahan");
      console.log(error);

      setIsError(true);
    } finally {
      fetchUsers();
      setisLoading(false);
    }
  };

  const executeDelete = async (id: string) => {
    setisLoading(true);
    try {
      const res = await deleteRequest(`/users/${id}`);

      const isLastItemOnPage = usersFiltered.length === 1;
      const shouldGoToPreviousPage = isLastItemOnPage && page > 1;

      if (shouldGoToPreviousPage) {
        setPage((prev) => prev - 1);
      }
      toast.success("User berhasil dihapus!");
    } catch (error) {
      toast.error(error.message || "Terjadi kesalahan");
      setIsError(true);
    } finally {
      fetchUsers();
      setisLoading(false);
    }
  };

  const popupDelete = (id: string) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data user akan dihapus permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        executeDelete(id);
      }
    });
  };

  const openEditDialog = (users: User) => {
    setFormData({
      ...users,
    });
    setEditingId(users.user_id || null);
    setOpen(true);
  };

  const getRoleObjectByName = (role: string) => {
    switch (role) {
      case "Kepala Sekolah PG-TK":
        return "PG-TK";
      case "Kepala Sekolah SD":
        return "SD";
      case "Kepala Sekolah SMP":
        return "SMP";
      default:
        return "SMA";
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // PAGINATION
  useEffect(() => {
    const newTotalData = usersBackup?.length || 0;
    const newTotalPages = Math.ceil(newTotalData / limit);

    if (page > newTotalPages && page > 1) {
      setPage(newTotalPages);
      return;
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const slicedData = usersBackup.slice(startIndex, endIndex);

    setUsersFiltered(slicedData);
  }, [page, usersBackup, limit, setPage]);

  // FILTERING
  useEffect(() => {
    setUsersFiltered(
      usersBackup
        .filter((users) =>
          users.username.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, limit * page),
    );
  }, [searchTerm, filterYear]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Kelola data user</p>
          </div>
          <div className="flex gap-2">
            {/* REFRESH */}
            <Button
              onClick={() => {
                fetchUsers();
                setFilterYear("all");
                setSearchTerm("");
              }}
              disabled={isLoading}
              variant="secondary"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            {/* TAMBAH/EDIT */}
            <Dialog
              open={open}
              onOpenChange={(value) => {
                setOpen(value);
                if (!value) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit User" : "Tambah User"}
                  </DialogTitle>
                  <DialogDescription>
                    Isi informasi user dengan lengkap
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* USERNAME */}
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
                  {/* FULLNAME */}
                  <div className="space-y-2">
                    <Label htmlFor="fullname"></Label>
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
                  {/* EMAIL */}
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
                    <Label
                      htmlFor="role"
                      className="block mb-2.5 text-sm font-medium text-heading"
                    >
                      Role
                    </Label>
                    <Select
                      value={formData.role.nama_role}
                      onValueChange={(newValue) => {
                        const selectedRole = getRoleObjectByName(newValue); // <-- Ganti dengan fungsi lookup Anda
                        setFormData((prev) => ({
                          ...prev,
                          role: selectedRole,
                        }));
                      }}
                    >
                      <SelectTrigger
                        id="role"
                        className="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs"
                      >
                        <SelectValue placeholder="Pilih Role" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Daftar Role</SelectLabel>
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
                  {/* SET PUBLISHED */}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* FILTER */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="pl-10 max-w-sm"
            />
          </div>
        </div>

        {/* DATA GRID */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
            <CardDescription>
              Total {totalData} data | Halaman {page} dari {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>User ID</TableHead>
                  {/* <TableHead>Username</TableHead> */}
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Login Terakhir</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-10"
                    >
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : (
                  usersFiltered &&
                  usersFiltered.map((users: User, index: number) => (
                    <TableRow key={users.user_id}>
                      <TableCell className="font-medium">
                        {(page - 1) * limit + index + 1}
                      </TableCell>
                      <TableCell className="font-medium w-[50px]">
                        {users.user_id}
                      </TableCell>
                      {/* <TableCell className='font-medium'>
												{users.username && users.username.length > 30 ? `${users.username.substring(0, 30)}...` : users.username}
											</TableCell> */}
                      <TableCell className="font-medium">
                        {users.nama_lengkap && users.nama_lengkap.length > 30
                          ? `${users.nama_lengkap.substring(0, 30)}...`
                          : users.nama_lengkap}
                      </TableCell>
                      <TableCell className="font-medium">
                        {users.email && users.email.length > 30
                          ? `${users.email.substring(0, 30)}...`
                          : users.email}
                      </TableCell>
                      <TableCell>
                        {users.login_terakhir && users.login_terakhir
                          ? new Date(users.login_terakhir!).toLocaleDateString(
                              "id-ID",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {users.role.nama_role}
                      </TableCell>
                      {/* <TableCell className='font-medium'>
=======
	const { userLoginInfo } = useAppContext();
	const [usersBackup, setUsersBackup] = useState<ApiResponse<User>["data"] | []>([]);
	const [usersFiltered, setUsersFiltered] = useState<ApiResponse<User>["data"] | []>([]);
	const [formData, setFormData] = useState<InitialForm>(initialFormData);
	const [editingId, setEditingId] = useState<string | null>(null);

	const [isLoading, setisLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	// Filter/Pagination State
	const [searchTerm, setSearchTerm] = useState("");
	const [filterYear, setFilterYear] = useState("all");

	const [page, setPage] = useState(1);
	const totalData = usersBackup?.length || 0;
	const limit = 10;
	const totalPages = Math.ceil(totalData / limit);

	const fetchUsers = async () => {
		setisLoading(true);
		try {
			const responseData: ApiResponse<User> = await getRequest(`/users`);
			console.log(responseData);

			const sortData = responseData.data.sort((a: User, b: User) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
			setUsersBackup(sortData);
			setUsersFiltered(sortData?.slice(limit * (page - 1), limit * page));
		} catch (e) {
			console.error(e);
			toast.error("Gagal memuat data user.");
			setUsersBackup(null);
			setIsError(true);
		} finally {
			setisLoading(false);
			setIsError(false);
		}
	};

	const resetForm = () => {
		setFormData(initialFormData);
		setEditingId(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setisLoading(true);
		setIsError(false);

		try {
			if (editingId) {
				const dataToSubmit = {
					...formData,
					updated_at: new Date().toISOString(),
					editor_user_id: userLoginInfo.userInfo.user_id,
				};
				const uploadUsersData = await putRequest(`/users/${editingId}`, dataToSubmit);
				toast.success(`User dengan id ${editingId} berhasil diupdate!`);
			} else {
				const dataToSubmit = {
					...formData,
					tanggal_publikasi: formData.login_terakhir ? formData.login_terakhir : new Date().toISOString(),
					updated_at: new Date().toISOString(),
					penulis_user_id: userLoginInfo.userInfo.user_id,
					editor_user_id: userLoginInfo.userInfo.user_id,
				};
				const uploadAchievementData = await postRequest("/users", dataToSubmit);
				toast.success("User berhasil ditambahkan!");
				resetForm();
				setOpen(false);
			}
			setisLoading(false);
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
			console.log(error);

			setIsError(true);
		} finally {
			fetchUsers();
			setisLoading(false);
		}
	};

	const executeDelete = async (id: string) => {
		setisLoading(true);
		try {
			const res = await deleteRequest(`/users/${id}`);

			const isLastItemOnPage = usersFiltered.length === 1;
			const shouldGoToPreviousPage = isLastItemOnPage && page > 1;

			if (shouldGoToPreviousPage) {
				setPage((prev) => prev - 1);
			}
			toast.success("User berhasil dihapus!");
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
			setIsError(true);
		} finally {
			fetchUsers();
			setisLoading(false);
		}
	};

	const popupDelete = (id: string) => {
		Swal.fire({
			title: "Apakah Anda yakin?",
			text: "Data user akan dihapus permanen!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#dc2626",
			cancelButtonColor: "#6b7280",
			confirmButtonText: "Ya, Hapus!",
			cancelButtonText: "Batal",
		}).then((result) => {
			if (result.isConfirmed) {
				executeDelete(id);
			}
		});
	};

	const openEditDialog = (users: User) => {
		setFormData({
			...users,
		});
		setEditingId(users.user_id || null);
		setOpen(true);
	};

	const getRoleObjectByName = (role: string) => {
		switch (role) {
			case "Kepala Sekolah PG-TK":
				return "PG-TK";
			case "Kepala Sekolah SD":
				return "SD";
			case "Kepala Sekolah SMP":
				return "SMP";
			default:
				return "SMA";
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	// PAGINATION
	useEffect(() => {
		const newTotalData = usersBackup?.length || 0;
		const newTotalPages = Math.ceil(newTotalData / limit);

		if (page > newTotalPages && page > 1) {
			setPage(newTotalPages);
			return;
		}

		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const slicedData = usersBackup.slice(startIndex, endIndex);

		setUsersFiltered(slicedData);
	}, [page, usersBackup, limit, setPage]);

	// FILTERING
	useEffect(() => {
		setUsersFiltered(usersBackup.filter((users) => users.username.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, limit * page));
	}, [searchTerm, filterYear]);

	return (
		<DashboardLayout>
			<div className='space-y-6'>
				{/* HEADER */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Users</h1>
						<p className='text-muted-foreground'>Kelola data user</p>
					</div>
					<div className='flex gap-2'>
						{/* REFRESH */}
						<Button
							onClick={() => {
								fetchUsers();
								setFilterYear("all");
								setSearchTerm("");
							}}
							disabled={isLoading}
							variant='secondary'
						>
							<RefreshCcw className='h-4 w-4' />
						</Button>
						{/* TAMBAH/EDIT */}
						<Dialog
							open={open}
							onOpenChange={(value) => {
								setOpen(value);
								if (!value) resetForm();
							}}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className='h-4 w-4 mr-2' />
									Tambah User
								</Button>
							</DialogTrigger>
							<DialogContent className='max-w-2xl max-h-[90vh] overflow-scroll'>
								<DialogHeader>
									<DialogTitle>{editingId ? "Edit User" : "Tambah User"}</DialogTitle>
									<DialogDescription>Isi informasi user dengan lengkap</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleSubmit} className='space-y-4'>
									{/* USERNAME */}
									<div className='space-y-2'>
										<Label htmlFor='username'>Username</Label>
										<Input id='username' value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
									</div>
									{/* FULLNAME */}
									<div className='space-y-2'>
										<Label htmlFor='fullname'></Label>
										<Input id='fullname' value={formData.nama_lengkap} onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })} required />
									</div>
									{/* EMAIL */}
									<div className='space-y-2'>
										<Label htmlFor='email'>Email</Label>
										<Input id='email' type='email' value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
									</div>
									<div className='space-y-2'>
										<Label htmlFor='role' className='block mb-2.5 text-sm font-medium text-heading'>
											Role
										</Label>
										<Select
											value={formData.role.nama_role}
											onValueChange={(newValue) => {
												const selectedRole = getRoleObjectByName(newValue); // <-- Ganti dengan fungsi lookup Anda
												setFormData((prev) => ({
													...prev,
													role: selectedRole,
												}));
											}}
										>
											<SelectTrigger
												id='role'
												className='block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs'
											>
												<SelectValue placeholder='Pilih Role' />
											</SelectTrigger>

											<SelectContent>
												<SelectGroup>
													<SelectLabel>Daftar Role</SelectLabel>
													<SelectItem value='Super Administrator'>Super Administrator</SelectItem>
													<SelectItem value='Kepala Sekolah PG-TK'>Kepala Sekolah PG-TK</SelectItem>
													<SelectItem value='Kepala Sekolah SD'>Kepala Sekolah SD</SelectItem>
													<SelectItem value='Kepala Sekolah SMP'>Kepala Sekolah SMP</SelectItem>
													<SelectItem value='Kepala Sekolah SMA'>Kepala Sekolah SMA</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
									</div>
									{/* SET PUBLISHED */}
									<Button type='submit' disabled={isLoading}>
										{isLoading ? "Menyimpan..." : "Simpan"}
									</Button>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{/* FILTER */}
				<div className='flex items-center gap-4'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							placeholder='Cari username...'
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
							}}
							className='pl-10 max-w-sm'
						/>
					</div>
				</div>

				{/* DATA GRID */}
				<Card className='shadow-md'>
					<CardHeader>
						<CardTitle>Daftar User</CardTitle>
						<CardDescription>
							Total {totalData} data | Halaman {page} dari {totalPages}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nomor</TableHead>
									<TableHead>User ID</TableHead>
									{/* <TableHead>Username</TableHead> */}
									<TableHead>Nama</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Login Terakhir</TableHead>
									<TableHead>Role</TableHead>
									<TableHead className='text-right w-[100px]'>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={5} className='text-center text-muted-foreground py-10'>
											Memuat data...
										</TableCell>
									</TableRow>
								) : (
									usersFiltered &&
									usersFiltered.map((users: User, index: number) => (
										<TableRow key={users.user_id}>
											<TableCell className='font-medium'>{(page - 1) * limit + index + 1}</TableCell>
											<TableCell className='font-medium w-[50px]'>{users.user_id}</TableCell>
											{/* <TableCell className='font-medium'>
												{users.username && users.username.length > 30 ? `${users.username.substring(0, 30)}...` : users.username}
											</TableCell> */}
											<TableCell className='font-medium'>
												{users.nama_lengkap && users.nama_lengkap.length > 30 ? `${users.nama_lengkap.substring(0, 30)}...` : users.nama_lengkap}
											</TableCell>
											<TableCell className='font-medium'>
												{users.email && users.email.length > 30 ? `${users.email.substring(0, 30)}...` : users.email}
											</TableCell>
											<TableCell>{users.login_terakhir && users.login_terakhir ? new Date(users.login_terakhir!).toLocaleDateString("id-ID") : "-"}</TableCell>
											<TableCell className='font-medium'>{users.role.nama_role}</TableCell>
											{/* <TableCell className='font-medium'>
>>>>>>> e7d98b4189bc814cc708844ee82c37cc9087fce8
												{users.jenjang_relasi &&
													users.jenjang_relasi.map((item: Jenjang_relasi) => (
														<p key={item.jenjang_id} className={`px-2 py-2 m-1 rounded-full w-fit ${getGradeColors(item.jenjang.kode_jenjang)}`}>
															{item.jenjang.kode_jenjang}
														</p>
													))}
											</TableCell> */}

<<<<<<< HEAD
                      <TableCell className="text-right flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/dashboard/users/${users.user_id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(users)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => popupDelete(users.user_id || "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && usersFiltered && usersFiltered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-10"
                    >
                      {searchTerm !== "" || filterYear !== "all"
                        ? "Tidak ada user yang cocok dengan kriteria filter."
                        : "Belum ada data user."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
=======
											<TableCell className='text-right flex gap-2'>
												<Button size='sm' variant='outline' onClick={() => navigate(`/dashboard/users/${users.user_id}`)}>
													<Eye className='h-4 w-4' />
												</Button>
												<Button size='sm' variant='outline' onClick={() => openEditDialog(users)}>
													<Pencil className='h-4 w-4' />
												</Button>
												<Button size='sm' variant='destructive' onClick={() => popupDelete(users.user_id || "")}>
													<Trash2 className='h-4 w-4' />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
								{!isLoading && usersFiltered && usersFiltered.length === 0 && (
									<TableRow>
										<TableCell colSpan={9} className='text-center text-muted-foreground py-10'>
											{searchTerm !== "" || filterYear !== "all" ? "Tidak ada user yang cocok dengan kriteria filter." : "Belum ada data user."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
>>>>>>> e7d98b4189bc814cc708844ee82c37cc9087fce8
};

export default UsersManagementPage;
