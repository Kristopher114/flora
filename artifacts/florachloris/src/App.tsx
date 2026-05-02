import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-provider";
import { CartProvider } from "@/lib/cart";
import { ReservationFlowProvider } from "@/lib/reservation-flow";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/customer/Home";
import Login from "@/pages/auth/Login";
import POS from "@/pages/cashier/POS";
import MyReservations from "@/pages/customer/MyReservations";
import Profile from "@/pages/customer/Profile";

// Global components
import { CartSidebar } from "@/components/CartSidebar";
import { AuthModal } from "@/components/AuthModal";
import { ReservationModal } from "@/components/ReservationModal";

// Admin
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Inventory from "@/pages/admin/Inventory";
import Products from "@/pages/admin/Products";
import Categories from "@/pages/admin/Categories";
import Orders from "@/pages/admin/Orders";
import Reservations from "@/pages/admin/Reservations";
import PortalSelect from "@/pages/admin/PortalSelect";
import BIDashboard from "@/pages/admin/BIDashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/cashier" component={POS} />
      <Route path="/my-reservations" component={MyReservations} />
      <Route path="/profile" component={Profile} />

      {/* Admin standalone pages */}
      <Route path="/admin/portal-select" component={PortalSelect} />
      <Route path="/admin/bi-dashboard" component={BIDashboard} />

      {/* Admin Routes wrapped in Layout */}
      <Route path="/admin">
        <AdminLayout><Dashboard /></AdminLayout>
      </Route>
      <Route path="/admin/inventory">
        <AdminLayout><Inventory /></AdminLayout>
      </Route>
      <Route path="/admin/products">
        <AdminLayout><Products /></AdminLayout>
      </Route>
      <Route path="/admin/categories">
        <AdminLayout><Categories /></AdminLayout>
      </Route>
      <Route path="/admin/orders">
        <AdminLayout><Orders /></AdminLayout>
      </Route>
      <Route path="/admin/reservations">
        <AdminLayout><Reservations /></AdminLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <CartProvider>
              <ReservationFlowProvider>
                <Router />
                <CartSidebar />
                <AuthModal />
                <ReservationModal />
                <Toaster />
              </ReservationFlowProvider>
            </CartProvider>
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
