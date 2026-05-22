"use client";
import React, { useState } from 'react';
import { uploadDishImage, removeDishImage, updateDishImageInDb } from '@/lib/supabase';

type PreviewDish = {
  id: number;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  image: string;
  sizes?: Record<string, number>;
};

const initialDishes: PreviewDish[] = [
  { id: 1, name: 'Truffle Parmesan Fries', category: 'Fast Food', price: 8.99, isAvailable: true, image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Fries' },
  { id: 2, name: 'Wagyu Beef Burger', category: 'Fast Food', price: 18.50, isAvailable: true, image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Burger' },
  { id: 3, name: 'Spicy Chicken Wrap', category: 'Fast Food', price: 12.50, isAvailable: false, image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Chicken+Wrap' },
  { id: 4, name: 'Mango Passionfruit Smoothie', category: 'Drinks', price: 6.50, isAvailable: true, image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Smoothie' },
  { id: 5, name: 'Artisan Iced Coffee', category: 'Drinks', price: 4.99, isAvailable: true, image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Iced+Coffee' },
  { id: 6, name: 'Molten Chocolate Lava Cake', category: 'Sweets', price: 9.50, isAvailable: true, image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Lava+Cake' },
  { id: 7, name: 'New York Cheesecake', category: 'Sweets', price: 8.00, isAvailable: false, image: 'https://placehold.co/600x400/f8fafc/94a3b8?text=Cheesecake' },
];

export default function AdminPreview() {
  const [dishes, setDishes] = useState(initialDishes);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const toggleAvailability = (id: number) => {
    setDishes(prev => prev.map(dish => 
      dish.id === id ? { ...dish, isAvailable: !dish.isAvailable } : dish
    ));
  };

  const editPrice = (id: number) => {
    const dish = dishes.find(d => d.id === id);
    if (!dish) return;
    
    const newPrice = prompt(`Enter new price for ${dish.name}:`, dish.price.toString());
    if (newPrice && !isNaN(parseFloat(newPrice))) {
      setDishes(prev => prev.map(d => 
        d.id === id ? { ...d, price: parseFloat(newPrice) } : d
      ));
    }
  };

  const handleImageUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(id);
    setUploadProgress(10); // Start progress bar

    // Fake progress interval while waiting for the real upload
    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 300);

    try {
      const dish = dishes.find(d => d.id === id);
      const oldImage = dish?.image;

      // 1. Remove old image if it is a Supabase storage URL to save space
      if (oldImage && oldImage.includes('supabase.co')) {
        await removeDishImage(oldImage, 'dishes');
      }

      // 2. Execute real upload to Supabase storage
      const publicUrl = await uploadDishImage(file, 'dishes');
      
      // 3. Update the database record
      try {
        await updateDishImageInDb(id, publicUrl);
      } catch (dbErr) {
        console.warn('Skipped DB update (likely using mock numeric IDs):', dbErr);
      }

      // 4. Update UI to immediately show only the new image
      setDishes(prev => prev.map(d => 
        d.id === id ? { ...d, image: publicUrl } : d
      ));
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please ensure your Supabase details are correct and the "dishes" storage bucket exists and is public.');
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setUploadingId(null);
        setUploadProgress(0);
      }, 1000); // Hide progress bar after 1s delay
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-tight">Restaurant OS</h2>
          <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 bg-gray-800 px-4 py-3 rounded-lg text-white font-medium transition-colors">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            Menu Items
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-400 hover:bg-gray-800 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Orders
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-400 hover:bg-gray-800 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
          </a>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 py-2.5 rounded-lg transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex justify-between items-center md:hidden">
          <h2 className="text-xl font-bold text-gray-900">Restaurant OS</h2>
          <button className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Menu Management</h1>
              <p className="mt-1 text-gray-500 text-sm sm:text-base">Update pricing and availability in real-time.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add New Dish
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="p-4">Dish</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                          {uploadingId === dish.id && uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="absolute inset-0 z-10 bg-black/50 flex flex-col justify-end">
                              <div className="h-1.5 bg-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.8)]" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          )}
                          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-gray-900">{dish.name}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {dish.category}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        ₹{dish.sizes && typeof dish.sizes === 'object' && Object.keys(dish.sizes).length > 0 ? Number(Object.values(dish.sizes)[0] ?? 0).toFixed(2) : Number(dish.price ?? 0).toFixed(2)}
                      </td>
                      <td className="p-4">
                        {dish.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Sold Out
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-3 whitespace-nowrap relative">
                        <label className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer inline-block">
                          {uploadingId === dish.id ? 'Uploading...' : 'Upload Photo'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(dish.id, e)} 
                            disabled={uploadingId === dish.id}
                          />
                        </label>
                        <button 
                          onClick={() => editPrice(dish.id)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Edit Price
                        </button>
                        <button 
                          onClick={() => toggleAvailability(dish.id)}
                          className={`text-sm font-semibold transition-colors ${dish.isAvailable ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {dish.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination / Footer Placeholder */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
              <span>Showing 1 to {dishes.length} of {dishes.length} items</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
