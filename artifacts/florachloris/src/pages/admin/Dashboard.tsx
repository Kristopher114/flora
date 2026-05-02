import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui-components";
import { Banknote, ShoppingBag, CalendarClock, AlertTriangle, Leaf } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { BarChart3 } from "lucide-react";

type ChartPeriod = "daily" | "weekly" | "monthly" | "yearly";

interface SalesTrendPoint { name: string; sales: number; }

function useSalesTrend(period: ChartPeriod) {
  return useQuery<SalesTrendPoint[]>({
    queryKey: ["sales-trend", period],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/bi-stats?period=${period}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return data.salesTrend as SalesTrendPoint[];
    },
    staleTime: 30_000,
  });
}

const PERIOD_OPTIONS: { label: string; value: ChartPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const [period, setPeriod] = useState<ChartPeriod>("weekly");
  const { data: chartData = [], isFetching: chartLoading } = useSalesTrend(period);

  if (isLoading || !stats) {
    return (
      <div className="animate-pulse space-y-8 mt-4">
        <div className="h-8 bg-muted rounded w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Today's Sales", value: formatCurrency(stats.totalSalesToday), icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Today's Orders", value: stats.totalOrdersToday.toString(), icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Pending Reservations", value: stats.pendingReservations.toString(), icon: CalendarClock, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Low Stock Items", value: stats.lowStockItems.toString(), icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? "Weekly";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your shop's performance</p>
        </div>
        <Link href="/admin/bi-dashboard">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors">
            <BarChart3 className="h-4 w-4" />
            BI Dashboard
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, i) => (
          <Card key={i} className="flex items-center gap-5 p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${card.bg}`}>
              <card.icon className={`h-7 w-7 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{card.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h3 className="font-serif font-bold text-xl">Sales Overview</h3>
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
          <div className={`flex-1 min-h-[280px] w-full transition-opacity ${chartLoading ? "opacity-50" : "opacity-100"}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                  formatter={(value: number) => [formatCurrency(value), "Sales"]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {chartData.every((d) => d.sales === 0) && !chartLoading && (
            <p className="text-center text-xs text-muted-foreground -mt-4">No sales data for this period yet.</p>
          )}
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Leaf className="h-48 w-48" />
          </div>
          <div className="relative z-10">
            <h3 className="font-serif font-bold text-xl mb-2 text-white">Monthly Summary</h3>
            <p className="text-white/80 text-sm mb-8">Performance for the current month</p>
            <div className="space-y-6">
              <div>
                <p className="text-white/70 text-sm mb-1">Total Revenue</p>
                <p className="text-4xl font-serif font-bold">{formatCurrency(stats.totalSalesThisMonth)}</p>
              </div>
              <div className="bg-white/10 h-px w-full" />
              <div>
                <p className="text-white/70 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-serif font-bold">{stats.totalOrdersThisMonth}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
