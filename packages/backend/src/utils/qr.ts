import QRCode from 'qrcode';

export async function generateQR(data: string): Promise<string> {
  return QRCode.toDataURL(data);
}

export async function generateQRBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data);
}
