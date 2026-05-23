import type { Metadata } from 'next';
import QrClient from './QrClient';

export const metadata: Metadata = {
  title: 'QR Codes',
  description: 'Generate and download QR codes for your restaurant tables with RESTDIGI.',
};

export default function QrPage() {
  return <QrClient />;
}
