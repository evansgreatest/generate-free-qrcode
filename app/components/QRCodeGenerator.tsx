import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QRCodeData, QRCodeType } from "../types/qrTypes";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateQRCodeData } from "../ utils/qrUtils";

interface QRCodeGeneratorProps {
  selectedType: QRCodeType;
  setSelectedType: (type: QRCodeType) => void;
}

export default function QRCodeGenerator({
  selectedType,
  setSelectedType,
}: QRCodeGeneratorProps) {
  const [qrCodeData, setQRCodeData] = useState<QRCodeData>({
    type: "URL",
    data: "",
  });
  const [qrCode, setQrCode] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCode && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCode, { width: 256 }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [qrCode]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const generatedData = generateQRCodeData(qrCodeData);
    setQrCode(generatedData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setQRCodeData({ ...qrCodeData, data: e.target.value });
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as QRCodeType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select QR Code Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="URL">URL</SelectItem>
              <SelectItem value="TEXT">Text</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="PHONE">Phone</SelectItem>
              {/* <SelectItem value="SMS">SMS</SelectItem> */}
            </SelectContent>
          </Select>

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedType === "URL" && (
              <Input
                type="url"
                placeholder="Enter URL"
                value={qrCodeData.data}
                onChange={handleInputChange}
                required
              />
            )}
            {selectedType === "TEXT" && (
              <Textarea
                placeholder="Enter Text"
                value={qrCodeData.data}
                onChange={handleInputChange}
                required
              />
            )}
            {selectedType === "EMAIL" && (
              <Input
                type="email"
                placeholder="Enter Email"
                value={qrCodeData.data}
                onChange={handleInputChange}
                required
              />
            )}
            {selectedType === "PHONE" && (
              <Input
                type="tel"
                placeholder="Enter Phone Number"
                value={qrCodeData.data}
                onChange={handleInputChange}
                required
              />
            )}
            {/* {selectedType === "SMS" && (
              <Input
                type="tel"
                placeholder="Enter Phone Number for SMS"
                value={qrCodeData.data}
                onChange={handleInputChange}
                required
              />
            )} */}
            <Button type="submit" className="w-full">
              Generate QR Code
            </Button>
          </form>
          {qrCode && (
            <div className="mt-6 flex flex-col items-center">
              <canvas ref={canvasRef} />
              <Button onClick={handleDownload} className="mt-4">
                Download QR Code
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
