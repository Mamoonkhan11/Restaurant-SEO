import type { Metadata } from 'next';
import TablesClient from './TablesClient';

export const metadata: Metadata = {
  title: 'Tables',
  description: 'Manage restaurant table layout and seating with RESTDIGI.',
};

export default function TablesPage() {
  return <TablesClient />;
}
