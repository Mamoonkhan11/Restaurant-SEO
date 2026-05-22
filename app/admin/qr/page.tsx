import type { Metadata } from 'next';
import QrClient from './QrClient';

export const metadata: Metadata = {
  title: 'QR Codes',
};

export default function QrPage() {
  return <QrClient />;
}
