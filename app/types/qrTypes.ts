export type QRCodeType = "URL" | "TEXT" | "EMAIL" | "PHONE" | "SMS";

export interface QRCodeData {
  type: QRCodeType;
  data: string;
}
