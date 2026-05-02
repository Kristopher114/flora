import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRegister } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, Input, Button } from "@/components/ui-components";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

type Tab = "signin" | "signup";

export default function Login() {
  const [tab, setTab] = useState<Tab>("signin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [suName, setSuName] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suUsername, setSuUsername] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [showSuPassword, setShowSuPassword] = useState(false);

  const { login, isLoggingIn } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({ title: "Account created!", description: `Welcome, ${data.user.name}!` });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({
          title: "Registration Failed",
          description: err?.error || "Could not create account.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      toast({ title: "Welcome back!" });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.error || "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (suPassword !== suConfirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (suPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ data: { name: suName, username: suUsername, password: suPassword, phone: suPhone || null, email: suEmail || null } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-primary/5">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-floral.png`}
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <Card className="w-full max-w-md relative z-10 p-8 sm:p-10 border-white/60 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <img src={`${import.meta.env.BASE_URL}images/florachloris-logo.png`} alt="Logo" className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Flora-Chloris</h1>
          <p className="text-muted-foreground mt-1 text-sm">Artisan Floral Studio</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted/50 p-1 mb-6">
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === "signin"
                ? "bg-white shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("signin")}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === "signup"
                ? "bg-white shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("signup")}
          >
            Create Account
          </button>
        </div>

        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoggingIn}>
              Sign In
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-1">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("signup")}
                className="text-primary font-semibold hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={suName}
              onChange={(e) => setSuName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label="Phone Number"
              placeholder="+63 912 345 6789"
              type="tel"
              value={suPhone}
              onChange={(e) => setSuPhone(e.target.value)}
              autoComplete="tel"
            />
            <Input
              label="Email Address"
              placeholder="jane@example.com"
              type="email"
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Username"
              placeholder="Choose a username"
              value={suUsername}
              onChange={(e) => setSuUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showSuPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowSuPassword((v) => !v)}
                className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showSuPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Confirm Password"
              type={showSuPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={suConfirm}
              onChange={(e) => setSuConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={registerMutation.isPending}
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-1">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("signin")}
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        <div className="mt-6 text-center border-t border-border pt-5">
          <Link href="/" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            <Leaf className="w-4 h-4" />
            Return to Store
          </Link>
        </div>
      </Card>
    </div>
  );
}
