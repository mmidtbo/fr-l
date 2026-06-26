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
  FieldSeparator,
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
import api from "@/lib/api/axios";
import type { Customer, ServicePrice } from "@/lib/types";
import { CUSTOMERS, ORDERS } from "@/lib/types";
import { useForm } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-store";
import React from "react";
import { z } from "zod";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  customer: Customer[];
  price: ServicePrice[];
}

export function OrderDialog({
  open,
  onOpenChange,
  customer,
  price,
  onSuccess,
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
      quantity: z.coerce.number().positive("Jumlah/berat tidak boleh kosong"),
      isExpress: z.boolean(),
      conditionNotes: z.string().max(500).optional(),
      notes: z.string().max(500).optional(),
      payNow: z.boolean(),
      paymentMethod: z.string(),
      paymentAmount: z.coerce.number(),
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
      quantity: 0,
      isExpress: false,
      conditionNotes: "",
      notes: "",
      payNow: false,
      paymentMethod: "",
      paymentAmount: 0,
    },
    validators: {
      onSubmit: formSchema,
      onChange: formSchema,
      onBlur: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        console.log("MASUK ONSUBMIT");
        console.log(value);
        setSubmitting(true);

        let custId = value.selectedCustId;

        if (value.custMode === "new") {
          const res = await api.post(CUSTOMERS, {
            name: value.newCustName.trim(),
            phone: value.newCustPhone.trim(),
            address: value.newCustAddress.trim(),
          });

          custId = res.data.id;
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

        await api.post(ORDERS, payload);

        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const custMode = useStore(form.store, (state) => state.values.custMode);

  const servicePriceId = useStore(
    form.store,
    (state) => state.values.servicePriceId,
  );

  const selectedService = React.useMemo(
    () => price.find((p) => p.id === servicePriceId),
    [price, servicePriceId],
  );

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
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(e.target.valueAsNumber || 0)
                      }
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
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.valueAsNumber || 0)
                              }
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
