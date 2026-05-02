import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Link, Redirect } from "wouter";
import {
  useListProducts,
  useListCategories,
  useCreateOrder,
  getListProductsQueryKey,
  type Product,
  type CreateOrderRequestItemsItem,
  type CreateOrderRequestType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Input, Badge } from "@/components/ui-components";
import { formatCurrency } from "@/lib/utils";
import {
  Search, LogOut, Trash2, Plus, Minus, CreditCard, Banknote,
  Receipt, AlertTriangle, CheckCircle2, XCircle, Copy, X,
  Printer, ShoppingBag, ArrowRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

const LOW_STOCK_THRESHOLD = 10;

interface POSCartItem {
  product: Product;
  quantity: number;
}

interface ReceiptData {
  orderNumber: string;
  timestamp: Date;
  items: POSCartItem[];
  paymentMethod: string;
  customerName: string;
  total: number;
  receivedCash: number;
  change: number;
}

/* ─────────────── helpers ─────────────── */
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function methodLabel(m: string) {
  return m === "cash" ? "Cash" : m === "gcash" ? "GCash" : "Maya";
}

/* ─────────────── Receipt Modal ─────────────── */
function ReceiptModal({ data, onNewOrder }: { data: ReceiptData; onNewOrder: () => void }) {
  const receiptRef = useRef<HTMLDivElement>(null);

  function copyReceipt() {
    const lines = [
      "════════════════════════",
      "   FLORA-CHLORIS",
      "   Flowershop & Giftshop",
      "════════════════════════",
      `Date : ${fmtDate(data.timestamp)}`,
      `Time : ${fmtTime(data.timestamp)}`,
      `Order: ${data.orderNumber}`,
      data.customerName ? `Cust : ${data.customerName}` : "",
      "────────────────────────",
      ...data.items.map(i => `${i.product.name}\n  ${i.quantity} x ${formatCurrency(i.product.price)} = ${formatCurrency(i.product.price * i.quantity)}`),
      "────────────────────────",
      `TOTAL       : ${formatCurrency(data.total)}`,
      `RECEIVED    : ${formatCurrency(data.receivedCash)}`,
      `CHANGE      : ${formatCurrency(data.change)}`,
      `PAYMENT     : ${methodLabel(data.paymentMethod)}`,
      "════════════════════════",
      "  Thank you for visiting!",
      "  Flora-Chloris 💐",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() =>
      toast({ title: "Receipt copied!", description: "Paste it anywhere you need." })
    );
  }

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-[95vw] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Success header */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-8 pb-6 text-center border-b border-border/40">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Payment Successful!</h2>
            <p className="text-sm text-muted-foreground mt-1">{data.orderNumber}</p>
          </div>

          {/* Receipt body */}
          <div ref={receiptRef} className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Date/time */}
            <div className="text-center text-xs text-muted-foreground">
              {fmtDate(data.timestamp)} · {fmtTime(data.timestamp)}
            </div>

            {/* Customer */}
            {data.customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{data.customerName}</span>
              </div>
            )}

            {/* Items */}
            <div className="bg-muted/40 rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order Items</p>
              {data.items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-start gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} × {formatCurrency(item.product.price)}</p>
                  </div>
                  <p className="font-semibold text-foreground shrink-0">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Payment summary */}
            <div className="space-y-2.5 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(data.total)}</span>
              </div>

              {data.paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cash Received</span>
                    <span>{formatCurrency(data.receivedCash)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-green-700">
                    <span>Change</span>
                    <span>{formatCurrency(data.change)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold capitalize">{methodLabel(data.paymentMethod)}</span>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2 italic">Thank you for visiting Flora-Chloris! 💐</p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-3 grid grid-cols-2 gap-3 border-t border-border/40">
            <Button variant="outline" className="gap-2" onClick={copyReceipt}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button variant="outline" className="gap-2 opacity-50" disabled>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button className="col-span-2 gap-2 h-12 text-base" onClick={onNewOrder}>
              <ShoppingBag className="h-4 w-4" /> New Order
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─────────────── Payment Modal ─────────────── */
function PaymentModal({
  open, onOpenChange, total, cart, customerName, setCustomerName,
  onConfirm, isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  cart: POSCartItem[];
  customerName: string;
  setCustomerName: (v: string) => void;
  onConfirm: (method: string, received: number) => void;
  isPending: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedCash, setReceivedCash] = useState("");

  const received = parseFloat(receivedCash) || 0;
  const change = received - total;
  const isExact = received === total;
  const isOver = received > total;
  const isCashSufficient = received >= total;

  // For non-cash methods, payment is always valid
  const canConfirm = paymentMethod !== "cash" ? true : isCashSufficient;

  // Quick-cash shortcuts
  const shortcuts = [100, 200, 500, 1000].filter(v => v >= total || v === 100);
  function applyShortcut(v: number) { setReceivedCash(String(v)); }
  function applyExact() { setReceivedCash(total.toFixed(2)); }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl w-[95vw] max-w-md z-[201] animate-in zoom-in-95 duration-200 overflow-hidden max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <Dialog.Title className="font-serif text-xl font-bold">Complete Payment</Dialog.Title>
            <Dialog.Close asChild>
              <button className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Total */}
            <div className="bg-primary/5 rounded-2xl p-5 text-center border border-primary/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Amount Due</p>
              <p className="text-4xl font-bold text-primary font-serif">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-sm font-semibold mb-3">Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "cash", label: "Cash", icon: Banknote },
                  { id: "gcash", label: "GCash", icon: CreditCard },
                  { id: "maya", label: "Maya", icon: CreditCard },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}
                  >
                    <Icon className="h-6 w-6 mb-1.5" />
                    <span className="text-sm font-bold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash receive section — only for cash */}
            {paymentMethod === "cash" && (
              <div className="space-y-4 border border-border rounded-2xl p-4">
                <p className="text-sm font-semibold">Receive Cash</p>

                {/* Quick shortcuts */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={applyExact}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    Exact ({formatCurrency(total)})
                  </button>
                  {[100, 200, 500, 1000].map(v => (
                    <button
                      key={v}
                      onClick={() => applyShortcut(v)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-muted hover:bg-muted/80 transition-colors border border-border"
                    >
                      ₱{v}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₱</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={receivedCash}
                    onChange={e => setReceivedCash(e.target.value)}
                    className={`w-full h-14 pl-9 pr-4 text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                      receivedCash === ""
                        ? "border-border focus:border-primary"
                        : isCashSufficient
                        ? "border-green-400 bg-green-50 text-green-800 focus:border-green-500"
                        : "border-red-400 bg-red-50 text-red-800 focus:border-red-500"
                    }`}
                  />
                </div>

                {/* Validation feedback */}
                {receivedCash !== "" && (
                  <div className={`rounded-xl p-4 flex flex-col gap-2 ${isCashSufficient ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      {isCashSufficient ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                      <span className={`font-bold text-sm ${isCashSufficient ? "text-green-700" : "text-red-700"}`}>
                        {isExact ? "Exact Amount" : isOver ? "Payment Accepted" : "Insufficient Payment"}
                      </span>
                    </div>

                    {/* Summary grid */}
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total Due</p>
                        <p className="font-bold text-sm text-foreground">{formatCurrency(total)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Received</p>
                        <p className={`font-bold text-sm ${isCashSufficient ? "text-green-700" : "text-red-700"}`}>{formatCurrency(received)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{isCashSufficient ? "Change" : "Short"}</p>
                        <p className={`font-bold text-sm ${isCashSufficient ? "text-green-700" : "text-red-700"}`}>
                          {isCashSufficient ? formatCurrency(change) : formatCurrency(total - received)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* For GCash/Maya — just show total */}
            {paymentMethod !== "cash" && (
              <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Customer pays via {methodLabel(paymentMethod)}</p>
                <p className="font-bold text-lg text-foreground">{formatCurrency(total)}</p>
              </div>
            )}

            {/* Customer name */}
            <Input
              label="Customer Name (Optional)"
              placeholder="Walk-in Customer"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-border flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2 h-12"
              disabled={!canConfirm || isPending}
              isLoading={isPending}
              onClick={() => onConfirm(paymentMethod, received)}
            >
              {!isPending && <ArrowRight className="h-4 w-4" />}
              {canConfirm ? "Confirm Order" : "Insufficient"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─────────────── POS Main ─────────────── */
export default function POS() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | undefined>();
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const { data: categories } = useListCategories();
  const { data: products, isLoading, refetch: refetchProducts } = useListProducts(
    { categoryId: activeCategory, search: search || undefined, available: true },
    { query: { refetchInterval: 30000 } }
  );

  const createOrderMutation = useCreateOrder({
    mutation: {
      onSuccess: (data, variables) => {
        const method = (variables.data as any).paymentMethod as string;
        const received = (variables.data as any).receivedCash as number;
        const cartSnapshot = [...cart];
        const tot = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
        setReceipt({
          orderNumber: data.orderNumber,
          timestamp: new Date(),
          items: cartSnapshot,
          paymentMethod: method,
          customerName,
          total: tot,
          receivedCash: method === "cash" ? received : tot,
          change: method === "cash" ? received - tot : 0,
        });
        setCart([]);
        setIsPaymentOpen(false);
        setCustomerName("");
        refetchProducts();
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: (err as any).error || "Failed to process order", variant: "destructive" });
      },
    },
  });

  if (user && user.role === "customer") return <Redirect to="/" />;

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) return;
    setCart(curr => {
      const existing = curr.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return curr;
        return curr.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...curr, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) { setCart(curr => curr.filter(i => i.product.id !== id)); return; }
    setCart(curr => curr.map(i => {
      if (i.product.id !== id) return i;
      return { ...i, quantity: Math.min(qty, i.product.stockQuantity) };
    }));
  };

  const total = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);

  function handleConfirmOrder(method: string, received: number) {
    const items: CreateOrderRequestItemsItem[] = cart.map(i => ({ productId: i.product.id, quantity: i.quantity }));
    createOrderMutation.mutateAsync({
      data: {
        type: "walk_in" as CreateOrderRequestType,
        items,
        paymentMethod: method,
        customerName: customerName || null,
        receivedCash: received,
      } as any,
    });
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden">

      {/* ── LEFT: Products ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border bg-white/50">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-border shadow-sm z-10">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}images/florachloris-logo.png`} alt="Logo" className="h-8 w-8" />
            <h1 className="font-serif font-bold text-xl hidden sm:block">Flora-Chloris POS</h1>
          </div>
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-full bg-muted border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden lg:block">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} title="Exit POS"><LogOut className="h-5 w-5" /></Button>
          </div>
        </header>

        {/* Categories */}
        <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border bg-white/30">
          <Badge
            className={`cursor-pointer px-4 py-1.5 text-sm transition-colors ${activeCategory === undefined ? "bg-primary text-white border-primary" : "bg-white hover:bg-primary/10"}`}
            onClick={() => setActiveCategory(undefined)}
          >
            All Products
          </Badge>
          {categories?.map(cat => (
            <Badge
              key={cat.id}
              className={`cursor-pointer px-4 py-1.5 text-sm transition-colors ${activeCategory === cat.id ? "bg-primary text-white border-primary" : "bg-white hover:bg-primary/10"}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products?.map(p => {
                const outOfStock = p.stockQuantity <= 0;
                const lowStock = !outOfStock && p.stockQuantity < LOW_STOCK_THRESHOLD;
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`bg-white rounded-2xl border overflow-hidden transition-all flex flex-col select-none ${outOfStock ? "opacity-50 grayscale border-border cursor-not-allowed" : "border-border/60 hover:border-primary hover:shadow-md cursor-pointer active:scale-95"}`}
                  >
                    <div className="aspect-[4/3] bg-muted relative">
                      <img src={p.imageUrl || `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`} className="w-full h-full object-cover" alt={p.name} />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                        {formatCurrency(p.price)}
                      </div>
                      {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow">Out of Stock</span>
                        </div>
                      )}
                      {lowStock && (
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{p.name}</h3>
                      <p className={`text-xs font-medium ${outOfStock ? "text-red-500" : lowStock ? "text-amber-600" : "text-muted-foreground"}`}>
                        Stock: {p.stockQuantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart ── */}
      <div className="w-full md:w-96 bg-white shadow-xl flex flex-col h-full border-l border-border z-20">
        <div className="p-5 border-b border-border bg-primary/5">
          <h2 className="font-serif font-bold text-xl flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> Current Order
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="m-auto text-center text-muted-foreground flex flex-col items-center">
                <Receipt className="h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm">No items in order</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  key={item.product.id}
                  className="bg-background rounded-xl p-3 border border-border shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm pr-2 leading-tight">{item.product.name}</span>
                    <button onClick={() => updateQty(item.product.id, 0)} className="text-destructive/60 hover:text-destructive p-0.5 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">{formatCurrency(item.product.price * item.quantity)}</span>
                    <div className="flex items-center gap-1.5 bg-muted rounded-full px-1 py-0.5 border border-border">
                      <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="h-6 w-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity}
                        className="h-6 w-6 bg-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {item.quantity >= item.product.stockQuantity && item.product.stockQuantity < LOW_STOCK_THRESHOLD && (
                    <p className="text-[10px] text-amber-600 mt-1 font-medium">Max stock reached</p>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Checkout summary */}
        <div className="p-5 bg-white border-t border-border shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
          {/* Items count */}
          {cart.length > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
              <span>{cart.reduce((s, i) => s + i.quantity, 0)} qty</span>
            </div>
          )}
          <div className="flex justify-between items-end mb-4">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-3xl font-bold font-serif text-foreground">{formatCurrency(total)}</span>
          </div>
          <Button
            className="w-full h-13 text-base shadow-md shadow-primary/20 gap-2"
            disabled={cart.length === 0}
            onClick={() => setIsPaymentOpen(true)}
          >
            <CreditCard className="h-4 w-4" />
            Charge {formatCurrency(total)}
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        total={total}
        cart={cart}
        customerName={customerName}
        setCustomerName={setCustomerName}
        onConfirm={handleConfirmOrder}
        isPending={createOrderMutation.isPending}
      />

      {/* Receipt Dialog */}
      {receipt && (
        <ReceiptModal
          data={receipt}
          onNewOrder={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
