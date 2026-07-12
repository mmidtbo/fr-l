import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiSafe } from "@/lib/api/axios";
import type { Customer, ServicePrice } from "@/lib/types";
import { CUSTOMERS, EXPRESS_MULTIPLIER, ORDERS } from "@/lib/types";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import React from "react";
import { toast } from "sonner";
import { z } from "zod";

interface OrderInitialData {
  customerId: string;
  servicePriceId: string;
  quantity: number;
  isExpress: boolean | null;
  conditionNotes: string;
  notes: string;
}

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  customer: Customer[];
  price: ServicePrice[];
  initialData?: OrderInitialData;
}

export function OrderDialog({
  open,
  onOpenChange,
  customer,
  price,
  onSuccess,
  initialData,
}: OrderDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [showConditionNotes, setShowConditionNotes] = React.useState(false);
  const [showNotes, setShowNotes] = React.useState(false);

  const formSchema = z
    .object({
      custMode: z.enum(["existing", "new"]),
      selectedCustId: z.string(),
      newCustName: z.string(),
      newCustPhone: z.string(),
      newCustAddress: z.string(),
      servicePriceId: z.string().min(1, "Pilih layanan terlebih dahulu"),
      quantity: z.coerce.number<string>().positive("Jumlah tidak boleh kosong"),
      isExpress: z.boolean(),
      conditionNotes: z.string().max(500),
      notes: z.string().max(500),
      payNow: z.boolean(),
      paymentMethod: z.string(),
      paymentAmount: z.coerce.number<string>().min(0),
    })
    .superRefine((data, ctx) => {
      if (data.custMode === "existing" && !data.selectedCustId) {
        ctx.addIssue({
          code: "custom",
          path: ["selectedCustId"],
          message: "Pilih pelanggan",
        });
      }
      if (data.custMode === "new") {
        if (!data.newCustName.trim())
          ctx.addIssue({
            code: "custom",
            path: ["newCustName"],
            message: "Nama tidak boleh kosong",
          });
        if (!data.newCustPhone.trim())
          ctx.addIssue({
            code: "custom",
            path: ["newCustPhone"],
            message: "Nomor HP tidak boleh kosong",
          });
      }
      if (data.payNow) {
        if (!data.paymentMethod) {
          ctx.addIssue({
            code: "custom",
            path: ["paymentMethod"],
            message: "Pilih metode pembayaran",
          });
        }
        if (!data.paymentAmount || data.paymentAmount <= 0) {
          ctx.addIssue({
            code: "custom",
            path: ["paymentAmount"],
            message: "Jumlah pembayaran harus lebih dari 0",
          });
        }
      }
    });

  const form = useForm({
    defaultValues: {
      custMode: "existing",
      selectedCustId: "",
      newCustName: "",
      newCustPhone: "",
      newCustAddress: "",
      servicePriceId: "",
      quantity: "1",
      isExpress: false,
      conditionNotes: "",
      notes: "",
      payNow: false,
      paymentMethod: "",
      paymentAmount: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (submitting) return;
      setSubmitting(true);

      let custId = value.selectedCustId;

      if (value.custMode === "new") {
        const res = await apiSafe.post(CUSTOMERS, {
          name: value.newCustName.trim(),
          phone: value.newCustPhone.trim(),
          address: value.newCustAddress.trim() || undefined,
        });
        if (res.error) {
          toast.error(res.error);
          setSubmitting(false);
          return;
        }
        custId = (res.data as { data: { id: string } }).data.id;
      }

      const payload: Record<string, unknown> = {
        customer_id: custId,
        service_price_id: value.servicePriceId,
        quantity: value.quantity,
        is_express: value.isExpress,
        condition_notes: value.conditionNotes || undefined,
        notes: value.notes || undefined,
      };

      if (value.payNow) {
        payload.payment = {
          method: value.paymentMethod,
          amount: value.paymentAmount,
          paid_by: custId,
        };
      }

      const orderRes = await apiSafe.post(ORDERS, payload);
      if (orderRes.error) {
        toast.error(orderRes.error);
        setSubmitting(false);
        return;
      }

      toast.success("Pesanan berhasil dibuat!");
      form.reset();
      setShowConditionNotes(false);
      setShowNotes(false);
      onOpenChange(false);
      onSuccess?.();
      setSubmitting(false);
    },
  });

  const wasOpen = React.useRef(false);
  const paymentEdited = React.useRef(false);
  React.useEffect(() => {
    // Hanya reset saat dialog baru dibuka (transisi tertutup -> terbuka),
    // agar input pengguna tidak tertimpa pada setiap render.
    if (open && !wasOpen.current) {
      paymentEdited.current = false;
      if (initialData) {
        form.reset({
          custMode: "existing",
          selectedCustId: initialData.customerId,
          newCustName: "",
          newCustPhone: "",
          newCustAddress: "",
          servicePriceId: initialData.servicePriceId,
          quantity: String(initialData.quantity),
          isExpress: initialData.isExpress ?? false,
          conditionNotes: initialData.conditionNotes,
          notes: initialData.notes,
          payNow: false,
          paymentMethod: "",
          paymentAmount: "",
        });
        setShowConditionNotes(!!initialData.conditionNotes);
        setShowNotes(!!initialData.notes);
      } else {
        form.reset();
        setShowConditionNotes(false);
        setShowNotes(false);
      }
    }
    wasOpen.current = open;
  }, [open, initialData]);

  const custMode = useStore(form.store, (state) => state.values.custMode);

  const servicePriceId = useStore(
    form.store,
    (state) => state.values.servicePriceId,
  );

  const selectedService = React.useMemo(
    () => price.find((p) => p.id === servicePriceId),
    [price, servicePriceId],
  );

  const quantity = useStore(form.store, (state) => state.values.quantity);

  const isExpress = useStore(form.store, (state) => state.values.isExpress);

  const payNow = useStore(form.store, (state) => state.values.payNow);

  const totalPrice = React.useMemo(() => {
    if (!selectedService) return 0;

    let total = 0;

    switch (selectedService.pricing_type) {
      case "per_kg":
      case "per_pcs":
        total = selectedService.price_min * Number(quantity);
        break;

      case "fixed":
        total = selectedService.price_min;
        break;

      case "range":
        total = selectedService.price_max! * Number(quantity);
        break;
    }

    if (isExpress) {
      total *= EXPRESS_MULTIPLIER;
    }

    return total;
  }, [selectedService, quantity, isExpress]);

  React.useEffect(() => {
    if (!payNow) {
      paymentEdited.current = false;
      return;
    }
    if (!paymentEdited.current) {
      form.setFieldValue("paymentAmount", String(totalPrice));
    }
  }, [payNow, totalPrice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <DialogContent className="sm:max-w-sm max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pesanan Baru</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <FieldLabel>Data Pelanggan</FieldLabel>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={custMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => form.setFieldValue("custMode", "existing")}
              >
                Pilih pelanggan
              </Button>

              <Button
                type="button"
                variant={custMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => form.setFieldValue("custMode", "new")}
              >
                + Pelanggan baru
              </Button>
            </div>
            {custMode === "existing" ? (
              <form.Field
                name="selectedCustId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih pelanggan..." />
                        </SelectTrigger>

                        <SelectContent>
                          {customer.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} — {c.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />
            ) : (
              <div className="space-y-2">
                <form.Field
                  name="newCustName"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <Input
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />

                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="newCustPhone"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <Input
                          placeholder="Nomor HP (cth: 0812xxxxxxxx)"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />

                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="newCustAddress"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <Input
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />

                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>
            )}
            <form.Field
              name="servicePriceId"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Layanan</FieldLabel>

                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger aria-invalid={isInvalid}>
                        <SelectValue placeholder="Pilih layanan..." />
                      </SelectTrigger>

                      <SelectContent>
                        {price.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.pricing_type === "per_kg"
                              ? `${p.name} - Rp${p.price_min}/${p.unit_label}`
                              : p.pricing_type === "per_pcs"
                                ? `${p.name} - Rp${p.price_min}/${p.unit_label}`
                                : p.pricing_type === "fixed"
                                  ? `${p.name} - Rp${p.price_min} (fixed)`
                                  : `${p.name} - Rp${p.price_max}/${p.unit_label}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Detail layanan yang dipilih */}
            {selectedService && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{selectedService.name}</span>
                  <span>
                    {selectedService.pricing_type === "per_kg"
                      ? `Rp${selectedService.price_min}/${selectedService.unit_label}`
                      : selectedService.pricing_type === "per_pcs"
                        ? `Rp${selectedService.price_min}/${selectedService.unit_label}`
                        : selectedService.pricing_type === "fixed"
                          ? `Rp${selectedService.price_min} (fixed)`
                          : `Rp${selectedService.price_max}/${selectedService.unit_label}`}
                  </span>
                </div>
              </div>
            )}

            {selectedService && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between">
                  <span>Layanan</span>
                  <span>{selectedService.name}</span>
                </div>

                <div className="flex justify-between">
                  <span>Harga</span>
                  <span>Rp{selectedService.price_min.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span>Qty</span>
                  <span>{quantity}</span>
                </div>

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Rp{totalPrice.toLocaleString("id-ID")}</span>
                </div>
              </div>
            )}

            {selectedService?.pricing_type === "per_kg" && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Tambah Layanan Express</p>
                  <p className="text-xs text-muted-foreground">
                    +100% dari harga normal
                  </p>
                </div>
                <form.Field
                  name="isExpress"
                  children={(field) => (
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  )}
                />
              </div>
            )}

            <form.Field
              name="quantity"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Berat / Jumlah</FieldLabel>

                    <Input
                      type="number"
                      step="any"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />

                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Catatan Kondisi</p>
                <p className="text-xs text-muted-foreground">
                  Catat kondisi laundry pelanggan
                </p>
              </div>
              <Switch
                checked={showConditionNotes}
                onCheckedChange={setShowConditionNotes}
              />
            </div>
            {showConditionNotes && (
              <form.Field
                name="conditionNotes"
                children={(field) => (
                  <Textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Catatan Internal</p>
                <p className="text-xs text-muted-foreground">
                  Catatan untuk internal
                </p>
              </div>
              <Switch checked={showNotes} onCheckedChange={setShowNotes} />
            </div>
            {showNotes && (
              <form.Field
                name="notes"
                children={(field) => (
                  <Textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Bayar Sekarang</p>
                <p className="text-xs text-muted-foreground">
                  Catat pembayaran saat membuat pesanan
                </p>
              </div>
              <form.Field
                name="payNow"
                children={(field) => (
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                )}
              />
            </div>

            <form.Subscribe
              selector={(state) => state.values.payNow}
              children={(payNow) => {
                if (!payNow) return null;
                return (
                  <div className="space-y-4 border rounded-lg p-3">
                    <p className="text-sm font-medium">Detail Pembayaran</p>
                    <form.Field
                      name="paymentMethod"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel>Metode</FieldLabel>
                            <Select
                              value={field.state.value}
                              onValueChange={field.handleChange}
                            >
                              <SelectTrigger aria-invalid={isInvalid}>
                                <SelectValue placeholder="Pilih metode..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="transfer">
                                  Transfer
                                </SelectItem>
                                <SelectItem value="qris">QRIS</SelectItem>
                                <SelectItem value="ewallet">
                                  E-Wallet
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    />
                    <form.Field
                      name="paymentAmount"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel>Jumlah</FieldLabel>
                            <Input
                              type="number"
                              step="any"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                paymentEdited.current = true;
                                field.handleChange(e.target.value);
                              }}
                              aria-invalid={isInvalid}
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    />
                  </div>
                );
              }}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild onClick={() => onOpenChange(false)}>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => {
                form.handleSubmit();
              }}
            >
              {submitting ? "Menyimpan..." : "Buat Pesanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
