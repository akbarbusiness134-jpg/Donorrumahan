import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminStore } from "@/lib/admin-store";
import { type BloodType } from "@/lib/admin-data";
import { toast } from "sonner";
import { Droplet, Calendar, Weight, Phone, MapPin, User, ArrowLeft, Ruler } from "lucide-react";

export const Route = createFileRoute("/daftar-pendonor")({
  head: () => ({
    meta: [
      { title: "Daftar Pendonor Pengganti — KSR PMI UNHAS" },
      {
        name: "description",
        content: "Daftarkan diri Anda sebagai pendonor pengganti untuk membantu mereka yang membutuhkan.",
      },
    ],
  }),
  component: DaftarPendonor,
});

type FormData = {
  // Data Diri
  name: string;
  birthDate: string;
  phone: string;
  address: string;
  isUnhasStudent: boolean;
  faculty: string;
  
  // Info Medis
  weight: string;
  height: string;
  bloodType: BloodType | "" | "Tidak Tahu";
  lastDonation: string;
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

const bloodTypes: (BloodType | "Tidak Tahu")[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Tidak Tahu"];

function DaftarPendonor() {
  const navigate = useNavigate();
  const { addDonor } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    // Data Diri
    name: "",
    birthDate: "",
    phone: "",
    address: "",
    isUnhasStudent: false,
    faculty: "",
    
    // Info Medis
    weight: "",
    height: "",
    bloodType: "",
    lastDonation: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Clear faculty if unchecking Mahasiswa Unhas
      if (field === "isUnhasStudent" && !value) {
        updated.faculty = "";
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // ===== DATA DIRI VALIDATION =====
    
    // Validasi nama
    if (!formData.name.trim()) {
      newErrors.name = "Nama lengkap wajib diisi";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Nama minimal 3 karakter";
    }

    // Validasi tanggal lahir
    if (!formData.birthDate) {
      newErrors.birthDate = "Tanggal lahir wajib diisi";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 17 || age > 65) {
        newErrors.birthDate = "Usia harus antara 17-65 tahun";
      }
    }

    // Validasi nomor telepon
    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor WhatsApp wajib diisi";
    } else {
      const phoneClean = formData.phone.replace(/\D/g, "");
      if (phoneClean.length < 10 || phoneClean.length > 15) {
        newErrors.phone = "Nomor WhatsApp tidak valid";
      }
    }

    // Validasi alamat
    if (!formData.address.trim()) {
      newErrors.address = "Alamat wajib diisi";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Alamat minimal 10 karakter";
    }

    // Validasi fakultas jika mahasiswa UNHAS
    if (formData.isUnhasStudent && !formData.faculty.trim()) {
      newErrors.faculty = "Fakultas wajib diisi untuk Mahasiswa UNHAS";
    }

    // ===== INFO MEDIS VALIDATION =====

    // Validasi berat badan
    if (!formData.weight) {
      newErrors.weight = "Berat badan wajib diisi";
    } else {
      const weightNum = parseFloat(formData.weight);
      if (isNaN(weightNum) || weightNum < 47) {
        newErrors.weight = "Berat badan minimal 47 kg";
      } else if (weightNum > 200) {
        newErrors.weight = "Berat badan tidak valid";
      }
    }

    // Validasi tinggi badan
    if (!formData.height) {
      newErrors.height = "Tinggi badan wajib diisi";
    } else {
      const heightNum = parseFloat(formData.height);
      if (isNaN(heightNum) || heightNum < 100) {
        newErrors.height = "Tinggi badan minimal 100 cm";
      } else if (heightNum > 250) {
        newErrors.height = "Tinggi badan tidak valid";
      }
    }

    // Validasi golongan darah
    if (!formData.bloodType) {
      newErrors.bloodType = "Golongan darah wajib dipilih";
    }

    // Validasi donor terakhir (opsional, tapi jika diisi harus valid)
    if (formData.lastDonation) {
      const lastDonation = new Date(formData.lastDonation);
      const today = new Date();
      if (lastDonation > today) {
        newErrors.lastDonation = "Tanggal donor tidak boleh di masa depan";
      }
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
      const donorId = `D-${Date.now().toString().slice(-6)}`;

      // Normalize phone number
      let normalizedPhone = formData.phone.replace(/\D/g, "");
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "62" + normalizedPhone.slice(1);
      } else if (!normalizedPhone.startsWith("62")) {
        normalizedPhone = "62" + normalizedPhone;
      }

      // Calculate age from birthDate
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      // Determine bloodType - use "O+" as default if "Tidak Tahu"
      const finalBloodType: BloodType = 
        formData.bloodType === "Tidak Tahu" ? "O+" : (formData.bloodType as BloodType);

      // Create donor object
      const newDonor = {
        id: donorId,
        name: formData.name.trim(),
        bloodType: finalBloodType,
        age: age,
        weight: parseFloat(formData.weight),
        phone: normalizedPhone,
        birthPlace: formData.isUnhasStudent 
          ? `Mahasiswa UNHAS - ${formData.faculty.trim()}` 
          : formData.address.trim(),
        birthDate: formData.birthDate,
        lastDonation: formData.lastDonation || undefined,
      };

      // Add to store
      addDonor(newDonor);

      toast.success("Pendaftaran berhasil!", {
        description: "Terima kasih telah mendaftar sebagai pendonor pengganti. Data Anda telah tersimpan.",
      });

      // Reset form
      setFormData({
        name: "",
        birthDate: "",
        phone: "",
        address: "",
        isUnhasStudent: false,
        faculty: "",
        weight: "",
        height: "",
        bloodType: "",
        lastDonation: "",
      });

      // Navigate to home after 2 seconds
      setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Terjadi kesalahan", {
        description: "Mohon coba lagi dalam beberapa saat.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              Daftar Pendonor Pengganti
            </h1>
          </div>

          {/* Form Container */}
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Lengkapi data diri Anda dengan benar.
            </p>
            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* ========== DATA DIRI SECTION ========== */}
                <Card className="overflow-hidden border-border/50 shadow-sm">
                  <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Data Diri
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Informasi identitas pribadi Anda</p>
                  </div>
                  <CardContent className="p-6 space-y-6">

                  {/* Nama Lengkap */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nama Lengkap *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Tanggal Lahir *
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleChange("birthDate", e.target.value)}
                      className={errors.birthDate ? "border-destructive" : ""}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    {errors.birthDate && (
                      <p className="text-sm text-destructive">{errors.birthDate}</p>
                    )}
                  </div>

                  {/* Nomor WhatsApp */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Nomor WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Nomor ini akan digunakan untuk menghubungi Anda saat dibutuhkan
                    </p>
                  </div>

                  {/* Alamat */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Alamat Lengkap *
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className={errors.address ? "border-destructive" : ""}
                      rows={3}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address}</p>
                    )}
                  </div>

                  {/* Checkbox Mahasiswa UNHAS */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isUnhasStudent"
                        checked={formData.isUnhasStudent}
                        onCheckedChange={(checked) => handleChange("isUnhasStudent", checked as boolean)}
                      />
                      <Label
                        htmlFor="isUnhasStudent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Mahasiswa Universitas Hasanuddin
                      </Label>
                    </div>

                    {/* Conditional Fakultas Field */}
                    {formData.isUnhasStudent && (
                      <div className="space-y-2">
                        <Label htmlFor="faculty">
                          Fakultas *
                        </Label>
                        <Input
                          id="faculty"
                          type="text"
                          value={formData.faculty}
                          onChange={(e) => handleChange("faculty", e.target.value)}
                          className={errors.faculty ? "border-destructive" : ""}
                        />
                        {errors.faculty && (
                          <p className="text-sm text-destructive">{errors.faculty}</p>
                        )}
                      </div>
                    )}
                  </div>
                  </CardContent>
                </Card>

                {/* ========== INFO MEDIS SECTION ========== */}
                <Card className="overflow-hidden border-border/50 shadow-sm">
                  <div className="bg-muted/30 px-6 py-4 border-b border-border/50">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Droplet className="h-5 w-5 text-primary" /> Info Medis
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Informasi kesehatan dan riwayat donor</p>
                  </div>
                  <CardContent className="p-6 space-y-6">

                  {/* Berat Badan & Tinggi Badan (Row) */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="flex items-center gap-2">
                        <Weight className="h-4 w-4" />
                        Berat Badan (kg) *
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        min="47"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => handleChange("weight", e.target.value)}
                        className={errors.weight ? "border-destructive" : ""}
                      />
                      {errors.weight && (
                        <p className="text-sm text-destructive">{errors.weight}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height" className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Tinggi Badan (cm) *
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        min="100"
                        step="0.1"
                        value={formData.height}
                        onChange={(e) => handleChange("height", e.target.value)}
                        className={errors.height ? "border-destructive" : ""}
                      />
                      {errors.height && (
                        <p className="text-sm text-destructive">{errors.height}</p>
                      )}
                    </div>
                  </div>

                  {/* Golongan Darah */}
                  <div className="space-y-2">
                    <Label htmlFor="bloodType" className="flex items-center gap-2">
                      <Droplet className="h-4 w-4" />
                      Golongan Darah *
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
                    <p className="text-xs text-muted-foreground">
                      Pilih "Tidak Tahu" jika belum mengetahui golongan darah Anda
                    </p>
                  </div>

                  {/* Donor Terakhir (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="lastDonation" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Tanggal Donor Terakhir (Opsional)
                    </Label>
                    <Input
                      id="lastDonation"
                      type="date"
                      value={formData.lastDonation}
                      onChange={(e) => handleChange("lastDonation", e.target.value)}
                      className={errors.lastDonation ? "border-destructive" : ""}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    {errors.lastDonation && (
                      <p className="text-sm text-destructive">{errors.lastDonation}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Kosongkan jika belum pernah mendonor sebelumnya
                    </p>
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
                    {isSubmitting ? "Memproses..." : "Daftar Sekarang"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Dengan mendaftar, Anda menyetujui untuk dihubungi saat ada kebutuhan donor darah
                  </p>
                </div>
              </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
