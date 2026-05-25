"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import DishForm from './DishForm';
import { getDishesForAdmin, getDishesByRestaurantSlug, updateDishAvailability, deleteDishFromDb, removeDishImage, upsertDish, logAdminAction, broadcastMenuUpdate, Dish } from '@/lib/supabase';
import { useRestaurant } from '@/lib/RestaurantContext';

// We fallback to a default slug if the context is still loading
const FALLBACK_SLUG = 'demo-restaurant'; 

export default function MenuManagement() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishToDelete, setDishToDelete] = useState<Dish | null>(null);
  const { restaurant } = useRestaurant();

  const activeSlug = restaurant?.slug || FALLBACK_SLUG;

  const planType = restaurant?.plan_type || 'free';
  const getPlanLimits = (plan: string) => {
    const limits: Record<string, { items: number; tables: number }> = {
      free: { items: 12, tables: 5 },
      basic: { items: 12, tables: 5 },
      pro: { items: 20, tables: 15 },
      premium: { items: 23, tables: 17 },
      enterprise: { items: 999999, tables: 999999 }
    };
    return limits[plan] || limits.free;
  };

  const limits = getPlanLimits(planType);
  const isAddLocked = dishes.length >= limits.items;

  useEffect(() => {
    if (restaurant) {
      fetchDishes();
    }
  }, [restaurant]);

  const fetchDishes = async () => {
    try {
      const data = await getDishesForAdmin();
      setDishes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (dish: Dish) => {
    const newValue = !dish.is_available;
    // Optimistic UI Update
    setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_available: newValue } : d));
    try {
      await updateDishAvailability(dish.id, newValue);
      await logAdminAction('STOCK_UPDATE', `Item "${dish.name}" status changed to ${newValue ? 'In Stock' : 'Out of Stock'}`);
      await broadcastMenuUpdate(activeSlug);
    } catch (err) {
      // Revert if failed
      setDishes(prev => prev.map(d => d.id === dish.id ? { ...d, is_available: !newValue } : d));
      alert('Failed to update availability');
    }
  };

  const handleDelete = async () => {
    if (!dishToDelete) return;
    const prevDishes = [...dishes];
    // Optimistic remove
    setDishes(prev => prev.filter(d => d.id !== dishToDelete.id));
    setDishToDelete(null);

    try {
      await deleteDishFromDb(dishToDelete.id);
      if (dishToDelete.image_url) {
        await removeDishImage(dishToDelete.image_url, 'dishes');
      }
      await logAdminAction('MENU_CHANGE', `Deleted dish "${dishToDelete.name}"`);
      await broadcastMenuUpdate(activeSlug);
    } catch (err) {
      setDishes(prevDishes);
      alert('Failed to delete dish');
    }
  };

  const handleSaveDish = async (data: any) => {
    try {
      await upsertDish({
        ...data,
        restaurant_slug: activeSlug,
        is_available: data.id ? dishes.find(d => d.id === data.id)?.is_available : true,
      });
      setIsFormOpen(false);
      setEditingDish(null);
      fetchDishes(); // Refresh list to get accurate DB state
      await logAdminAction('MENU_CHANGE', `${data.id ? 'Edited' : 'Added'} dish "${data.name}"`);
      await broadcastMenuUpdate(activeSlug);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="p-4 sm:p-8 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Menu Management</h1>
            <p className="mt-1 text-gray-500">
              Manage your dishes, pricing, and availability (used {dishes.length} of {limits.items === 999999 ? 'unlimited' : limits.items} items).
            </p>
          </div>
          {isAddLocked ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hidden md:block">
                Item limit reached. Upgrade plan to add more dishes!
              </span>
              <button disabled className="bg-gray-200 text-gray-400 px-6 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 cursor-not-allowed">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Dish</span>
              </button>
            </div>
          ) : (
            <button onClick={() => { setEditingDish(null); setIsFormOpen(true); }} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 shadow-sm flex items-center gap-2 transition-colors">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Dish</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              </div>
            ) : dishes.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>No dishes found. Add your first dish to get started!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Dish</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-center">In Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                            {dish.image_url ? (
                              <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs">No Img</div>
                            )}
                          </div>
                          <div className="font-bold text-gray-900 text-sm sm:text-base">{dish.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700">
                          {dish.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">
                          ₹{dish.sizes && typeof dish.sizes === 'object' && Object.keys(dish.sizes).length > 0 ? Number(Object.values(dish.sizes)[0] ?? 0).toFixed(2) : Number(dish.price ?? 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggle(dish)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${dish.is_available ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dish.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => { setEditingDish(dish); setIsFormOpen(true); }} className="p-2 text-gray-400 hover:text-orange-600 rounded-xl hover:bg-orange-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDishToDelete(dish)} className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isFormOpen && (
        <DishForm initialData={editingDish} onClose={() => { setIsFormOpen(false); setEditingDish(null); }} onSave={handleSaveDish} />
      )}

      {dishToDelete && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-fade-in-up border border-gray-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Dish?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete <strong>{dishToDelete.name}</strong>? This will permanently remove its data and photo.</p>
            <div className="flex gap-3">
              <button onClick={() => setDishToDelete(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}
