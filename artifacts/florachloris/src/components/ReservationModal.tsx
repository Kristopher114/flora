import {
  X, ChevronLeft, ChevronRight, CalendarIcon, Smartphone, CheckCircle2,
  Upload, ImageIcon, ArrowLeft, User, Phone, Mail, CalendarCheck2, ShoppingBag,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui-components";
import { formatCurrency } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import {
  useCreateReservation,
  type CreateReservationRequestItemsItem,
} from "@workspace/api-client-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useReservationFlow } from "@/lib/reservation-flow";

// ─── OWNER CONFIG ────────────────────────────────────────────────────────────
const GCASH_ACCOUNT_NAME = "FShop";
const GCASH_NUMBER       = "0968-607-2134";
const QR_IMAGE_URL = `${import.meta.env.BASE_URL}images/gcash-qr.jpg`;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const MONTHS    = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEK_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function MiniCalendar({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const today = new Date();
  const [view, setView] = useState<Date>(value ?? today);
  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const isPast   = (d: number) => { const dt = new Date(year, month, d); dt.setHours(0,0,0,0); const t = new Date(); t.setHours(0,0,0,0); return dt < t; };
  const isSelHit = (d: number) => value && value.getFullYear() === year && value.getMonth() === month && value.getDate() === d;
  const isTod    = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const pickDay  = (d: number) => {
    if (isPast(d)) return;
    const next = new Date(year, month, d, value?.getHours() ?? 10, value?.getMinutes() ?? 0);
    onChange(next);
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="p-1 rounded-full hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="p-1 rounded-full hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map(d => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center">
            {d !== null && (
              <button type="button" onClick={() => pickDay(d)} disabled={isPast(d)}
                className={["w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors",
                  isSelHit(d) ? "bg-primary text-white font-bold"
                  : isTod(d) ? "bg-primary/15 text-primary font-semibold"
                  : isPast(d) ? "text-muted-foreground/40 cursor-not-allowed"
                  : "hover:bg-muted text-foreground"].join(" ")}
              >{d}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Date+Time Picker ─────────────────────────────────────────────────────────
function DateTimePicker({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const display = value
    ? value.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Select date & time";

  const hours = Array.from({ length: 12 }, (_, i) => i + 7).filter(h => h <= 19);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">Pickup / Event Date & Time <span className="text-red-500">*</span></label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={["w-full h-12 rounded-2xl border-2 px-4 text-sm text-left transition-colors flex items-center gap-2",
          open ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-primary/50",
          !value ? "text-muted-foreground" : "text-foreground"].join(" ")}
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{display}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-white border-2 border-border rounded-2xl p-4 shadow-lg overflow-hidden"
          >
            <MiniCalendar value={value} onChange={(d) => { onChange(d); }} />
            {value && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Pick-up Time</p>
                <div className="flex flex-wrap gap-1.5">
                  {hours.map(h => {
                    const label = h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h-12}:00 PM`;
                    const active = value?.getHours() === h;
                    return (
                      <button key={h} type="button"
                        onClick={() => { const d = new Date(value!); d.setHours(h, 0); onChange(d); setOpen(false); }}
                        className={["px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                          active ? "bg-primary text-white" : "bg-muted hover:bg-primary/10"].join(" ")}
                      >{label}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, icon, value, onChange, placeholder, type = "text", required, readOnly }:
  { label: string; icon?: React.ReactNode; value: string; onChange?: (v: string) => void;
    placeholder?: string; type?: string; required?: boolean; readOnly?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <input
          type={type} value={value} onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder} required={required} readOnly={readOnly}
          className={["w-full h-12 rounded-2xl border-2 pr-4 text-sm transition-colors outline-none",
            icon ? "pl-10" : "pl-4",
            readOnly ? "bg-muted/30 border-border/60 text-foreground/70 cursor-default"
            : "bg-white border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground"].join(" ")}
        />
      </div>
    </div>
  );
}

// ─── Receipt Dialog ────────────────────────────────────────────────────────────
interface ReceiptData {
  reservationNumber: string;
  customerName: string;
  customerPhone: string;
  pickupDate: Date;
  items: { name: string; qty: number; price: number }[];
  total: number;
}

function ReceiptDialog({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        className="fixed inset-0 z-[401] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col">
          {/* Receipt header */}
          <div className="bg-primary px-6 pt-8 pb-6 text-white text-center relative">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-serif font-bold">Reservation Confirmed!</h2>
            <p className="text-white/80 text-sm mt-1">Awaiting admin verification</p>
            <div className="mt-4 bg-white/15 rounded-2xl px-4 py-2 inline-block">
              <p className="text-xs text-white/70 font-medium">Reservation No.</p>
              <p className="text-lg font-bold font-mono tracking-wider">{data.reservationNumber}</p>
            </div>
          </div>

          {/* Receipt body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {/* Customer info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <User className="h-3.5 w-3.5" /> Customer Details
              </div>
              <div className="bg-muted/30 rounded-2xl p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground">{data.customerName}</p>
                <p className="text-xs text-muted-foreground">{data.customerPhone}</p>
              </div>
            </div>

            {/* Pickup date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <CalendarCheck2 className="h-3.5 w-3.5" /> Pickup Date & Time
              </div>
              <div className="bg-muted/30 rounded-2xl p-3">
                <p className="text-sm font-semibold text-foreground">
                  {data.pickupDate.toLocaleString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <ShoppingBag className="h-3.5 w-3.5" /> Order Items
              </div>
              <div className="bg-muted/30 rounded-2xl p-3 space-y-2">
                {data.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-foreground/80">{item.name} <span className="text-muted-foreground">×{item.qty}</span></span>
                    <span className="font-semibold">{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-border/60 pt-2 mt-1 flex justify-between font-bold text-sm">
                  <span>Total Paid</span>
                  <span className="text-primary">{formatCurrency(data.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="flex items-center gap-3 bg-[#0064d2]/8 border border-[#0064d2]/20 rounded-2xl px-4 py-3">
              <Smartphone className="h-5 w-5 text-[#0064d2] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#0064d2]">GCash Payment</p>
                <p className="text-xs text-muted-foreground">Proof of payment submitted</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#0064d2] ml-auto shrink-0" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 border-t border-border">
            <Button onClick={onClose} size="lg" className="w-full h-12 text-sm">
              Done — View My Reservations
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              We'll contact you once your reservation is verified.
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main ReservationModal ─────────────────────────────────────────────────────
export function ReservationModal() {
  const { flowStep, setFlowStep, closeFlow } = useReservationFlow();
  const { items, total, clearCart, setIsCartOpen } = useCart();
  const { user } = useAuth();

  // Form fields
  const [fullName,  setFullName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [pickupDate, setPickupDate] = useState<Date | null>(null);

  // Payment proof
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFile,    setProofFile]    = useState<File | null>(null);
  const [proofError,   setProofError]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Receipt
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const isDetails = flowStep === "reservation";
  const isPayment = flowStep === "payment";
  const open = isDetails || isPayment;

  // Auto-fill from user profile when modal opens
  useEffect(() => {
    if (isDetails && user) {
      setFullName(user.name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [isDetails, user]);

  // Reset proof when going back to details
  useEffect(() => {
    if (isDetails) {
      setProofPreview(null);
      setProofFile(null);
      setProofError(false);
    }
  }, [isDetails]);

  const createReservation = useCreateReservation({
    mutation: {
      onSuccess: (data) => {
        const receiptData: ReceiptData = {
          reservationNumber: data.reservationNumber,
          customerName: fullName.trim(),
          customerPhone: phone.trim(),
          pickupDate: pickupDate!,
          items: items.map(i => ({ name: i.product.name, qty: i.quantity, price: Number(i.product.price) })),
          total,
        };
        setReceipt(receiptData);
        clearCart();
        setIsCartOpen(false);
      },
      onError: (e: any) => {
        toast({ title: "Reservation Failed", description: e?.error || "An error occurred.", variant: "destructive" });
      },
    },
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDate) {
      toast({ title: "Date required", description: "Please select a pickup/event date and time.", variant: "destructive" });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Phone required", variant: "destructive" });
      return;
    }
    setFlowStep("payment");
  };

  const handleConfirmPayment = () => {
    if (!proofFile) {
      setProofError(true);
      toast({ title: "Proof required", description: "Please upload your GCash payment screenshot to continue.", variant: "destructive" });
      return;
    }
    if (!items.length || !user) return;
    const reservationItems: CreateReservationRequestItemsItem[] = items.map(i => ({
      productId: i.product.id,
      quantity: i.quantity,
    }));
    createReservation.mutate({
      data: {
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || null,
        pickupDate: pickupDate!.toISOString(),
        items: reservationItems,
        notes: notes || null,
        paymentMethod: "gcash",
        fulfillmentType: "pickup",
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PNG, JPG, JPEG, or WEBP image.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setProofFile(file);
    setProofError(false);
    const reader = new FileReader();
    reader.onload = ev => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveProof = () => {
    setProofPreview(null);
    setProofFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const cartSummary = items.map(i => ({ name: i.product.name, qty: i.quantity, price: Number(i.product.price) }));

  const handleReceiptClose = () => {
    setReceipt(null);
    closeFlow();
    setProofPreview(null);
    setProofFile(null);
    window.location.href = `${import.meta.env.BASE_URL}my-reservations`;
  };

  return (
    <AnimatePresence>
      {/* ── RECEIPT DIALOG ── */}
      {receipt && (
        <ReceiptDialog data={receipt} onClose={handleReceiptClose} />
      )}

      {open && !receipt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
            onClick={() => { if (isDetails) closeFlow(); }}
          />

          {/* Modal */}
          <motion.div
            key={flowStep}
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 z-[301] flex sm:items-center sm:justify-center sm:p-4 pointer-events-none"
          >
            <div className="bg-[#FAF7F5] rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg pointer-events-auto flex flex-col overflow-x-hidden"
              style={{ maxHeight: "92dvh" }}>

              {/* ── STEP 1: Reservation Details ── */}
              {isDetails && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-4 bg-white rounded-t-3xl sm:rounded-t-3xl border-b border-border/60 shrink-0">
                    {/* Drag handle for mobile */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-border sm:hidden" />
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">Complete Reservation</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Fill in your details to confirm your order</p>
                    </div>
                    <button onClick={closeFlow} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0" aria-label="Close">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleDetailsSubmit} className="flex-1 overflow-y-auto overscroll-contain">
                    <div className="px-5 py-4 space-y-4">

                      {/* Order summary pill */}
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-primary font-medium">{items.length} item{items.length !== 1 ? "s" : ""} in cart</span>
                        <span className="font-bold text-primary text-base">{formatCurrency(total)}</span>
                      </div>

                      {/* Fulfillment type */}
                      <div>
                        <label className="text-sm font-medium text-foreground/80 block mb-2">Fulfillment Type</label>
                        <div className="w-full py-2.5 rounded-xl border-2 border-primary bg-primary/5 text-sm font-semibold text-primary text-center">
                          Store Pickup
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="bg-white rounded-2xl border border-border/60 p-4 space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Information</p>
                        <Field label="Full Name" icon={<User className="h-4 w-4" />} value={fullName} onChange={setFullName} placeholder="Your full name" required />
                        <Field label="Phone Number" icon={<Phone className="h-4 w-4" />} value={phone} onChange={setPhone} placeholder="+63 912 345 6789" type="tel" required />
                        <Field label="Email Address" icon={<Mail className="h-4 w-4" />} value={email} onChange={setEmail} placeholder="jane@example.com" type="email" />
                      </div>

                      {/* Date & Notes */}
                      <div className="bg-white rounded-2xl border border-border/60 p-4 space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Schedule & Notes</p>
                        <DateTimePicker value={pickupDate} onChange={setPickupDate} />
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-foreground/80">Special Notes</label>
                          <textarea
                            value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Flower preferences, color themes, special requests…"
                            rows={3}
                            className="w-full rounded-2xl border-2 border-border hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 px-4 py-3 text-sm outline-none resize-none transition-colors bg-white"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-6 pt-2 shrink-0">
                      <Button type="submit" size="lg" className="w-full h-12 sm:h-14 text-sm sm:text-base shadow-lg">
                        Continue to Payment
                      </Button>
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        You'll pay via GCash in the next step
                      </p>
                    </div>
                  </form>
                </>
              )}

              {/* ── STEP 2: Payment ── */}
              {isPayment && (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 pt-5 pb-4 bg-white rounded-t-3xl border-b border-border/60 shrink-0 relative">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-border sm:hidden" />
                    <button onClick={() => setFlowStep("reservation")} disabled={createReservation.isPending}
                      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground">GCash Payment</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Scan QR → Pay → Upload proof → Confirm</p>
                    </div>
                    <button onClick={closeFlow} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0" aria-label="Close">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">

                    {/* Amount due */}
                    <div className="bg-[#0064d2] rounded-2xl p-4 text-white text-center shadow-lg shadow-blue-500/20">
                      <p className="text-xs font-medium text-white/80 mb-1">Amount to Pay</p>
                      <p className="text-3xl sm:text-4xl font-bold font-serif">{formatCurrency(total)}</p>
                      <p className="text-xs text-white/70 mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white rounded-3xl border border-border p-4 sm:p-5 flex flex-col items-center gap-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-[#0064d2]" />
                        <span className="font-bold text-[#0064d2] text-sm">Scan to Pay via GCash</span>
                      </div>
                      {/* QR image */}
                      <div className="w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden border-4 border-[#0064d2]/10 bg-white flex items-center justify-center relative">
                        <img
                          src={QR_IMAGE_URL}
                          alt="GCash QR Code"
                          className="h-full w-full object-contain"
                          onError={e => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                            const fallback = img.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        <div className="hidden absolute inset-0 flex-col items-center justify-center gap-2 text-center px-4 bg-[#0064d2]/5">
                          <Smartphone className="h-10 w-10 text-[#0064d2]/50" />
                          <p className="text-xs font-semibold text-[#0064d2]">QR not available</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{GCASH_ACCOUNT_NAME}</p>
                        <p className="text-[#0064d2] font-semibold text-lg tracking-wide">{GCASH_NUMBER}</p>
                      </div>
                    </div>

                    {/* Order summary */}
                    <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Order Summary</p>
                      {cartSummary.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-foreground/80 truncate mr-2">{item.name} × {item.qty}</span>
                          <span className="font-medium shrink-0">{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      ))}
                      <div className="border-t border-border/60 pt-2 mt-2 flex justify-between font-bold text-sm">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    {/* How to pay */}
                    <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">How to Pay</p>
                      {[
                        "Open your GCash app on your phone",
                        "Tap 'Scan QR' or 'Pay QR'",
                        `Send exactly ${formatCurrency(total)} to ${GCASH_NUMBER}`,
                        "Take a screenshot of your payment confirmation",
                        "Upload the screenshot below, then tap Confirm",
                      ].map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="h-5 w-5 rounded-full bg-[#0064d2]/10 text-[#0064d2] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <p className="text-sm text-foreground/75 leading-snug">{step}</p>
                        </div>
                      ))}
                    </div>

                    {/* Proof of payment — REQUIRED */}
                    <div className={["rounded-2xl border-2 p-4 space-y-3 transition-colors",
                      proofError ? "border-red-400 bg-red-50" : proofFile ? "border-green-400 bg-green-50" : "border-dashed border-border bg-white"
                    ].join(" ")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload className={["h-4 w-4", proofFile ? "text-green-600" : "text-muted-foreground"].join(" ")} />
                          <p className="text-sm font-semibold text-foreground">
                            Proof of Payment <span className="text-red-500">*</span>
                          </p>
                        </div>
                        {proofFile && (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {proofFile
                          ? "Screenshot uploaded. You can replace it by tapping below."
                          : "Required: Upload your GCash payment screenshot to confirm your reservation."
                        }
                      </p>
                      {proofPreview ? (
                        <div className="relative">
                          <img src={proofPreview} alt="Proof" className="w-full rounded-xl object-cover max-h-48" />
                          <button onClick={handleRemoveProof}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className={["w-full h-20 rounded-xl border transition-colors flex flex-col items-center justify-center gap-1.5",
                            proofError
                              ? "border-red-300 bg-red-50 text-red-500 hover:bg-red-100"
                              : "border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground"
                          ].join(" ")}>
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-xs font-medium">Tap to upload screenshot</span>
                          <span className="text-[10px] opacity-70">PNG, JPG, JPEG, WEBP</span>
                        </button>
                      )}
                      {proofError && !proofFile && (
                        <p className="text-xs text-red-500 font-medium">Please upload your payment screenshot to proceed.</p>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                  </div>

                  {/* Footer */}
                  <div className="px-5 pb-6 pt-3 bg-white border-t border-border shrink-0 space-y-2">
                    <Button
                      className={["w-full h-12 sm:h-14 text-sm sm:text-base gap-2 transition-colors",
                        proofFile
                          ? "bg-[#0064d2] hover:bg-[#0058c4] shadow-lg shadow-blue-500/20"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      ].join(" ")}
                      onClick={handleConfirmPayment}
                      isLoading={createReservation.isPending}
                      disabled={createReservation.isPending || !proofFile}
                    >
                      {!createReservation.isPending && <CheckCircle2 className="h-5 w-5" />}
                      {proofFile ? "I Have Paid — Confirm Reservation" : "Upload Proof to Confirm"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">Your reservation will be pending admin verification.</p>
                  </div>
                </>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
