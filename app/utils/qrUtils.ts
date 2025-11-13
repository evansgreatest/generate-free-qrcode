import { QRCodeData } from "../types/qrTypes";

export function generateQRCodeData(qrCodeData: QRCodeData): string {
  switch (qrCodeData.type) {
    case "URL":
      return qrCodeData.data;
    case "TEXT":
      return qrCodeData.data;
    case "EMAIL":
      return `mailto:${qrCodeData.data}`;
    case "PHONE":
      return `tel:${qrCodeData.data}`;
    case "SMS":
      return `sms:${qrCodeData.data}`;
    case "WIFI":
      // WiFi data is already formatted in the component
      return qrCodeData.data;
    case "LOCATION":
      // Location data is already formatted in the component
      return qrCodeData.data;
    default:
      return qrCodeData.data;
  }
}
