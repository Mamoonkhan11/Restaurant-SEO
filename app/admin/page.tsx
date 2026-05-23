import type { Metadata } from 'next';
import AdminDashboardOverview from './DashboardPageClient';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your restaurant in real-time with RESTDIGI — view orders, analytics, and menu performance.',
};

export default function DashboardPage() {
  return <AdminDashboardOverview />;
}
