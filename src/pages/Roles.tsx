import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import DashboardLayout from "@/components/DashboardLayout";
import { getRequest, putRequest } from "@/utils/api-call";
import { toast } from "sonner"; // Opsional, sesuaikan dengan library toast Anda

// Penambahan Interface untuk Type Safety
interface Permission {
  permission_id: number | string;
  nama_permission: string;
  grup?: string;
}

interface Role {
  role_id: number | string;
  nama_role: string;
  role_permission: { permission: Permission }[];
  ownedPermissionIds?: (number | string)[];
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"ROLE" | "PERMISSION">("PERMISSION");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rolesRes = await getRequest("/users/roles");
        const permissionsRes = await getRequest("/users/permissions/list");

        // Mengambil data dari properti .data sesuai struktur API Anda
        const rolesData = rolesRes?.data || [];
        const permissionsData = permissionsRes?.data || [];

        setRoles(rolesData);
        setPermissions(permissionsData);

        // Auto-select role pertama jika ada data
        if (rolesData.length > 0) {
          handleSelectRole(rolesData[0]);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectRole = (role: Role) => {
    // Memastikan role_permission ada sebelum di-map
    const ownedPermissions =
      role.role_permission?.map((x) => x.permission.permission_id) || [];
    const detail = {
      ...role,
      ownedPermissionIds: ownedPermissions,
    };

    setSelectedRole(detail);
  };

  const handlePermissionToggle = (permissionId: number | string) => {
    if (!selectedRole) return;

    setSelectedRole((prev) => {
      if (!prev) return null;
      const currentIds = prev.ownedPermissionIds || [];

      if (currentIds.includes(permissionId)) {
        return {
          ...prev,
          ownedPermissionIds: currentIds.filter((id) => id !== permissionId),
        };
      } else {
        return {
          ...prev,
          ownedPermissionIds: [...currentIds, permissionId],
        };
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await putRequest(`users/roles/${selectedRole.role_id}/permissions`, {
        permission_ids: selectedRole.ownedPermissionIds,
      });
      toast.success(
        `Permission untuk ${selectedRole.nama_role} berhasil disimpan!`,
      );
    } catch (error) {
      console.error("Gagal menyimpan permission:", error);
      toast.error("Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-[400px] col-span-1" />
          <Skeleton className="h-[400px] col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Manajemen Role & Akses</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM KIRI: DAFTAR ROLE */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Daftar Role</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {roles.map((role) => (
                <div
                  key={role.role_id}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    selectedRole?.role_id === role.role_id
                      ? "bg-primary/10 border border-primary text-primary"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectRole(role)}
                >
                  <p className="font-medium">{role.nama_role}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* KOLOM KANAN: EDITOR PERMISSION */}
          {mode === "PERMISSION" && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Permission untuk: {selectedRole?.nama_role || "Pilih Role"}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                {!selectedRole ? (
                  <p className="text-gray-500 italic">
                    Silakan pilih Role dari daftar untuk melihat dan mengedit
                    permission.
                  </p>
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
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Detail Role: {selectedRole?.nama_role || "Pilih Role"}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                {/* Konten detail role */}
              </CardContent>
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
interface PermissionEditorProps {
  allPermissions: Permission[];
  selectedRole: Role;
  onToggle: (id: number | string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const PermissionEditor = ({
  allPermissions,
  selectedRole,
  onToggle,
  onSave,
  isSaving,
}: PermissionEditorProps) => {
  // Pastikan allPermissions adalah array sebelum di-reduce
  const groupedPermissions = (
    Array.isArray(allPermissions) ? allPermissions : []
  ).reduce((acc: any, perm) => {
    const groupName = perm.grup || "Umum";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(perm);
    return acc;
  }, {});

  const isChecked = (permissionId: number | string) =>
    selectedRole.ownedPermissionIds?.includes(permissionId) || false;

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(
          ([group, perms]: [string, any]) => (
            <div
              key={group}
              className="border p-4 rounded-lg bg-card shadow-sm"
            >
              <h4 className="font-semibold text-lg mb-4 capitalize text-primary border-b pb-2">
                {group}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perms.map((perm: Permission) => (
                  <div
                    key={perm.permission_id}
                    className="flex items-center space-x-3 p-1"
                  >
                    <Checkbox
                      id={`perm-${perm.permission_id}`}
                      checked={isChecked(perm.permission_id)}
                      onCheckedChange={() => onToggle(perm.permission_id)}
                    />
                    <label
                      htmlFor={`perm-${perm.permission_id}`}
                      className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {perm.nama_permission}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="flex justify-end pt-6 border-t mt-6">
        <Button onClick={onSave} disabled={isSaving} className="min-w-[150px]">
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
};
