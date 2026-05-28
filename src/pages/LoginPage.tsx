import * as React from "react";
import { WashingMachine, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { ModeToggle } from "@/components/mode-toggle";

export function LoginPage() {
  const { signIn, signUp } = useAuth();

  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [showLoginPw, setShowLoginPw] = React.useState(false);

  const [regName, setRegName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regRole, setRegRole] = React.useState<"owner" | "karyawan">(
    "karyawan",
  );
  const [regError, setRegError] = React.useState("");
  const [regLoading, setRegLoading] = React.useState(false);
  const [showRegPw, setShowRegPw] = React.useState(false);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim()) {
      toast("nama tidak boleh kosong");
      return;
    }
    if (!loginPassword.trim()) {
      toast("password tidak boleh kosong");
      return;
    }
    if (loginPassword.length < 8) {
      toast("password minimal 8 karakter");
      return;
    }

    setLoginLoading(true);
    const result = await signIn(loginEmail, loginPassword);
    if (result.error) {
      toast("Email atau password salah. Silakan coba lagi.");
    }
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setRegError("");
    if (!regName.trim()) {
      setRegError("Nama tidak boleh kosong.");
      return;
    }
    if (regPassword.length < 8) {
      setRegError("Password minimal 8 karakter.");
      return;
    }
    setRegLoading(true);
    const { error } = await signUp(regEmail, regPassword, regName, regRole);
    if (error)
      setRegError(error.includes("already") ? "Email sudah terdaftar." : error);
    setRegLoading(false);
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-muted/30 p-4 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <WashingMachine className="size-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gresik Laundry
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistem Informasi Manajemen Laundry
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Selamat Datang</CardTitle>
            <CardDescription>
              Masuk atau daftarkan akun baru untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1">
                  Masuk
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1">
                  Daftar
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPw ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showLoginPw ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {loginError && (
                    <p className="text-sm text-destructive">{loginError}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Memuat..." : "Masuk"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Nama Lengkap</Label>
                    <Input
                      id="reg-name"
                      placeholder="Nama lengkap Anda"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showRegPw ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showRegPw ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Peran</Label>
                    <Select
                      value={regRole}
                      onValueChange={(v) =>
                        setRegRole(v as "owner" | "karyawan")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Pemilik (Owner)</SelectItem>
                        <SelectItem value="karyawan">Karyawan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {regError && (
                    <p className="text-sm text-destructive">{regError}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={regLoading}
                  >
                    {regLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Gresik Laundry &copy; {new Date().getFullYear()} &mdash; Sistem
          Informasi Manajemen
        </p>
      </div>
    </div>
  );
}
