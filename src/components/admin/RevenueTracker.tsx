import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

type Period = "7d" | "30d" | "3m" | "all";
type ChartType = "area" | "bar";
type ViewMode = "timeseries" | "donut" | "both";

type RevenueOrder = {
  total_amount: number;
  created_at: string;
  events?: {
    category?: string | null;
  } | null;
};

type RevenuePoint = {
  id: string;
  label: string;
  revenue: number;
};

type RevenueSegment = {
  name: string;
  value: number;
  color: string;
};

const DONUT_COLORS = ["#8b5cf6", "#a855f7", "#9333ea", "#c084fc", "#7c3aed", "#d8b4fe"];

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "3m", label: "3 Months" },
  { key: "all", label: "All Time" },
];

const startOfPeriod = (period: Period) => {
  const now = new Date();
  const d = new Date(now);

  if (period === "7d") {
    d.setDate(d.getDate() - 6);
  } else if (period === "30d") {
    d.setDate(d.getDate() - 29);
  } else if (period === "3m") {
    d.setMonth(d.getMonth() - 3);
  } else {
    d.setFullYear(d.getFullYear() - 2);
  }

  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeekMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const bucketIdFor = (dateInput: string, period: Period) => {
  const d = new Date(dateInput);
  if (period === "7d" || period === "30d") {
    return d.toISOString().slice(0, 10);
  }
  return startOfWeekMonday(d).toISOString().slice(0, 10);
};

const labelFor = (id: string) => {
  const d = new Date(`${id}T00:00:00`);
  return d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
};

const buildSeries = (orders: RevenueOrder[], period: Period): RevenuePoint[] => {
  const bucketTotals = new Map<string, number>();

  for (const order of orders) {
    const id = bucketIdFor(order.created_at, period);
    bucketTotals.set(id, (bucketTotals.get(id) || 0) + Number(order.total_amount));
  }

  const points: RevenuePoint[] = [];
  const now = new Date();

  if (period === "7d" || period === "30d") {
    const cursor = startOfPeriod(period);
    while (cursor <= now) {
      const id = cursor.toISOString().slice(0, 10);
      points.push({ id, label: labelFor(id), revenue: bucketTotals.get(id) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }

  const cursor = startOfWeekMonday(startOfPeriod(period));
  while (cursor <= now) {
    const id = cursor.toISOString().slice(0, 10);
    points.push({ id, label: labelFor(id), revenue: bucketTotals.get(id) || 0 });
    cursor.setDate(cursor.getDate() + 7);
  }

  return points;
};

const StatCard = ({ label, value, sub, emphasize = false }: { label: string; value: string; sub: string; emphasize?: boolean }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-heading font-bold ${emphasize ? "text-primary" : "text-foreground"}`}>{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
  </div>
);

const RevenueTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-primary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const RevenueTracker = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [orders, setOrders] = useState<RevenueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRevenueOrders = async () => {
      setLoading(true);
      const from = startOfPeriod(period).toISOString();

      const { data, error } = await (supabase as any)
        .from("orders")
        .select("total_amount, created_at, events(category)")
        .eq("status", "confirmed")
        .gte("created_at", from)
        .order("created_at", { ascending: true });

      if (error) {
        setOrders([]);
        toast({ title: "Unable to load revenue analytics", description: error.message, variant: "destructive" });
      } else {
        setOrders((data || []) as RevenueOrder[]);
      }

      setLoading(false);
    };

    fetchRevenueOrders();
  }, [period, toast]);

  const chartData = useMemo(() => buildSeries(orders, period), [orders, period]);

  const grossRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total_amount), 0), [orders]);

  const avgPerBucket = useMemo(() => {
    if (chartData.length === 0) return 0;
    return grossRevenue / chartData.length;
  }, [chartData, grossRevenue]);

  const peak = useMemo(() => {
    if (chartData.length === 0) return { label: "-", revenue: 0 };
    return chartData.reduce((max, current) => (current.revenue > max.revenue ? current : max), chartData[0]);
  }, [chartData]);

  const donutData = useMemo<RevenueSegment[]>(() => {
    const totals = new Map<string, number>();

    for (const order of orders) {
      const key = order.events?.category?.trim() || "Uncategorized";
      totals.set(key, (totals.get(key) || 0) + Number(order.total_amount));
    }

    const sorted = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], idx) => ({
        name,
        value,
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }));

    return sorted;
  }, [orders]);

  const bucketLabel = period === "7d" || period === "30d" ? "day" : "week";

  return (
    <section className="rounded-xl border border-border bg-card p-5 mb-8">
      <div className="flex flex-col gap-4 mb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold">Revenue Tracker</h2>
          <p className="text-sm text-muted-foreground">Confirmed orders only</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                period === p.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-transparent hover:border-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <StatCard label="Gross Revenue" value={formatCurrency(grossRevenue)} sub={`Range: ${period === "all" ? "All time" : period}`} emphasize />
        <StatCard label={`Avg / ${bucketLabel}`} value={formatCurrency(avgPerBucket)} sub={`Across selected ${bucketLabel}s`} />
        <StatCard label={`Peak ${bucketLabel}`} value={formatCurrency(peak.revenue)} sub={peak.label} />
        <StatCard label="Confirmed Orders" value={String(orders.length)} sub="Count in selected range" />
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <div className="flex flex-wrap justify-between gap-2 mb-2">
          <div className="flex gap-2">
            {([
              { key: "timeseries", label: "Trend" },
              { key: "donut", label: "Cycle" },
              { key: "both", label: "Both" },
            ] as const).map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={`px-3 py-1 text-xs rounded-md border ${
                  viewMode === mode.key ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
          <button
            onClick={() => setChartType("area")}
            className={`px-3 py-1 text-xs rounded-md border ${
              chartType === "area" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 text-xs rounded-md border ${
              chartType === "bar" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
            }`}
          >
            Bar
          </button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Loading revenue data...</div>
        ) : (
          <div className={`grid gap-4 ${viewMode === "both" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
            {viewMode !== "donut" && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      />
                      <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueFill)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      />
                      <Tooltip content={<RevenueTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {viewMode !== "timeseries" && (
              <div className="min-h-64 rounded-md border border-border bg-card p-3">
                <p className="text-sm text-muted-foreground mb-2">Revenue by Category</p>
                {donutData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No confirmed revenue for this range.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-2 items-center">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip content={<RevenueTooltip />} />
                          <Pie
                            data={donutData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={100}
                            paddingAngle={2}
                          >
                            {donutData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      {donutData.map((seg) => {
                        const pct = grossRevenue > 0 ? (seg.value / grossRevenue) * 100 : 0;
                        return (
                          <div key={seg.name} className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                              <span className="text-muted-foreground truncate">{seg.name}</span>
                            </div>
                            <span className="font-medium whitespace-nowrap">{pct.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default RevenueTracker;
