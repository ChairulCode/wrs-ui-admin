export interface Metadata {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	limit: number;
}

export interface Jenjang {
	jenjang_id: string;
	nama_jenjang: string;
	kode_jenjang: string;
}

export interface Jenjang_relasi {
	prestasi_id: string;
	jenjang_id: string;
	jenjang: Jenjang;
}

export interface Penulis {
	user_id: string;
	username: string;
	email: string;
	password_hash: string;
	nama_lengkap: string;
	role_id: number;
	jabatan: string | null;
	created_at: string;
	updated_at: string;
	login_terakhir: string | null;
}

export interface Prestasi {
	prestasi_id: string;
	judul: string;
	deskripsi: string;
	konten: string;
	path_gambar: string;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	penulis_user_id: string;
	editor_user_id: string | null;
	jenjangJenjang_id: string | null;
	jenjang_relasi: Jenjang_relasi[];
	penulis: Penulis;
	editor: Penulis;
}

export interface PrestasiDetail {
	prestasi_id: string;
	judul: string;
	deskripsi: string;
	konten: string;
	path_gambar: string;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	penulis_user_id: string;
	editor_user_id: string | null;
	jenjangJenjang_id: string | null;
	jenjang_relasi: Jenjang_relasi[];
	penulis: Penulis;
	editor: string | null;
}

export interface Kegiatan {
	kegiatan_id: string;
	judul: string;
	deskripsi: string;
	konten: string;
	path_gambar: string;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	penulis_user_id: string;
	editor_user_id: string | null;
	jenjangJenjang_id: string | null;
	jenjang_relasi: Jenjang_relasi[];
	penulis: Penulis;
	editor: Penulis;
}

export interface KegiatanDetail {
	kegiatan_id: string;
	judul: string;
	deskripsi: string;
	konten: string;
	path_gambar: string;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	penulis_user_id: string;
	editor_user_id: string | null;
	jenjangJenjang_id: string | null;
	jenjang_relasi: Jenjang_relasi[];
	penulis: Penulis;
	editor: string | null;
}

export interface Pengumuman {
	pengumuman_id: string;
	judul: string;
	deskripsi: string;
	konten: string;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	penulis_user_id: string;
	editor_user_id: string | null;
	jenjangJenjang_id: string | null;
	jenjang_relasi: Jenjang_relasi[];
	penulis: Penulis;
	editor: Penulis;
}

export interface Carousel {
	carousel_id: string;
	judul: string;
	urutan: number;
	konten: string;
	path_gambar: string;
	tanggal_publikasi: string;
	is_published: boolean;
	is_featured: boolean;
	created_at: string;
	updated_at: string;
	jenjang_id?: string;
	penulis_user_id: string;
	editor_user_id?: string;
	jenjang?: string;
	penulis: Penulis;
	editor: Penulis;
}
export interface Permission {
	permission_id: number;
	nama_permission: string;
	grup: string;
}

export interface Role_permission {
	role_id: number;
	permission_id: number;
	permission: Permission;
}

export interface Role {
	role_id: number;
	nama_role: string;
	role_permission: Role_permission[];
}

export interface User {
	user_id: string;
	username: string;
	email: string;
	password_hash: string;
	nama_lengkap: string;
	role_id: number;
	jabatan?: string;
	created_at: string;
	updated_at: string;
	login_terakhir?: string;
	role: Role;
}

export interface ApiResponse<T> {
	message: string;
	metadata?: Metadata;
	data: T[];
}
