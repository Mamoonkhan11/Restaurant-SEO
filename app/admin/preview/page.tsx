import type { Metadata } from 'next';
import PreviewClient from './PreviewClient';

export const metadata: Metadata = {
  title: 'Preview Menu',
};

export default function PreviewPage() {
  return <PreviewClient />;
}
