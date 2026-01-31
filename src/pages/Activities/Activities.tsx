import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, RefreshCcw, Eye, Cloud, CloudUploadIcon, CheckIcon, MinusIcon } from "lucide-react";
import { deleteRequest, getRequest, postRequest, putRequest } from "@/utils/api-call";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";
import { useNavigate } from "react-router-dom";
import DashboardPagination from "@/components/sections/dashboardPagination";
import { ApiResponse, Jenjang, Jenjang_relasi, Kegiatan } from "@/types/data";

interface InitialForm {
	kegiatan_id: string;
	judul: string;
	deskripsi: string;
	konten: string;
	path_gambar: string;
	penulis_user_id: string;
	editor_user_id: string | null;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	updated_at: string;
	jenjang_relasi: JenjangRelasi[];
}

type JenjangRelasi = {
	kegiatan_id: string;
	jenjang_id: string;
	jenjang: Jenjang;
};

const initialFormData: InitialForm = {
	kegiatan_id: "",
	judul: "",
	deskripsi: "",
	konten: "",
	path_gambar: "",
	penulis_user_id: "",
	editor_user_id: "",
	tanggal_publikasi: "",
	is_published: true,
	is_featured: true,
	updated_at: "",
	jenjang_relasi: [
		{
			jenjang_id: "",
			kegiatan_id: "",
			jenjang: {
				jenjang_id: "",
				nama_jenjang: "",
				kode_jenjang: "",
			},
		},
	],
};

/**
 * PR
 * 1. BAGIAN POPUP(FIELD JENJANG DAN TAMPILKAN MASIH BELUM TERBACA DATA API NYA, KARENA TIDAK ADA ASYNC JADI DIPAKAI DATA AWAL)
 */

const BASE_URL = import.meta.env.VITE_BASE_URL;
const Activities = () => {
	const { userLoginInfo } = useAppContext();
	const [activitiesBackup, setAchievementsBackup] = useState<ApiResponse<Kegiatan>["data"] | []>([]);
	const [activitiesFiltered, setAchievementsFiltered] = useState<ApiResponse<Kegiatan>["data"] | []>([]);
	const [jenjang, setJenjang] = useState<Jenjang[]>([]);
	const [gambar, setGambar] = useState<File | null>(null);
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
	const totalData = activitiesBackup?.length || 0;
	const limit = 10;
	const totalPages = Math.ceil(totalData / limit);

	const fetchAchievements = async () => {
		setisLoading(true);
		try {
			const responseData: ApiResponse<Kegiatan> = await getRequest(`/kegiatan?page=1&limit=1000`);
			const fetchJenjang = await getRequest(`/jenjang`);
			const sortData = responseData.data.sort((a: Kegiatan, b: Kegiatan) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

			setAchievementsBackup(sortData);
			setAchievementsFiltered(sortData?.slice(limit * (page - 1), limit * page));
			setJenjang(fetchJenjang.data);
		} catch (e) {
			console.error(e);
			toast.error("Gagal memuat data kegiatan.");
			setAchievementsBackup(null);
			setIsError(true);
		} finally {
			setisLoading(false);
			setIsError(false);
		}
	};

	const resetForm = () => {
		setFormData(initialFormData);
		setGambar(null);
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
				const uploadAchievementData = await putRequest(`/kegiatan/${editingId}`, dataToSubmit);

				if (gambar) {
					const foto = new FormData();
					foto.append("image", gambar);
					foto.append("alt", formData.path_gambar);

					const uploadFoto = await postRequest("/galleries/add/activities", foto);
					toast.success(`Foto berhasil diupdate!`);
				}
				toast.success(`Kegiatan dengan id ${editingId} berhasil diupdate!`);
			} else {
				const dataToSubmit = {
					...formData,
					tanggal_publikasi: formData.tanggal_publikasi ? formData.tanggal_publikasi : new Date().toISOString(),
					updated_at: new Date().toISOString(),
					penulis_user_id: userLoginInfo.userInfo.user_id,
					editor_user_id: userLoginInfo.userInfo.user_id,
				};
				const uploadAchievementData = await postRequest("/kegiatan", dataToSubmit);
				if (gambar) {
					const foto = new FormData();
					foto.append("image", gambar);
					const uploadFoto = await postRequest("/galleries/add/activities", {
						file: foto,
						alt: formData.path_gambar,
					});
					toast.success(`Foto berhasil diunggah!`);
				}
				toast.success("Kegiatan berhasil ditambahkan!");
				resetForm();
				setOpen(false);
			}
			setisLoading(false);
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
			console.log(error);

			setIsError(true);
		} finally {
			fetchAchievements();
			setisLoading(false);
		}
	};

	const executeDelete = async (id: string) => {
		setisLoading(true);
		try {
			const res = await deleteRequest(`/kegiatan/${id}`);

			const isLastItemOnPage = activitiesFiltered.length === 1;
			const shouldGoToPreviousPage = isLastItemOnPage && page > 1;

			if (shouldGoToPreviousPage) {
				setPage((prev) => prev - 1);
			}
			toast.success("Kegiatan berhasil dihapus!");
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
			setIsError(true);
		} finally {
			fetchAchievements();
			setisLoading(false);
		}
	};

	const popupDelete = (id: string) => {
		Swal.fire({
			title: "Apakah Anda yakin?",
			text: "Data kegiatan akan dihapus permanen!",
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

	const openEditDialog = (achievement: Kegiatan) => {
		const formattedDate = achievement.tanggal_publikasi ? new Date(achievement.tanggal_publikasi!).toISOString().split("T")[0] : "";

		setFormData({
			kegiatan_id: achievement.kegiatan_id,
			judul: achievement.judul,
			deskripsi: achievement.deskripsi,
			konten: achievement.konten,
			path_gambar: achievement.path_gambar || "",
			tanggal_publikasi: formattedDate,
			is_published: achievement.is_published,
			is_featured: achievement.is_featured,
			updated_at: achievement.updated_at,
			penulis_user_id: achievement.penulis_user_id,
			editor_user_id: achievement.editor_user_id,
			jenjang_relasi: achievement.jenjang_relasi,
		});

		setEditingId(achievement.kegiatan_id || null);
		setGambar(null);
		setOpen(true);
	};

	const achievementYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		const years = Array.from({ length: 10 }, (_, i) => currentYear - i).map((y) => y.toString());
		return years;
	}, []);

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setPage(page);
		}
	};

	const getGradeColors = (grade: string) => {
		switch (grade) {
			case "PG-TK":
				return "bg-green-300";
			case "SD":
				return "bg-yellow-300";
			case "SMP":
				return "bg-red-300";
			default:
				return "bg-blue-300";
		}
	};

	const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const fileName = file.name;

			const reader = new FileReader();
			reader.onload = () => {
				setFormData((prev) => ({
					...prev,
					path_gambar: "activities/" + fileName,
				}));
				setGambar(file);
			};
			reader.readAsDataURL(file);
		}
	};

	useEffect(() => {
		fetchAchievements();
	}, []);

	// PAGINATION
	useEffect(() => {
		const newTotalData = activitiesBackup?.length || 0;
		const newTotalPages = Math.ceil(newTotalData / limit);

		if (page > newTotalPages && page > 1) {
			setPage(newTotalPages);
			return;
		}

		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const slicedData = activitiesBackup.slice(startIndex, endIndex);

		setAchievementsFiltered(slicedData);
	}, [page, activitiesBackup, limit, setPage]);

	// FILTERING
	useEffect(() => {
		setAchievementsFiltered(
			activitiesBackup.filter((achievement) => achievement.judul.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, limit * page),
		);
	}, [searchTerm, filterYear]);

	return (
		<DashboardLayout>
			<div className='space-y-6'>
				{/* HEADER */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Kegiatan</h1>
						<p className='text-muted-foreground'>Kelola data kegiatan sekolah</p>
					</div>
					<div className='flex gap-2'>
						{/* REFRESH */}
						<Button
							onClick={() => {
								fetchAchievements();
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
									Tambah Kegiatan
								</Button>
							</DialogTrigger>
							<DialogContent className='max-w-2xl max-h-[90vh] overflow-scroll'>
								<DialogHeader>
									<DialogTitle>{editingId ? "Edit Kegiatan" : "Tambah Kegiatan"}</DialogTitle>
									<DialogDescription>Isi informasi kegiatan dengan lengkap</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleSubmit} className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='title'>Judul Kegiatan</Label>
										<Input id='title' value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} required />
									</div>
									{/* DESKRIPSI */}
									<div className='space-y-2'>
										<Label htmlFor='description'>Deskripsi</Label>
										<Textarea
											id='description'
											value={formData.deskripsi}
											onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
											rows={4}
											required
										/>
									</div>
									{/* TANGGAL */}
									<div className='space-y-2'>
										<Label htmlFor='achievement_date'>Tanggal</Label>
										<Input
											id='achievement_date'
											type='date'
											value={formData.tanggal_publikasi}
											onChange={(e) => setFormData({ ...formData, tanggal_publikasi: e.target.value })}
										/>
									</div>
									{/* GAMBAR */}
									<div className='space-y-2'>
										<Label htmlFor='image'>Gambar Kegiatan</Label>
										<div className='flex items-center justify-center w-full border-2 rounded-sm overflow-hidden max-h-[300px]'>
											{gambar ? (
												/* 1. Prioritas Utama: Jika user baru saja pilih file (Add/Edit mode), tampilkan preview local */
												<img src={URL.createObjectURL(gambar)} alt='Preview' className='w-full h-auto object-cover' />
											) : formData.path_gambar ? (
												/* 2. Jika tidak ada file baru, tapi ada path dari API (Edit mode) */
												<img
													src={`${BASE_URL}/${formData.path_gambar}`}
													alt='Gambar Kegiatan'
													className='w-full h-auto object-cover min-h-20 flex items-center justify-center'
												/>
											) : (
												/* 3. Jika keduanya kosong (Add mode awal atau data memang kosong) */
												<p className='py-10 text-neutral-500'>Tidak ada gambar</p>
											)}
										</div>
									</div>
									<div className='flex items-center justify-center w-full'>
										<Label
											htmlFor='dropzone-file'
											className='flex flex-col items-center justify-center w-full h-64 bg-neutral-secondary-medium rounded-sm border-2 border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium'
										>
											<div className='flex flex-col items-center justify-center text-body pt-5 pb-6'>
												<CloudUploadIcon className='w-8 h-8 mb-4' />
												<p className='mb-2 text-sm'>
													<span className='font-semibold'>Click to upload</span> or drag and drop
												</p>
												<p className='text-xs'>SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
											</div>
											<Input id='dropzone-file' type='file' className='hidden' accept='image/*' onChange={handleUploadImage} multiple={false} />
										</Label>
									</div>
									{/* KONTEN */}
									<div className='space-y-2'>
										<Label htmlFor='content'>Konten Lengkap</Label>
										<Textarea id='content' value={formData.konten} onChange={(e) => setFormData({ ...formData, konten: e.target.value })} rows={8} />
									</div>
									{/* JENJANG - HANYA SUPER ADMINISTRATOR*/}
									<div className='grid gap-4'>
										<Label htmlFor=''>Jenjang</Label>
										<div className='grid grid-cols-2 gap-4'>
											{jenjang &&
												jenjang.map((item, idx) => {
													return (
														<div
															className={`flex items-center ps-4  rounded-sm group border border-default bg-neutral-primary-soft rounded-base ${
																formData.jenjang_relasi.some((id) => id.jenjang_id === item.jenjang_id) && "border-blue-500"
															}`}
														>
															<Input
																id={`jenjang-${item.kode_jenjang}`}
																type='checkbox'
																value={item.jenjang_id}
																checked={formData.jenjang_relasi.some((id) => id.jenjang_id === item.jenjang_id)}
																name='jenjang'
																className='w-4 h-4 text-neutral-primary border-default-medium bg-neutral-secondary-medium rounded-full checked:border-brand focus:ring-2 focus:outline-none focus:ring-brand-subtle border border-default appearance-none'
																onChange={(e) => {
																	setFormData((prev) => ({
																		...prev,
																		jenjang_relasi: e.target.checked
																			? [...prev.jenjang_relasi, { kegiatan_id: formData.kegiatan_id, jenjang_id: item.jenjang_id, jenjang: item }]
																			: prev.jenjang_relasi.filter((id) => id.jenjang_id !== item.jenjang_id),
																	}));
																}}
															/>
															<Label htmlFor={`jenjang-${item.kode_jenjang}`} className='w-full py-4 select-none ms-2 text-sm font-medium text-heading'>
																{item.nama_jenjang}
															</Label>
														</div>
													);
												})}
										</div>
									</div>
									{/* TAMPILKAN */}
									<div className='grid gap-4'>
										<Label htmlFor=''>Tampilkan</Label>
										<div className='grid grid-cols-2 gap-4'>
											<div
												className={`flex items-center ps-4 rounded-sm group border border-default bg-neutral-primary-soft rounded-base ${
													formData.is_published && "border-blue-500"
												}`}
											>
												<Input
													id={`is_published_true`}
													type='checkbox'
													checked={formData.is_published}
													name='is_published'
													className='group-checked:border-red-600 w-4 h-4 text-neutral-primary border-default-medium bg-neutral-secondary-medium rounded-full checked:border-brand focus:ring-2 focus:outline-none focus:ring-brand-subtle border border-default appearance-none'
													onChange={(e) =>
														setFormData((prev) => ({
															...prev,
															is_published: prev.is_published ? true : e.target.checked,
														}))
													}
												/>
												<Label htmlFor={`is_published_true`} className='w-full py-4 select-none ms-2 text-sm font-medium text-heading'>
													Ya
												</Label>
											</div>
											<div
												className={`flex items-center ps-4 rounded-sm group border border-default bg-neutral-primary-soft rounded-base ${
													!formData.is_published && "border-blue-500"
												}`}
											>
												<Input
													id={`is_published_false`}
													type='checkbox'
													checked={!formData.is_published}
													name='is_published'
													className='w-4 h-4 text-neutral-primary border-default-medium bg-neutral-secondary-medium rounded-full checked:border-brand focus:ring-2 focus:outline-none focus:ring-brand-subtle border border-default appearance-none'
													onChange={(e) =>
														setFormData((prev) => ({
															...prev,
															is_published: prev.is_published ? false : e.target.checked,
														}))
													}
												/>
												<Label htmlFor={`is_published_false`} className='w-full py-4 select-none ms-2 text-sm font-medium text-heading'>
													Tidak
												</Label>
											</div>
										</div>
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
							placeholder='Cari judul kegiatan...'
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
							}}
							className='pl-10 max-w-sm'
						/>
					</div>

					<div className='space-x-2 flex items-center'>
						<Label htmlFor='filter-year' className='text-sm font-medium'>
							Tahun:
						</Label>
						<Select
							value={filterYear}
							onValueChange={(value) => {
								setFilterYear(value);
							}}
						>
							<SelectTrigger id='filter-year' className='w-[150px]'>
								<SelectValue placeholder='Semua Tahun' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Semua Tahun</SelectItem>
								{achievementYears.map((year) => (
									<SelectItem key={year} value={year}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* DATA GRID */}
				<Card className='shadow-md'>
					<CardHeader>
						<CardTitle>Daftar Kegiatan</CardTitle>
						<CardDescription>
							Total {totalData} data | Halaman {page} dari {totalPages}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nomor</TableHead>
									<TableHead>Gambar</TableHead>
									<TableHead>Judul</TableHead>
									<TableHead>Deskripsi</TableHead>
									<TableHead>Konten</TableHead>
									<TableHead>Tampilkan</TableHead>
									<TableHead className='w-[150px]'>Tanggal</TableHead>
									<TableHead className='w-[150px]'>Jenjang</TableHead>
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
									activitiesFiltered &&
									activitiesFiltered.map((achievement, index) => (
										<TableRow key={achievement.kegiatan_id}>
											<TableCell className='font-medium'>{(page - 1) * limit + index + 1}</TableCell>
											<TableCell className='font-medium'>
												<div style={{ height: "100px", width: "100px", overflow: "hidden" }}>
													<img loading='lazy' height={100} width={100} src={`${BASE_URL}/${achievement.path_gambar}`} alt='' />
												</div>
											</TableCell>
											<TableCell className='font-medium'>
												{achievement.judul && achievement.judul.length > 30 ? `${achievement.judul.substring(0, 30)}...` : achievement.judul}
											</TableCell>
											<TableCell className='font-medium'>
												{achievement.deskripsi && achievement.deskripsi.length > 30 ? `${achievement.deskripsi.substring(0, 30)}...` : achievement.deskripsi}
											</TableCell>
											<TableCell className='font-medium'>
												{achievement.konten && achievement.konten.length > 30 ? `${achievement.konten.substring(0, 30)}...` : achievement.konten}
											</TableCell>
											<TableCell className='font-medium'>{achievement.is_published ? "Ya" : "Tidak"}</TableCell>
											<TableCell>
												{achievement.tanggal_publikasi && achievement.tanggal_publikasi
													? new Date(achievement.tanggal_publikasi!).toLocaleDateString("id-ID")
													: "-"}
											</TableCell>
											<TableCell className='font-medium'>
												{achievement.jenjang_relasi &&
													achievement.jenjang_relasi.map((item: Jenjang_relasi) => {
														return (
															<p key={item.jenjang_id} className={`px-2 py-2 m-1 rounded-full w-fit ${getGradeColors(item.jenjang.kode_jenjang)}`}>
																{item.jenjang.kode_jenjang}
															</p>
														);
													})}
											</TableCell>
											<TableCell className='text-right flex gap-2'>
												<Button size='sm' variant='outline' onClick={() => navigate(`/dashboard/activities/${achievement.kegiatan_id}`)}>
													<Eye className='h-4 w-4' />
												</Button>
												<Button size='sm' variant='outline' onClick={() => openEditDialog(achievement)}>
													<Pencil className='h-4 w-4' />
												</Button>
												<Button size='sm' variant='destructive' onClick={() => popupDelete(achievement.kegiatan_id || "")}>
													<Trash2 className='h-4 w-4' />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
								{!isLoading && activitiesFiltered && activitiesFiltered.length === 0 && (
									<TableRow>
										<TableCell colSpan={9} className='text-center text-muted-foreground py-10'>
											{searchTerm !== "" || filterYear !== "all" ? "Tidak ada kegiatan yang cocok dengan kriteria filter." : "Belum ada data kegiatan."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* PAGINATION */}
				<DashboardPagination key={"activities-pagination"} page={page} handlePageChange={handlePageChange} totalPages={totalPages} />
			</div>
		</DashboardLayout>
	);
};

export default Activities;
