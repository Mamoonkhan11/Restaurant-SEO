import type { Metadata } from 'next';
import TermsSetupClient from './TermsSetupClient';

export const metadata: Metadata = {
  title: 'Terms Setup',
};

export default function TermsSetupPage() {
  return <TermsSetupClient />;
}
