import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, Monitor, ClipboardList, Download, Loader2 } from "lucide-react";
import { useState } from "react";

export default function PortalSelect() {
  const { user, logout } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/export-zip", { credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Export failed" }));
        alert(err.error || "Export failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const cd   = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "florachloris-pos.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#9e9e9e] flex flex-col items-center justify-center relative px-4">

      {/* Logout button — top right */}
      <button
        onClick={logout}
        className="absolute top-5 right-6 flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>

      {/* Cards row */}
      <div className="flex flex-row items-center justify-center gap-10 flex-wrap">

        {/* OPERATION */}
        <Link href="/admin">
          <div className="bg-white rounded-2xl shadow-lg w-48 h-48 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 select-none">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Monitor className="h-14 w-14 text-gray-800 stroke-[1.5]" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  </svg>
                </div>
              </div>
            </div>
            <span className="text-sm font-bold tracking-widest text-gray-800 uppercase">Operation</span>
          </div>
        </Link>

        {/* MANAGEMENT */}
        <Link href="/admin/bi-dashboard">
          <div className="bg-white rounded-2xl shadow-lg w-48 h-48 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200 select-none">
            <div className="flex items-center justify-center">
              <div className="relative">
                <ClipboardList className="h-14 w-14 text-gray-800 stroke-[1.5]" />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                  </svg>
                </div>
              </div>
            </div>
            <span className="text-sm font-bold tracking-widest text-gray-800 uppercase">Management</span>
          </div>
        </Link>

      </div>

      {/* Download Project ZIP */}
      <div className="mt-10 flex flex-col items-center gap-2">
        <button
          onClick={handleDownloadZip}
          disabled={downloading}
          className="flex items-center gap-2.5 bg-white/90 hover:bg-white text-gray-800 font-semibold text-sm px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloading
            ? <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
            : <Download className="h-4 w-4 text-gray-600" />
          }
          {downloading ? "Preparing ZIP…" : "Download Project as ZIP"}
        </button>
        <p className="text-xs text-white/60">Full source code · excludes node_modules &amp; secrets</p>
      </div>

    </div>
  );
}
