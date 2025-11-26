"use client";

import { useState, useEffect } from "react";
import { QRCodeType } from "../types/qrTypes";
import QRCodeGenerator from "../components/QRCodeGenerator";
import {
  Sparkles,
  Shield,
  Zap,
  Globe,
  CheckCircle2,
  TrendingUp,
  Users,
  Star,
  QrCode,
  Loader2,
  Link,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
  FileText,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function HomeComp() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<QRCodeType>("URL");
  const [hasPaid, setHasPaid] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setMounted(true);
    fetchStats();
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats([
          {
            icon: QrCode,
            value: data.totalQRCodesFormatted || "0+",
            label: "QR Codes Generated",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    // Check if payment was successful
    const reference = searchParams.get("reference");
    if (reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(
        `/api/paystack/verify?reference=${reference}`
      );
      const data = await response.json();

      if (data.status) {
        setHasPaid(true);
        // Store payment reference for this QR code generation
        sessionStorage.setItem("payment_reference", reference);
        sessionStorage.setItem("has_paid", "true");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
    }
  };

  useEffect(() => {
    // Check sessionStorage for unused payment
    const paid = sessionStorage.getItem("has_paid");
    const paymentRef = sessionStorage.getItem("payment_reference");
    if (paid === "true" && paymentRef) {
      setHasPaid(true);
    } else {
      setHasPaid(false);
    }
  }, []);

  const handlePaymentSuccess = () => {
    // Re-check payment status from sessionStorage after QR generation
    const paid = sessionStorage.getItem("has_paid");
    const paymentRef = sessionStorage.getItem("payment_reference");
    setHasPaid(paid === "true" && !!paymentRef);
  };

  const qrTypes = [
    {
      id: "URL" as QRCodeType,
      name: "Website URL",
      icon: Link,
      description: "Link to any website",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      borderColor: "border-blue-500",
    },
    {
      id: "TEXT" as QRCodeType,
      name: "Plain Text",
      icon: MessageSquare,
      description: "Any text message",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-500",
    },
    {
      id: "EMAIL" as QRCodeType,
      name: "Email",
      icon: Mail,
      description: "Email address",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-500",
    },
    {
      id: "PHONE" as QRCodeType,
      name: "Phone",
      icon: Phone,
      description: "Phone number",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/10 to-red-500/10",
      borderColor: "border-orange-500",
    },
    {
      id: "WIFI" as QRCodeType,
      name: "WiFi",
      icon: Sparkles,
      description: "WiFi network credentials",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-500/10 to-blue-500/10",
      borderColor: "border-indigo-500",
    },
    {
      id: "LOCATION" as QRCodeType,
      name: "Location",
      icon: Globe,
      description: "GPS coordinates",
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-500/10 to-cyan-500/10",
      borderColor: "border-teal-500",
    },
    {
      id: "VCARD" as QRCodeType,
      name: "VCard",
      icon: Users,
      description: "Contact profile card",
      gradient: "from-rose-500 to-pink-500",
      bgGradient: "from-rose-500/10 to-pink-500/10",
      isSpecial: true,
      badge: "Premium",
      borderColor: "border-rose-500",
    },
    {
      id: "PDF" as QRCodeType,
      name: "PDF Document",
      icon: FileText,
      description: "Link to PDF file",
      gradient: "from-red-500 to-orange-500",
      bgGradient: "from-red-500/10 to-orange-500/10",
      borderColor: "border-red-500",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate QR codes in seconds with our optimized engine",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: "Secure & Safe",
      description: "Your data is encrypted and processed securely",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Globe,
      title: "Multiple Formats",
      description: "Support for URLs, text, emails, and phone numbers",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: TrendingUp,
      title: "High Quality",
      description: "Crystal clear QR codes that scan perfectly every time",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const [stats, setStats] = useState([
    { icon: QrCode, value: "0+", label: "QR Codes Generated" },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                           linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                {/* <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" /> */}
                <div className="relative p-2.5 bg-primary rounded-xl">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Go QR Generator
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Professional QR Solutions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user && hasPaid && mounted && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">
                    Payment Verified
                  </span>
                </div>
              )}
              {user && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="hidden sm:flex items-center gap-2 bg-white/5 hover:text-white border-white/10 text-slate-400 hover:bg-white/10"
                >
                  <QrCode className="h-4 w-4" />
                  Dashboard
                </Button>
              )}
              {user ? (
                <UserButton />
              ) : (
                <SignInButton mode="modal">
                  <Button className="bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20">
                    Sign In
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 md:pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24 space-y-6 md:space-y-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight px-4">
            <span className="block text-white">Generate</span>
            <span className="block bg-primary bg-clip-text text-transparent">
              QR Codes Instantly
            </span>
          </h2>

          <p className="text-lg md:text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed px-4">
            Create high-quality QR codes for URLs, text, emails, phone numbers,
            WiFi networks, and locations.
            <br />
            <span className="text-slate-300 font-semibold">
              Fast, secure, and reliable.
            </span>
          </p>

          <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-full mx-4">
            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-400">
              Non-expiring QR codes - Generate once, use forever
            </span>
          </div>
        </div>

        <div className="text-center mb-12 max-w-6xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Choose QR Code Type
          </h3>
          <p className="text-slate-400 text-lg">
            Select the type of content you want to encode
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-16 md:mb-24 px-4 md:px-0 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {/* QR Type Selection */}
          <div className="col-span-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {qrTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;

                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 text-left ${
                      isSelected
                        ? `${type.borderColor} bg-gradient-to-br ${type.bgGradient} shadow-2xl shadow-primary/20 scale-[1.02]`
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:scale-[1.02] hover:border-white/20"
                    }`}
                  >
                    {isSelected && (
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${type.gradient} opacity-20 rounded-2xl blur-xl`}
                      />
                    )}

                    <div className="relative space-y-4">
                      {type.isSpecial && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full shadow-lg">
                            {type.badge}
                          </span>
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${
                          type.gradient
                        } shadow-lg ${
                          isSelected ? "scale-110" : "group-hover:scale-110"
                        } transition-transform duration-300`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg md:text-xl font-bold">
                            {type.name}
                          </h4>
                          {type.isSpecial && (
                            <Sparkles className="h-4 w-4 text-rose-400" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QR Code Generator */}
          <div id="qr-generator" className="col-span-1">
            {!isLoaded ? (
              <div className="relative group">
                {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl opacity-20 blur-2xl" /> */}
                <Card className="relative bg-white/5 backdrop-blur-xl border border-white/10 text-white">
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </CardContent>
                </Card>
              </div>
            ) : !user ? (
              <div className="relative group">
                {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl opacity-20 blur-2xl" /> */}
                <Card className="relative bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">
                      Sign In Required
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Please sign in to generate QR codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SignInButton mode="modal">
                      <Button className="w-full bg-primary hover:bg-primary/80 shadow-xl shadow-primary/30">
                        Sign In
                      </Button>
                    </SignInButton>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="relative group">
                {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" /> */}
                <div className="relative">
                  <QRCodeGenerator
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    onPaymentSuccess={handlePaymentSuccess}
                    hasPaid={hasPaid}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto mb-16 md:mb-20">
          <div className="text-center mb-10 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Why Choose Us?
            </h3>
            <p className="text-slate-400">
              Everything you need for professional QR code generation
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative p-6 md:p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div
                    className={`inline-flex p-3 bg-gradient-to-r ${feature.gradient} rounded-xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-12 border-t border-white/10">
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-500">
              © {currentYear} Go QR Generator. All rights reserved.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
