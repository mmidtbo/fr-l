import * as React from "react";
import { Plus, Search, Phone, MapPin, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CUSTOMERS, type Customer, type CustomerResponse } from "@/lib/types";
import { apiSafe } from "@/lib/api/axios";
import { toast } from "sonner";

export function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showDialog, setShowDialog] = React.useState(false);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect((): void => {
    fetchCustomers();
  }, []);

  async function fetchCustomers(): Promise<void> {
    setLoading(true);
    const raw_data = await apiSafe.get(CUSTOMERS);
    const customers = (raw_data as any).data.data;
    setCustomers(customers ?? []);
    setLoading(false);
  }

  async function handleSubmit(e: React.ChangeEvent): Promise<void> {
    e.preventDefault();

    setFormError("");
    setSubmitting(true);

    try {
      if (!name.trim()) {
        setFormError("Nama tidak boleh kosong.");
        return;
      }

      if (!phone.trim()) {
        setFormError("Nomor HP tidak boleh kosong.");
        return;
      }

      if (!/^08[0-9]{8,11}$/.test(phone.replace(/\s/g, ""))) {
        setFormError("Format nomor HP tidak valid (contoh: 08123456789).");
        return;
      }

      const response = await apiSafe.post<CustomerResponse>(CUSTOMERS, {
        name,
        phone,
        address,
      });

      const result = response.data;
      if (!result) {
        throw new Error("Failed create customer");
      }

      if (result.status_code === 201) {
        toast.success("Customer berhasil ditambahkan");
        await fetchCustomers();

        setName("");
        setPhone("");
        setAddress("");

        setShowDialog(false);
        return;
      }

      if (result.status_code === 409) {
        setFormError("Nomor telepon sudah digunakan.");
        toast.error("Nomor telepon sudah digunakan");
        return;
      }

      setFormError("Terjadi kesalahan.");
    } catch (error) {
      console.error(error);

      setFormError("Gagal menambahkan customer.");
      toast.error("Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = React.useMemo((): Customer[] => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address?.toLowerCase().includes(q),
    );
  }, [customers, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pelanggan</h1>
          <p className="text-muted-foreground">Data pelanggan Gresik Laundry</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2 shrink-0">
          <Plus className="size-4" />
          Tambah Pelanggan
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, nomor HP, atau alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Menampilkan{" "}
        <span className="font-medium text-foreground">{filtered.length}</span>{" "}
        dari{" "}
        <span className="font-medium text-foreground">{customers.length}</span>{" "}
        pelanggan
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="size-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Tidak ada pelanggan
              </p>
              <p className="text-sm text-muted-foreground">
                {search ? "Coba kata kunci lain" : "Tambah pelanggan pertama"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Nomor HP</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Bergabung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center justify-center gap-1 text-sm hover:underline text-foreground"
                      >
                        <Phone className="size-3 text-muted-foreground" />
                        {c.phone}
                      </a>
                    </TableCell>
                    <TableCell>
                      {c.address ? (
                        <span className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          {c.address}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cust-name"
                placeholder="Nama lengkap pelanggan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">
                Nomor HP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cust-phone"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-address">Alamat</Label>
              <Input
                id="cust-address"
                placeholder="Alamat rumah (opsional)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
