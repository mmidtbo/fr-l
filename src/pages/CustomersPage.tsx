import { DataTable } from "@/components/demo-pages/customer-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSafe } from "@/lib/api/axios";
import { CUSTOMERS, type Customer, type CustomerResponse } from "@/lib/types";
import { Plus, Search, X } from "lucide-react";
import * as React from "react";
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
    if (!Array.isArray(customers)) {
      return [];
    }

    if (!search) {
      return customers;
    }

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
      <div className="flex flex-col mx-4 lg:mx-6 gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pelanggan</h1>
          <p className="text-muted-foreground">Data pelanggan Gresik Laundry</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus />
          Tambah Pelanggan
        </Button>
      </div>

      {/* Search */}
      <Card className="mx-4 lg:mx-6">
        <CardContent>
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
      <div className="mx-4 lg:mx-6 text-sm text-muted-foreground">
        Menampilkan{" "}
        <span className="font-medium text-foreground">{filtered.length}</span>{" "}
        dari{" "}
        <span className="font-medium text-foreground">{customers.length}</span>{" "}
        pelanggan
      </div>

      <DataTable data={customers} />

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
