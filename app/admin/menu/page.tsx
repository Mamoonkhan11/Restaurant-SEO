import type { Metadata } from 'next';
import MenuClient from './MenuClient';

export const metadata: Metadata = {
  title: 'Menu Management',
};

export default function MenuPage() {
  return <MenuClient />;
}
