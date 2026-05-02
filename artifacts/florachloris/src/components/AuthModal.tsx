import { useState } from "react";
import { X, Eye, EyeOff, Leaf } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input, Button } from "@/components/ui-components";
import { toast } from "@/hooks/use-toast";
import { useReservationFlow } from "@/lib/reservation-flow";
import { AnimatePresence, motion } from "framer-motion";

type Tab = "signin" | "signup";

export function AuthModal() {
  const { flowStep, setFlowStep, closeFlow } = useReservationFlow();
  const open = flowStep === "auth";

  const [tab, setTab] = useState<Tab>("signin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [suName, setSuName] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suUsername, setSuUsername] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [showSuPw, setShowSuPw] = useState(false);

  const { login, isLoggingIn } = useAuth();
  const queryClient = useQueryClient();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({ title: "Account created!", description: `Welcome, ${data.user.name}!` });
        setFlowStep("reservation");
      },
      onError: (err: any) => {
        toast({ title: "Registration Failed", description: err?.error || "Could not create account.", variant: "destructive" });
      },
    },
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      toast({ title: "Welcome back!" });
      setFlowStep("reservation");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.error || "Invalid username or password", variant: "destructive" });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (suPassword !== suConfirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    if (suPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    registerMutation.mutate({ data: { name: suName, username: suUsername, password: suPassword, phone: suPhone || null, email: suEmail || null } });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300]"
            onClick={closeFlow}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-7 pt-7 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-foreground">
                      {tab === "signin" ? "Welcome Back" : "Create Account"}
                    </h2>
                    <p className="text-xs text-muted-foreground">Flora-Chloris Artisan Floral Studio</p>
                  </div>
                </div>
                <button
                  aria-label="Close"
                  onClick={closeFlow}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-7 pb-7">
                {/* Tabs */}
                <div className="flex rounded-xl bg-muted/50 p-1 mb-6">
                  <button
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "signin" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setTab("signin")}
                  >
                    Sign In
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "signup" ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setTab("signup")}
                  >
                    Create Account
                  </button>
                </div>

                {tab === "signin" ? (
                  <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                    <Input label="Username" placeholder="Enter your username" value={username}
                      onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
                    <div className="relative">
                      <Input label="Password" type={showPw ? "text" : "password"} placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-8 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoggingIn}>Sign In</Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <button type="button" onClick={() => setTab("signup")} className="text-primary font-semibold hover:underline">Create one</button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                    <Input label="Full Name" placeholder="Your full name" value={suName}
                      onChange={(e) => setSuName(e.target.value)} required autoComplete="name" />
                    <Input label="Phone Number" placeholder="+63 912 345 6789" type="tel" value={suPhone}
                      onChange={(e) => setSuPhone(e.target.value)} autoComplete="tel" />
                    <Input label="Email Address" placeholder="jane@example.com" type="email" value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)} autoComplete="email" />
                    <Input label="Username" placeholder="Choose a username" value={suUsername}
                      onChange={(e) => setSuUsername(e.target.value)} required autoComplete="username" />
                    <div className="relative">
                      <Input label="Password" type={showSuPw ? "text" : "password"} placeholder="At least 6 characters"
                        value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required autoComplete="new-password" />
                      <button type="button" onClick={() => setShowSuPw(v => !v)}
                        className="absolute right-3 top-8 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showSuPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Input label="Confirm Password" type={showSuPw ? "text" : "password"} placeholder="Repeat your password"
                      value={suConfirm} onChange={(e) => setSuConfirm(e.target.value)} required autoComplete="new-password" />
                    <Button type="submit" size="lg" className="w-full mt-2" isLoading={registerMutation.isPending}>Create Account</Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button type="button" onClick={() => setTab("signin")} className="text-primary font-semibold hover:underline">Sign in here</button>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
