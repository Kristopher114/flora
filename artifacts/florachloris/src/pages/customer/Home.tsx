import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useListProducts, useListCategories, type Product } from "@workspace/api-client-react";
import { Button, Badge } from "@/components/ui-components";
import { useCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import {
  Loader2, Heart, Search, X, Plus, Minus,
  Flower2, Star, Phone, Mail, MapPin, Truck, Award, Smile
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 10;

/* ─────────────────────────── Product Detail Modal ─────────────────────────── */
function ProductModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (qty: number) => void }) {
  const [qty, setQty] = useState(1);
  const isOutOfStock = product.stockQuantity <= 0;
  const maxQty = product.stockQuantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={product.imageUrl || `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.categoryName && (
            <Badge className="absolute top-4 left-4 bg-white/90 border-none shadow-sm text-foreground">
              {product.categoryName}
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-1">{product.name}</h2>
          <p className="text-2xl font-bold text-primary mb-3">{formatCurrency(product.price)}</p>
          {product.description && (
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{product.description}</p>
          )}

          {/* Stock info */}
          {product.stockQuantity > 0 && product.stockQuantity < LOW_STOCK_THRESHOLD && (
            <p className="text-xs text-amber-600 font-medium mb-4">Only {product.stockQuantity} left in stock</p>
          )}

          {/* Qty + Reserve */}
          {isOutOfStock ? (
            <Button variant="secondary" className="w-full" disabled>Out of Stock</Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-full overflow-hidden">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-sm">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => { onAdd(qty); onClose(); }}
              >
                Reserve Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Product Card ──────────────────────────── */
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = !isOutOfStock && product.stockQuantity < LOW_STOCK_THRESHOLD;

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer ${isOutOfStock ? "opacity-70" : "hover:border-primary/30"}`}
      onClick={onClick}
    >
      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "1/1" }}>
        <img
          src={product.imageUrl || `${import.meta.env.BASE_URL}images/placeholder-bouquet.png`}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? "grayscale" : "group-hover:scale-105"}`}
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          {product.categoryName && (
            <Badge className="bg-white/90 border-none text-foreground text-xs shrink-0">{product.categoryName}</Badge>
          )}
          <div className="ml-auto flex flex-col gap-1 items-end">
            {isOutOfStock && <Badge variant="destructive" className="border-none text-xs">Out of Stock</Badge>}
            {isLowStock && <Badge className="bg-amber-500 text-white border-none text-xs">Only {product.stockQuantity} left</Badge>}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-serif font-bold text-base text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{product.description || "A beautiful arrangement crafted with care."}</p>
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg text-primary">{formatCurrency(product.price)}</p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${isOutOfStock ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"}`}>
            {isOutOfStock ? "Unavailable" : "Reserve"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── REVIEWS DATA ─────────────────────────────── */
const REVIEWS = [
  { name: "Maria Santos", rating: 5, text: "The bouquet I ordered for my anniversary was absolutely stunning! Fresh flowers and beautifully arranged. My husband loved it so much!", avatar: "MS" },
  { name: "Juan dela Cruz", rating: 5, text: "Ordered a surprise bouquet for my mom's birthday. It arrived exactly on time and the flowers were incredibly fresh. Highly recommend!", avatar: "JC" },
  { name: "Ana Reyes", rating: 5, text: "Beautiful arrangement, very elegant and premium-looking. The packaging was also impressive. Will definitely order again soon!", avatar: "AR" },
];

/* ───────────────────────────────── HOME PAGE ───────────────────────────────── */
export default function Home() {
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts(
    { categoryId: activeCategoryId, search: searchQuery || undefined, available: true },
    { query: { refetchInterval: 30000 } }
  );
  const { addToCart } = useCart();

  function handleAddToCart(product: Product, qty: number) {
    for (let i = 0; i < qty; i++) addToCart(product);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf8f5]">
      <Navigation />

      {/* ── HERO ── */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 text-center md:text-left animate-in fade-in slide-in-from-left-8 duration-700">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Flora-Chloris Flowershop</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-5">
              Beautiful Flowers<br />
              <span className="text-primary">for Every Occasion</span>
            </h1>
            <p className="text-base text-foreground/60 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
              Handcrafted bouquets and unique gifts, beautifully arranged to express your deepest sentiments for any special moment.
            </p>
            <div className="flex gap-3 justify-center md:justify-start flex-wrap">
              <Button size="lg" onClick={() => document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" })}>
                Shop Collection
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 flex justify-center md:justify-end animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px]">
              <div className="absolute inset-0 rounded-full bg-pink-200/60" />
              <img
                src={`${import.meta.env.BASE_URL}images/hero-floral.png`}
                alt="Beautiful floral arrangement"
                className="relative z-10 w-full h-full object-cover rounded-full border-4 border-white shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#fdf8f5]" style={{ borderRadius: "100% 100% 0 0 / 40px 40px 0 0" }} />
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-white border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Flower2, label: "Fresh Flowers", value: "2,000+", color: "text-pink-500" },
              { icon: Smile, label: "Happy Customers", value: "500+", color: "text-rose-500" },
              { icon: Award, label: "Premium Quality", value: "100%", color: "text-fuchsia-500" },
              { icon: Heart, label: "Love Delivered", value: "Daily", color: "text-red-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`h-10 w-10 rounded-full bg-pink-50 flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-bold text-xl text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLECTIONS / SHOP ── */}
      <section id="collections" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-2">Browse</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Our Collections</h2>
            <div className="mt-3 h-1 w-16 bg-primary rounded-full mx-auto" />
          </div>

          {/* Category tabs + Search row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
            <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
              <button
                onClick={() => setActiveCategoryId(undefined)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold border transition-all ${activeCategoryId === undefined ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-foreground/70 border-border hover:border-primary/40"}`}
              >
                All
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold border transition-all ${activeCategoryId === cat.id ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-foreground/70 border-border hover:border-primary/40"}`}
                >
                  {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search flowers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-full border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm bg-white"
              />
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-border">
              <Heart className="h-12 w-12 text-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold">No blooms found</h3>
              <p className="text-muted-foreground mt-2 text-sm">Try adjusting your search or category.</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(""); setActiveCategoryId(undefined); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-3">Who We Are</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-5">About Flora-Chloris</h2>
              <p className="text-foreground/65 leading-relaxed mb-6">
                We are a family-owned flower shop dedicated to bringing beauty and joy through every arrangement we craft. Each bouquet is made with love, using only the freshest blooms sourced from trusted local and international growers.
              </p>
              <p className="text-foreground/65 leading-relaxed mb-8">
                Whether it's a birthday, anniversary, sympathy, or just because — Flora-Chloris has the perfect arrangement to express your feelings elegantly and authentically.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: "100%", label: "Freshness" },
                  { value: "50+", label: "Happy Products" },
                  { value: "5★", label: "Pickup Service" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-bold text-3xl text-primary mb-1">{value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image collage */}
            <div className="relative h-72 md:h-96">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-100 to-rose-100 overflow-hidden">
                <img
                  src={`${import.meta.env.BASE_URL}images/hero-floral.png`}
                  alt="About Flora-Chloris"
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-2xl bg-primary/10 border-4 border-white flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <p className="font-bold text-2xl text-primary">5★</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="py-16 md:py-24 bg-[#fdf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-2">Testimonials</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Customer Reviews</h2>
            <div className="mt-3 h-1 w-16 bg-primary rounded-full mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl p-6 shadow-sm border border-border/40 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed mb-5 italic">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {r.avatar}
                  </div>
                  <p className="font-semibold text-sm text-foreground">{r.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO BANNER ── */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 px-8 md:px-16 py-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-white text-center md:text-left">
              <p className="text-4xl md:text-5xl font-bold mb-2">100% Fresh</p>
              <p className="text-lg text-white/90 mb-6">Guaranteed farm-fresh flowers delivered with care right to your door or ready for easy pickup.</p>
              <Button
                variant="outline"
                className="bg-white text-primary border-white hover:bg-white/90 font-semibold"
                onClick={() => document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" })}
              >
                Order Now
              </Button>
            </div>
            <div className="shrink-0">
              <div className="h-40 w-40 md:h-48 md:w-48 rounded-full bg-white/20 flex items-center justify-center">
                <Flower2 className="h-24 w-24 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-primary font-semibold uppercase tracking-widest mb-2">Reach Out</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">Get in Touch</h2>
            <div className="mt-3 h-1 w-16 bg-primary rounded-full mx-auto" />
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Mail, label: "Email", value: "hello@florachloris.com", color: "bg-pink-50 text-pink-500" },
              { icon: Phone, label: "Phone", value: "+63 912 345 6789", color: "bg-rose-50 text-rose-500" },
              { icon: MapPin, label: "Pickup", value: "Visit our shop for in-store pickup", color: "bg-fuchsia-50 text-fuchsia-500" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/40 bg-[#fdf8f5] hover:shadow-md transition-shadow">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="font-semibold text-foreground mb-1">{label}</p>
                <p className="text-sm text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-foreground text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={`${import.meta.env.BASE_URL}images/florachloris-logo.png`} alt="Logo" className="h-8 w-8 brightness-200 opacity-90" />
                <span className="font-serif text-xl font-bold">Flora-Chloris</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Your trusted flower shop for every beautiful occasion and heartfelt sentiment.
              </p>
            </div>

            {/* Shop */}
            <div>
              <p className="font-semibold text-sm mb-4 text-white/80 uppercase tracking-wider">Shop</p>
              <ul className="space-y-2">
                {["Bouquets", "Arrangements", "Gifts", "Seasonal"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <p className="font-semibold text-sm mb-4 text-white/80 uppercase tracking-wider">About</p>
              <ul className="space-y-2">
                {["Our Story", "Blog", "Careers", "Press"].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-white/50 hover:text-white transition-colors">{item}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <p className="font-semibold text-sm mb-4 text-white/80 uppercase tracking-wider">Support</p>
              <ul className="space-y-2">
                {["FAQ", "Reservation Policy", "Cancellation", "Contact Us"].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Flora-Chloris Flowershop. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="hover:text-white/70 transition-colors">Privacy Policy</button>
              <button className="hover:text-white/70 transition-colors">Terms of Use</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── PRODUCT MODAL ── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(qty) => handleAddToCart(selectedProduct, qty)}
        />
      )}
    </div>
  );
}
