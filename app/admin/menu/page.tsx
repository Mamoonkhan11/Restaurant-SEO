import type { Metadata } from 'next';
import MenuClient from './MenuClient';

export const metadata: Metadata = {
  title: 'Menu Management',
  description: 'Manage your restaurant dishes, categories, and menu layout with RESTDIGI.',
};

export default function MenuPage() {
  return <MenuClient />;
}
