"use client";

import React from "react";
import { QRCodeType, QRCodeData, WiFiData, VCardData } from "../types/qrTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import VCardStepper from "./VCardStepper";
import { User, Briefcase, Sparkles, Settings, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationDataForm {
  latitude: string;
  longitude: string;
  query: string;
}

interface WiFiDataForm {
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

interface QRFormInputsProps {
  selectedType: QRCodeType;
  qrCodeData: QRCodeData;
  wifiData: WiFiDataForm;
  locationData: LocationDataForm;
  profileData: VCardData;
  profileStep: number;
  onQRCodeDataChange: (data: QRCodeData) => void;
  onWifiDataChange: (data: WiFiDataForm) => void;
  onLocationDataChange: (data: LocationDataForm) => void;
  onProfileDataChange: (data: VCardData) => void;
  onProfileStepChange: (step: number) => void;
}

const steps = [
  {
    number: 1,
    label: "Basic Info",
    icon: User,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    number: 2,
    label: "Professional",
    icon: Briefcase,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    number: 3,
    label: "Social Media",
    icon: Sparkles,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    number: 4,
    label: "Settings",
    icon: Settings,
    gradient: "from-orange-500 to-red-500",
  },
];

export default function QRFormInputs({
  selectedType,
  qrCodeData,
  wifiData,
  locationData,
  profileData,
  profileStep,
  onQRCodeDataChange,
  onWifiDataChange,
  onLocationDataChange,
  onProfileDataChange,
  onProfileStepChange,
}: QRFormInputsProps) {
  const { toast } = useToast();
  const [isUploadingPDF, setIsUploadingPDF] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onQRCodeDataChange({ ...qrCodeData, data: e.target.value });
  };

  const handleNextStep = (nextStep: number) => {
    if (profileStep === 1) {
      if (!profileData.fullName || !profileData.phone || !profileData.email) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Full Name, Phone, Email)",
          variant: "destructive",
        });
        return;
      }
    }
    onProfileStepChange(nextStep);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        {selectedType === "URL" && "Website URL"}
        {selectedType === "TEXT" && "Text Content"}
        {selectedType === "EMAIL" && "Email Address"}
        {selectedType === "PHONE" && "Phone Number"}
        {selectedType === "WIFI" && "WiFi Network"}
        {selectedType === "LOCATION" && "GPS Location"}
        {selectedType === "VCARD" && "Contact Profile"}
        {selectedType === "PDF" && "Upload PDF Document"}
      </label>

      {/* URL Input */}
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

      {/* TEXT Input */}
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

      {/* EMAIL Input */}
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

      {/* PHONE Input */}
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

      {/* PDF Upload */}
      {selectedType === "PDF" && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label
              htmlFor="pdf-upload"
              className="flex-1 cursor-pointer"
            >
              <div className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg bg-white/5 transition-colors ${
                isUploadingPDF ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'
              }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingPDF ? (
                    <Loader2 className="w-10 h-10 mb-3 text-slate-400 animate-spin" />
                  ) : (
                    <svg
                      className="w-10 h-10 mb-3 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  )}
                  <p className="mb-2 text-sm text-slate-400">
                    {isUploadingPDF ? (
                      <span className="font-semibold">Uploading...</span>
                    ) : (
                      <>
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">PDF (MAX. 10MB)</p>
                </div>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Validate file type
                    if (file.type !== 'application/pdf') {
                      toast({
                        title: "Invalid File Type",
                        description: "Please upload a PDF file",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Validate file size (10MB)
                    if (file.size > 10 * 1024 * 1024) {
                      toast({
                        title: "File Too Large",
                        description: "PDF file must be less than 10MB",
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsUploadingPDF(true);

                    // Upload file
                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                      const response = await fetch('/api/pdf/upload', {
                        method: 'POST',
                        body: formData,
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        toast({
                          title: "Upload Failed",
                          description: data.error || "Failed to upload PDF",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Set the PDF URL in qrCodeData
                      onQRCodeDataChange({ ...qrCodeData, data: data.url });
                      toast({
                        title: "Upload Successful",
                        description: "PDF uploaded successfully",
                      });
                    } catch (error) {
                      toast({
                        title: "Upload Error",
                        description: "An error occurred while uploading the PDF",
                        variant: "destructive",
                      });
                    } finally {
                      setIsUploadingPDF(false);
                    }
                  }}
                  disabled={isUploadingPDF}
                />
              </div>
            </label>
          </div>
          {qrCodeData.data && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-green-400 font-medium">
                PDF uploaded successfully
              </span>
              <button
                type="button"
                onClick={() => onQRCodeDataChange({ ...qrCodeData, data: "" })}
                className="ml-auto text-xs text-slate-400 hover:text-white transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* WIFI Input */}
      {selectedType === "WIFI" && (
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Network Name (SSID)"
            value={wifiData.ssid}
            onChange={(e) => onWifiDataChange({ ...wifiData, ssid: e.target.value })}
            required
            className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
          />
          <Input
            type="password"
            placeholder={wifiData.security === "nopass" ? "No password needed" : "Password"}
            value={wifiData.password}
            onChange={(e) => onWifiDataChange({ ...wifiData, password: e.target.value })}
            disabled={wifiData.security === "nopass"}
            className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-400">Security:</Label>
              <Select
                value={wifiData.security}
                onValueChange={(value) => {
                  const newSecurity = value as "WPA" | "WEP" | "nopass";
                  onWifiDataChange({
                    ...wifiData,
                    security: newSecurity,
                    password: newSecurity === "nopass" ? "" : wifiData.password,
                  });
                }}
              >
                <SelectTrigger className="w-full h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500">
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
                onChange={(e) => onWifiDataChange({ ...wifiData, hidden: e.target.checked })}
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary focus:ring-primary"
              />
              <label htmlFor="hidden" className="text-xs text-slate-400">
                Hidden Network
              </label>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION Input */}
      {selectedType === "LOCATION" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              step="any"
              placeholder="Latitude"
              value={locationData.latitude}
              onChange={(e) =>
                onLocationDataChange({
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
                onLocationDataChange({
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
              onLocationDataChange({
                ...locationData,
                query: e.target.value,
              })
            }
            className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
          />
        </div>
      )}

      {/* VCARD Form */}
      {selectedType === "VCARD" && (
        <div className="space-y-6">
          <VCardStepper currentStep={profileStep} totalSteps={steps.length} />
          
          {/* Step 1: Basic Information */}
          {profileStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Full Name *</Label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={profileData.fullName}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, fullName: e.target.value })
                    }
                    required
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={profileData.phone}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, phone: e.target.value })
                    }
                    required
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={profileData.email}
                  onChange={(e) =>
                    onProfileDataChange({ ...profileData, email: e.target.value })
                  }
                  required
                  className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleNextStep(2)}
                  className="px-6 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white font-semibold transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Professional Information */}
          {profileStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Company</Label>
                  <Input
                    type="text"
                    placeholder="Company Name"
                    value={profileData.company || ""}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, company: e.target.value })
                    }
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Job Title</Label>
                  <Input
                    type="text"
                    placeholder="Job Title"
                    value={profileData.jobTitle || ""}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, jobTitle: e.target.value })
                    }
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Website</Label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={profileData.website || ""}
                  onChange={(e) =>
                    onProfileDataChange({ ...profileData, website: e.target.value })
                  }
                  className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Profile Picture URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={profileData.profilePicture || ""}
                  onChange={(e) =>
                    onProfileDataChange({ ...profileData, profilePicture: e.target.value })
                  }
                  className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Bio/About</Label>
                <Textarea
                  placeholder="Tell us about yourself..."
                  value={profileData.bio || ""}
                  onChange={(e) =>
                    onProfileDataChange({ ...profileData, bio: e.target.value })
                  }
                  rows={4}
                  className="resize-none bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                />
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => onProfileStepChange(1)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-semibold transition-colors"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => onProfileStepChange(3)}
                  className="px-6 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white font-semibold transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Social Media */}
          {profileStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">LinkedIn</Label>
                  <Input
                    type="text"
                    placeholder="linkedin.com/in/username"
                    value={profileData.linkedin || ""}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, linkedin: e.target.value })
                    }
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Twitter</Label>
                  <Input
                    type="text"
                    placeholder="@username"
                    value={profileData.twitter || ""}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, twitter: e.target.value })
                    }
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Instagram</Label>
                  <Input
                    type="text"
                    placeholder="@username"
                    value={profileData.instagram || ""}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, instagram: e.target.value })
                    }
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Facebook</Label>
                  <Input
                    type="text"
                    placeholder="facebook.com/username"
                    value={profileData.facebook || ""}
                    onChange={(e) =>
                      onProfileDataChange({ ...profileData, facebook: e.target.value })
                    }
                    className="h-12 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => onProfileStepChange(2)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-semibold transition-colors"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  onClick={() => onProfileStepChange(4)}
                  className="px-6 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white font-semibold transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {profileStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">QR Code Type</Label>
                <Select
                  value={profileData.generateType || "both"}
                  onValueChange={(value) =>
                    onProfileDataChange({
                      ...profileData,
                      generateType: value as "vcard" | "web" | "both",
                    })
                  }
                >
                  <SelectTrigger className="h-12 bg-white/5 border border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="both">Both (vCard + Web Profile)</SelectItem>
                    <SelectItem value="vcard">vCard Only (Contact Import)</SelectItem>
                    <SelectItem value="web">Web Profile Only</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-2">
                  Choose how your profile QR code will work. "Both" creates a web profile page with vCard download option.
                </p>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => onProfileStepChange(3)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-semibold transition-colors"
                >
                  ← Previous
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

