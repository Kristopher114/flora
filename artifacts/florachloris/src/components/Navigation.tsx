import { Link } from "wouter";
import { ShoppingBag, Menu, X, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "./ui-components";
import { useState } from "react";
import { cn } from "@/lib/utils";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Navigation() {
  const { user, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [mobileMenu, setMobileMenu] = useState(false);

  const navLinks = [
    { label: "Home", target: "hero" },
    { label: "About", target: "about" },
    { label: "Collection", target: "collections" },
    { label: "Shop", target: "collections" },
    { label: "Contact", target: "contact" },
  ];

  return (
    <header className="sticky top-0 z-[200] w-full bg-white/90 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0">
            <img
              src={`${import.meta.env.BASE_URL}images/florachloris-logo.png`}
              alt="Flora-Chloris Logo"
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.target)}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link href="/my-reservations" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
              My Reservations
            </Link>
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              aria-label="Open cart"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground/70 hover:text-primary transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold shadow-sm animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-border">
                <span className="text-sm font-medium text-foreground hidden lg:block">{user.name}</span>
                {user.role === "admin" && (
                  <Link href="/admin"><Button variant="outline" size="sm">Dashboard</Button></Link>
                )}
                {user.role === "cashier" && (
                  <Link href="/cashier"><Button variant="outline" size="sm">POS</Button></Link>
                )}
                {user.role === "customer" && (
                  <Link href="/profile" title="Profile Settings">
                    <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-3">
            <button aria-label="Open cart" onClick={() => setIsCartOpen(true)} className="relative p-2 text-foreground/70">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2">
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div className={cn("md:hidden bg-white border-t border-border transition-all duration-300 overflow-hidden", mobileMenu ? "max-h-96 py-4" : "max-h-0")}>
        <div className="flex flex-col gap-3 px-6">
          {navLinks.map((link) => (
            <button key={link.label} onClick={() => { scrollTo(link.target); setMobileMenu(false); }} className="text-base font-medium text-left">
              {link.label}
            </button>
          ))}
          <Link href="/my-reservations" onClick={() => setMobileMenu(false)} className="text-base font-medium">My Reservations</Link>
          <hr className="border-border" />
          {user ? (
            <>
              {user.role === "admin" && <Link href="/admin" onClick={() => setMobileMenu(false)} className="text-base font-medium text-primary">Admin Dashboard</Link>}
              {user.role === "cashier" && <Link href="/cashier" onClick={() => setMobileMenu(false)} className="text-base font-medium text-primary">Cashier POS</Link>}
              {user.role === "customer" && <Link href="/profile" onClick={() => setMobileMenu(false)} className="text-base font-medium text-primary">Profile Settings</Link>}
              <button onClick={() => { logout(); setMobileMenu(false); }} className="text-base font-medium text-destructive text-left">Logout</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileMenu(false)} className="text-base font-medium text-primary">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
