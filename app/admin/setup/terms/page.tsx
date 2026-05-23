import type { Metadata } from 'next';
import TermsSetupClient from './TermsSetupClient';

export const metadata: Metadata = {
  title: 'Terms & Setup',
  description: 'Accept terms and complete your restaurant setup on RESTDIGI.',
};

export default function TermsSetupPage() {
  return <TermsSetupClient />;
}
