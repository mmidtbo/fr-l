import { DataTable } from "@/components/demo-pages/customer-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { apiSafe } from "@/lib/api/axios";
import {
  CUSTOMERS,
  CustomersPaginationrequest,
  type Customer,
  type CustomerMetadata,
  type CustomerResponse,
  type CustomersRaw,
} from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export function CustomersPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const queryClient = useQueryClient();

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [search, setSearch] = React.useState("");
  const [showDialog, setShowDialog] = React.useState(false);
  const [metadata_first, setMetadataFirst] = React.useState<CustomerMetadata>({
    page: 0,
    take: 0,
    total: 0,
  });

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<Customer | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const customers = useQuery({
    queryKey: ["customers", pagination.pageIndex, pagination.pageSize],
    queryFn: async (): Promise<CustomersRaw> => {
      const response = await CustomersPaginationrequest(
        pagination.pageIndex + 1,
        pagination.pageSize,
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const data: CustomersRaw = response.data ?? {
        data: [],
        page: 0,
        take: 0,
        total: 0,
        status_code: 0,
      };

      setMetadataFirst({
        page: data.page,
        take: data.take,
        total: data.total,
      });
      return data;
    },
  });

  const allCustomers = customers.data?.data ?? [];

  const filteredCustomers = React.useMemo(() => {
    if (!search.trim()) return allCustomers;
    const q = search.toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.address?.toLowerCase().includes(q),
    );
  }, [allCustomers, search]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    setFormError("");

    if (!name.trim()) {
      setFormError("Nama tidak boleh kosong.");
      return;
    }

    if (!phone.trim()) {
      setFormError("Nomor HP tidak boleh kosong.");
      return;
    }

    if (!/^08[0-9]{6,13}$/.test(phone.replace(/\s/g, ""))) {
      setFormError("Format nomor HP tidak valid (contoh: 08123456789).");
      return;
    }

    setSubmitting(true);

    const response = await apiSafe.post<CustomerResponse>(CUSTOMERS, {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
    });

    if (response.error) {
      const message = /unique|sudah|already|conflict/i.test(response.error)
        ? "Nomor telepon sudah digunakan."
        : response.error;
      setFormError(message);
      toast.error(message);
      setSubmitting(false);
      return;
    }

    toast.success("Pelanggan berhasil ditambahkan.");
    setName("");
    setPhone("");
    setAddress("");
    setShowDialog(false);
    setSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await apiSafe.delete(`${CUSTOMERS}/${deleteTarget.id}`);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Pelanggan ${deleteTarget.name} berhasil dihapus.`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

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
        <span className="font-medium text-foreground">
          {filteredCustomers.length}
        </span>{" "}
        dari{" "}
        <span className="font-medium text-foreground">
          {metadata_first.total ?? 0}
        </span>{" "}
        pelanggan
      </div>

      {customers.isError ? (
        <div className="mx-4 lg:mx-6 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            Gagal memuat data pelanggan.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => customers.refetch()}
          >
            Coba Lagi
          </Button>
        </div>
      ) : (
        <DataTable
          data={filteredCustomers}
          metadata={metadata_first}
          pagination={pagination}
          setPagination={setPagination}
          onDelete={isOwner ? setDeleteTarget : undefined}
        />
      )}

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
                disabled={submitting}
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Data pelanggan <strong>{deleteTarget?.name}</strong> akan dihapus
              permanen. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
