import type { Metadata } from 'next';
import PreviewClient from './PreviewClient';

export const metadata: Metadata = {
  title: 'Preview Menu',
  description: 'Preview your digital menu as customers see it – powered by RESTDIGI.',
};

export default function PreviewPage() {
  return <PreviewClient />;
}
