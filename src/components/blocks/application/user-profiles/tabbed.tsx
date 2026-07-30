import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiSafe } from "@/lib/api/axios";
import {
  AUTH_CURRENT,
  AUTH_DELETE_ACCOUNT,
  AUTH_ME,
  AUTH_NAME,
} from "@/lib/types";
import type { User as UserRequest, UserResponse } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Key, Lock, Trash2, User } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function TabbedUserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserRequest | null>({
    queryKey: ["auth_user"],
    queryFn: async () => {
      const res = await apiSafe.get<UserResponse>(AUTH_ME);
      const data = res.data?.data;
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        role: data.role,
        first_name: data.first_name ?? null,
        last_name: data.last_name ?? null,
      };
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const [firstName, setFirstName] = React.useState(user?.first_name ?? "");
  const [lastName, setLastName] = React.useState(user?.last_name ?? "");
  const [savingName, setSavingName] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
    }
  }, [user]);

  const nameChanged =
    firstName.trim() !== (user?.first_name ?? "") ||
    lastName.trim() !== (user?.last_name ?? "");

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);

  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  async function handleSaveName() {
    const nextFirst = firstName.trim();
    const nextLast = lastName.trim();

    if (!nextFirst) {
      toast.error("Nama depan tidak boleh kosong");
      return;
    }

    setSavingName(true);
    const res = await apiSafe.patch(AUTH_NAME, {
      first_name: nextFirst,
      last_name: nextLast,
    });
    setSavingName(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    queryClient.setQueryData<UserRequest | null>(["auth_user"], (prev) =>
      prev ? { ...prev, first_name: nextFirst, last_name: nextLast } : prev,
    );
    setFirstName(nextFirst);
    setLastName(nextLast);
    toast.success("Nama berhasil diubah");
  }

  async function handleChangePassword() {
    if (!newPassword) {
      toast.error("Password baru tidak boleh kosong");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setChangingPassword(true);
    const res = await apiSafe.patch(AUTH_CURRENT, { password: newPassword });
    setChangingPassword(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Password berhasil diubah");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    const res = await apiSafe.delete(AUTH_DELETE_ACCOUNT);
    setDeletingAccount(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success("Akun berhasil dihapus");
    queryClient.clear();
    navigate("/login");
    setShowDeleteAlert(false);
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:px-6 2xl:max-w-[1400px]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-6">
            <Skeleton className="size-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-6 md:px-6 2xl:max-w-[1400px]">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Gagal memuat data akun.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Konfirmasi Hapus Akun</AlertDialogTitle>
            <AlertDialogDescription>
              Akun ini akan dihapus permanen. Seluruh data terkait akan hilang
              dan tidak bisa dikembalikan. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? "Menghapus..." : "Ya, Hapus Akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto px-4 py-6 md:px-6 2xl:max-w-[1400px]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-6">
            <Avatar className="size-20">
              <AvatarImage
                src="https://api.dicebear.com/10.x/notionists/svg?seed=Felix"
                alt="User"
              />
              <AvatarFallback>
                {user?.first_name?.charAt(0)?.toUpperCase() ?? "U"}
                {user?.last_name?.charAt(0)?.toUpperCase() ?? ""}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">Account Settings</h1>
              <p className="text-muted-foreground text-sm">
                Kelola pengaturan akun dan keamanan
              </p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="h-auto w-full justify-start gap-6 bg-transparent p-0">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className="mr-2 size-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Lock className="mr-2 size-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="p-0">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold">
                    Profile Details
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        onClick={handleSaveName}
                        disabled={savingName || !nameChanged}
                      >
                        {savingName ? "Menyimpan..." : "Simpan Nama"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email ?? ""}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <div className="flex h-8 items-center">
                        <Badge
                          variant="outline"
                          className="capitalize px-2 py-1"
                        >
                          {user?.role === "owner" ? "Owner" : "Karyawan"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="p-0">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold">Ganti Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Minimal 8 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Konfirmasi Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                    >
                      <Key className="mr-2 size-4" />
                      {changingPassword ? "Menyimpan..." : "Simpan Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0 border-destructive/50">
                <CardContent className="p-6">
                  <h2 className="mb-4 text-lg font-semibold text-destructive">
                    Hapus Akun
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Menghapus akun akan menghilangkan seluruh data secara
                    permanen. Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Hapus Akun
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
