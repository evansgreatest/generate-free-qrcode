"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
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
import {
  DollarSign,
  TrendingUp,
  Users,
  QrCode,
  Loader2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Activity,
  Home,
  LayoutDashboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SalesData {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    created_at: string;
    user_id: string;
    status: string;
  }>;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageTransaction: number;
    stats: {
      total: number;
      success: number;
      failed: number;
      pending: number;
    };
  };
}

interface StatsData {
  totalQRCodes: number;
  totalUsers: number;
  totalRevenue: number;
  dailyRevenue: Record<string, number>;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (response.status === 403) {
    const error = new Error("Access Denied");
    (error as any).status = 403;
    throw error;
  }

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }

  return response.json();
};

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });

  // Initialize date range in useEffect to avoid Date.now() during prerender (Next.js 16)
  useEffect(() => {
    setDateRange({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
  }, []);

  // Build sales API URL with date range (only when dates are initialized)
  const salesUrl =
    user && dateRange.startDate && dateRange.endDate
      ? `/api/admin/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&limit=50`
      : null;

  // SWR hooks for data fetching
  const {
    data: salesData,
    error: salesError,
    isLoading: salesLoading,
    mutate: mutateSales,
  } = useSWR<SalesData>(salesUrl, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    onError: (error: any) => {
      if (error.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        router.push("/");
      } else {
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive",
        });
      }
    },
  });

  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR<StatsData>(user ? "/api/admin/stats" : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    onError: (error) => {
      console.error("Error fetching stats:", error);
    },
  });

  const loading = salesLoading || statsLoading;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl opacity-20 blur-2xl" />
          <Card className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl">
                  Admin Access Required
                </CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Please sign in to access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton mode="modal">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl shadow-blue-500/30">
                  Sign In
                </Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
                {/*   <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" /> */}
                <div className="relative p-2.5 bg-primary rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-400">Sales & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="hidden sm:flex items-center gap-2 bg-white/5 hover:text-white border-white/10 text-slate-400 hover:bg-white/10"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="hidden sm:flex items-center gap-2 bg-white/5 hover:text-white border-white/10 text-slate-400 hover:bg-white/10"
              >
                <LayoutDashboard className="h-4 w-4" />
                My Dashboard
              </Button>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="relative group mb-8">
          {/* <div className="absolute -inset-1 bg-primary rounded-2xl opacity-20 blur-xl" /> */}
          <Card className="relative border-0 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-white">Date Range Filter</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, startDate: e.target.value });
                      // Trigger revalidation when date range changes
                      mutateSales();
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:bg-white/10 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, endDate: e.target.value });
                      // Trigger revalidation when date range changes
                      mutateSales();
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:bg-white/10 focus:outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        {statsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold">
                  GHS {statsData.totalRevenue.toFixed(2)}
                </h3>
                <p className="text-xs text-slate-500 mt-2">All time earnings</p>
              </div>
            </div>

            <div className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Users</p>
                <h3 className="text-3xl font-bold">{statsData.totalUsers}</h3>
                <p className="text-xs text-slate-500 mt-2">Active customers</p>
              </div>
            </div>

            <div className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary rounded-xl shadow-lg">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">QR Codes</p>
                <h3 className="text-3xl font-bold">{statsData.totalQRCodes}</h3>
                <p className="text-xs text-slate-500 mt-2">Total generated</p>
              </div>
            </div>

            {salesData && (
              <div className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Transactions</p>
                  <h3 className="text-3xl font-bold">
                    {salesData.summary.totalTransactions}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Avg: GHS {salesData.summary.averageTransaction.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sales Table */}
        {loading ? (
          <div className="relative group">
            {/* <div className="absolute -inset-1 bg-primary rounded-2xl opacity-20 blur-xl" /> */}
            <Card className="relative border-0 bg-white/5 backdrop-blur-xl">
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          </div>
        ) : salesData ? (
          <div className="relative group">
            {/* <div className="absolute -inset-1 bg-primary rounded-2xl opacity-20 blur-xl" /> */}
            <Card className="relative border-0 bg-white/5 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  Recent Sales
                </CardTitle>
                <CardDescription className="text-slate-400">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-semibold">
                    {salesData.summary.stats.success} successful
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-white text-xs font-semibold ml-2">
                    {salesData.summary.stats.failed} failed
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-white text-xs font-semibold ml-2">
                    {salesData.summary.stats.pending} pending
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm font-semibold text-slate-300">
                          Date
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-300">
                          User ID
                        </th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-300">
                          Amount
                        </th>
                        <th className="text-center p-4 text-sm font-semibold text-slate-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-white/5 hover:bg-primary/10 transition-colors"
                        >
                          <td className="p-4 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              {new Date(
                                payment.created_at
                              ).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4 text-sm font-mono text-xs text-slate-400">
                            <div className="px-2 py-1 bg-white/5 rounded inline-block">
                              {payment.user_id.slice(0, 8)}...
                            </div>
                          </td>
                          <td className="p-4 text-right font-semibold text-white">
                            GHS {payment.amount.toFixed(2)}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                payment.status === "success"
                                  ? "bg-primary/20 text-primary border border-primary/30"
                                  : payment.status === "failed"
                                  ? "bg-primary/20 text-primary border border-primary/30"
                                  : "bg-primary/20 text-primary border border-primary/30"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}
