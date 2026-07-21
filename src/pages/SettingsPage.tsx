import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiSafe } from "@/lib/api/axios";
import type { ServicePrice } from "@/lib/types";
import { formatRupiah, EXPRESS_MULTIPLIER, SERVICE } from "@/lib/types";
import { RefreshCw, Save, Settings } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  basic_wash: "Cuci Biasa",
  full_service: "Full Service",
  ironing: "Setrika",
  item_based: "Per Item",
};

const PRICING_TYPE_LABELS: Record<string, string> = {
  per_kg: "Per Kg",
  per_pcs: "Per Pcs",
  fixed: "Fixed",
  range: "Range",
};

export function SettingsPage() {
  const [prices, setPrices] = React.useState<ServicePrice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editValues, setEditValues] = React.useState<
    Record<string, { price_min: string; price_max: string }>
  >({});

  React.useEffect(() => {
    fetchPrices();
  }, []);

  async function fetchPrices() {
    setLoading(true);
    const res = await apiSafe.get<any>(SERVICE);
    if (res.error) {
      toast.error(res.error);
    } else {
      const data = (res.data as any)?.data ?? [];
      const list: ServicePrice[] = data.filter((p: any) => p.is_active);
      setPrices(list);
      const vals: Record<string, { price_min: string; price_max: string }> = {};
      list.forEach((p) => {
        vals[p.id] = {
          price_min: String(p.price_min ?? ""),
          price_max: p.price_max ? String(p.price_max) : "",
        };
      });
      setEditValues(vals);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    let hasError = false;
    for (const price of prices) {
      const vals = editValues[price.id];
      if (!vals) continue;
      const value = parseFloat(vals.price_min) || 0;
      const res = await apiSafe.put(
        `${SERVICE}/${price.id}?value=${value}`,
        {},
      );
      if (res.error) {
        toast.error(res.error);
        hasError = true;
        break;
      }
    }
    if (!hasError) {
      toast.success("Harga berhasil disimpan!");
      await fetchPrices();
    }
    setSaving(false);
  }

  const activePrices = prices.filter((p) => p.is_active);

  function getEffectivePrice(price: ServicePrice): number {
    const vals = editValues[price.id];
    return parseFloat(vals?.price_min ?? String(price.price_min)) || 0;
  }

  const expressPrice = React.useMemo(() => {
    const perKg = activePrices.find((p) => p.pricing_type === "per_kg");
    if (!perKg) return 0;
    return getEffectivePrice(perKg) * EXPRESS_MULTIPLIER;
  }, [editValues, activePrices]);

  return (
    <div className="space-y-6">
      <div className="mx-4 lg:mx-6">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola harga layanan laundry</p>
      </div>

      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Settings className="size-4" />
            </div>

            <div>
              <CardTitle className="font-semibold">Harga Layanan</CardTitle>
              <CardDescription>
                Atur harga untuk setiap jenis layanan laundry
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : activePrices.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada layanan yang aktif.
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {activePrices.map((price) => {
                  const vals = editValues[price.id] ?? {
                    price_min: "",
                    price_max: "",
                  };

                  const isRange = price.pricing_type === "range";

                  return (
                    <Card key={price.id}>
                      <CardContent className="space-y-4 pt-6">
                        <div>
                          <h4 className="font-medium">{price.name}</h4>

                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {CATEGORY_LABELS[price.category] ??
                                price.category}
                            </Badge>

                            <Badge variant="outline">
                              {PRICING_TYPE_LABELS[price.pricing_type] ??
                                price.pricing_type}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="500"
                            value={vals.price_min}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                [price.id]: {
                                  ...prev[price.id],
                                  price_min: e.target.value,
                                },
                              }))
                            }
                          />

                          {isRange && (
                            <>
                              <span>-</span>

                              <Input
                                type="number"
                                min="0"
                                step="500"
                                value={vals.price_max}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    [price.id]: {
                                      ...prev[price.id],
                                      price_max: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>/{price.unit_label}</span>

                          {!isRange && vals.price_min && (
                            <span>{formatRupiah(Number(vals.price_min))}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={fetchPrices}
                  disabled={saving}
                >
                  <RefreshCw className="mr-2 size-4" />
                  Reset
                </Button>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}

                  {saving ? "Menyimpan..." : "Simpan Harga"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Price Preview Table */}
      <div className="mx-4 lg:mx-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-base">Tabel Harga Contoh</CardTitle>
            <CardDescription>
              Estimasi biaya berdasarkan harga saat ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      Layanan
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      1
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      3
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      5
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      10
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activePrices
                    .filter(
                      (p) =>
                        p.pricing_type === "per_kg" ||
                        p.pricing_type === "per_pcs",
                    )
                    .map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{p.name}</td>
                        {[1, 3, 5, 10].map((qty) => (
                          <td
                            key={qty}
                            className="text-right py-2 text-muted-foreground"
                          >
                            {formatRupiah(getEffectivePrice(p) * qty)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  {expressPrice > 0 && (
                    <tr className="bg-amber-50/50 dark:bg-amber-950/10">
                      <td className="py-2 font-medium text-amber-700 dark:text-amber-400">
                        Express (+100%)
                      </td>
                      {[1, 3, 5, 10].map((qty) => (
                        <td
                          key={qty}
                          className="text-right py-2 text-amber-700 dark:text-amber-400"
                        >
                          {formatRupiah(expressPrice * qty)}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
