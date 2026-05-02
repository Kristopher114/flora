import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  PackageSearch, 
  Tags, 
  Leaf, 
  ReceiptText, 
  CalendarCheck,
  LogOut,
  BarChart3,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ReceiptText },
    { href: "/admin/reservations", label: "Reservations", icon: CalendarCheck },
    { href: "/admin/products", label: "Products", icon: Leaf },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col flex-shrink-0 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-6 border-b border-border bg-primary/5">
          <Link href="/" className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}images/florachloris-logo.png`} alt="Logo" className="h-8 w-8" />
            <span className="font-serif font-bold text-xl text-foreground">Admin Panel</span>
          </Link>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-1 px-4 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-4 border-t border-border pt-4 flex flex-col gap-1">
            <Link
              href="/admin/bi-dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-violet-700 hover:bg-violet-50 transition-all duration-200"
            >
              <BarChart3 className="h-5 w-5 text-violet-500" />
              BI Dashboard
            </Link>
            <Link
              href="/admin/portal-select"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <LayoutGrid className="h-5 w-5" />
              Switch Portal
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-3 bg-muted rounded-xl mb-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative bg-background/50">
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
