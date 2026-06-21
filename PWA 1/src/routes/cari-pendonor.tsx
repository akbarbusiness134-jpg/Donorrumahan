import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminStore } from "@/lib/admin-store";
import { type BloodType } from "@/lib/admin-data";
import { toast } from "sonner";
import { Heart, User, Phone, Building2, Hospital, Droplet, FileText, ArrowLeft, Info } from "lucide-react";

export const Route = createFileRoute("/cari-pendonor")({
  head: () => ({
    meta: [
      { title: "Bantuan Cari Pendonor — KSR PMI UNHAS" },
      {
        name: "description",
        content: "Ajukan permintaan pencarian pendonor darah untuk kebutuhan mendesak.",
      },
    ],
  }),
  component: CariPendonor,
});

type FormData = {
  // Data Pasien
  patientName: string;
  bloodType: BloodType | "";
  bagsNeeded: string;
  hospital: string;
  utd: string;
  
  // Data Penanggung Jawab
  kinName: string;
  kinPhone: string;
  kinRelation: string;
  
  urgency: "normal" | "urgent";
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

const bloodTypes: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function CariPendonor() {
  const navigate = useNavigate();
  const { setRequests, requests, cms } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState("");
  
  const [formData, setFormData] = useState<FormData>({
    // Data Pasien
    patientName: "",
    bloodType: "",
    bagsNeeded: "",
    hospital: "",
    utd: "",
    
    // Data Penanggung Jawab
    kinName: "",
    kinPhone: "",
    kinRelation: "",
    urgency: "normal",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Scroll smoothly to top when submission is successful to focus on the success message
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isSubmitted]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // ===== DATA PASIEN VALIDATION =====
    
    // Validasi nama pasien
    if (!formData.patientName.trim()) {
      newErrors.patientName = "Nama pasien wajib diisi";
    } else if (formData.patientName.trim().length < 3) {
      newErrors.patientName = "Nama pasien minimal 3 karakter";
    }

    // Validasi golongan darah
    if (!formData.bloodType) {
      newErrors.bloodType = "Golongan darah wajib dipilih";
    }

    // Validasi jumlah kantong
    if (!formData.bagsNeeded) {
      newErrors.bagsNeeded = "Jumlah kantong darah wajib diisi";
    } else {
      const bags = parseInt(formData.bagsNeeded);
      if (isNaN(bags) || bags < 1) {
        newErrors.bagsNeeded = "Jumlah kantong minimal 1";
      } else if (bags > 20) {
        newErrors.bagsNeeded = "Jumlah kantong maksimal 20";
      }
    }

    // Validasi rumah sakit
    if (!formData.hospital.trim()) {
      newErrors.hospital = "Nama rumah sakit wajib diisi";
    }

    // Validasi UTD
    if (!formData.utd.trim()) {
      newErrors.utd = "Unit Transfusi Darah wajib diisi";
    }

    // ===== DATA PENANGGUNG JAWAB VALIDATION =====

    // Validasi nama penanggung jawab
    if (!formData.kinName.trim()) {
      newErrors.kinName = "Nama penanggung jawab wajib diisi";
    } else if (formData.kinName.trim().length < 3) {
      newErrors.kinName = "Nama penanggung jawab minimal 3 karakter";
    }

    // Validasi nomor telepon penanggung jawab
    if (!formData.kinPhone.trim()) {
      newErrors.kinPhone = "Nomor telepon wajib diisi";
    } else {
      const phoneClean = formData.kinPhone.replace(/\D/g, "");
      if (phoneClean.length < 10 || phoneClean.length > 15) {
        newErrors.kinPhone = "Nomor telepon tidak valid";
      }
    }

    // Validasi hubungan dengan pasien
    if (!formData.kinRelation.trim()) {
      newErrors.kinRelation = "Hubungan dengan pasien wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua kolom yang wajib diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate ID
      const requestId = `REQ-${Date.now().toString().slice(-6)}`;

      // Normalize phone number
      let normalizedPhone = formData.kinPhone.replace(/\D/g, "");
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "62" + normalizedPhone.slice(1);
      } else if (!normalizedPhone.startsWith("62")) {
        normalizedPhone = "62" + normalizedPhone;
      }

      // Create timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      
      const timestamp = `${day}-${month}-${year} ${hour}:${minute}`;

      // Create blood request object
      const newRequest = {
        id: requestId,
        patient: formData.patientName.trim(),
        bloodType: formData.bloodType as BloodType,
        bags: parseInt(formData.bagsNeeded),
        hospital: formData.hospital.trim(),
        utd: formData.utd.trim(),
        kin: formData.kinName.trim(),
        kinPhone: normalizedPhone,
        kinRelation: formData.kinRelation.trim() || undefined,
        urgency: formData.urgency,
        status: "Baru" as const,
        createdAt: timestamp,
      };

      // Add to store (prepend to beginning of array)
      setRequests([newRequest, ...requests]);

      // Set submitted state
      setIsSubmitted(true);
      setSubmittedRequestId(requestId);

      toast.success("Permintaan berhasil dikirim!", {
        description: `Permintaan ${requestId} telah tercatat.`,
        duration: 5000,
      });

      // Reset form
      setFormData({
        patientName: "",
        bloodType: "",
        bagsNeeded: "",
        hospital: "",
        utd: "",
        kinName: "",
        kinPhone: "",
        kinRelation: "",
        urgency: "normal",
      });

    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Terjadi kesalahan", {
        description: "Mohon coba lagi dalam beberapa saat.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const pdpkPhone = cms.footer.responsePhone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Halo Badan PDDK-KSR PMI UNHAS,\n\nSaya ingin mengonfirmasi permintaan donor darah dengan ID: ${submittedRequestId}\n\nMohon bantuannya. Terima kasih.`
    );
    window.open(`https://wa.me/${pdpkPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="py-6 sm:py-8 lg:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/" })}
            className="group mb-6 -ml-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Beranda
          </Button>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              Bantuan Cari Pendonor
            </h1>
          </div>

          {/* Alert Persyaratan - Red/Warning */}
          {!isSubmitted && (
            <Alert className="mb-8 border-red-500/50 bg-red-50 dark:bg-red-950/20 p-4 sm:p-5">
              <Info className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 sm:mt-0" />
              <div className="flex flex-col gap-1.5 sm:gap-1">
                <AlertTitle className="text-red-900 dark:text-red-100 font-bold text-base">
                  Persyaratan Penting
                </AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                  Pastikan Anda telah memiliki <span className="font-bold">Resi/Bukti Permintaan Darah</span> dari UTD/UDD sebelum mengisi formulir ini.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Form Container */}
          <div>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* ========== DATA PASIEN SECTION ========== */}
                <Card className="overflow-hidden border-border/50 shadow-sm">
                  <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Data Pasien
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Informasi identitas dan kebutuhan darah pasien</p>
                  </div>
                  <CardContent className="p-6 space-y-6">

                  {/* Nama Pasien */}
                  <div className="space-y-2">
                    <Label htmlFor="patientName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nama Pasien *
                    </Label>
                    <Input
                      id="patientName"
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => handleChange("patientName", e.target.value)}
                      className={errors.patientName ? "border-destructive" : ""}
                    />
                    {errors.patientName && (
                      <p className="text-sm text-destructive">{errors.patientName}</p>
                    )}
                  </div>

                  {/* Golongan Darah & Jumlah Kantong (Row) */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bloodType" className="flex items-center gap-2">
                        <Droplet className="h-4 w-4" />
                        Golongan Darah Dibutuhkan *
                      </Label>
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) => handleChange("bloodType", value)}
                      >
                        <SelectTrigger className={errors.bloodType ? "border-destructive" : ""}>
                          <SelectValue placeholder="Pilih golongan darah" />
                        </SelectTrigger>
                        <SelectContent>
                          {bloodTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.bloodType && (
                        <p className="text-sm text-destructive">{errors.bloodType}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bagsNeeded" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Jumlah Kantong Darah *
                      </Label>
                      <Input
                        id="bagsNeeded"
                        type="number"
                        min="1"
                        max="20"
                        value={formData.bagsNeeded}
                        onChange={(e) => handleChange("bagsNeeded", e.target.value)}
                        className={errors.bagsNeeded ? "border-destructive" : ""}
                      />
                      {errors.bagsNeeded && (
                        <p className="text-sm text-destructive">{errors.bagsNeeded}</p>
                      )}
                    </div>
                  </div>

                  {/* Rumah Sakit */}
                  <div className="space-y-2">
                    <Label htmlFor="hospital" className="flex items-center gap-2">
                      <Hospital className="h-4 w-4" />
                      Nama Rumah Sakit *
                    </Label>
                    <Input
                      id="hospital"
                      type="text"
                      value={formData.hospital}
                      onChange={(e) => handleChange("hospital", e.target.value)}
                      className={errors.hospital ? "border-destructive" : ""}
                    />
                    {errors.hospital && (
                      <p className="text-sm text-destructive">{errors.hospital}</p>
                    )}
                  </div>

                  {/* Unit Transfusi Darah (UTD) */}
                  <div className="space-y-2">
                    <Label htmlFor="utd" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      UTD / UDD *
                    </Label>
                    <Input
                      id="utd"
                      type="text"
                      value={formData.utd}
                      onChange={(e) => handleChange("utd", e.target.value)}
                      className={errors.utd ? "border-destructive" : ""}
                    />
                    {errors.utd && (
                      <p className="text-sm text-destructive">{errors.utd}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Unit Transfusi Darah (UTD) atau Unit Donor Darah (UDD) tempat kantong darah akan diambil.
                    </p>
                  </div>
                  </CardContent>
                </Card>

                {/* ========== DATA PENANGGUNG JAWAB SECTION ========== */}
                <Card className="overflow-hidden border-border/50 shadow-sm">
                  <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" /> Data Penanggung Jawab
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Kontak penanggung jawab yang dapat dihubungi</p>
                  </div>
                  <CardContent className="p-6 space-y-6">

                  {/* Nama Penanggung Jawab */}
                  <div className="space-y-2">
                    <Label htmlFor="kinName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nama Penanggung Jawab *
                    </Label>
                    <Input
                      id="kinName"
                      type="text"
                      value={formData.kinName}
                      onChange={(e) => handleChange("kinName", e.target.value)}
                      className={errors.kinName ? "border-destructive" : ""}
                    />
                    {errors.kinName && (
                      <p className="text-sm text-destructive">{errors.kinName}</p>
                    )}
                  </div>

                  {/* Nomor Telepon Penanggung Jawab */}
                  <div className="space-y-2">
                    <Label htmlFor="kinPhone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Nomor Telepon / WhatsApp *
                    </Label>
                    <Input
                      id="kinPhone"
                      type="tel"
                      value={formData.kinPhone}
                      onChange={(e) => handleChange("kinPhone", e.target.value)}
                      className={errors.kinPhone ? "border-destructive" : ""}
                    />
                    {errors.kinPhone && (
                      <p className="text-sm text-destructive">{errors.kinPhone}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Nomor yang dapat dihubungi untuk koordinasi donor
                    </p>
                  </div>

                  {/* Hubungan dengan Pasien */}
                  <div className="space-y-2">
                    <Label htmlFor="kinRelation">
                      Hubungan dengan Pasien *
                    </Label>
                    <Select
                      value={formData.kinRelation}
                      onValueChange={(value) => handleChange("kinRelation", value)}
                    >
                      <SelectTrigger className={errors.kinRelation ? "border-destructive" : ""}>
                        <SelectValue placeholder="Pilih hubungan dengan pasien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Orang Tua">Orang Tua</SelectItem>
                        <SelectItem value="Anak">Anak</SelectItem>
                        <SelectItem value="Suami">Suami</SelectItem>
                        <SelectItem value="Istri">Istri</SelectItem>
                        <SelectItem value="Saudara Kandung">Saudara Kandung</SelectItem>
                        <SelectItem value="Kerabat">Kerabat</SelectItem>
                        <SelectItem value="Kenalan">Kenalan</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.kinRelation && (
                      <p className="text-sm text-destructive">{errors.kinRelation}</p>
                    )}
                  </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex flex-col gap-3 pt-6 pb-4 max-w-xl mx-auto">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full h-14 text-base rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting ? "Memproses Permintaan..." : "Kirim Permintaan Sekarang"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Dengan mengirim permintaan, Anda menyetujui bahwa data yang diisi adalah benar dan dapat dipertanggungjawabkan
                  </p>
                </div>
              </form>
            ) : (
              /* Success Message with WhatsApp Confirmation */
              <Card className="border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5 max-w-lg mx-auto shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8 flex flex-col items-center">
                  <div className="h-16 w-16 flex items-center justify-center mb-4">
                    {cms.footer.pdpkLogo ? (
                      <img
                        src={cms.footer.pdpkLogo}
                        alt="Logo PDDK"
                        className="h-16 w-16 object-contain"
                      />
                    ) : cms.header.logo ? (
                      <img
                        src={cms.header.logo}
                        alt={cms.header.orgName}
                        className="h-16 w-16 object-contain"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Heart className="h-7 w-7 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Success Title */}
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-ink text-center">
                    Permintaan Terkirim!
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    ID Permintaan Anda: <span className="font-mono font-bold text-primary select-all px-2 py-0.5 bg-primary/5 rounded border border-primary/10">{submittedRequestId}</span>
                  </p>

                  {/* Compact, clean instructions card */}
                  <div className="w-full border border-blue-200 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/15 rounded-xl p-4 my-6 text-left flex gap-3 items-start">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        Langkah Selanjutnya (Wajib):
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        Kirim foto <span className="font-bold">Resi/Bukti Permintaan Darah</span> dari UTD/UDD ke WhatsApp resmi kami agar permintaan Anda dapat segera diproses oleh relawan.
                      </p>
                    </div>
                  </div>

                  {/* Sleek, smaller buttons side-by-side or stacked neatly */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Button
                      onClick={handleWhatsAppContact}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md transition-all font-semibold h-11"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Kirim Bukti WhatsApp
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate({ to: "/" })}
                      className="rounded-xl font-semibold border-border hover:bg-muted h-11"
                    >
                      Kembali ke Beranda
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
