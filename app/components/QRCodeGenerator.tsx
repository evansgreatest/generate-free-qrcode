"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QRCodeData, QRCodeType } from "../types/qrTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { generateQRCodeData } from "../utils/qrUtils";
import { generateVCard } from "../utils/vcardUtils";
import { VCardData } from "../types/qrTypes";
import QRFormInputs from "./QRFormInputs";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Loader2,
  CreditCard,
  Mail,
  X,
  GlobeIcon,
  FileTextIcon,
  MailIcon,
  PhoneIcon,
  Sparkles,
  Shield,
  Zap,
  Wifi,
  MapPin,
  User,
  Building,
  Briefcase,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface QRCodeGeneratorProps {
  selectedType: QRCodeType;
  setSelectedType: (type: QRCodeType) => void;
  onPaymentSuccess: () => void;
  hasPaid: boolean;
}

const PRICE_PER_QR = 10.0;
const PRICE_PER_PROFILE = 15.0; // Premium pricing for Profile QR codes

export default function QRCodeGenerator({
  selectedType,
  setSelectedType,
  onPaymentSuccess,
  hasPaid,
}: QRCodeGeneratorProps) {
  const [qrCodeData, setQRCodeData] = useState<QRCodeData>({
    type: selectedType,
    data: "",
  });

  // WiFi-specific state
  const [wifiData, setWifiData] = useState<{
    ssid: string;
    password: string;
    security: "WPA" | "WEP" | "nopass";
    hidden: boolean;
  }>({
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
  });

  // Location-specific state
  const [locationData, setLocationData] = useState<{
    latitude: string;
    longitude: string;
    query: string;
  }>({
    latitude: "",
    longitude: "",
    query: "",
  });

  // Profile-specific state
  const [profileData, setProfileData] = useState<VCardData>({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    jobTitle: "",
    website: "",
    bio: "",
    profilePicture: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    facebook: "",
    generateType: "both",
  });

  // Check for pending QR data after payment and auto-generate
  useEffect(() => {
    if (!hasPaid) return;

    const paid = sessionStorage.getItem("has_paid");
    const paymentRef = sessionStorage.getItem("payment_reference");
    const pendingData = sessionStorage.getItem("pending_qr_data");

    if (paid === "true" && paymentRef && pendingData) {
      try {
        const storedData = JSON.parse(pendingData);

        // Restore form data
        setQRCodeData(storedData.qrCodeData);
        if (storedData.wifiData) {
          setWifiData(storedData.wifiData);
        }
        if (storedData.locationData) {
          setLocationData(storedData.locationData);
        }
        if (storedData.profileData) {
          setProfileData(storedData.profileData);
        }
        if (storedData.imageFormat) {
          setImageFormat(storedData.imageFormat);
        }
        if (storedData.selectedType) {
          setSelectedType(storedData.selectedType);
        }

        // Auto-generate after a short delay to ensure state is updated
        const timer = setTimeout(() => {
          autoGenerateAfterPayment(storedData);
        }, 500);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error restoring pending QR data:", error);
        sessionStorage.removeItem("pending_qr_data");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPaid]);

  // Auto-generate QR code after payment
  const autoGenerateAfterPayment = async (storedData: any) => {
    setIsGenerating(true);
    try {
      let dataToGenerate: QRCodeData;

      if (storedData.selectedType === "WIFI") {
        const wifiString = `WIFI:T:${storedData.wifiData.security};S:${
          storedData.wifiData.ssid
        };P:${storedData.wifiData.password || ""};H:${
          storedData.wifiData.hidden ? "true" : "false"
        };;`;
        dataToGenerate = { type: "WIFI", data: wifiString };
      } else if (storedData.selectedType === "LOCATION") {
        const lat = parseFloat(storedData.locationData.latitude);
        const lng = parseFloat(storedData.locationData.longitude);
        let locationString = `geo:${lat},${lng}`;
        if (storedData.locationData.query) {
          locationString += `?q=${encodeURIComponent(
            storedData.locationData.query
          )}`;
        }
        dataToGenerate = { type: "LOCATION", data: locationString };
      } else if (storedData.selectedType === "VCARD") {
        // Handle profile generation - send profile data to API
        dataToGenerate = {
          type: "VCARD",
          data: JSON.stringify(storedData.profileData),
        };
      } else if (storedData.selectedType === "PDF") {
        // PDF - use the URL from qrCodeData
        dataToGenerate = storedData.qrCodeData;
      } else {
        dataToGenerate = storedData.qrCodeData;
      }

      // For VCARD, we send the JSON string directly to API
      // The API will generate the appropriate QR data (vCard or web URL)
      // For PDF, we send the URL directly
      const generatedData =
        storedData.selectedType === "VCARD"
          ? JSON.stringify(storedData.profileData)
          : storedData.selectedType === "PDF"
          ? storedData.qrCodeData.data // Send PDF URL directly
          : generateQRCodeData(dataToGenerate);
      const paymentRef = sessionStorage.getItem("payment_reference");

      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrData: generatedData,
          qrType: storedData.selectedType,
          imageFormat: storedData.imageFormat || imageFormat,
          paymentReference: paymentRef,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("QR generation failed:", errorData);
        throw new Error(errorData.error || "Failed to generate QR code");
      }

      const result = await response.json();

      // Clear stored data and payment status
      sessionStorage.removeItem("pending_qr_data");
      sessionStorage.removeItem("payment_reference");
      sessionStorage.removeItem("has_paid");

      // For VCARD, use the actual QR data from API response
      if (storedData.selectedType === "VCARD") {
        // Use the actual QR data from the API response
        // This will be either the vCard string or the web profile URL
        const actualQrData =
          result.qrCode?.qrData || result.profile?.url || generatedData;
        setQrCode(actualQrData);

        // Show profile URL if web profile was created
        if (result.profile?.url) {
          toast({
            title: "Profile Created",
            description: `Your profile is available at: ${result.profile.url}`,
          });
        }
      } else if (storedData.selectedType === "PDF") {
        // For PDF, use the URL that was uploaded
        setQrCode(storedData.qrCodeData.data);
      } else {
        setQrCode(generatedData);
      }

      if (result.qrCode?.dataUrl && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvasRef.current?.getContext("2d");
          if (ctx && canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = result.qrCode.dataUrl;
      }

      toast({
        title: "Success",
        description: "QR code generated and saved successfully!",
      });

      onPaymentSuccess();
    } catch (error) {
      console.error("Auto-generation error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive",
      });
      // Clear pending data on error
      sessionStorage.removeItem("pending_qr_data");
    } finally {
      setIsGenerating(false);
    }
  };

  // Update qrCodeData type when selectedType changes and reset form data
  useEffect(() => {
    // Don't reset if we're restoring from pending data
    const pendingData = sessionStorage.getItem("pending_qr_data");
    if (pendingData) return;

    setQRCodeData((prev) => ({ ...prev, type: selectedType, data: "" }));
    // Reset WiFi data when switching away from WIFI type
    if (selectedType !== "WIFI") {
      setWifiData({
        ssid: "",
        password: "",
        security: "WPA",
        hidden: false,
      });
    }
    // Reset Location data when switching away from LOCATION type
    if (selectedType !== "LOCATION") {
      setLocationData({
        latitude: "",
        longitude: "",
        query: "",
      });
    }
    // Reset Profile data when switching away from PROFILE type
    if (selectedType !== "VCARD") {
      setProfileData({
        fullName: "",
        phone: "",
        email: "",
        company: "",
        jobTitle: "",
        website: "",
        bio: "",
        profilePicture: "",
        linkedin: "",
        twitter: "",
        instagram: "",
        facebook: "",
        generateType: "both",
      });
      setProfileStep(1);
    }
  }, [selectedType]);
  const [qrCode, setQrCode] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg">("png");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [profileStep, setProfileStep] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (qrCode && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrCode,
        {
          width: 512,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) {
            console.error(error);
            toast({
              title: "Error",
              description: "Failed to generate QR code image",
              variant: "destructive",
            });
          }
        }
      );
    }
  }, [qrCode, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!hasPaid) {
      // Store form data before redirecting to payment
      const formDataToStore = {
        selectedType,
        qrCodeData,
        wifiData,
        locationData,
        profileData,
        imageFormat,
      };
      sessionStorage.setItem(
        "pending_qr_data",
        JSON.stringify(formDataToStore)
      );
      setShowPaymentDialog(true);
      return;
    }

    // Validate WIFI data
    if (selectedType === "WIFI" && !wifiData.ssid) {
      toast({
        title: "Validation Error",
        description: "Please enter WiFi network name (SSID)",
        variant: "destructive",
      });
      return;
    }

    // Validate LOCATION data
    if (selectedType === "LOCATION") {
      if (!locationData.latitude || !locationData.longitude) {
        toast({
          title: "Validation Error",
          description: "Please enter both latitude and longitude",
          variant: "destructive",
        });
        return;
      }
      const lat = parseFloat(locationData.latitude);
      const lng = parseFloat(locationData.longitude);
      if (
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        toast({
          title: "Validation Error",
          description:
            "Please enter valid coordinates (Lat: -90 to 90, Lng: -180 to 180)",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate PROFILE data
    if (selectedType === "VCARD") {
      if (!profileData.fullName || !profileData.phone || !profileData.email) {
        toast({
          title: "Validation Error",
          description:
            "Please enter full name, phone, and email (required fields)",
          variant: "destructive",
        });
        return;
      }
    }

    setIsGenerating(true);
    try {
      // Prepare data based on type
      let dataToGenerate: QRCodeData;

      if (selectedType === "WIFI") {
        // Format: WIFI:T:WPA;S:NetworkName;P:Password;H:false;;
        const wifiString = `WIFI:T:${wifiData.security};S:${wifiData.ssid};P:${
          wifiData.password || ""
        };H:${wifiData.hidden ? "true" : "false"};;`;
        dataToGenerate = { type: "WIFI", data: wifiString };
      } else if (selectedType === "LOCATION") {
        // Format: geo:latitude,longitude?q=query
        const lat = parseFloat(locationData.latitude);
        const lng = parseFloat(locationData.longitude);
        let locationString = `geo:${lat},${lng}`;
        if (locationData.query) {
          locationString += `?q=${encodeURIComponent(locationData.query)}`;
        }
        dataToGenerate = { type: "LOCATION", data: locationString };
      } else if (selectedType === "VCARD") {
        // Profile will be handled in API - send profile data
        dataToGenerate = { type: "VCARD", data: JSON.stringify(profileData) };
      } else if (selectedType === "PDF") {
        // PDF - use the URL from qrCodeData
        dataToGenerate = qrCodeData;
      } else {
        dataToGenerate = qrCodeData;
      }

      // For PDF, send the URL directly (no transformation needed)
      const generatedData =
        selectedType === "PDF"
          ? qrCodeData.data
          : selectedType === "VCARD"
          ? JSON.stringify(profileData)
          : generateQRCodeData(dataToGenerate);
      const paymentRef = sessionStorage.getItem("payment_reference");

      const response = await fetch("/api/qr/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrData: generatedData,
          qrType: selectedType,
          imageFormat: imageFormat,
          paymentReference: paymentRef,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("QR generation failed:", errorData);

        if (response.status === 402) {
          sessionStorage.removeItem("pending_qr_data");
          sessionStorage.removeItem("payment_reference");
          sessionStorage.removeItem("has_paid");
          setShowPaymentDialog(true);
          setIsGenerating(false);
          toast({
            title: "Payment Required",
            description:
              errorData.error ||
              "Please complete payment for this QR code generation",
            variant: "destructive",
          });
          return;
        }

        throw new Error(errorData.error || "Failed to generate QR code");
      }

      const result = await response.json();

      // Clear stored data and payment status
      sessionStorage.removeItem("pending_qr_data");
      sessionStorage.removeItem("payment_reference");
      sessionStorage.removeItem("has_paid");

      // For VCARD type, use the actual QR data from API response
      // The API returns the final QR data (vCard string or web URL) in qrCode.qrData
      if (selectedType === "VCARD") {
        // Use the actual QR data from the API response
        // This will be either the vCard string or the web profile URL
        const actualQrData =
          result.qrCode?.qrData || result.profile?.url || generatedData;
        setQrCode(actualQrData);

        // Show profile URL if web profile was created
        if (result.profile?.url) {
          toast({
            title: "Profile Created",
            description: `Your profile is available at: ${result.profile.url}`,
          });
        }
      } else if (selectedType === "PDF") {
        // For PDF, use the URL that was uploaded
        setQrCode(qrCodeData.data);
      } else {
        setQrCode(generatedData);
      }

      if (result.qrCode?.dataUrl && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvasRef.current?.getContext("2d");
          if (ctx && canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = result.qrCode.dataUrl;
      }

      toast({
        title: "Success",
        description:
          selectedType === "VCARD" && result.profile
            ? "Profile QR code generated successfully!"
            : "QR code generated and saved successfully! Payment consumed.",
      });

      onPaymentSuccess();
    } catch (error) {
      console.error("QR generation error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setQRCodeData({ ...qrCodeData, data: e.target.value });
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `qrcode-${Date.now()}.${imageFormat}`;
      link.href = canvasRef.current.toDataURL(`image/${imageFormat}`);
      link.click();
      toast({
        title: "Downloaded",
        description: "QR code downloaded successfully!",
      });
    }
  };

  const handleCopy = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({
        title: "Copied",
        description: "QR code data copied to clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaymentClick = () => {
    setShowPaymentDialog(false);
    setShowEmailDialog(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: selectedType === "VCARD" ? PRICE_PER_PROFILE : PRICE_PER_QR,
          metadata: {
            qrType: selectedType,
            custom_fields: [
              {
                display_name: "QR Code Type",
                variable_name: "qr_type",
                value: selectedType,
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Payment Error",
          description: data.error,
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      window.location.href = data.authorization_url;
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <Card className="w-full border shadow-2xl bg-white/5 backdrop-blur-xl text-white  border-white/10">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-md opacity-75" /> */}
              <div className="relative p-3 bg-primary rounded-xl">
                <QrCode className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                QR Code Generator
              </CardTitle>
              <CardDescription className="mt-1 text-slate-400">
                Create QR codes instantly
              </CardDescription>
            </div>
          </div>

          {hasPaid && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">
                Payment verified - Ready to generate
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <QRFormInputs
              selectedType={selectedType}
              qrCodeData={qrCodeData}
              wifiData={wifiData}
              locationData={locationData}
              profileData={profileData}
              profileStep={profileStep}
              onQRCodeDataChange={setQRCodeData}
              onWifiDataChange={setWifiData}
              onLocationDataChange={setLocationData}
              onProfileDataChange={setProfileData}
              onProfileStepChange={setProfileStep}
            />

            {!hasPaid && (
              <div className="relative group">
                {/* <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl blur-md" /> */}
                <div
                  className={`relative p-4 rounded-xl border ${
                    selectedType === "VCARD"
                      ? "bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/20"
                      : "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedType === "VCARD"
                          ? "bg-rose-500/20"
                          : "bg-orange-500/20"
                      }`}
                    >
                      <CreditCard
                        className={`h-5 w-5 ${
                          selectedType === "VCARD"
                            ? "text-rose-400"
                            : "text-orange-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          selectedType === "VCARD"
                            ? "text-rose-300"
                            : "text-orange-300"
                        }`}
                      >
                        Payment Required
                        {selectedType === "VCARD" && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-rose-500/20 border border-rose-500/30 rounded-full">
                            Premium
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-xs ${
                          selectedType === "VCARD"
                            ? "text-rose-400/80"
                            : "text-orange-400/80"
                        }`}
                      >
                        GHS{" "}
                        {selectedType === "VCARD"
                          ? PRICE_PER_PROFILE
                          : PRICE_PER_QR}{" "}
                        per QR code generation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/80  transition-all"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-5 w-5" />
                  Generate QR Code
                </>
              )}
            </Button>
          </form>

          {qrCode && (
            <div className="mt-8 space-y-6 animate-fade-in">
              <div className="relative group">
                {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" /> */}
                <div className="relative p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="p-6 bg-white rounded-xl shadow-2xl">
                      <canvas ref={canvasRef} className="max-w-full" />
                    </div>

                    <div className="flex flex-wrap gap-3 w-full justify-center">
                      <Select
                        value={imageFormat}
                        onValueChange={(value) =>
                          setImageFormat(value as "png" | "jpeg")
                        }
                      >
                        <SelectTrigger className="w-32 bg-white/5 border border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleDownload}
                        className="flex-1 min-w-[140px] h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-md bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-lg blur-md opacity-75" />
                <div className="relative p-2 bg-primary rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl">Payment Required</DialogTitle>
            </div>
            <DialogDescription className="text-base text-slate-400">
              To generate a QR code, please complete the payment of{" "}
              <span
                className={`font-bold ${
                  selectedType === "VCARD" ? "text-rose-400" : "text-blue-400"
                }`}
              >
                GHS{" "}
                {selectedType === "VCARD" ? PRICE_PER_PROFILE : PRICE_PER_QR}
              </span>
              {selectedType === "VCARD" && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-rose-500/20 border border-rose-500/30 rounded-full text-rose-300">
                  Premium Feature
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentClick}
              className="flex-1 bg-primary hover:bg-primary/80  transition-all"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Continue to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-lg blur-md opacity-75" />
                <div className="relative p-2 bg-primary rounded-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl">Enter Your Email</DialogTitle>
            </div>
            <DialogDescription className="text-base text-slate-400">
              Please provide your email address to proceed with payment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit} className="space-y-4 mt-1">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-slate-300"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500/50 focus:bg-white/10"
                disabled={isProcessingPayment}
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEmailDialog(false);
                  setEmail("");
                }}
                className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/80  transition-all"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay with Paystack
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
