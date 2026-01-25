import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/DashboardLayout";
import { getRequest, putRequest } from "@/utils/api-call";

export default function RoleManagementPage() {
	const [roles, setRoles] = useState([]);
	const [permissions, setPermissions] = useState([]);
	const [selectedRole, setSelectedRole] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [mode, setMode] = useState<"ROLE" | "PERMISSION">("PERMISSION");

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const roles = await getRequest("/users/roles");
				const permissions = await getRequest("/users/permissions/list");

				setRoles(roles.data);
				setPermissions(permissions?.data);

				if (roles.length > 0) {
					handleSelectRole(roles[0]);
				}
			} catch (error) {
				console.error("Gagal mengambil data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const handleSelectRole = async (role) => {
		const ownedPermissions = role.role_permission.map((x) => x.permission.permission_id);
		const detail = {
			...role,
			ownedPermissionIds: ownedPermissions,
		};

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
			const res = await putRequest(`users/roles/${selectedRole.role_id}/permissions`, { permission_ids: selectedRole.ownedPermissionIds });
			console.log("hasil", res);
			// alert(`Permission untuk ${selectedRole.nama_role} berhasil disimpan!`);
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
							{/* <Button type='button' onClick={() => setMode((prev) => (prev === "PERMISSION" ? "ROLE" : "PERMISSION"))} size='sm' className='mt-2 w-full'>
								{mode === "ROLE" ? "Ubah Perizinan" : "Lihat Role"}
							</Button> */}
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

					{mode === "PERMISSION" && (
						<Card className='lg:col-span-2'>
							<CardHeader>
								<CardTitle>Permission untuk: {selectedRole?.nama_role || "Pilih Role"}</CardTitle>
							</CardHeader>
							<CardContent className='max-h-[600px] overflow-y-auto'>
								{!selectedRole ? (
									<p className='text-gray-500'>Silakan pilih Role dari daftar untuk melihat dan mengedit permission.</p>
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
					)}

					{mode === "ROLE" && (
						<Card className='lg:col-span-2'>
							<CardHeader>
								<CardTitle>Detail Role: {selectedRole?.nama_role || "Pilih Role"}</CardTitle>
							</CardHeader>
							<CardContent className='max-h-[600px] overflow-y-auto'></CardContent>
						</Card>
					)}
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
						{/* <Checkbox id={`group-perm-${group.permission_id}`} checked={isChecked(perm.permission_id)} onCheckedChange={() => onToggle(perm.permission_id)} /> */}
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
							{perms &&
								perms.map((perm) => (
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
				<Button onClick={onSave} disabled={isSaving || !selectedRole}>
					{isSaving ? "Menyimpan..." : "Simpan Perubahan"}
				</Button>
			</div>
		</div>
	);
};
