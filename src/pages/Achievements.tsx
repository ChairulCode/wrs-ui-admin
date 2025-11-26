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
import { Plus, Pencil, Trash2, Search, RefreshCcw } from "lucide-react";
import { deleteRequest, getRequest, postRequest, putRequest } from "@/utils/api-call";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import { useAppContext } from "@/utils/app-context";

export interface Achievement {
	berita_id?: string;
	judul?: string;
	slug?: string;
	ringkasan?: string;
	konten_lengkap?: string;
	kategori_id?: string;
	gambar_utama?: string;
	tanggal_publikasi?: string;
	is_published?: boolean;
	penulis_user_id?: string;
	tags?: string;
	views_count?: number;
	is_featured?: boolean;
	created_at?: string;
	updated_at?: string;
	editor_user_id?: string;
}

export interface Metadata {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	limit: number;
}

export interface AchievementResponse {
	message: string;
	metadata: Metadata;
	data: Achievement[];
}

const initialFormData: Achievement = {
	judul: "",
	ringkasan: "",
	konten_lengkap: "",
	gambar_utama: "",
	editor_user_id: "",
	penulis_user_id: "",
	tanggal_publikasi: "",
};

const Achievements = () => {
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [achievementsFiltered, setAchievementsFiltered] = useState<Achievement[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [formData, setFormData] = useState<Achievement>(initialFormData);
	const { userLoginInfo } = useAppContext();

	// Filter/Pagination State
	const [searchTerm, setSearchTerm] = useState("");
	const [filterYear, setFilterYear] = useState("all");
	const [metadata, setMetadata] = useState<Metadata>({
		totalItems: 0,
		totalPages: 1,
		currentPage: 1,
		limit: 20,
	});

	const currentPage = metadata.currentPage;
	const totalPages = metadata.totalPages;
	const totalItems = metadata.totalItems;
	const itemsPerPage = metadata.limit;

	const fetchAchievements = async () => {
		setLoading(true);
		try {
			const queryParams = new URLSearchParams({
				page: currentPage.toString(),
				limit: itemsPerPage.toString(),
			});

			const res = await getRequest(`/berita?${queryParams.toString()}`);
			const responseData: AchievementResponse = res;

			setAchievements(responseData.data || []);
			setAchievementsFiltered(responseData.data || []);
			setMetadata(responseData.metadata);
		} catch (e) {
			console.error(e);
			toast.error("Gagal memuat data prestasi.");
			setAchievements([]);
			setMetadata((prev) => ({ ...prev, totalItems: 0, totalPages: 1 }));
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFormData(initialFormData);
		setEditingId(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			if (editingId) {
				const dataToSubmit: Achievement = {
					...formData,
					tanggal_publikasi: formData.tanggal_publikasi ? `${formData.tanggal_publikasi}T00:00:00Z` : null,
					editor_user_id: userLoginInfo.userInfo.user_id,
				};
				const res = await putRequest(`/berita/${editingId}`, dataToSubmit);

				if (res.status !== 200) throw new Error(res.message || "Gagal mengupdate data.");
				toast.success("Prestasi berhasil diupdate!");
			} else {
				const dataToSubmit: Achievement = {
					...formData,
					tanggal_publikasi: formData.tanggal_publikasi ? `${formData.tanggal_publikasi}T00:00:00Z` : null,
					editor_user_id: userLoginInfo.userInfo.user_id,
					penulis_user_id: userLoginInfo.userInfo.user_id,
				};
				const res = await postRequest("/berita", dataToSubmit);
				if (res.status !== 201) throw new Error(res.message || "Gagal menambahkan data.");
				toast.success("Prestasi berhasil ditambahkan!");
			}
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
		} finally {
			resetForm();
			setOpen(false);
			fetchAchievements();
			setLoading(false);
		}
	};

	const executeDelete = async (id: string) => {
		setLoading(true);
		try {
			const res = await deleteRequest(`/berita/${id}`);

			if (res.status !== 200) throw new Error(res.message || "Gagal menghapus data.");
			const isLastItemOnPage = achievements.length === 1;
			const shouldGoToPreviousPage = isLastItemOnPage && currentPage > 1;

			if (shouldGoToPreviousPage) {
				setMetadata((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
			}
			toast.success("Prestasi berhasil dihapus!");
		} catch (error) {
			toast.error(error.message || "Terjadi kesalahan");
		} finally {
			fetchAchievements();
			setLoading(false);
		}
	};

	const handleDelete = (id: string) => {
		Swal.fire({
			title: "Apakah Anda yakin?",
			text: "Data prestasi akan dihapus permanen!",
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

	const openEditDialog = (achievement: Achievement) => {
		const formattedDate = achievement.tanggal_publikasi ? new Date(achievement.tanggal_publikasi!).toISOString().split("T")[0] : "";

		setFormData({
			judul: achievement.judul,
			ringkasan: achievement.ringkasan,
			konten_lengkap: achievement.konten_lengkap,
			gambar_utama: achievement.gambar_utama || "",
			editor_user_id: achievement.editor_user_id,
			penulis_user_id: achievement.penulis_user_id,
			tanggal_publikasi: formattedDate,
		});
		setEditingId(achievement.berita_id || null);
		setOpen(true);
	};

	const achievementYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		const years = Array.from({ length: 10 }, (_, i) => currentYear - i).map((y) => y.toString());
		return years;
	}, []);

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setMetadata((prev) => ({ ...prev, currentPage: page }));
		}
	};

	useEffect(() => {
		fetchAchievements();
	}, [metadata.currentPage]);

	useEffect(() => {
		setAchievementsFiltered(achievements);
		setAchievementsFiltered((prev) => prev.filter((achievement) => achievement.judul.toLowerCase().includes(searchTerm.toLowerCase())));
		setMetadata((prev) => ({
			...prev,
			currentPage: 1,
		}));
	}, [searchTerm, filterYear]);

	return (
		<DashboardLayout>
			<div className='space-y-6'>
				{/* HEADER */}
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold tracking-tight'>Prestasi</h1>
						<p className='text-muted-foreground'>Kelola data prestasi sekolah</p>
					</div>
					<div className='flex gap-2'>
						<Button
							onClick={() => {
								fetchAchievements();
								setMetadata((prev) => ({ ...prev, currentPage: 1 }));
								setFilterYear("all");
								setSearchTerm("");
							}}
							disabled={loading}
							variant='secondary'
						>
							<RefreshCcw className='h-4 w-4' />
						</Button>
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
									Tambah Prestasi
								</Button>
							</DialogTrigger>
							<DialogContent className='max-w-2xl'>
								<DialogHeader>
									<DialogTitle>{editingId ? "Edit Prestasi" : "Tambah Prestasi"}</DialogTitle>
									<DialogDescription>Isi informasi prestasi dengan lengkap</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleSubmit} className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='title'>Judul Prestasi</Label>
										<Input id='title' value={formData.judul} onChange={(e) => setFormData({ ...formData, judul: e.target.value })} required />
									</div>

									<div className='space-y-2'>
										<Label htmlFor='description'>Deskripsi</Label>
										<Textarea
											id='description'
											value={formData.ringkasan}
											onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
											rows={4}
											required
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='achievement_date'>Tanggal</Label>
										<Input
											id='achievement_date'
											type='date'
											value={formData.tanggal_publikasi}
											onChange={(e) => setFormData({ ...formData, tanggal_publikasi: e.target.value })}
											required
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='image_url'>URL Gambar</Label>
										<Input
											id='image_url'
											value={formData.gambar_utama}
											onChange={(e) => setFormData({ ...formData, gambar_utama: e.target.value })}
											placeholder='https://...'
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='content'>Konten Lengkap</Label>
										<Textarea
											id='content'
											value={formData.konten_lengkap}
											onChange={(e) => setFormData({ ...formData, konten_lengkap: e.target.value })}
											rows={8}
										/>
									</div>

									<Button type='submit' disabled={loading}>
										{loading ? "Menyimpan..." : "Simpan"}
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
							placeholder='Cari judul atau deskripsi...'
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
						<CardTitle>Daftar Prestasi</CardTitle>
						<CardDescription>
							Total {totalItems} data | Halaman {currentPage} dari {totalPages}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nomor</TableHead>
									<TableHead>Judul</TableHead>
									<TableHead className='w-[150px]'>Tanggal</TableHead>
									<TableHead>Deskripsi</TableHead>
									<TableHead className='text-right w-[100px]'>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={5} className='text-center text-muted-foreground py-10'>
											Memuat data...
										</TableCell>
									</TableRow>
								) : (
									achievementsFiltered.map((achievement, index) => (
										<TableRow key={achievement.berita_id}>
											<TableCell className='font-medium'>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
											<TableCell className='font-medium'>{achievement.judul}</TableCell>
											<TableCell>{achievement.tanggal_publikasi ? new Date(achievement.tanggal_publikasi!).toLocaleDateString("id-ID") : "-"}</TableCell>
											<TableCell className='max-w-md truncate'>{achievement.ringkasan}</TableCell>
											<TableCell className='text-right flex gap-2'>
												<Button size='sm' variant='outline' onClick={() => openEditDialog(achievement)}>
													<Pencil className='h-4 w-4' />
												</Button>
												<Button size='sm' variant='destructive' onClick={() => handleDelete(achievement.berita_id || "")}>
													<Trash2 className='h-4 w-4' />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
								{!loading && achievementsFiltered.length === 0 && (
									<TableRow>
										<TableCell colSpan={5} className='text-center text-muted-foreground py-10'>
											{searchTerm !== "" || filterYear !== "all" ? "Tidak ada prestasi yang cocok dengan kriteria filter." : "Belum ada data prestasi."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* PAGINATION */}
				{totalPages > 1 && (
					<div className='flex justify-end pt-2'>
						<Pagination>
							<PaginationContent>
								<PaginationItem className='cursor-pointer'>
									<PaginationPrevious
										onClick={() => handlePageChange(currentPage - 1)}
										aria-label='Previous page'
										className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
									/>
								</PaginationItem>

								{Array.from({ length: totalPages }, (_, i) => i + 1)
									.filter((page) => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
									.map((page, index, arr) => {
										const isGap = arr[index - 1] && page > arr[index - 1] + 1;
										return (
											<>
												{isGap && <PaginationItem key={`gap-${index}`}>...</PaginationItem>}
												<PaginationItem key={page} className='cursor-pointer'>
													<PaginationLink
														className={`${currentPage === page && "bg-primary text-primary-foreground"}`}
														isActive={currentPage === page}
														onClick={() => handlePageChange(page)}
													>
														{page}
													</PaginationLink>
												</PaginationItem>
											</>
										);
									})}

								<PaginationItem className='cursor-pointer'>
									<PaginationNext
										onClick={() => handlePageChange(currentPage + 1)}
										aria-label='Next page'
										className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
};

export default Achievements;
