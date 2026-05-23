import type { Metadata } from 'next';
import AdminDashboardOverview from './DashboardPageClient';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your restaurant in real-time with RESTDIGI — view orders, analytics, and menu performance.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/restdigi-logo.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/restdigi-logo.png', sizes: '180x180', type: 'image/png' },
  },
};

export default function DashboardPage() {
  return <AdminDashboardOverview />;
}
