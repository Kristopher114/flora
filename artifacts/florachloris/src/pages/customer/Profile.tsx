import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, User, Phone, Mail, Lock, Eye, EyeOff, Save, KeyRound } from "lucide-react";
import { Button, Input } from "@/components/ui-components";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const updateMutation = useUpdateProfile({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetMeQueryKey(), updated);
        toast({ title: "Profile updated!", description: "Your information has been saved." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangingPassword(false);
      },
      onError: (err: any) => {
        toast({
          title: "Update failed",
          description: err?.error || "Could not update profile.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (changingPassword) {
      if (!currentPassword) {
        toast({ title: "Enter your current password", variant: "destructive" });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: "New password must be at least 6 characters", variant: "destructive" });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" });
        return;
      }
    }

    updateMutation.mutate({
      data: {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        currentPassword: changingPassword ? currentPassword : null,
        newPassword: changingPassword ? newPassword : null,
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">You must be signed in to view your profile.</p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
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
          <span className="text-sm font-semibold text-primary border-b-2 border-primary pb-0.5">Profile</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar + name banner */}
        <div className="flex items-center gap-4 mb-8 bg-white rounded-3xl border border-border shadow-sm px-6 py-5">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-serif font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xl font-serif font-bold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
              {user.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Personal Information */}
          <section className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Personal Information</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <Input
                label="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                autoComplete="name"
              />
              <div>
                <label className="text-sm font-medium text-foreground/80 block mb-1.5">Username</label>
                <div className="h-11 rounded-xl border border-border/60 bg-muted/30 px-3.5 flex items-center text-sm text-muted-foreground">
                  @{user.username}
                  <span className="ml-auto text-xs text-muted-foreground/60">Cannot be changed</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Details */}
          <section className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Contact Details</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 912 345 6789"
                autoComplete="tel"
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Your phone number is used to pre-fill reservation forms. Email is optional.
              </p>
            </div>
          </section>

          {/* Password Change */}
          <section className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setChangingPassword((v) => !v)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Change Password</h2>
              </div>
              <span className="text-xs text-muted-foreground">{changingPassword ? "Cancel" : "Update"}</span>
            </button>

            {changingPassword && (
              <div className="px-6 pb-5 flex flex-col gap-4 border-t border-border/60 pt-4">
                <div className="relative">
                  <Input
                    label="Current Password *"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Your current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((v) => !v)}
                    className="absolute right-3 top-8 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  label="New Password *"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm New Password *"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                />
              </div>
            )}
          </section>

          {/* Save button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </form>
      </main>
    </div>
  );
}
