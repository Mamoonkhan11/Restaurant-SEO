import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function AdminPage() {
  return <DashboardClient />;
}
