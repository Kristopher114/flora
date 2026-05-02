import { useState } from "react";
import { Link } from "wouter";
import { useUpdateReservationStatus, useGetMyReservations } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarDays, MapPin, CreditCard, Package2, ChevronLeft, Plus,
  Clock, CheckCircle, XCircle, Star, LogIn, AlertCircle, Info
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

const CANCEL_WINDOW_HOURS = 7;
const ADMIN_OVERDUE_DAYS = 2;

function getCancellationStatus(reservation: { status: string; createdAt: string }): {
  canCancel: boolean;
  reason: string | null;
} {
  if (reservation.status !== "pending") {
    return { canCancel: false, reason: null };
  }
  const now = Date.now();
  const created = new Date(reservation.createdAt).getTime();
  const hoursSince = (now - created) / (1000 * 60 * 60);
  const daysSince = hoursSince / 24;

  if (hoursSince <= CANCEL_WINDOW_HOURS) {
    const hoursLeft = CANCEL_WINDOW_HOURS - hoursSince;
    const minsLeft = Math.ceil(hoursLeft * 60);
    const label = minsLeft < 60
      ? `${minsLeft} min${minsLeft !== 1 ? "s" : ""}`
      : `${Math.ceil(hoursLeft)} hr${Math.ceil(hoursLeft) !== 1 ? "s" : ""}`;
    return { canCancel: true, reason: `Cancel window closes in ${label}` };
  }

  if (daysSince >= ADMIN_OVERDUE_DAYS) {
    return { canCancel: true, reason: "Admin has not confirmed within 2 days — you may still cancel" };
  }

  const hoursUntilOverdue = ADMIN_OVERDUE_DAYS * 24 - hoursSince;
  const hLabel = `${Math.ceil(hoursUntilOverdue)} hr${Math.ceil(hoursUntilOverdue) !== 1 ? "s" : ""}`;
  return {
    canCancel: false,
    reason: `Cancellation window closed. If admin hasn't confirmed in ${hLabel}, you may cancel again.`,
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });
}

const STATUS_CONFIG: Record<string, {
  label: string;
  badgeClass: string;
  topBorder: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
    topBorder: "border-t-4 border-amber-400",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-green-50 text-green-700 border border-green-200",
    topBorder: "border-t-4 border-green-500",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    topBorder: "border-t-4 border-blue-500",
    icon: <Star className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-red-50 text-red-600 border border-red-200",
    topBorder: "border-t-4 border-red-500",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

export default function MyReservations() {
  const { setIsCartOpen } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const { data: reservations = [], isLoading, refetch } = useGetMyReservations({
    query: { enabled: !!user },
  });

  const cancelMutation = useUpdateReservationStatus({
    mutation: {
      onSuccess: () => {
        refetch();
        setCancellingId(null);
        toast({ title: "Reservation cancelled." });
      },
      onError: () => {
        setCancellingId(null);
        toast({ title: "Error", description: "Could not cancel reservation.", variant: "destructive" });
      },
    },
  });

  const handleCancel = (id: number) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    setCancellingId(id);
    cancelMutation.mutate({ id, data: { status: "cancelled" } });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}images/florachloris-logo.png`}
              alt="Flora-Chloris"
              className="h-8 w-8 object-contain"
            />
            <span className="font-serif text-lg font-bold text-foreground hidden sm:block">Flora-Chloris</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary border-b-2 border-primary pb-0.5">My Reservations</span>
            {user && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-2 rounded-full font-semibold shadow hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3 w-3" />
                New
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Not logged in */}
        {!authLoading && !user ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-sm">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">Sign in to view your reservations</h3>
            <p className="text-muted-foreground mb-6 text-sm max-w-xs mx-auto">
              Your reservations are saved to your account. Please sign in to access them.
            </p>
            <Link href="/login">
              <button className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors text-sm inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Page title */}
            <div className="mb-6">
              <h1 className="text-3xl font-serif font-bold text-[#6B1A2A]">My Reservations</h1>
              <p className="text-sm text-muted-foreground mt-1">Track and manage your floral arrangement orders.</p>
            </div>

            {/* Cancellation policy banner */}
            <div className="mb-6 bg-[#FDF0F2] border border-[#E8B4BE] rounded-2xl px-4 py-3 flex gap-3">
              <Info className="h-4 w-4 text-[#9B2C3A] mt-0.5 shrink-0" />
              <p className="text-sm text-[#6B1A2A] leading-relaxed">
                <span className="font-semibold">Cancellation policy:</span> You may cancel a reservation within{" "}
                <span className="font-bold">7 hours</span> of placing it. If the admin has not confirmed your
                reservation within <span className="font-bold">2 days</span>, the time limit is lifted and you
                can cancel at any time.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-muted-foreground">Loading your reservations…</div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-sm">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package2 className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-2">No reservations yet</h3>
                <p className="text-muted-foreground mb-6">Browse our collection and make your first reservation.</p>
                <Link href="/">
                  <button className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors text-sm">
                    Shop Now
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {reservations.map((res) => {
                  const cfg = STATUS_CONFIG[res.status] ?? STATUS_CONFIG.pending;
                  const { canCancel, reason: cancelReason } = getCancellationStatus({
                    status: res.status,
                    createdAt: res.createdAt ?? new Date().toISOString(),
                  });

                  return (
                    <div key={res.id} className={`bg-white rounded-2xl border border-border shadow-sm overflow-hidden ${cfg.topBorder}`}>
                      {/* Card header row */}
                      <div className="flex items-start justify-between px-5 pt-4 pb-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-base text-[#3D1010]">
                            Order #{String(res.id).padStart(4, "0")}
                          </span>
                          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badgeClass}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </div>
                        <span className="font-bold text-lg text-primary shrink-0 ml-3">
                          {formatCurrency(Number(res.total))}
                        </span>
                      </div>

                      {/* Placed time */}
                      <div className="px-5 pb-3 pt-0.5">
                        <p className="text-xs text-muted-foreground">
                          Placed {timeAgo(res.createdAt ?? "")} · {formatDateTime(res.createdAt ?? "")}
                        </p>
                      </div>

                      <div className="border-t border-border/60" />

                      {/* Meta grid */}
                      <div className="grid grid-cols-3 gap-0 divide-x divide-border/40 px-0 py-4">
                        <div className="px-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Event Date
                          </p>
                          <p className="text-sm font-semibold text-foreground">{formatEventDate(res.pickupDate)}</p>
                        </div>
                        <div className="px-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Fulfillment
                          </p>
                          <p className="text-sm font-semibold text-foreground capitalize">
                            {res.fulfillmentType ?? "Pickup"}
                          </p>
                        </div>
                        {res.paymentMethod && (
                          <div className="px-5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                              <CreditCard className="h-3 w-3" /> Payment
                            </p>
                            <p className="text-sm font-semibold text-foreground capitalize">{res.paymentMethod}</p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-border/60" />

                      {/* Items */}
                      <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Items</p>
                        <div className="flex flex-col gap-2">
                          {(res.items as any[]).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-foreground/80">{item.productName} × {item.quantity}</span>
                              <span className="font-medium text-foreground">{formatCurrency(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Notes / Special instructions */}
                        {res.notes && (
                          <div className="mt-3 border-l-4 border-primary/40 bg-primary/5 rounded-r-xl px-4 py-3">
                            <p className="text-xs font-bold text-primary mb-0.5">Special Instructions</p>
                            <p className="text-xs text-muted-foreground italic">{res.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Cancel action + hint */}
                      {(canCancel || cancelReason) && (
                        <>
                          <div className="border-t border-border/60" />
                          <div className="px-5 py-3 flex items-center justify-between gap-3">
                            {cancelReason && (
                              <div className={`flex items-start gap-2 text-xs flex-1 ${
                                canCancel ? "text-amber-700" : "text-muted-foreground"
                              }`}>
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <span>{cancelReason}</span>
                              </div>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => handleCancel(res.id)}
                                disabled={cancellingId === res.id}
                                className="shrink-0 text-xs border border-destructive/40 text-destructive px-4 py-1.5 rounded-full hover:bg-destructive/5 transition-colors disabled:opacity-50 font-semibold"
                              >
                                {cancellingId === res.id ? "Cancelling…" : "Cancel"}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
