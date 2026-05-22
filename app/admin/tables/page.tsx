import type { Metadata } from 'next';
import TablesClient from './TablesClient';

export const metadata: Metadata = {
  title: 'Tables',
};

export default function TablesPage() {
  return <TablesClient />;
}
