"use server";

import { QRCodeData } from "../types/qrTypes";
import { generateQRCodeData } from "../utils/qrUtils";

export async function generateQRCodeAction(qrCodeData: QRCodeData) {
  try {
    const qrData = generateQRCodeData(qrCodeData);
    return { success: true, data: qrData };
  } catch (error) {
    return { success: false, error: "Failed to generate QR code data" };
  }
}

