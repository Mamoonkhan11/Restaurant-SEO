import type { Metadata } from 'next';
import BillingClient from './BillingClient';

export const metadata: Metadata = {
  title: 'Billing & Plans',
  description: 'Manage your RESTDIGI subscription, upgrade plans, and view billing history.',
};

export default function BillingPage() {
  return <BillingClient />;
}
