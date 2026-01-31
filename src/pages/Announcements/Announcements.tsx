import React, { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, RefreshCcw, Eye, Cloud, CloudUploadIcon, UserIcon, CalendarIcon, LayersIcon } from "lucide-react";
import { deleteRequest, getRequest, postRequest, putRequest } from "@/utils/api-call";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";
import { useNavigate } from "react-router-dom";
import DashboardPagination from "@/components/sections/dashboardPagination";
import { ApiResponse, Jenjang, Pengumuman } from "@/types/data";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/utils/time-format";

interface InitialForm {
	pengumuman_id: string;
	judul: string;
	deskripsi: string;
	konten: string;
	penulis_user_id: string;
	editor_user_id: string | null;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	updated_at: string;
	jenjang_relasi: JenjangRelasi[];
}

type JenjangRelasi = {
	pengumuman_id?: string;
	jenjang_id?: string;
	jenjang?: Jenjang;
};

const initialFormData: InitialForm = {
	pengumuman_id: "",
	judul: "",
	deskripsi: "",
	konten: "",
	penulis_user_id: "",
	editor_user_id: "",
	tanggal_publikasi: "",
	is_published: true,
	is_featured: true,
	updated_at: "",
	jenjang_relasi: [
		{
			jenjang_id: "",
			pengumuman_id: "",
			jenjang: {
				jenjang_id: "",
				nama_jenjang: "",
				kode_jenjang: "",
			},
		},
	],
};

const AnnouncementsPage = () => {
	const { userLoginInfo } = useAppContext();
	const [announcementsBackup, setAnnouncementsBackup] = useState<ApiResponse<Pengumuman>["data"] | []>([]);
	const [announcementsFiltered, setAnnouncementsFiltered] = useState<ApiResponse<Pengumuman>["data"] | []>([]);
	const [jenjang, setJenjang] = useState<Jenjang[]>([]);
	const [formData, setFormData] = useState<InitialForm>(initialFormData);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [openPreviewDialog, setOpenPreviewDialog] = useState<string | null>(null);
	const [previewData, setPreviewData] = useState<Pengumuman | null>(null);

	const [isLoading, setisLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

	// Filter/Pagination State
	const [searchTerm, setSearchTerm] = useState("");
	const [filterYear, setFilterYear] = useState("all");

	const [page, setPage] = useState(1);
	const totalData = announcementsBackup?.length || 0;
	const limit = 10;
	const totalPages = Math.ceil(totalData / limit);

	const fetchAnnouncements = async () => {
		setisLoading(true);
		try {
			const responseData = await getRequest(`/pengumuman?page=1&limit=1000`);
			const fetchJenjang = await getRequest(`/jenjang`);

			// const sortData = responseData.data.sort((a: Pengumuman, b: Pengumuman) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
			const sortData = responseData.data.sort((a: Pengumuman, b: Pengumuman) =>a.judul.localeCompare(b.judul));
			setAnnouncementsBackup(sortData);
			setAnnouncementsFiltered(sortData.slice(limit * (page - 1), limit * page));
			setJenjang(fetchJenjang.data);
		} catch (e) {
			console.error(e);
			toast.error("Gagal memuat data pengumuman.");
			setAnnouncementsBackup(null);
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
				const uploadAchievementData = await putRequest(`/pengumuman/${editingId}`, dataToSubmit);

				toast.success(`Pengumuman dengan id ${editingId} berhasil diupdate!`);
			} else {
				const dataToSubmit = {
					...formData,
					tanggal_publikasi: formData.tanggal_publikasi ? formData.tanggal_publikasi : new Date().toISOString(),
					updated_at: new Date().toISOString(),
					penulis_user_id: userLoginInfo.userInfo.user_id,
					editor_user_id: userLoginInfo.userInfo.user_id,
				};
				const uploadAchievementData = await postRequest("/pengumuman", dataToSubmit);
				toast.success("Pengumuman berhasil ditambahkan!");
				resetForm();
				setOpen(false);
			}
			setisLoading(false);
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
			console.log(error);

			setIsError(true);
		} finally {
			fetchAnnouncements();
			setisLoading(false);
		}
	};

	const executeDelete = async (id: string) => {
		setisLoading(true);
		try {
			const res = await deleteRequest(`/pengumuman/${id}`);

			const isLastItemOnPage = announcementsFiltered.length === 1;
			const shouldGoToPreviousPage = isLastItemOnPage && page > 1;

			if (shouldGoToPreviousPage) {
				setPage((prev) => prev - 1);
			}
			toast.success("Pengumuman berhasil dihapus!");
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
			setIsError(true);
		} finally {
			fetchAnnouncements();
			setisLoading(false);
		}
	};

	const popupDelete = (id: string) => {
		Swal.fire({
			title: "Apakah Anda yakin?",
			text: "Data pengumuman akan dihapus permanen!",
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

	const openEditDialog = (announcements: Pengumuman) => {
		const formattedDate = announcements.tanggal_publikasi ? new Date(announcements.tanggal_publikasi!).toISOString().split("T")[0] : "";

		setFormData({
			pengumuman_id: announcements.pengumuman_id,
			judul: announcements.judul,
			deskripsi: announcements.deskripsi,
			konten: announcements.konten,
			tanggal_publikasi: formattedDate,
			is_published: announcements.is_published,
			is_featured: announcements.is_featured,
			updated_at: announcements.updated_at,
			penulis_user_id: announcements.penulis_user_id,
			editor_user_id: announcements.editor_user_id,
			jenjang_relasi: announcements.jenjang_relasi,
		});
		setEditingId(announcements.pengumuman_id || null);
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

	useEffect(() => {
		fetchAnnouncements();
	}, []);

	// PAGINATION
	useEffect(() => {
		const newTotalData = announcementsBackup?.length || 0;
		const newTotalPages = Math.ceil(newTotalData / limit);

		if (page > newTotalPages && page > 1) {
			setPage(newTotalPages);
			return;
		}

		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;
		const slicedData = announcementsBackup.slice(startIndex, endIndex);

		setAnnouncementsFiltered(slicedData);
	}, [page, announcementsBackup, limit, setPage]);

	// FILTERING
	useEffect(() => {
		setAnnouncementsFiltered(
			announcementsBackup.filter((announcements) => announcements.judul.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, limit * page),
		);
	}, [searchTerm, filterYear]);

	return (
		<DashboardLayout>
			<div className='space-y-6'>
				{/* HEADER */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Pengumuman</h1>
						<p className='text-muted-foreground'>Kelola data pengumuman sekolah</p>
					</div>
					<div className='flex gap-2'>
						{/* REFRESH */}
						<Button
							onClick={() => {
								fetchAnnouncements();
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
									Tambah Pengumuman
								</Button>
							</DialogTrigger>
							<DialogContent className='max-w-2xl max-h-[90vh] overflow-scroll'>
								<DialogHeader>
									<DialogTitle>{editingId ? "Edit Pengumuman" : "Tambah Pengumuman"}</DialogTitle>
									<DialogDescription>Isi informasi pengumuman dengan lengkap</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleSubmit} className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='title'>Judul Pengumuman</Label>
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
																			? [...prev.jenjang_relasi, { pengumuman_id: formData.pengumuman_id, jenjang_id: item.jenjang_id, jenjang: item }]
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

						{/* PREVIEW */}
					</div>
				</div>

				{/* FILTER */}
				<div className='flex items-center gap-4'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							placeholder='Cari judul pengumuman...'
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
						<CardTitle>Daftar Pengumuman</CardTitle>
						<CardDescription>
							Total {totalData} data | Halaman {page} dari {totalPages}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nomor</TableHead>
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
									announcementsFiltered &&
									announcementsFiltered.map((announcements: Pengumuman, index: number) => (
										<TableRow key={announcements.pengumuman_id}>
											<TableCell className='font-medium'>{(page - 1) * limit + index + 1}</TableCell>
											<TableCell className='font-medium'>
												{announcements.judul && announcements.judul.length > 30 ? `${announcements.judul.substring(0, 30)}...` : announcements.judul}
											</TableCell>
											<TableCell className='font-medium'>
												{announcements.deskripsi && announcements.deskripsi.length > 30
													? `${announcements.deskripsi.substring(0, 30)}...`
													: announcements.deskripsi}
											</TableCell>
											<TableCell className='font-medium'>
												{announcements.konten && announcements.konten.length > 30 ? `${announcements.konten.substring(0, 30)}...` : announcements.konten}
											</TableCell>
											<TableCell className='font-medium'>{announcements.is_published && announcements.is_published ? "Ya" : "Tidak"}</TableCell>
											<TableCell>
												{announcements.tanggal_publikasi && announcements.tanggal_publikasi
													? new Date(announcements.tanggal_publikasi!).toLocaleDateString("id-ID")
													: "-"}
											</TableCell>
											<TableCell className='font-medium'>
												{announcements.jenjang_relasi &&
													announcements.jenjang_relasi.map((item) => (
														<p key={item.jenjang_id} className={`px-2 py-2 m-1 rounded-full w-fit ${getGradeColors(item.jenjang.kode_jenjang)}`}>
															{item.jenjang.kode_jenjang}
														</p>
													))}
											</TableCell>
											<TableCell className='text-right flex gap-2'>
												<Button
													size='sm'
													variant='outline'
													onClick={() => {
														setPreviewData(announcements);
														setOpenPreviewDialog(announcements.pengumuman_id);
													}}
												>
													<Eye className='h-4 w-4' />
												</Button>
												<Button size='sm' variant='outline' onClick={() => openEditDialog(announcements)}>
													<Pencil className='h-4 w-4' />
												</Button>
												<Button size='sm' variant='destructive' onClick={() => popupDelete(announcements.pengumuman_id || "")}>
													<Trash2 className='h-4 w-4' />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
								{!isLoading && announcementsFiltered && announcementsFiltered.length === 0 && (
									<TableRow>
										<TableCell colSpan={9} className='text-center text-muted-foreground py-10'>
											{searchTerm !== "" || filterYear !== "all" ? "Tidak ada pengumuman yang cocok dengan kriteria filter." : "Belum ada data pengumuman."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* PREVIEW DIALOG */}
				<OpenPreviewDialog data={previewData} pengumuman_id={openPreviewDialog} setOpenPreviewDialog={setOpenPreviewDialog} />

				{/* PAGINATION */}
				<DashboardPagination page={page} handlePageChange={handlePageChange} totalPages={totalPages} />
			</div>
		</DashboardLayout>
	);
};

const OpenPreviewDialog = ({
	data,
	pengumuman_id,
	setOpenPreviewDialog,
}: {
	data: Pengumuman;
	pengumuman_id: string;
	setOpenPreviewDialog: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
	useEffect(() => {
		console.log(data);
	}, []);

	const getColors = (jenjang: string) => {
		switch (jenjang) {
			case "PG-TK":
				return "bg-red-500";
			case "SD":
				return "bg-yellow-500";
			case "SMP":
				return "bg-green-500";
			default:
				return "bg-blue-500";
		}
	};
	return (
		data && (
			<Dialog open={!!pengumuman_id} onOpenChange={() => setOpenPreviewDialog(null)}>
				<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<div className='flex justify-between items-start'>
							<div>
								<DialogTitle className='text-2xl font-bold'>{data.judul || "Tanpa Judul"}</DialogTitle>
								<DialogDescription className='mt-2 text-sm'>ID Pengumuman: {pengumuman_id}</DialogDescription>
							</div>
							<div className='flex gap-2'>
								<Badge variant={data.is_published ? "default" : "secondary"}>{data.is_published ? "Published" : "Draft"}</Badge>
								{data.is_featured && (
									<Badge variant='outline' className='border-yellow-500 text-yellow-600'>
										Featured
									</Badge>
								)}
							</div>
						</div>
					</DialogHeader>

					<div className='space-y-6 py-4'>
						{/* Metadata Info */}
						<div className='grid grid-cols-2 gap-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg'>
							<div className='flex items-center gap-2'>
								<UserIcon className='w-4 h-4' />
								<span>Penulis: {data.penulis.nama_lengkap}</span>
							</div>
							<div className='flex items-center gap-2'>
								<CalendarIcon className='w-4 h-4' />
								<span>Publikasi: {formatTime(data.tanggal_publikasi, "DD MMMM yyyy")}</span>
							</div>
						</div>

						{/* Jenjang Badges */}
						<div className='space-y-2'>
							<div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
								<LayersIcon className='w-4 h-4' />
								<span>Jenjang Sasaran:</span>
							</div>
							<div className='flex flex-wrap gap-2'>
								{data.jenjang_relasi.length > 0 ? (
									data.jenjang_relasi.map((j) => (
										<Badge key={j.jenjang_id} variant='outline' className={getColors(j.jenjang.kode_jenjang)}>
											{j.jenjang.kode_jenjang}
										</Badge>
									))
								) : (
									<span className='text-sm text-muted-foreground italic'>Semua Jenjang</span>
								)}
							</div>
						</div>

						{/* Content Area */}
						<div className='space-y-2'>
							<h4 className='font-semibold border-b pb-1'>Deskripsi</h4>
							<p className='text-sm text-muted-foreground leading-relaxed'>{data.deskripsi || "Tidak ada deskripsi."}</p>
						</div>

						<div className='space-y-2'>
							<h4 className='font-semibold border-b pb-1'>Konten Utama</h4>
							<div className='text-sm prose prose-sm max-w-none' dangerouslySetInnerHTML={{ __html: data.konten || "<i>Konten kosong</i>" }} />
						</div>
					</div>

					<DialogFooter className='sm:justify-end'>
						<Button type='button' variant='secondary' onClick={() => setOpenPreviewDialog(null)}>
							Tutup Preview
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	);
};

export default AnnouncementsPage;
