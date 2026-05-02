import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Banknote, ShoppingBag, Star, CalendarCheck, AlertTriangle,
  ArrowLeft, TrendingUp, LayoutGrid, BarChart3
} from "lucide-react";

type Period = "daily" | "weekly" | "monthly" | "yearly";

interface BIStats {
  totalSalesAllTime: number;
  totalTransactions: number;
  topSellingProduct: string;
  totalReservations: number;
  lowStockItems: number;
  salesTrend: Array<{ name: string; sales: number }>;
  stockByCategory: Array<{ name: string; stock: number }>;
  orderTypeBreakdown: { posOrders: number; reservationOrders: number };
  salesByCategory: Array<{ name: string; total: number }>;
}

function useBIStats(period: Period) {
  return useQuery<BIStats>({
    queryKey: ["bi-stats", period],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/bi-stats?period=${period}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch BI stats");
      return res.json();
    },
    staleTime: 30_000,
  });
}

const CHART_COLORS = ["#4f7c5a", "#7c5cbf", "#e0a335", "#d45f6a", "#3b82f6", "#10b981", "#f59e0b"];

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex items-start gap-4 shadow-sm hover:-translate-y-0.5 transition-transform">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-xl font-bold text-foreground mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-serif font-bold text-lg text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name === "sales" || entry.name === "total"
            ? formatCurrency(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function BIDashboard() {
  const { user, logout } = useAuth();
  const [period, setPeriod] = useState<Period>("weekly");
  const { data: stats, isLoading } = useBIStats(period);

  const kpiCards = stats
    ? [
        {
          title: "Total Sales (All Time)",
          value: formatCurrency(stats.totalSalesAllTime),
          icon: Banknote,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          title: "Total Transactions",
          value: stats.totalTransactions.toLocaleString(),
          icon: ShoppingBag,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          title: "Top Selling Product",
          value: stats.topSellingProduct,
          icon: Star,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          title: "Total Reservations",
          value: stats.totalReservations.toLocaleString(),
          icon: CalendarCheck,
          color: "text-violet-600",
          bg: "bg-violet-50",
        },
        {
          title: "Low Stock Items",
          value: stats.lowStockItems.toLocaleString(),
          icon: AlertTriangle,
          color: "text-rose-600",
          bg: "bg-rose-50",
          sub: "Below 10 units",
        },
      ]
    : [];

  const orderTypeData = stats
    ? [
        { name: "POS Orders", value: stats.orderTypeBreakdown.posOrders },
        { name: "Reservations", value: stats.orderTypeBreakdown.reservationOrders },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#f8f4ef]">
      <header className="bg-white border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/portal-select">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Portal</span>
              </button>
            </Link>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-base text-foreground leading-none">
                  Business Intelligence
                </h1>
                <p className="text-xs text-muted-foreground">POS · Inventory · Reservation Analytics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin">
              <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <LayoutGrid className="h-4 w-4" />
                Operations
              </button>
            </Link>
            <div className="flex items-center bg-muted rounded-xl p-1 gap-0.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === opt.value
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 bg-white rounded-2xl" />
              ))}
            </div>
          </div>
        ) : !stats ? (
          <div className="text-center py-20 text-muted-foreground">Failed to load analytics data.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {kpiCards.map((card, i) => (
                <StatCard key={i} {...card} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Sales Trend"
                subtitle={`${period.charAt(0).toUpperCase() + period.slice(1)} revenue overview`}
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.salesTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(v) => `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#4f7c5a"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: "#4f7c5a", strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Stock by Category" subtitle="Current inventory levels">
                <div className="h-64">
                  {stats.stockByCategory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No stock data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.stockByCategory}
                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
                          {stats.stockByCategory.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Order Types" subtitle="POS walk-in vs. reservations">
                <div className="h-64 flex items-center">
                  {orderTypeData.every((d) => d.value === 0) ? (
                    <div className="w-full text-center text-muted-foreground text-sm">No orders yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {orderTypeData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                            fontSize: 13,
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Revenue by Category" subtitle="Sales distribution across product categories">
                <div className="h-64 flex items-center">
                  {stats.salesByCategory.length === 0 ? (
                    <div className="w-full text-center text-muted-foreground text-sm">No sales data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.salesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="total"
                          nameKey="name"
                        >
                          {stats.salesByCategory.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                            fontSize: 13,
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

