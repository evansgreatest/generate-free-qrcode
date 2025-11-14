export type QRCodeType =
  | "URL"
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "SMS"
  | "WIFI"
  | "LOCATION"
  | "PROFILE";

export interface QRCodeData {
  type: QRCodeType;
  data: string;
}

export interface WiFiData {
  ssid: string;
  password: string;
  security: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  query?: string;
}

export interface ProfileData {
  fullName: string;
  phone: string;
  email: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  bio?: string;
  profilePicture?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  generateType?: "vcard" | "web" | "both";
}
