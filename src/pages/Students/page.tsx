import { useState, useMemo, useCallback, useEffect } from "react";
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	X,
	ChevronRight,
	GraduationCap,
	Users,
	BookOpen,
	Filter,
	ChevronUp,
	ChevronDown,
	Check,
	AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { deleteRequest, getRequest, postRequest, putRequest } from "@/utils/api-call";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "react-toastify";

// ─── Types ───────────────────────────────────────────────────────────────────

type JenisKelamin = "L" | "P";
type StatusSiswa = "AKTIF" | "TIDAK_AKTIF";
type Semester = "GANJIL" | "GENAP";

interface Siswa {
	id: string;
	no: number;
	nama: string;
	nisn: string;
	alamat: string;
	tanggalLahir: string;
	jenisKelamin: JenisKelamin;
	kelas: string;
	telepon: string;
	email: string;
	status: StatusSiswa;
}

interface OrangTua {
	id: string;
	siswaId: string;
	namaAyah: string;
	namaIbu: string;
	pekerjaanAyah: string;
	pekerjaanIbu: string;
	teleponAyah: string;
	teleponIbu: string;
	alamatOrangTua: string;
}

interface Nilai {
	id: string;
	siswaId: string;
	mataPelajaran: string;
	semester: Semester;
	tahunAjaran: string;
	nilaiHarian: number;
	nilaiUTS: number;
	nilaiUAS: number;
	nilaiAkhir: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTanggal = (iso: string) => {
	if (!iso) return "-";
	const d = new Date(iso);
	return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

const getNilaiColor = (nilai: number) => {
	if (nilai >= 90) return "text-emerald-600 font-bold";
	if (nilai >= 80) return "text-teal-600 font-semibold";
	if (nilai >= 70) return "text-amber-600 font-semibold";
	return "text-red-500 font-semibold";
};

const getNilaiGrade = (nilai: number) => {
	if (nilai >= 90) return "A";
	if (nilai >= 80) return "B";
	if (nilai >= 70) return "C";
	if (nilai >= 60) return "D";
	return "E";
};

const generateId = (prefix: string) => `${prefix}${Date.now().toString().slice(-6)}`;

// ─── Blank Forms ──────────────────────────────────────────────────────────────

const blankSiswa = (): Omit<Siswa, "id" | "no"> => ({
	nama: "",
	nisn: "",
	alamat: "",
	tanggalLahir: "",
	jenisKelamin: "L",
	kelas: "",
	telepon: "",
	email: "",
	status: "AKTIF",
});

const blankOrangTua = (siswaId: string): Omit<OrangTua, "id"> => ({
	siswaId,
	namaAyah: "",
	namaIbu: "",
	pekerjaanAyah: "",
	pekerjaanIbu: "",
	teleponAyah: "",
	teleponIbu: "",
	alamatOrangTua: "",
});

const blankNilai = (siswaId: string): Omit<Nilai, "id"> => ({
	siswaId,
	mataPelajaran: "",
	semester: "GANJIL",
	tahunAjaran: "2024/2025",
	nilaiHarian: 0,
	nilaiUTS: 0,
	nilaiUAS: 0,
	nilaiAkhir: 0,
});

// ─── Modal Siswa ──────────────────────────────────────────────────────────────

interface ModalSiswaProps {
	open: boolean;
	mode: "add" | "edit";
	data: Omit<Siswa, "id" | "no">;
	onChange: (field: keyof Omit<Siswa, "id" | "no">, value: string) => void;
	onSave: () => void;
	onClose: () => void;
}

function ModalSiswa({ open, mode, data, onChange, onSave, onClose }: ModalSiswaProps) {
	const kelasList = [
		// TK
		"TK A",
		"TK B",

		// SD
		"1A",
		"1B",
		"2A",
		"2B",
		"3A",
		"3B",
		"4A",
		"4B",
		"5A",
		"5B",
		"6A",
		"6B",

		// SMP
		"7A",
		"7B",
		"7C",
		"8A",
		"8B",
		"8C",
		"9A",
		"9B",
		"9C",

		// SMA/SMK
		"10 IPA 1",
		"10 IPA 2",
		"10 IPS 1",
		"10 IPS 2",
		"11 IPA 1",
		"11 IPA 2",
		"11 IPS 1",
		"11 IPS 2",
		"12 IPA 1",
		"12 IPA 2",
		"12 IPS 1",
		"12 IPS 2",
	];
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-w-2xl bg-white border border-slate-200 shadow-xl'>
				<DialogHeader>
					<DialogTitle className='text-slate-800 font-bold text-lg flex items-center gap-2'>
						<GraduationCap className='w-5 h-5 text-teal-600' />
						{mode === "add" ? "Tambah Siswa Baru" : "Edit Data Siswa"}
					</DialogTitle>
				</DialogHeader>
				<div className='grid grid-cols-2 gap-4 py-2'>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Nama Lengkap</Label>
						<Input
							value={data.nama}
							onChange={(e) => onChange("nama", e.target.value)}
							placeholder='Masukkan nama lengkap'
							className='border-slate-200 focus:border-teal-400 focus:ring-teal-400/20'
						/>
					</div>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>NISN</Label>
						<Input
							value={data.nisn}
							onChange={(e) => onChange("nisn", e.target.value)}
							placeholder='0051234567'
							className='border-slate-200 focus:border-teal-400 focus:ring-teal-400/20'
						/>
					</div>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Tanggal Lahir</Label>
						<Input
							type='date'
							value={data.tanggalLahir.split("T")[0]}
							onChange={(e) => onChange("tanggalLahir", e.target.value)}
							className='border-slate-200 focus:border-teal-400 focus:ring-teal-400/20'
						/>
					</div>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Jenis Kelamin</Label>
						<Select value={data.jenisKelamin} onValueChange={(v) => onChange("jenisKelamin", v)}>
							<SelectTrigger className='border-slate-200 focus:border-teal-400'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='L'>Laki-laki</SelectItem>
								<SelectItem value='P'>Perempuan</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Kelas</Label>
						<Select value={data.kelas} onValueChange={(v) => onChange("kelas", v)}>
							<SelectTrigger className='border-slate-200 focus:border-teal-400'>
								<SelectValue placeholder='Pilih kelas' />
							</SelectTrigger>
							<SelectContent>
								{/* TK */}
								<SelectGroup>
									<SelectLabel>============TK============</SelectLabel>
									<SelectItem value='TK A'>TK A</SelectItem>
									<SelectItem value='TK B'>TK B</SelectItem>
								</SelectGroup>

								{/* SD */}
								<SelectGroup>
									<SelectLabel>============SD============</SelectLabel>
									{["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B", "6A", "6B"].map((k) => (
										<SelectItem key={k} value={k}>
											{k}
										</SelectItem>
									))}
								</SelectGroup>

								{/* SMP */}
								<SelectGroup>
									<SelectLabel>============SMP============</SelectLabel>
									{["7A", "7B", "7C", "8A", "8B", "8C", "9A", "9B", "9C"].map((k) => (
										<SelectItem key={k} value={k}>
											{k}
										</SelectItem>
									))}
								</SelectGroup>

								{/* SMA */}
								<SelectGroup>
									<SelectLabel>============SMA============</SelectLabel>
									{[
										"10 IPA 1",
										"10 IPA 2",
										"10 IPS 1",
										"10 IPS 2",
										"11 IPA 1",
										"11 IPA 2",
										"11 IPS 1",
										"11 IPS 2",
										"12 IPA 1",
										"12 IPA 2",
										"12 IPS 1",
										"12 IPS 2",
									].map((k) => (
										<SelectItem key={k} value={k}>
											{k}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Status</Label>
						<Select value={data.status} onValueChange={(v) => onChange("status", v)}>
							<SelectTrigger className='border-slate-200 focus:border-teal-400'></SelectTrigger>
							<SelectContent>
								<SelectItem value='AKTIF'>Aktif</SelectItem>
								<SelectItem value='TIDAK_AKTIF'>Tidak Aktif</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Telepon</Label>
						<Input
							value={data.telepon}
							onChange={(e) => onChange("telepon", e.target.value)}
							placeholder='081234567890'
							className='border-slate-200 focus:border-teal-400 focus:ring-teal-400/20'
						/>
					</div>
					<div className='space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Email</Label>
						<Input
							type='email'
							value={data.email}
							onChange={(e) => onChange("email", e.target.value)}
							placeholder='email@domain.com'
							className='border-slate-200 focus:border-teal-400 focus:ring-teal-400/20'
						/>
					</div>
					<div className='col-span-2 space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Alamat</Label>
						<Input
							value={data.alamat}
							onChange={(e) => onChange("alamat", e.target.value)}
							placeholder='Jl. Contoh No. 1, Kota'
							className='border-slate-200 focus:border-teal-400 focus:ring-teal-400/20'
						/>
					</div>
				</div>
				<DialogFooter className='gap-2'>
					<Button variant='outline' onClick={onClose} className='border-slate-200 text-slate-600 hover:bg-slate-50'>
						Batal
					</Button>
					<Button onClick={onSave} className='bg-teal-600 hover:bg-teal-700 text-white'>
						<Check className='w-4 h-4 mr-1' />
						Simpan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Modal Orang Tua ──────────────────────────────────────────────────────────

interface ModalOrangTuaProps {
	open: boolean;
	mode: "add" | "edit";
	data: Omit<OrangTua, "id">;
	onChange: (field: keyof Omit<OrangTua, "id">, value: string) => void;
	onSave: () => void;
	onClose: () => void;
}

function ModalOrangTua({ open, mode, data, onChange, onSave, onClose }: ModalOrangTuaProps) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-w-2xl bg-white border border-slate-200 shadow-xl'>
				<DialogHeader>
					<DialogTitle className='text-slate-800 font-bold text-lg flex items-center gap-2'>
						<Users className='w-5 h-5 text-blue-600' />
						{mode === "add" ? "Tambah Data Orang Tua" : "Edit Data Orang Tua"}
					</DialogTitle>
				</DialogHeader>
				<div className='grid grid-cols-2 gap-4 py-2'>
					{[
						{ label: "Nama Ayah", field: "namaAyah" as const, ph: "Nama lengkap ayah" },
						{ label: "Nama Ibu", field: "namaIbu" as const, ph: "Nama lengkap ibu" },
						{ label: "Pekerjaan Ayah", field: "pekerjaanAyah" as const, ph: "Contoh: PNS, Wiraswasta" },
						{ label: "Pekerjaan Ibu", field: "pekerjaanIbu" as const, ph: "Contoh: Guru, IRT" },
						{ label: "Telepon Ayah", field: "teleponAyah" as const, ph: "081200001111" },
						{ label: "Telepon Ibu", field: "teleponIbu" as const, ph: "081200002222" },
					].map(({ label, field, ph }) => (
						<div key={field} className='space-y-1'>
							<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>{label}</Label>
							<Input
								value={(data as Record<string, string>)[field] || ""}
								onChange={(e) => onChange(field, e.target.value)}
								placeholder={ph}
								className='border-slate-200 focus:border-blue-400 focus:ring-blue-400/20'
							/>
						</div>
					))}
					<div className='col-span-2 space-y-1'>
						<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Alamat Orang Tua</Label>
						<Input
							value={data.alamatOrangTua}
							onChange={(e) => onChange("alamatOrangTua", e.target.value)}
							placeholder='Jl. Contoh No. 1, Kota'
							className='border-slate-200 focus:border-blue-400 focus:ring-blue-400/20'
						/>
					</div>
				</div>
				<DialogFooter className='gap-2'>
					<Button variant='outline' onClick={onClose} className='border-slate-200 text-slate-600 hover:bg-slate-50'>
						Batal
					</Button>
					<Button onClick={onSave} className='bg-blue-600 hover:bg-blue-700 text-white'>
						<Check className='w-4 h-4 mr-1' />
						Simpan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Modal Nilai ──────────────────────────────────────────────────────────────

interface ModalNilaiProps {
	open: boolean;
	mode: "add" | "edit";
	data: Omit<Nilai, "id">;
	onChange: (field: keyof Omit<Nilai, "id">, value: string | number) => void;
	onSave: () => void;
	onClose: () => void;
}

function ModalNilai({ open, mode, data, onChange, onSave, onClose }: ModalNilaiProps) {
	const mapelList = [
		"Matematika",
		"Bahasa Indonesia",
		"Bahasa Inggris",
		"Fisika",
		"Kimia",
		"Biologi",
		"Ekonomi",
		"Sosiologi",
		"Sejarah",
		"Geografi",
		"PPKN",
		"Seni Budaya",
		"Penjaskes",
		"Informatika",
	];
	const avg = Math.round((data.nilaiHarian + data.nilaiUTS + data.nilaiUAS) / 3);
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='max-w-lg bg-white border border-slate-200 shadow-xl'>
				<DialogHeader>
					<DialogTitle className='text-slate-800 font-bold text-lg flex items-center gap-2'>
						<BookOpen className='w-5 h-5 text-violet-600' />
						{mode === "add" ? "Tambah Data Nilai" : "Edit Data Nilai"}
					</DialogTitle>
				</DialogHeader>
				<div className='space-y-4 py-2'>
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-1'>
							<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Mata Pelajaran</Label>
							<Select value={data.mataPelajaran} onValueChange={(v) => onChange("mataPelajaran", v)}>
								<SelectTrigger className='border-slate-200'>
									<SelectValue placeholder='Pilih mapel' />
								</SelectTrigger>
								<SelectContent>
									{mapelList.map((m) => (
										<SelectItem key={m} value={m}>
											{m}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='space-y-1'>
							<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Semester</Label>
							<Select value={data.semester} onValueChange={(v) => onChange("semester", v)}>
								<SelectTrigger className='border-slate-200'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='GANJIL'>Ganjil</SelectItem>
									<SelectItem value='GENAP'>Genap</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='col-span-2 space-y-1'>
							<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>Tahun Ajaran</Label>
							<Input value={data.tahunAjaran} onChange={(e) => onChange("tahunAjaran", e.target.value)} placeholder='2024/2025' className='border-slate-200' />
						</div>
					</div>
					<Separator />
					<div className='grid grid-cols-3 gap-3'>
						{[
							{ label: "Nilai Harian", field: "nilaiHarian" as const },
							{ label: "Nilai UTS", field: "nilaiUTS" as const },
							{ label: "Nilai UAS", field: "nilaiUAS" as const },
						].map(({ label, field }) => (
							<div key={field} className='space-y-1'>
								<Label className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>{label}</Label>
								<Input
									type='number'
									min={0}
									max={100}
									value={data[field]}
									onChange={(e) => {
										const v = Math.min(100, Math.max(0, Number(e.target.value)));
										onChange(field, v);
										onChange(
											"nilaiAkhir",
											Math.round(
												((field === "nilaiHarian" ? v : data.nilaiHarian) +
													(field === "nilaiUTS" ? v : data.nilaiUTS) +
													(field === "nilaiUAS" ? v : data.nilaiUAS)) /
													3,
											),
										);
									}}
									className='border-slate-200 text-center font-bold'
								/>
							</div>
						))}
					</div>
					<div className='rounded-sm bg-slate-50 border border-slate-200 p-3 flex items-center justify-between'>
						<span className='text-sm font-semibold text-slate-600'>Nilai Akhir (Rata-rata)</span>
						<span className={cn("text-2xl font-black", getNilaiColor(avg))}>
							{avg} <span className='text-base'>({getNilaiGrade(avg)})</span>
						</span>
					</div>
				</div>
				<DialogFooter className='gap-2'>
					<Button variant='outline' onClick={onClose} className='border-slate-200 text-slate-600 hover:bg-slate-50'>
						Batal
					</Button>
					<Button onClick={onSave} className='bg-violet-600 hover:bg-violet-700 text-white'>
						<Check className='w-4 h-4 mr-1' />
						Simpan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardSiswa() {
	// ── State: Data ────────────────────────────────────────────────────────────
	const [siswaList, setSiswaList] = useState<Siswa[]>([]);
	const [orangTuaList, setOrangTuaList] = useState<OrangTua[]>([]);
	const [nilaiList, setNilaiList] = useState<Nilai[]>([]);

	const [page, setPage] = useState(1);
	const limit = 10;

	// ── State: Selection ──────────────────────────────────────────────────────
	const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);

	// ── State: Filter Siswa ───────────────────────────────────────────────────
	const [filterNama, setFilterNama] = useState("");
	const [filterKelas, setFilterKelas] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterJK, setFilterJK] = useState("all");

	// ── State: Filter Nilai ───────────────────────────────────────────────────
	const [filterSemester, setFilterSemester] = useState("all");
	const [filterMapel, setFilterMapel] = useState("all");

	// ── State: Sort ───────────────────────────────────────────────────────────
	const [sortField, setSortField] = useState<keyof Siswa>("no");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

	// ── State: Modal Siswa ────────────────────────────────────────────────────
	const [modalSiswaOpen, setModalSiswaOpen] = useState(false);
	const [modalSiswaMode, setModalSiswaMode] = useState<"add" | "edit">("add");
	const [formSiswa, setFormSiswa] = useState<Omit<Siswa, "id" | "no">>(blankSiswa());
	const [editingSiswaId, setEditingSiswaId] = useState<string | null>(null);
	const [deleteSiswaTarget, setDeleteSiswaTarget] = useState<Siswa | null>(null);

	// ── State: Modal OrangTua ─────────────────────────────────────────────────
	const [modalOTOpen, setModalOTOpen] = useState(false);
	const [modalOTMode, setModalOTMode] = useState<"add" | "edit">("add");
	const [formOT, setFormOT] = useState<Omit<OrangTua, "id">>(blankOrangTua(""));
	const [editingOTId, setEditingOTId] = useState<string | null>(null);
	const [deleteOTTarget, setDeleteOTTarget] = useState<OrangTua | null>(null);

	// ── State: Modal Nilai ────────────────────────────────────────────────────
	const [modalNilaiOpen, setModalNilaiOpen] = useState(false);
	const [modalNilaiMode, setModalNilaiMode] = useState<"add" | "edit">("add");
	const [formNilai, setFormNilai] = useState<Omit<Nilai, "id">>(blankNilai(""));
	const [editingNilaiId, setEditingNilaiId] = useState<string | null>(null);
	const [deleteNilaiTarget, setDeleteNilaiTarget] = useState<Nilai | null>(null);

	// ── Derived: Filter & Sort Siswa ──────────────────────────────────────────
	const filteredSiswa = useMemo(() => {
		let result = [...siswaList];
		if (filterNama) result = result.filter((s) => s.nama.toLowerCase().includes(filterNama.toLowerCase()) || s.nisn.includes(filterNama));
		if (filterKelas !== "all") result = result.filter((s) => s.kelas === filterKelas);
		if (filterStatus !== "all") result = result.filter((s) => s.status === filterStatus);
		if (filterJK !== "all") result = result.filter((s) => s.jenisKelamin === filterJK);
		result.sort((a, b) => {
			const av = a[sortField] ?? "";
			const bv = b[sortField] ?? "";
			const cmp = String(av).localeCompare(String(bv), "id", { numeric: true });
			return sortDir === "asc" ? cmp : -cmp;
		});
		return result;
	}, [siswaList, filterNama, filterKelas, filterStatus, filterJK, sortField, sortDir]);

	// ── Derived: Detail data ──────────────────────────────────────────────────
	const selectedOrangTua = useMemo(() => (selectedSiswa ? orangTuaList.filter((ot) => ot.siswaId === selectedSiswa.id) : []), [orangTuaList, selectedSiswa]);

	const filteredNilai = useMemo(() => {
		let result = selectedSiswa ? nilaiList.filter((n) => n.siswaId === selectedSiswa.id) : [];
		if (filterSemester !== "all") result = result.filter((n) => n.semester === filterSemester);
		if (filterMapel !== "all") result = result.filter((n) => n.mataPelajaran === filterMapel);
		return result;
	}, [nilaiList, selectedSiswa, filterSemester, filterMapel]);

	const kelasList = useMemo(() => [...new Set(siswaList.map((s) => s.kelas))].sort(), [siswaList]);
	const mapelList = useMemo(
		() => (selectedSiswa ? [...new Set(nilaiList.filter((n) => n.siswaId === selectedSiswa.id).map((n) => n.mataPelajaran))].sort() : []),
		[nilaiList, selectedSiswa],
	);

	// ── Action: Select Siswa ──────────────────────────────────────────────────
	const handleSelectSiswa = useCallback(
		(siswa: Siswa) => {
			if (selectedSiswa?.id === siswa.id) {
				setSelectedSiswa(null);
				return;
			}
			setIsLoadingDetail(true);
			setSelectedSiswa(siswa);
			setFilterSemester("all");
			setFilterMapel("all");
			setTimeout(() => setIsLoadingDetail(false), 300);
		},
		[selectedSiswa],
	);

	// ── Action: Sort ──────────────────────────────────────────────────────────
	const handleSort = (field: keyof Siswa) => {
		if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortField(field);
			setSortDir("asc");
		}
	};

	const SortIcon = ({ field }: { field: keyof Siswa }) =>
		sortField === field ? (
			sortDir === "asc" ? (
				<ChevronUp className='w-3 h-3 inline ml-1 text-teal-600' />
			) : (
				<ChevronDown className='w-3 h-3 inline ml-1 text-teal-600' />
			)
		) : (
			<ChevronUp className='w-3 h-3 inline ml-1 text-slate-300' />
		);

	// ── CRUD: Siswa ───────────────────────────────────────────────────────────
	const openAddSiswa = () => {
		setFormSiswa(blankSiswa());
		setModalSiswaMode("add");
		setEditingSiswaId(null);
		setModalSiswaOpen(true);
	};
	const openEditSiswa = (s: Siswa) => {
		const { id, no, ...rest } = s;
		setFormSiswa(rest);
		setEditingSiswaId(id);
		setModalSiswaMode("edit");
		setModalSiswaOpen(true);
	};
	const saveSiswa = async () => {
		const validateForm = () => {
			const errors = [];

			if (!formSiswa.nama) errors.push("Nama");
			if (!formSiswa.nisn) errors.push("NISN");
			if (!formSiswa.kelas) errors.push("Kelas");
			if (!formSiswa.tanggalLahir) errors.push("Tanggal Lahir");
			if (!formSiswa.jenisKelamin) errors.push("Jenis Kelamin");
			if (!formSiswa.alamat) errors.push("Alamat");
			if (!formSiswa.status) errors.push("Status");
			if (!formSiswa.telepon) errors.push("Telepon");
			if (!formSiswa.email) errors.push("Email");

			if (errors.length > 0) {
				toast.error(`Field berikut wajib diisi: ${errors.join(", ")}`);
				return false;
			}

			return true;
		};
		if (!validateForm()) return;
		if (modalSiswaMode === "add") {
			const newId = generateId("S");
			const newNo = Math.max(...siswaList.map((s) => s.no), 0) + 1;
			setSiswaList((prev) => [...prev, { id: newId, no: newNo, ...formSiswa }]);
			await postRequest("/siswa", { id: newId, no: newNo, ...formSiswa });
		} else if (editingSiswaId) {
			setSiswaList((prev) => prev.map((s) => (s.id === editingSiswaId ? { ...s, ...formSiswa } : s)));
			await putRequest(`/siswa/${editingSiswaId}`, formSiswa);
			if (selectedSiswa?.id === editingSiswaId) setSelectedSiswa((prev) => (prev ? { ...prev, ...formSiswa } : prev));
		}
		setModalSiswaOpen(false);
	};
	const deleteSiswa = (s: Siswa) => {
		setSiswaList((prev) => prev.filter((x) => x.id !== s.id));
		setOrangTuaList((prev) => prev.filter((ot) => ot.siswaId !== s.id));
		setNilaiList((prev) => prev.filter((n) => n.siswaId !== s.id));
		if (selectedSiswa?.id === s.id) setSelectedSiswa(null);
		deleteRequest(`/siswa/${s.id}`);
		deleteRequest(`/orang-tua/siswa/${s.id}`);
		deleteRequest(`/nilai/siswa/${s.id}`);
		setDeleteSiswaTarget(null);
	};

	// ── CRUD: Orang Tua ───────────────────────────────────────────────────────
	const openAddOT = () => {
		if (!selectedSiswa) return;
		setFormOT(blankOrangTua(selectedSiswa.id));
		setModalOTMode("add");
		setEditingOTId(null);
		setModalOTOpen(true);
	};
	const openEditOT = (ot: OrangTua) => {
		const { id, ...rest } = ot;
		setFormOT(rest);
		setEditingOTId(id);
		setModalOTMode("edit");
		setModalOTOpen(true);
	};
	const saveOT = async () => {
		if (!formOT.namaAyah && !formOT.namaIbu) return;
		if (modalOTMode === "add") {
			setOrangTuaList((prev) => [...prev, { id: generateId("OT"), ...formOT }]);
			await postRequest(`/orang-tua/siswa/${formOT.siswaId}`, formOT);
		} else if (editingOTId) {
			setOrangTuaList((prev) => prev.map((ot) => (ot.id === editingOTId ? { ...ot, ...formOT } : ot)));
			await putRequest(`/orang-tua/${editingOTId}`, formOT);
		}
		setModalOTOpen(false);
	};
	const deleteOT = async (ot: OrangTua) => {
		setOrangTuaList((prev) => prev.filter((x) => x.id !== ot.id));
		await deleteRequest(`/orang-tua/${ot.id}`);
		setDeleteOTTarget(null);
	};

	// ── CRUD: Nilai ───────────────────────────────────────────────────────────
	const openAddNilai = () => {
		if (!selectedSiswa) return;
		setFormNilai(blankNilai(selectedSiswa.id));
		setModalNilaiMode("add");
		setEditingNilaiId(null);
		setModalNilaiOpen(true);
	};
	const openEditNilai = (n: Nilai) => {
		const { id, ...rest } = n;
		setFormNilai(rest);
		setEditingNilaiId(id);
		setModalNilaiMode("edit");
		setModalNilaiOpen(true);
	};
	const saveNilai = async () => {
		if (!formNilai.mataPelajaran) return;
		if (modalNilaiMode === "add") {
			setNilaiList((prev) => [...prev, { id: generateId("N"), ...formNilai }]);
			await postRequest(`/nilai/siswa/${formNilai.siswaId}`, formNilai);
		} else if (editingNilaiId) {
			setNilaiList((prev) => prev.map((n) => (n.id === editingNilaiId ? { ...n, ...formNilai } : n)));
			await putRequest(`/nilai/${editingNilaiId}`, formNilai);
		}

		setModalNilaiOpen(false);
	};
	const deleteNilai = async (n: Nilai) => {
		setNilaiList((prev) => prev.filter((x) => x.id !== n.id));
		await deleteRequest(`/nilai/${n.id}`);
		setDeleteNilaiTarget(null);
	};

	// ── Stats ─────────────────────────────────────────────────────────────────
	const stats = useMemo(
		() => ({
			total: siswaList.length,
			aktif: siswaList.filter((s) => s.status === "AKTIF").length,
			laki: siswaList.filter((s) => s.jenisKelamin === "L").length,
			perempuan: siswaList.filter((s) => s.jenisKelamin === "P").length,
		}),
		[siswaList],
	);

	const avgNilai = useMemo(() => {
		if (!filteredNilai.length) return 0;
		return Math.round(filteredNilai.reduce((acc, n) => acc + n.nilaiAkhir, 0) / filteredNilai.length);
	}, [filteredNilai]);

	const fetchSiswa = async () => {
		const res = await getRequest(`/siswa`);
		setSiswaList(res.data);
		setSelectedSiswa(res.data[0]);
	};

	const getNilaiSiswa = async (id: string) => {
		const res = await getRequest(`/nilai/siswa/${id}`);
		setNilaiList(res.data);
	};

	const getOrangTuaSiswa = async (id: string) => {
		const res = await getRequest(`/orang-tua/siswa/${id}`);
		setOrangTuaList(res.data);
	};

	useEffect(() => {
		fetchSiswa();
	}, []);

	useEffect(() => {
		getNilaiSiswa(selectedSiswa?.id || "");
		getOrangTuaSiswa(selectedSiswa?.id || "");
	}, [selectedSiswa]);

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<DashboardLayout>
			<div className='min-h-scree' style={{ fontFamily: "'Instrument Sans', 'DM Sans', sans-serif" }}>
				<main className='max-w-[1400px] mx-auto space-y-6'>
					{/* Stats Cards */}
					<div className='grid grid-cols-4 gap-4'>
						{[
							{
								label: "Total Siswa",
								value: stats.total,
								icon: <GraduationCap className='w-5 h-5' />,
								color: "text-teal-600",
								bg: "bg-teal-50",
								border: "border-teal-100",
							},
							{
								label: "Siswa Aktif",
								value: stats.aktif,
								icon: <Check className='w-5 h-5' />,
								color: "text-emerald-600",
								bg: "bg-emerald-50",
								border: "border-emerald-100",
							},
							{
								label: "Laki-laki",
								value: stats.laki,
								icon: <Users className='w-5 h-5' />,
								color: "text-blue-600",
								bg: "bg-blue-50",
								border: "border-blue-100",
							},
							{
								label: "Perempuan",
								value: stats.perempuan,
								icon: <Users className='w-5 h-5' />,
								color: "text-pink-600",
								bg: "bg-pink-50",
								border: "border-pink-100",
							},
						].map((stat) => (
							<div key={stat.label} className={`stat-card bg-white rounded-sm border ${stat.border} p-4 flex items-center gap-3`}>
								<div className={`w-10 h-10 rounded-sm ${stat.bg} flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
								<div>
									<p className='text-2xl font-black text-slate-800'>{stat.value}</p>
									<p className='text-xs text-slate-500 font-medium'>{stat.label}</p>
								</div>
							</div>
						))}
					</div>

					{/* ── TABLE SISWA (MASTER) ─────────────────────────────────────────── */}
					<div className='bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden'>
						<div className='px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4'>
							<div className='flex items-center gap-2'>
								<div className='w-7 h-7 rounded-sm bg-teal-50 flex items-center justify-center'>
									<GraduationCap className='w-4 h-4 text-teal-600' />
								</div>
								<div>
									<h2 className='text-sm font-bold text-slate-800'>Data Siswa</h2>
									<p className='text-xs text-slate-400'>Klik baris untuk lihat detail</p>
								</div>
								<Badge variant='secondary' className='ml-2 bg-teal-50 text-teal-700 border-teal-100 text-xs font-bold'>
									{filteredSiswa.length}
								</Badge>
							</div>
							<div className='flex items-center gap-2 flex-wrap justify-end'>
								<div className='relative'>
									<Search className='w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400' />
									<Input
										value={filterNama}
										onChange={(e) => setFilterNama(e.target.value)}
										placeholder='Cari nama / NISN…'
										className='pl-8 h-8 text-xs w-44 border-slate-200 focus:border-teal-400'
									/>
									{filterNama && (
										<button onClick={() => setFilterNama("")} className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'>
											<X className='w-3 h-3' />
										</button>
									)}
								</div>
								<Select value={filterKelas} onValueChange={setFilterKelas}>
									<SelectTrigger className='h-8 text-xs w-32 border-slate-200'>
										<SelectValue placeholder='Semua Kelas' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Kelas</SelectItem>
										{kelasList.map((k) => (
											<SelectItem key={k} value={k}>
												{k}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={filterJK} onValueChange={setFilterJK}>
									<SelectTrigger className='h-8 text-xs w-32 border-slate-200'>
										<SelectValue placeholder='Jenis Kelamin' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua</SelectItem>
										<SelectItem value='L'>Laki-laki</SelectItem>
										<SelectItem value='P'>Perempuan</SelectItem>
									</SelectContent>
								</Select>
								<Select value={filterStatus} onValueChange={setFilterStatus}>
									<SelectTrigger className='h-8 text-xs w-28 border-slate-200'>
										<SelectValue placeholder='Status' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Semua Status</SelectItem>
										<SelectItem value='AKTIF'>Aktif</SelectItem>
										<SelectItem value='TIDAK_AKTIF'>Tidak Aktif</SelectItem>
									</SelectContent>
								</Select>
								<Button onClick={openAddSiswa} size='sm' className='h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5 shadow-sm'>
									<Plus className='w-3.5 h-3.5' />
									Tambah Siswa
								</Button>
							</div>
						</div>
						<div className='overflow-auto'>
							<Table>
								<TableHeader>
									<TableRow className='bg-slate-50 hover:bg-slate-50'>
										<TableHead className='w-12'>
											<span className='sr-only'>No</span>
										</TableHead>
										{[
											{ label: "Nama Siswa", field: "nama" as keyof Siswa, w: "min-w-[160px]" },
											{ label: "ID Siswa", field: "no" as keyof Siswa, w: "w-12" },
											{ label: "NISN", field: "nisn" as keyof Siswa, w: "w-32" },
											{ label: "Kelas", field: "kelas" as keyof Siswa, w: "w-32" },
											{ label: "Jenis Kelamin", field: "jenisKelamin" as keyof Siswa, w: "w-28" },
											{ label: "Tanggal Lahir", field: "tanggalLahir" as keyof Siswa, w: "w-36" },
											{ label: "Alamat", field: "alamat" as keyof Siswa, w: "min-w-[180px]" },
											{ label: "Telepon", field: "telepon" as keyof Siswa, w: "w-32" },
											{ label: "Status", field: "status" as keyof Siswa, w: "w-24" },
										].map(({ label, field, w }) => (
											<TableHead
												key={field}
												onClick={() => handleSort(field)}
												className={`${w} text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-teal-600 whitespace-nowrap py-3`}
											>
												{label}
												<SortIcon field={field} />
											</TableHead>
										))}
										<TableHead className='w-20 text-xs font-bold text-slate-500 uppercase tracking-wide text-right'>Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredSiswa.length === 0 ? (
										<TableRow>
											<TableCell colSpan={10} className='text-center py-12 text-slate-400 text-sm'>
												Tidak ada data siswa ditemukan
											</TableCell>
										</TableRow>
									) : (
										filteredSiswa.slice(limit * (page - 1), limit * page).map((siswa, idx) => (
											<TableRow
												key={siswa.id}
												onClick={() => handleSelectSiswa(siswa)}
												className={cn("table-row-hover transition-colors text-sm", selectedSiswa?.id === siswa.id && "selected-row")}
											>
												<TableCell className='font-mono text-xs text-slate-500 py-2.5'>{idx + 1}</TableCell>
												<TableCell className='py-2.5'>
													<div className='flex items-center gap-2'>
														<div
															className={cn(
																"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
																siswa.jenisKelamin === "L" ? "bg-blue-400" : "bg-pink-400",
															)}
														>
															{siswa.nama.charAt(0)}
														</div>
														<span className='font-semibold text-slate-700'>{siswa.nama}</span>
														{selectedSiswa?.id === siswa.id && <ChevronRight className='w-3.5 h-3.5 text-teal-500 ml-auto' />}
													</div>
												</TableCell>
												<TableCell className='font-mono text-xs text-slate-500 py-2.5'>{siswa.no}</TableCell>
												<TableCell className='font-mono text-xs text-slate-600 py-2.5'>{siswa.nisn}</TableCell>
												<TableCell className='py-2.5'>
													<Badge variant='outline' className='text-xs border-slate-200 text-slate-600 font-medium'>
														{siswa.kelas}
													</Badge>
												</TableCell>
												<TableCell className='py-2.5 text-xs text-slate-600'>{siswa.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}</TableCell>
												<TableCell className='py-2.5 text-xs text-slate-600 whitespace-nowrap'>{formatTanggal(siswa.tanggalLahir)}</TableCell>
												<TableCell className='py-2.5 text-xs text-slate-500 max-w-[200px] truncate'>{siswa.alamat}</TableCell>
												<TableCell className='py-2.5 font-mono text-xs text-slate-500'>{siswa.telepon}</TableCell>
												<TableCell className='py-2.5'>
													<Badge
														className={cn(
															"text-xs font-semibold border-0",
															siswa.status === "AKTIF" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
														)}
													>
														{siswa.status}
													</Badge>
												</TableCell>
												<TableCell className='py-2.5 text-right' onClick={(e) => e.stopPropagation()}>
													<div className='flex items-center justify-end gap-1'>
														<Button variant='ghost' size='icon' className='h-7 w-7 hover:bg-teal-50 hover:text-teal-600' onClick={() => openEditSiswa(siswa)}>
															<Pencil className='w-3.5 h-3.5' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															className='h-7 w-7 hover:bg-red-50 hover:text-red-500'
															onClick={() => setDeleteSiswaTarget(siswa)}
														>
															<Trash2 className='w-3.5 h-3.5' />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
								<TableFooter>
									<TableRow>
										{/* Pastikan colSpan sesuai jumlah kolom table kamu agar lebar penuh */}
										<TableCell colSpan={12}>
											<div className='flex w-full justify-end items-center'>
												<Pagination className='justify-end w-auto mx-0'>
													<PaginationContent>
														<PaginationItem>
															<PaginationPrevious className='cursor-pointer select-none' onClick={() => page > 1 && setPage((prev) => Math.max(prev - 1, 1))} />
														</PaginationItem>

														{/* Indikator Halaman Simple */}
														<PaginationItem>
															<span className='px-4 text-sm font-medium text-muted-foreground'>Hal. {page}</span>
														</PaginationItem>

														<PaginationItem>
															<PaginationNext
																className='cursor-pointer select-none'
																onClick={() => filteredSiswa.length / limit > page && setPage((prev) => prev + 1)}
															/>
														</PaginationItem>
													</PaginationContent>
												</Pagination>
											</div>
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					</div>

					{/* ── DETAIL SECTION ────────────────────────────────────────────────── */}
					{selectedSiswa ? (
						<div className='fade-in space-y-5'>
							{/* Detail Header */}
							<div className='flex items-center gap-3 bg-teal-600 rounded-sm p-4 text-white'>
								<div
									className={cn(
										"w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0",
										selectedSiswa.jenisKelamin === "L" ? "bg-teal-400" : "bg-teal-300",
									)}
								>
									{selectedSiswa.nama.charAt(0)}
								</div>
								<div>
									<p className='font-bold text-base leading-none'>{selectedSiswa.nama}</p>
									<p className='text-teal-200 text-xs mt-1 font-mono'>
										{selectedSiswa.nisn} · {selectedSiswa.kelas} · {selectedSiswa.email}
									</p>
								</div>
								<Button variant='ghost' size='icon' className='ml-auto text-teal-200 hover:text-white hover:bg-teal-500' onClick={() => setSelectedSiswa(null)}>
									<X className='w-4 h-4' />
								</Button>
							</div>

							<div className='grid grid-cols-2 gap-5'>
								{/* ── TABLE NILAI ──────────────────────────────────────────────── */}
								<div className='bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden'>
									<div className='px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap'>
										<div className='flex items-center gap-2'>
											<div className='w-6 h-6 rounded-sm bg-violet-50 flex items-center justify-center'>
												<BookOpen className='w-3.5 h-3.5 text-violet-600' />
											</div>
											<h3 className='text-sm font-bold text-slate-700'>Nilai Akademik</h3>
											<Badge variant='secondary' className='bg-violet-50 text-violet-700 border-violet-100 text-xs font-bold'>
												{filteredNilai.length}
											</Badge>
											{filteredNilai.length > 0 && (
												<span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", getNilaiColor(avgNilai), "bg-slate-50 border border-slate-200")}>
													Rata-rata: {avgNilai} ({getNilaiGrade(avgNilai)})
												</span>
											)}
										</div>
										<div className='flex items-center gap-2'>
											<Select value={filterSemester} onValueChange={setFilterSemester}>
												<SelectTrigger className='h-7 text-xs w-24 border-slate-200'>
													<SelectValue placeholder='Semester' />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='all'>Semua</SelectItem>
													<SelectItem value='GANJIL'>Ganjil</SelectItem>
													<SelectItem value='GENAP'>Genap</SelectItem>
												</SelectContent>
											</Select>
											{mapelList.length > 0 && (
												<Select value={filterMapel} onValueChange={setFilterMapel}>
													<SelectTrigger className='h-7 text-xs w-32 border-slate-200'>
														<SelectValue placeholder='Mapel' />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='all'>Semua Mapel</SelectItem>
														{mapelList.map((m) => (
															<SelectItem key={m} value={m}>
																{m}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											)}
											<Button
												onClick={openAddNilai}
												size='sm'
												variant='outline'
												className='h-7 text-xs border-violet-200 text-violet-600 hover:bg-violet-50 gap-1'
											>
												<Plus className='w-3 h-3' />
												Tambah
											</Button>
										</div>
									</div>
									{isLoadingDetail ? (
										<div className='flex items-center justify-center py-12'>
											<div className='w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin' />
										</div>
									) : (
										<div className='overflow-auto'>
											<Table>
												<TableHeader>
													<TableRow className='bg-slate-50 hover:bg-slate-50'>
														{["Mata Pelajaran", "Semester", "T.A.", "Harian", "UTS", "UAS", "Akhir", "Grade"].map((h) => (
															<TableHead
																key={h}
																className='text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5 whitespace-nowrap text-center first:text-left'
															>
																{h}
															</TableHead>
														))}
														<TableHead className='text-right text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5'>Aksi</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filteredNilai.length === 0 ? (
														<TableRow>
															<TableCell colSpan={9} className='text-center py-8 text-slate-400 text-xs'>
																Belum ada data nilai
															</TableCell>
														</TableRow>
													) : (
														filteredNilai.map((n) => (
															<TableRow key={n.id} className='text-xs hover:bg-violet-50/50'>
																<TableCell className='py-2.5 font-semibold text-slate-700 whitespace-nowrap'>{n.mataPelajaran}</TableCell>
																<TableCell className='py-2.5 text-center text-slate-500'>{n.semester}</TableCell>
																<TableCell className='py-2.5 text-center text-slate-400 font-mono'>{n.tahunAjaran}</TableCell>
																<TableCell className={cn("py-2.5 text-center", getNilaiColor(n.nilaiHarian))}>{n.nilaiHarian}</TableCell>
																<TableCell className={cn("py-2.5 text-center", getNilaiColor(n.nilaiUTS))}>{n.nilaiUTS}</TableCell>
																<TableCell className={cn("py-2.5 text-center", getNilaiColor(n.nilaiUAS))}>{n.nilaiUAS}</TableCell>
																<TableCell className={cn("py-2.5 text-center text-sm font-black", getNilaiColor(n.nilaiAkhir))}>{n.nilaiAkhir}</TableCell>
																<TableCell className='py-2.5 text-center'>
																	<span
																		className={cn(
																			"inline-flex w-8 h-6 items-center justify-center rounded-sm text-xs font-black",
																			n.nilaiAkhir >= 90
																				? "bg-emerald-100 text-emerald-700"
																				: n.nilaiAkhir >= 80
																					? "bg-teal-100 text-teal-700"
																					: n.nilaiAkhir >= 70
																						? "bg-amber-100 text-amber-700"
																						: "bg-red-100 text-red-600",
																		)}
																	>
																		{getNilaiGrade(n.nilaiAkhir)}
																	</span>
																</TableCell>
																<TableCell className='py-2.5 text-right'>
																	<div className='flex items-center justify-end gap-1'>
																		<Button
																			variant='ghost'
																			size='icon'
																			className='h-6 w-6 hover:bg-violet-100 hover:text-violet-600'
																			onClick={() => openEditNilai(n)}
																		>
																			<Pencil className='w-3 h-3' />
																		</Button>
																		<Button
																			variant='ghost'
																			size='icon'
																			className='h-6 w-6 hover:bg-red-100 hover:text-red-500'
																			onClick={() => setDeleteNilaiTarget(n)}
																		>
																			<Trash2 className='w-3 h-3' />
																		</Button>
																	</div>
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</div>
									)}
								</div>

								{/* ── TABLE ORANG TUA ─────────────────────────────────────────── */}
								<div className='bg-white rounded-sm h-fit border border-slate-200 shadow-sm overflow-hidden'>
									<div className='px-5 py-3.5 border-b border-slate-100 flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<div className='w-6 h-6 rounded-sm bg-blue-50 flex items-center justify-center'>
												<Users className='w-3.5 h-3.5 text-blue-600' />
											</div>
											<h3 className='text-sm font-bold text-slate-700'>Data Orang Tua</h3>
											<Badge variant='secondary' className='bg-blue-50 text-blue-700 border-blue-100 text-xs font-bold'>
												{selectedOrangTua.length}
											</Badge>
										</div>
										<Button onClick={openAddOT} size='sm' variant='outline' className='h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 gap-1'>
											<Plus className='w-3 h-3' />
											Tambah
										</Button>
									</div>
									{isLoadingDetail ? (
										<div className='flex items-center justify-center py-12'>
											<div className='w-5 h-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin' />
										</div>
									) : (
										<div className='overflow-auto'>
											<Table>
												<TableHeader>
													<TableRow className='bg-slate-50 hover:bg-slate-50'>
														{["Nama Ayah", "Pekerjaan Ayah", "Nama Ibu", "Pekerjaan Ibu", "Telepon Ayah", "Alamat"].map((h) => (
															<TableHead key={h} className='text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5 whitespace-nowrap'>
																{h}
															</TableHead>
														))}
														<TableHead className='text-right text-xs font-bold text-slate-500 uppercase tracking-wide py-2.5'>Aksi</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{selectedOrangTua.length === 0 ? (
														<TableRow>
															<TableCell colSpan={7} className='text-center py-8 text-slate-400 text-xs'>
																Belum ada data orang tua
															</TableCell>
														</TableRow>
													) : (
														selectedOrangTua.map((ot) => (
															<TableRow key={ot.id} className='text-xs hover:bg-blue-50/50'>
																<TableCell className='py-2.5 font-semibold text-slate-700 whitespace-nowrap'>{ot.namaAyah}</TableCell>
																<TableCell className='py-2.5 text-slate-500'>{ot.pekerjaanAyah}</TableCell>
																<TableCell className='py-2.5 font-semibold text-slate-700 whitespace-nowrap'>{ot.namaIbu}</TableCell>
																<TableCell className='py-2.5 text-slate-500'>{ot.pekerjaanIbu}</TableCell>
																<TableCell className='py-2.5 font-mono text-slate-500'>{ot.teleponAyah}</TableCell>
																<TableCell className='py-2.5 text-slate-500 max-w-[140px] truncate'>{ot.alamatOrangTua}</TableCell>
																<TableCell className='py-2.5 text-right'>
																	<div className='flex items-center justify-end gap-1'>
																		<Button
																			variant='ghost'
																			size='icon'
																			className='h-6 w-6 hover:bg-blue-100 hover:text-blue-600'
																			onClick={() => openEditOT(ot)}
																		>
																			<Pencil className='w-3 h-3' />
																		</Button>
																		<Button
																			variant='ghost'
																			size='icon'
																			className='h-6 w-6 hover:bg-red-100 hover:text-red-500'
																			onClick={() => setDeleteOTTarget(ot)}
																		>
																			<Trash2 className='w-3 h-3' />
																		</Button>
																	</div>
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</div>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className='bg-white border border-dashed border-slate-200 rounded-sm py-12 flex flex-col items-center justify-center text-slate-400 gap-2'>
							<div className='w-12 h-12 rounded-sm bg-slate-50 flex items-center justify-center mb-1'>
								<ChevronRight className='w-6 h-6 text-slate-300' />
							</div>
							<p className='text-sm font-semibold text-slate-500'>Pilih siswa untuk melihat detail</p>
							<p className='text-xs'>Klik baris pada tabel siswa di atas untuk menampilkan data orang tua dan nilai</p>
						</div>
					)}
				</main>

				{/* ── Modals & Dialogs ────────────────────────────────────────────────── */}

				<ModalSiswa
					open={modalSiswaOpen}
					mode={modalSiswaMode}
					data={formSiswa}
					onChange={(f, v) => setFormSiswa((prev) => ({ ...prev, [f]: v }))}
					onSave={saveSiswa}
					onClose={() => setModalSiswaOpen(false)}
				/>

				<ModalOrangTua
					open={modalOTOpen}
					mode={modalOTMode}
					data={formOT}
					onChange={(f, v) => setFormOT((prev) => ({ ...prev, [f]: v }))}
					onSave={saveOT}
					onClose={() => setModalOTOpen(false)}
				/>

				<ModalNilai
					open={modalNilaiOpen}
					mode={modalNilaiMode}
					data={formNilai}
					onChange={(f, v) => setFormNilai((prev) => ({ ...prev, [f]: v }))}
					onSave={saveNilai}
					onClose={() => setModalNilaiOpen(false)}
				/>

				{/* Delete Siswa */}
				<AlertDialog open={!!deleteSiswaTarget} onOpenChange={() => setDeleteSiswaTarget(null)}>
					<AlertDialogContent className='bg-white border border-slate-200'>
						<AlertDialogHeader>
							<AlertDialogTitle className='flex items-center gap-2 text-slate-800'>
								<AlertTriangle className='w-5 h-5 text-red-500' />
								Hapus Data Siswa
							</AlertDialogTitle>
							<AlertDialogDescription className='text-slate-500'>
								Apakah Anda yakin ingin menghapus data siswa <span className='font-semibold text-slate-700'>{deleteSiswaTarget?.nama}</span>? Semua data orang
								tua dan nilai terkait juga akan dihapus permanen.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel className='border-slate-200 text-slate-600'>Batal</AlertDialogCancel>
							<AlertDialogAction onClick={() => deleteSiswaTarget && deleteSiswa(deleteSiswaTarget)} className='bg-red-500 hover:bg-red-600 text-white'>
								Hapus
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Delete Orang Tua */}
				<AlertDialog open={!!deleteOTTarget} onOpenChange={() => setDeleteOTTarget(null)}>
					<AlertDialogContent className='bg-white border border-slate-200'>
						<AlertDialogHeader>
							<AlertDialogTitle className='flex items-center gap-2 text-slate-800'>
								<AlertTriangle className='w-5 h-5 text-red-500' />
								Hapus Data Orang Tua
							</AlertDialogTitle>
							<AlertDialogDescription className='text-slate-500'>
								Hapus data orang tua{" "}
								<span className='font-semibold text-slate-700'>
									{deleteOTTarget?.namaAyah} & {deleteOTTarget?.namaIbu}
								</span>
								?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel className='border-slate-200 text-slate-600'>Batal</AlertDialogCancel>
							<AlertDialogAction onClick={() => deleteOTTarget && deleteOT(deleteOTTarget)} className='bg-red-500 hover:bg-red-600 text-white'>
								Hapus
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Delete Nilai */}
				<AlertDialog open={!!deleteNilaiTarget} onOpenChange={() => setDeleteNilaiTarget(null)}>
					<AlertDialogContent className='bg-white border border-slate-200'>
						<AlertDialogHeader>
							<AlertDialogTitle className='flex items-center gap-2 text-slate-800'>
								<AlertTriangle className='w-5 h-5 text-red-500' />
								Hapus Data Nilai
							</AlertDialogTitle>
							<AlertDialogDescription className='text-slate-500'>
								Hapus nilai <span className='font-semibold text-slate-700'>{deleteNilaiTarget?.mataPelajaran}</span> semester {deleteNilaiTarget?.semester}?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel className='border-slate-200 text-slate-600'>Batal</AlertDialogCancel>
							<AlertDialogAction onClick={() => deleteNilaiTarget && deleteNilai(deleteNilaiTarget)} className='bg-red-500 hover:bg-red-600 text-white'>
								Hapus
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</DashboardLayout>
	);
}
