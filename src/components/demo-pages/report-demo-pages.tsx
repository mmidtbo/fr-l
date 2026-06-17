import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Settings2,
  Save,
  RotateCcw,
  Droplets,
  Wind,
  Shirt,
  Sparkles,
  Bed,
  Zap,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pengaturan Harga · Laundry" },
      {
        name: "description",
        content: "Kelola harga layanan laundry dengan mudah dan rapi.",
      },
    ],
  }),
  component: ReportsPage,
});

type ServiceType = "kg" | "pcs";

type Service = {
  id: string;
  name: string;
  tag: string;
  type: ServiceType;
  icon: React.ComponentType<{ className?: string }>;
  price: number;
  priceMax?: number;
  range?: boolean;
};

const INITIAL: Service[] = [
  {
    id: "cuci-basah",
    name: "Cuci Basah",
    tag: "Cuci Biasa",
    type: "kg",
    icon: Droplets,
    price: 5000,
  },
  {
    id: "cuci-kering",
    name: "Cuci Kering",
    tag: "Cuci Biasa",
    type: "kg",
    icon: Wind,
    price: 5500,
  },
  {
    id: "cuci-setrika",
    name: "Cuci Setrika",
    tag: "Full Service",
    type: "kg",
    icon: Sparkles,
    price: 8000,
  },
  {
    id: "setrika-saja",
    name: "Setrika Saja",
    tag: "Setrika",
    type: "kg",
    icon: Shirt,
    price: 6000,
  },
  {
    id: "handuk-besar",
    name: "Handuk Besar",
    tag: "Per Item",
    type: "pcs",
    icon: Shirt,
    price: 8000,
  },
  {
    id: "handuk-sedang",
    name: "Handuk Sedang",
    tag: "Per Item",
    type: "pcs",
    icon: Shirt,
    price: 6000,
  },
  {
    id: "handuk-kecil",
    name: "Handuk Kecil",
    tag: "Per Item",
    type: "pcs",
    icon: Shirt,
    price: 5000,
  },
  {
    id: "selimut-besar",
    name: "Selimut Besar",
    tag: "Per Item",
    type: "pcs",
    icon: Bed,
    price: 10000,
    priceMax: 12000,
    range: true,
  },
  {
    id: "selimut-kecil",
    name: "Selimut Kecil",
    tag: "Per Item",
    type: "pcs",
    icon: Bed,
    price: 8000,
  },
  {
    id: "selimut-tebal",
    name: "Selimut Tebal",
    tag: "Per Item",
    type: "pcs",
    icon: Bed,
    price: 20000,
  },
  {
    id: "bedcover-big",
    name: "Bed Cover Big",
    tag: "Per Item",
    type: "pcs",
    icon: Bed,
    price: 40000,
    priceMax: 45000,
    range: true,
  },
  {
    id: "bedcover-normal",
    name: "Bed Cover Normal",
    tag: "Per Item",
    type: "pcs",
    icon: Bed,
    price: 18000,
  },
];

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function ReportsPage() {
  const [services, setServices] = useState<Service[]>(INITIAL);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"all" | "kg" | "pcs">("all");
  const [dirty, setDirty] = useState(false);

  const update = (id: string, key: "price" | "priceMax", v: number) => {
    setServices((s) =>
      s.map((it) => (it.id === id ? { ...it, [key]: v } : it)),
    );
    setDirty(true);
  };

  const reset = () => {
    setServices(INITIAL);
    setDirty(false);
  };

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (tab !== "all" && s.type !== tab) return false;
      if (filter && !s.name.toLowerCase().includes(filter.toLowerCase()))
        return false;
      return true;
    });
  }, [services, filter, tab]);

  const stats = useMemo(() => {
    const kg = services.filter((s) => s.type === "kg");
    const pcs = services.filter((s) => s.type === "pcs");
    const avgKg = Math.round(kg.reduce((a, b) => a + b.price, 0) / kg.length);
    const avgPcs = Math.round(
      pcs.reduce((a, b) => a + b.price, 0) / pcs.length,
    );
    return { total: services.length, avgKg, avgPcs };
  }, [services]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] pb-32">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--brand)] text-[var(--brand-fg)] grid place-items-center shadow-sm">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Pengaturan Harga
              </h1>
              <p className="text-xs text-muted-foreground">
                Kelola harga layanan laundry
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button
              onClick={() => setDirty(false)}
              className="gap-2 bg-[var(--brand)] text-[var(--brand-fg)] hover:opacity-90"
            >
              <Save className="h-4 w-4" /> Simpan Harga
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-8 space-y-8">
        {/* Stat cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Layanan"
            value={String(stats.total)}
            hint="jenis layanan aktif"
            icon={Sparkles}
          />
          <StatCard
            label="Rata-rata /kg"
            value={fmt(stats.avgKg)}
            hint="layanan berat"
            icon={Droplets}
          />
          <StatCard
            label="Rata-rata /pcs"
            value={fmt(stats.avgPcs)}
            hint="layanan item"
            icon={Bed}
          />
        </section>

        {/* Toolbar */}
        <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="bg-[var(--surface)] border border-[var(--line)]">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="kg">Per Kg</TabsTrigger>
              <TabsTrigger value="pcs">Per Pcs</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cari layanan..."
              className="pl-9 bg-[var(--surface)] border-[var(--line)]"
            />
          </div>
        </section>

        {/* Service grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} onChange={update} />
          ))}
          {filtered.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-[var(--line)] p-12 text-center text-muted-foreground">
              Tidak ada layanan yang cocok.
            </div>
          )}
        </section>

        {/* Example price table */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
          <div className="p-6 border-b border-[var(--line)] flex items-center justify-between">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--brand)]" />
                Tabel Harga Contoh
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Estimasi biaya berdasarkan harga saat ini
              </p>
            </div>
            <Badge variant="outline" className="border-[var(--line)]">
              Auto-update
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--bg-app)]/60 hover:bg-[var(--bg-app)]/60">
                  <TableHead className="font-medium">Layanan</TableHead>
                  <TableHead className="text-right">1</TableHead>
                  <TableHead className="text-right">3</TableHead>
                  <TableHead className="text-right">5</TableHead>
                  <TableHead className="text-right">10</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} className="border-[var(--line)]">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    {[1, 3, 5, 10].map((q) => (
                      <TableCell
                        key={q}
                        className="text-right tabular-nums text-muted-foreground"
                      >
                        {fmt(s.price * q)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow className="bg-amber-50/60 dark:bg-amber-500/5 border-[var(--line)]">
                  <TableCell className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Zap className="h-4 w-4" /> Express (+50%)
                  </TableCell>
                  {[1, 3, 5, 10].map((q) => (
                    <TableCell
                      key={q}
                      className="text-right tabular-nums font-semibold text-amber-700 dark:text-amber-400"
                    >
                      {fmt(Math.round(services[0].price * 1.5 * q))}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </main>

      {/* Sticky save bar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all ${
          dirty
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] shadow-lg px-4 py-2">
          <span className="text-sm text-muted-foreground pl-2">
            Ada perubahan belum disimpan
          </span>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button
            size="sm"
            onClick={() => setDirty(false)}
            className="gap-1.5 bg-[var(--brand)] text-[var(--brand-fg)] hover:opacity-90 rounded-full"
          >
            <Save className="h-3.5 w-3.5" /> Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
      <div className="h-9 w-9 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] grid place-items-center">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  onChange,
}: {
  service: Service;
  onChange: (id: string, key: "price" | "priceMax", v: number) => void;
}) {
  const Icon = service.icon;
  const unit = service.type === "kg" ? "/kg" : "/pcs";
  return (
    <div className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--brand)]/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] grid place-items-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{service.name}</h3>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className="rounded-full font-normal text-xs"
              >
                {service.tag}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {service.type === "kg"
                  ? "Per Kg"
                  : service.range
                    ? "Range"
                    : "Per Pcs"}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Harga
          </p>
          <p className="font-semibold tabular-nums text-[var(--brand)]">
            {service.range
              ? `${fmt(service.price)} – ${fmt(service.priceMax ?? service.price)}`
              : fmt(service.price)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <PriceInput
          value={service.price}
          onChange={(v) => onChange(service.id, "price", v)}
          suffix={unit}
        />
        {service.range && (
          <>
            <span className="text-muted-foreground">–</span>
            <PriceInput
              value={service.priceMax ?? 0}
              onChange={(v) => onChange(service.id, "priceMax", v)}
              suffix={unit}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="flex-1 flex items-center rounded-lg border border-[var(--line)] bg-[var(--bg-app)] focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/15 transition">
      <span className="pl-3 text-xs text-muted-foreground select-none">Rp</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-0 bg-transparent shadow-none focus-visible:ring-0 tabular-nums font-medium"
      />
      <span className="pr-3 text-xs text-muted-foreground select-none">
        {suffix}
      </span>
    </div>
  );
}
