"use client";

import { useState } from "react";
import { QRCodeType } from "../types/qrTypes";
import QRCodeGenerator from "../components/QRCodeGenerator";

export default function HomeComp() {
  const [selectedType, setSelectedType] = useState<QRCodeType>("URL");

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col items-center justify-center sm:py-12">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-primary mb-8">
          QR Code Generator
        </h1>
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6">
            <QRCodeGenerator
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
