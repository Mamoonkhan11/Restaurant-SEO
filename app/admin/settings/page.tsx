import type { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure your restaurant profile, branding, and preferences on RESTDIGI.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
