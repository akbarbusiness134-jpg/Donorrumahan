import { createFileRoute } from "@tanstack/react-router";
import { useAdminStore } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, Save, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/database")({
  component: AdminDatabase,
});

function AdminDatabase() {
  const { cms, updateCMSDatabase } = useAdminStore();
  const [supabaseUrl, setSupabaseUrl] = useState(cms.database?.supabaseUrl || "");
  const [supabaseKey, setSupabaseKey] = useState(cms.database?.supabaseKey || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if cms changes from outside
  useEffect(() => {
    setSupabaseUrl(cms.database?.supabaseUrl || "");
    setSupabaseKey(cms.database?.supabaseKey || "");
  }, [cms.database]);

  const handleSave = () => {
    setIsSaving(true);
    // Simulation of save delay
    setTimeout(() => {
      updateCMSDatabase({
        supabaseUrl,
        supabaseKey,
      });
      setIsSaving(false);
      toast.success("Pengaturan Database Berhasil Disimpan", {
        description: "Koneksi Supabase telah diperbarui.",
      });
    }, 500);
  };

  const isConnected = !!supabaseUrl && !!supabaseKey;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan Database</h1>
          <p className="text-muted-foreground">Hubungkan website ini ke Supabase Cloud Storage.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Kredensial Supabase</h2>
              <p className="text-sm text-muted-foreground">Masukkan kunci API Anda di bawah ini.</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Project URL
              </label>
              <Input
                placeholder="https://xxxxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
              <p className="text-[0.8rem] text-muted-foreground">URL unik untuk database Anda.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                API Key (anon / public)
              </label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Gunakan kunci 'anon' atau 'publishable' yang aman untuk publik.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Status Koneksi</h2>
          
          {isConnected ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium text-emerald-900">Database Terhubung</p>
                <p className="text-sm text-emerald-700 mt-1">
                  Kredensial telah disimpan. Klien Supabase siap digunakan untuk menyimpan data dan gambar ke Cloud.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="font-medium text-amber-900">Belum Terhubung</p>
              <p className="text-sm text-amber-700 mt-1">
                Silakan isi URL dan API Key di samping. Sistem saat ini masih menggunakan penyimpanan lokal sementara (Local Storage).
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t space-y-3">
            <h3 className="font-medium text-sm">Langkah selanjutnya:</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              <li>Pastikan URL dan Key benar.</li>
              <li>Simpan pengaturan.</li>
              <li>Secara otomatis aplikasi akan membangun klien Supabase dengan kunci ini.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
