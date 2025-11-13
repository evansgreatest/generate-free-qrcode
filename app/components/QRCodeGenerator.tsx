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
  const [wifiData, setWifiData] = useState({
    ssid: "",
    password: "",
    security: "WPA" as "WPA" | "WEP" | "nopass",
    hidden: false,
  });

  // Location-specific state
  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: "",
    query: "",
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
      } else {
        dataToGenerate = storedData.qrCodeData;
      }

      const generatedData = generateQRCodeData(dataToGenerate);
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

      setQrCode(generatedData);

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
      } else {
        dataToGenerate = qrCodeData;
      }

      const generatedData = generateQRCodeData(dataToGenerate);
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

      setQrCode(generatedData);

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
          "QR code generated and saved successfully! Payment consumed.",
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
          amount: PRICE_PER_QR,
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
      <Card className="w-full border-0 shadow-2xl bg-white/5 backdrop-blur-xl text-white border border-white/10">
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
                Create professional QR codes instantly
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
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                {selectedType === "URL" && "Website URL"}
                {selectedType === "TEXT" && "Text Content"}
                {selectedType === "EMAIL" && "Email Address"}
                {selectedType === "PHONE" && "Phone Number"}
                {selectedType === "WIFI" && "WiFi Network"}
                {selectedType === "LOCATION" && "GPS Location"}
              </label>
              {selectedType === "URL" && (
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={qrCodeData.data}
                  onChange={handleInputChange}
                  required
                  className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              )}
              {selectedType === "TEXT" && (
                <Textarea
                  placeholder="Enter your text here..."
                  value={qrCodeData.data}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="resize-none bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              )}
              {selectedType === "EMAIL" && (
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={qrCodeData.data}
                  onChange={handleInputChange}
                  required
                  className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              )}
              {selectedType === "PHONE" && (
                <Input
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  value={qrCodeData.data}
                  onChange={handleInputChange}
                  required
                  className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              )}
              {selectedType === "WIFI" && (
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Network Name (SSID)"
                    value={wifiData.ssid}
                    onChange={(e) =>
                      setWifiData({ ...wifiData, ssid: e.target.value })
                    }
                    required
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                  <Input
                    type="password"
                    placeholder={
                      wifiData.security === "nopass"
                        ? "No password needed"
                        : "Password"
                    }
                    value={wifiData.password}
                    onChange={(e) =>
                      setWifiData({ ...wifiData, password: e.target.value })
                    }
                    disabled={wifiData.security === "nopass"}
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-slate-400">
                        Security:
                      </Label>
                      <Select
                        value={wifiData.security}
                        onValueChange={(value) => {
                          const newSecurity = value as "WPA" | "WEP" | "nopass";
                          setWifiData({
                            ...wifiData,
                            security: newSecurity,
                            password:
                              newSecurity === "nopass" ? "" : wifiData.password,
                          });
                        }}
                      >
                        <SelectTrigger className="w-full h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 ">
                          <SelectValue placeholder="Select Security" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-white/10">
                          <SelectItem value="WPA">WPA/WPA2</SelectItem>
                          <SelectItem value="WEP">WEP</SelectItem>
                          <SelectItem value="nopass">No Password</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hidden"
                        checked={wifiData.hidden}
                        onChange={(e) =>
                          setWifiData({ ...wifiData, hidden: e.target.checked })
                        }
                        className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="hidden"
                        className="text-xs text-slate-400"
                      >
                        Hidden Network
                      </label>
                    </div>
                  </div>
                </div>
              )}
              {selectedType === "LOCATION" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={locationData.latitude}
                      onChange={(e) =>
                        setLocationData({
                          ...locationData,
                          latitude: e.target.value,
                        })
                      }
                      required
                      className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={locationData.longitude}
                      onChange={(e) =>
                        setLocationData({
                          ...locationData,
                          longitude: e.target.value,
                        })
                      }
                      required
                      className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Location Name (Optional)"
                    value={locationData.query}
                    onChange={(e) =>
                      setLocationData({
                        ...locationData,
                        query: e.target.value,
                      })
                    }
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
              )}
            </div>

            {!hasPaid && (
              <div className="relative group">
                {/* <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl blur-md" /> */}
                <div className="relative p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <CreditCard className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-orange-300">
                        Payment Required
                      </p>
                      <p className="text-xs text-orange-400/80">
                        GHS {PRICE_PER_QR} per QR code generation
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur-md opacity-75" />
                <div className="relative p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl">Payment Required</DialogTitle>
            </div>
            <DialogDescription className="text-base text-slate-400">
              To generate a QR code, please complete the payment of{" "}
              <span className="font-bold text-blue-400">
                GHS {PRICE_PER_QR}
              </span>
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
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl shadow-blue-500/30"
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
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-md opacity-75" />
                <div className="relative p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
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
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl shadow-purple-500/30"
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
