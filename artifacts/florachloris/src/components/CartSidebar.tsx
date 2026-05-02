import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "./ui-components";
import { formatCurrency } from "@/lib/utils";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReservationFlow } from "@/lib/reservation-flow";

export function CartSidebar() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, total } = useCart();
  const { user } = useAuth();
  const { setFlowStep } = useReservationFlow();

  // Body scroll lock
  useEffect(() => {
    if (!isCartOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position   = "fixed";
    body.style.top        = `-${scrollY}px`;
    body.style.left       = "0";
    body.style.right      = "0";
    body.style.overflowY  = "scroll";
    return () => {
      body.style.position  = "";
      body.style.top       = "";
      body.style.left      = "";
      body.style.right     = "";
      body.style.overflowY = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, [isCartOpen]);

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) setIsCartOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  const handleReserveClick = () => {
    setIsCartOpen(false);
    if (!user) {
      setFlowStep("auth");
    } else {
      setFlowStep("reservation");
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar panel */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            key="cart-panel"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            data-testid="cart-sidebar"
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-2xl z-[101] flex flex-col border-l border-white/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-white/50 shrink-0">
              <h2 className="text-2xl font-serif font-bold text-foreground">Your Cart</h2>
              <button aria-label="Close cart" onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-primary/50" />
                  </div>
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <Button onClick={() => setIsCartOpen(false)} variant="outline">Continue Shopping</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map(item => {
                    const stock = item.product.stockQuantity;
                    const atMax = item.quantity >= stock;
                    const isLowStock = stock > 0 && stock < 10;
                    return (
                      <div key={item.product.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-border shadow-sm">
                        <img
                          src={item.product.imageUrl || `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`}
                          alt={item.product.name}
                          className="h-20 w-20 object-cover rounded-xl bg-muted shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-foreground text-sm leading-tight">{item.product.name}</h3>
                            <button
                              aria-label={`Remove ${item.product.name} from cart`}
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-medium text-primary">{formatCurrency(item.product.price)}</p>
                            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-2 py-1 border border-border">
                              <button
                                aria-label="Decrease quantity"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white shadow-sm transition-colors"
                              ><Minus className="h-3 w-3" /></button>
                              <span aria-label={`Quantity: ${item.quantity}`} className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                              <button
                                aria-label="Increase quantity"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                disabled={atMax}
                                className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              ><Plus className="h-3 w-3" /></button>
                            </div>
                          </div>
                          {atMax && <p className="text-xs text-amber-600 font-medium mt-1.5">Only {stock} available — max reached</p>}
                          {!atMax && isLowStock && <p className="text-xs text-amber-600 mt-1.5">Only {stock} in stock</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 bg-white border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.05)] shrink-0">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-foreground/70 font-medium">Estimated Total</span>
                  <span className="text-2xl font-serif font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={handleReserveClick}>
                  Reserve for Pickup
                </Button>
                {!user && (
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    You'll be asked to sign in to complete your reservation
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
