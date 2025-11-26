"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  CreditCard,
  Loader2,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface QRCodeItem {
  id: string;
  qr_type: string;
  qr_data: string;
  image_url: string;
  image_format: string;
  created_at: string;
}

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  paystack_reference: string;
  status: string;
  qr_code_id: string | null;
  created_at: string;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return response.json();
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("qr-codes");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SWR hooks for data fetching
  const {
    data: qrCodesData,
    error: qrCodesError,
    isLoading: qrCodesLoading,
    mutate: mutateQRCodes,
  } = useSWR<{ qrCodes: QRCodeItem[] }>(
    user && activeTab === "qr-codes" ? "/api/user/qr-codes" : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Disable auto-refresh, only refresh on focus/reconnect
    }
  );

  const {
    data: paymentsData,
    error: paymentsError,
    isLoading: paymentsLoading,
    mutate: mutatePayments,
  } = useSWR<{ payments: PaymentItem[] }>(
    user && activeTab === "payments" ? "/api/user/payments" : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0,
    }
  );

  const qrCodes = qrCodesData?.qrCodes || [];
  const payments = paymentsData?.payments || [];
  const loading = activeTab === "qr-codes" ? qrCodesLoading : paymentsLoading;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }
  }, [user, isLoaded, router]);

  // Show error toast if data fetching fails
  useEffect(() => {
    if (qrCodesError || paymentsError) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  }, [qrCodesError, paymentsError, toast]);

  const handleDownload = (imageUrl: string, qrType: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `qrcode-${qrType}-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
    toast({
      title: "Downloaded",
      description: "QR code downloaded successfully!",
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied",
      description: "Copied to clipboard!",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
      <header className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
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
            <UserButton />
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 hover:text-white text-slate-400 border border-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            {/* <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-75" /> */}
            <div className="relative p-3 bg-primary rounded-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              My Dashboard
            </h1>
            <p className="text-slate-400">Manage your QR codes and payments</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total QR Codes</span>
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{qrCodes.length}</p>
          </div>

          <div className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Payments</span>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{payments.length}</p>
          </div>

          <div className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Spent</span>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">
              GHS {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-white/5 border border-white/10">
            <TabsTrigger
              value="qr-codes"
              className="flex items-center gap-2 data-[state=active]:bg-primary"
            >
              <QrCode className="h-4 w-4" />
              QR Codes ({qrCodes.length})
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center gap-2 data-[state=active]:bg-primary"
            >
              <CreditCard className="h-4 w-4" />
              Payments ({payments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qr-codes">
            <Card className="border-0 bg-white/5 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  Your QR Codes
                </CardTitle>
                <CardDescription className="text-slate-400">
                  All QR codes you've generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : qrCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50" />
                      <div className="relative p-4 bg-white/5 rounded-full">
                        <QrCode className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <p className="text-slate-400 mb-4">
                      No QR codes generated yet
                    </p>
                    <Button
                      onClick={() => router.push("/")}
                      className="bg-primary hover:bg-primary/80 shadow-xl shadow-primary/30"
                    >
                      Generate Your First QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {qrCodes.map((qr) => (
                      <div
                        key={qr.id}
                        className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300"
                      >
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
                            <div className="relative p-1 bg-white rounded-xl">
                              <Image
                                src={qr.image_url}
                                alt={`QR Code ${qr.qr_type}`}
                                width={128}
                                height={128}
                                className="w-32 h-32"
                              />
                            </div>
                          </div>
                          <div className="w-full space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold capitalize px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary">
                                {qr.qr_type}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(qr.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDownload(qr.image_url, qr.qr_type)
                                }
                                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(qr.qr_data, qr.id)}
                                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                              >
                                {copiedId === qr.id ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-0 bg-white/5 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  Payment History
                </CardTitle>
                <CardDescription className="text-slate-400">
                  All your payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50" />
                      <div className="relative p-4 bg-white/5 rounded-full">
                        <CreditCard className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <p className="text-slate-400">No payments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="relative group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border-l-4 border-l-primary hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-primary/20 rounded-lg">
                                <CreditCard className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-semibold text-white text-lg">
                                GHS {payment.amount.toFixed(2)}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  payment.status === "success"
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : payment.status === "failed"
                                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                    : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  payment.created_at
                                ).toLocaleDateString()}
                              </div>
                              {payment.qr_code_id && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 border border-primary/30 rounded">
                                  <QrCode className="h-3 w-3 text-primary" />
                                  <span className="text-primary">Used</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-mono bg-white/5 px-2 py-1 rounded inline-block">
                                Ref: {payment.paystack_reference}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
