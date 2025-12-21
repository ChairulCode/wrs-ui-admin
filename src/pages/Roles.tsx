import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/DashboardLayout";

export default function RoleManagementPage() {
	const [roles, setRoles] = useState([]);
	const [permissions, setPermissions] = useState([]);
	const [selectedRole, setSelectedRole] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// [1] Fetch semua Role dan semua Permission Master saat komponen dimuat
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				// Asumsi: fetchRole() mengambil daftar role (id, nama_role)
				// Asumsi: fetchPermissions() mengambil daftar semua permission master (id, nama_permission, grup)
				// const roleList = await lihatSemuaRole();
				// const masterPermissions = await lihatSemuaPermission();

				// --- Placeholder Data ---
				const roleList = [
					{ role_id: 1, nama_role: "SuperAdmin" },
					{ role_id: 2, nama_role: "Admin Konten" },
					{ role_id: 3, nama_role: "User Biasa" },
				];
				const masterPermissions = [
					{ permission_id: 1, nama_permission: "user.create", grup: "user" },
					{ permission_id: 2, nama_permission: "user.read", grup: "user" },
					{ permission_id: 3, nama_permission: "content.create", grup: "content" },
					{ permission_id: 4, nama_permission: "content.delete", grup: "content" },
				];
				// ------------------------

				setRoles(roleList);
				setPermissions(masterPermissions);
				if (roleList.length > 0) {
					// Secara default, pilih role pertama
					handleSelectRole(roleList[0]);
				}
			} catch (error) {
				console.error("Gagal mengambil data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	// [2] Handler saat Role dipilih
	const handleSelectRole = async (role) => {
		// Asumsi: Ambil detail role yang berisi permission yang sudah dimiliki
		// const detail = await lihatDetailRole(role.role_id);

		// --- Placeholder Detail ---
		const ownedPermissions = role.role_id === 1 ? [1, 2, 3, 4] : role.role_id === 2 ? [3] : [];
		const detail = {
			...role,
			ownedPermissionIds: ownedPermissions,
		};
		// ------------------------

		setSelectedRole(detail);
	};

	// [3] Logika untuk menangani centang/un-centang permission
	const handlePermissionToggle = (permissionId) => {
		setSelectedRole((prev) => {
			const currentIds = prev.ownedPermissionIds;
			if (currentIds.includes(permissionId)) {
				// Hapus permission (un-check)
				return {
					...prev,
					ownedPermissionIds: currentIds.filter((id) => id !== permissionId),
				};
			} else {
				// Tambah permission (check)
				return {
					...prev,
					ownedPermissionIds: [...currentIds, permissionId],
				};
			}
		});
	};

	// [4] Simpan perubahan permission ke API
	const handleSavePermissions = async () => {
		if (!selectedRole) return;
		setIsSaving(true);
		try {
			// Panggil API updatePermission(roleId, [permissionIds])
			// await updatePermission(selectedRole.role_id, selectedRole.ownedPermissionIds);
			alert(`Permission untuk ${selectedRole.nama_role} berhasil disimpan!`);
		} catch (error) {
			console.error("Gagal menyimpan permission:", error);
			alert("Gagal menyimpan perubahan.");
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) {
		return (
			<div className='p-8'>
				<Skeleton className='h-10 w-full' />
			</div>
		);
	}

	return (
		<DashboardLayout>
			<div className='space-y-8'>
				<h1 className='text-3xl font-bold'>Manajemen Role & Akses</h1>
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* -------------------------------------------------- */}
					{/* KOLOM KIRI: DAFTAR ROLE (Role List) */}
					{/* -------------------------------------------------- */}
					<Card className='lg:col-span-1'>
						<CardHeader>
							<CardTitle>Daftar Role</CardTitle>
							<Button size='sm' className='mt-2 w-full'>
								Tambah Role Baru
							</Button>
						</CardHeader>
						<CardContent className='max-h-[600px] overflow-y-auto'>
							{roles.map((role) => (
								<div
									key={role.role_id}
									className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
										selectedRole?.role_id === role.role_id ? "bg-primary/10 border border-primary" : "hover:bg-gray-100"
									}`}
									onClick={() => handleSelectRole(role)}
								>
									<p className='font-medium'>{role.nama_role}</p>
								</div>
							))}
						</CardContent>
					</Card>

					{/* -------------------------------------------------- */}
					{/* KOLOM KANAN: DETAIL PERMISSION ROLE (Permission Editor) */}
					{/* -------------------------------------------------- */}
					<Card className='lg:col-span-2'>
						<CardHeader>
							<CardTitle>Permission untuk: {selectedRole?.nama_role || "Pilih Role"}</CardTitle>
						</CardHeader>
						<CardContent className='max-h-[600px] overflow-y-auto'>
							{!selectedRole ? (
								<p className='text-gray-500'>Silakan pilih Role dari daftar di samping untuk melihat dan mengedit permission.</p>
							) : (
								<PermissionEditor
									allPermissions={permissions}
									selectedRole={selectedRole}
									onToggle={handlePermissionToggle}
									onSave={handleSavePermissions}
									isSaving={isSaving}
								/>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</DashboardLayout>
	);
}

// --------------------------------------------------
// Komponen Pembantu: Permission Editor
// --------------------------------------------------
const PermissionEditor = ({ allPermissions, selectedRole, onToggle, onSave, isSaving }) => {
	// Grouping permission berdasarkan properti 'grup'
	const groupedPermissions = allPermissions.reduce((acc, perm) => {
		const groupName = perm.grup || "Umum";
		if (!acc[groupName]) {
			acc[groupName] = [];
		}
		acc[groupName].push(perm);
		return acc;
	}, {});

	const isChecked = (permissionId) => selectedRole.ownedPermissionIds.includes(permissionId);

	return (
		<div className='space-y-4'>
			<div className='space-y-6'>
				{Object.entries(groupedPermissions).map(([group, perms]) => (
					<div key={group} className='border p-4 rounded-lg'>
						<h4 className='font-semibold text-lg mb-3 capitalize'>{group}</h4>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
							{perms.map((perm) => (
								<div key={perm.permission_id} className='flex items-center space-x-2'>
									<Checkbox id={`perm-${perm.permission_id}`} checked={isChecked(perm.permission_id)} onCheckedChange={() => onToggle(perm.permission_id)} />
									<label
										htmlFor={`perm-${perm.permission_id}`}
										className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
									>
										{perm.nama_permission}
									</label>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<div className='flex justify-end pt-4 border-t mt-6'>
				<Button
					onClick={onSave}
					disabled={isSaving || !selectedRole}
					// Tambahkan loading spinner jika isSaving true
				>
					{isSaving ? "Menyimpan..." : "Simpan Perubahan"}
				</Button>
			</div>
		</div>
	);
};
