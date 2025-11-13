export type QRCodeType =
  | "URL"
  | "TEXT"
  | "EMAIL"
  | "PHONE"
  | "SMS"
  | "WIFI"
  | "LOCATION";

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
