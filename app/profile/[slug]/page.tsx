"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Download,
  Loader2,
  ArrowLeft,
  QrCode,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { generateVCard } from "@/app/utils/vcardUtils";
import { VCardData } from "@/app/types/qrTypes";

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  company: string | null;
  job_title: string | null;
  website: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  facebook: string | null;
  created_at: string;
}

// Fetcher function for SWR
const fetcher = async (slug: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("profile_slug", slug)
    .single();

  if (error) {
    console.error("Profile fetch error:", error);
    throw new Error("Profile not found");
  }

  if (!data) {
    throw new Error("Profile not found");
  }

  return data;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // SWR hook for data fetching
  const {
    data: profile,
    error,
    isLoading,
  } = useSWR<Profile>(slug ? slug : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Disable auto-refresh
    onError: (err) => {
      console.error("SWR error:", err);
    },
  });

  const loading = isLoading;

  const handleDownloadVCard = () => {
    if (!profile) return;

    const profileData: VCardData = {
      fullName: profile.full_name,
      phone: profile.phone,
      email: profile.email,
      company: profile.company || undefined,
      jobTitle: profile.job_title || undefined,
      website: profile.website || undefined,
      bio: profile.bio || undefined,
      profilePicture: profile.profile_picture_url || undefined,
      linkedin: profile.linkedin || undefined,
      twitter: profile.twitter || undefined,
      instagram: profile.instagram || undefined,
      facebook: profile.facebook || undefined,
    };

    const vCard = generateVCard(profileData);
    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.full_name.replace(/\s+/g, "-")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" /> */}
          <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="relative group">
          {/* <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl opacity-20 blur-2xl" /> */}
          <Card className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-2xl">Profile Not Found</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-6">
                {error || "The profile you're looking for doesn't exist."}
              </p>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
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
      {/* <header className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <QrCode className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-slate-300">
                Digital Profile
              </span>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-3xl opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" /> */}
            <Card className="relative border-0 bg-white/5 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-8 md:p-12">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center mb-8 space-y-6">
                  {profile.profile_picture_url ? (
                    <div className="relative group/avatar">
                      {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 group-hover/avatar:opacity-80 transition-opacity" /> */}
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                        <Image
                          src={profile.profile_picture_url}
                          alt={profile.full_name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative group/avatar">
                      {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 group-hover/avatar:opacity-80 transition-opacity" /> */}
                      <div className="relative w-32 h-32 rounded-full bg-primary flex items-center justify-center border-4 border-white/20 shadow-2xl">
                        <User className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                      {profile.full_name}
                    </h1>
                    {profile.job_title && (
                      <div className="flex items-center justify-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-400" />
                        <p className="text-lg text-slate-300 font-medium">
                          {profile.job_title}
                        </p>
                      </div>
                    )}
                    {profile.company && (
                      <div className="flex items-center justify-center gap-2">
                        <Building className="h-4 w-4 text-purple-400" />
                        <p className="text-sm text-slate-400">
                          {profile.company}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="relative group/bio mb-8">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover/bio:opacity-100 transition-opacity" />
                    <div className="relative p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 justify-center">
                        <p className="text-slate-300 leading-relaxed text-center">
                          {profile.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-4 mb-8">
                  <h2 className="text-2xl text-white font-bold mb-4 flex items-center gap-2">
                    <Mail className="h-6 w-6 text-blue-400" />
                    Contact Information
                  </h2>

                  <div className="space-y-3">
                    {profile.email && (
                      <a
                        href={`mailto:${profile.email}`}
                        className="group/item flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all"
                      >
                        <div className="p-3 bg-blue-500/20 rounded-xl group-hover/item:bg-blue-500/30 transition-colors">
                          <Mail className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-0.5">Email</p>
                          <p className="text-white font-medium">
                            {profile.email}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-500 group-hover/item:text-blue-400 transition-colors" />
                      </a>
                    )}

                    {profile.phone && (
                      <a
                        href={`tel:${profile.phone}`}
                        className="group/item flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all"
                      >
                        <div className="p-3 bg-green-500/20 rounded-xl group-hover/item:bg-green-500/30 transition-colors">
                          <Phone className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                          <p className="text-white font-medium">
                            {profile.phone}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-500 group-hover/item:text-green-400 transition-colors" />
                      </a>
                    )}

                    {profile.website && (
                      <a
                        href={
                          profile.website.startsWith("http")
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/item flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all"
                      >
                        <div className="p-3 bg-purple-500/20 rounded-xl group-hover/item:bg-purple-500/30 transition-colors">
                          <Globe className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-0.5">
                            Website
                          </p>
                          <p className="text-white font-medium truncate">
                            {profile.website}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-500 group-hover/item:text-purple-400 transition-colors" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Social Media */}
                {(profile.linkedin ||
                  profile.twitter ||
                  profile.instagram ||
                  profile.facebook) && (
                  <div className="mb-8">
                    <h2 className="text-2xl text-white font-bold mb-4 flex items-center gap-2">
                      Social Media
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {profile.linkedin && (
                        <a
                          href={
                            profile.linkedin.startsWith("http")
                              ? profile.linkedin
                              : profile.linkedin.startsWith("@")
                              ? `https://linkedin.com/in/${profile.linkedin.slice(
                                  1
                                )}`
                              : `https://linkedin.com/in/${profile.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/social flex flex-col items-center gap-3 p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 hover:scale-105 transition-all"
                        >
                          <div className="p-3 bg-blue-500/20 rounded-xl group-hover/social:bg-blue-500/30 transition-colors">
                            <Linkedin className="h-6 w-6 text-blue-400" />
                          </div>
                        </a>
                      )}

                      {profile.twitter && (
                        <a
                          href={
                            profile.twitter.startsWith("http")
                              ? profile.twitter
                              : profile.twitter.startsWith("@")
                              ? `https://twitter.com/${profile.twitter.slice(
                                  1
                                )}`
                              : `https://twitter.com/${profile.twitter}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/social flex flex-col items-center gap-3 p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 hover:scale-105 transition-all"
                        >
                          <div className="p-3 bg-cyan-500/20 rounded-xl group-hover/social:bg-cyan-500/30 transition-colors">
                            <Twitter className="h-6 w-6 text-cyan-400" />
                          </div>
                        </a>
                      )}

                      {profile.instagram && (
                        <a
                          href={
                            profile.instagram.startsWith("http")
                              ? profile.instagram
                              : profile.instagram.startsWith("@")
                              ? `https://instagram.com/${profile.instagram.slice(
                                  1
                                )}`
                              : `https://instagram.com/${profile.instagram}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/social flex flex-col items-center gap-3 p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-pink-500/30 hover:scale-105 transition-all"
                        >
                          <div className="p-3 bg-pink-500/20 rounded-xl group-hover/social:bg-pink-500/30 transition-colors">
                            <Instagram className="h-6 w-6 text-pink-400" />
                          </div>
                        </a>
                      )}

                      {profile.facebook && (
                        <a
                          href={
                            profile.facebook.startsWith("http")
                              ? profile.facebook
                              : `https://facebook.com/${profile.facebook}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/social flex flex-col items-center gap-3 p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-blue-600/30 hover:scale-105 transition-all"
                        >
                          <div className="p-3 bg-blue-600/20 rounded-xl group-hover/social:bg-blue-600/30 transition-colors">
                            <Facebook className="h-6 w-6 text-blue-500" />
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Download vCard Button */}
                <div className="relative pt-8 border-t border-white/10">
                  {/* <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl" /> */}
                  <Button
                    onClick={handleDownloadVCard}
                    className="relative w-full h-14 text-base font-semibold bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20 text-white"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Save Contact (vCard)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
