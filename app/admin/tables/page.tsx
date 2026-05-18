"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Link as LinkIcon, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/lib/RestaurantContext';

export default function TablesPage() {
  const { restaurant, isLoading: isRestaurantLoading } = useRestaurant();
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTableName, setNewTableName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (restaurant) {
      fetchTables();
    }
  }, [restaurant]);

  const fetchTables = async () => {
    if (!restaurant) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load tables');
    } else {
      setTables(data || []);
    }
    setIsLoading(false);
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim() || !restaurant) return;

    setIsAdding(true);

    // Generate a slug-friendly table name
    const tableSlugPart = newTableName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const qrSlug = `${restaurant.slug}-${tableSlugPart}`;

    const { data, error } = await supabase
      .from('tables')
      .insert({
        restaurant_id: restaurant.id,
        table_name: newTableName.trim(),
        qr_slug: qrSlug
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error(`Failed to add table: ${error.message}`);
    } else if (data) {
      toast.success('Table added!');
      setTables([...tables, data]);
      setNewTableName('');
    }

    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete table');
    } else {
      toast.success('Table deleted');
      setTables(tables.filter(t => t.id !== id));
    }
  };

  if (isRestaurantLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vionys.com';

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Table Management</h1>
          <p className="mt-1 text-gray-700 font-medium">Add tables to generate specific ordering links and track orders.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="e.g. Table 1, VIP Room, Patio A"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black font-medium placeholder:text-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            required
          />
          <button
            type="submit"
            disabled={isAdding || !newTableName.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Add Table
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => {
          const tableUrl = `${origin}/menu/${restaurant?.slug}?table=${encodeURIComponent(table.table_name)}`;
          return (
            <div key={table.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-black text-lg">{table.table_name}</h3>
                </div>
                <button onClick={() => handleDelete(table.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2.5 rounded-lg overflow-hidden group">
                  <LinkIcon className="w-4 h-4 shrink-0" />
                  <a href={tableUrl} target="_blank" rel="noreferrer" className="truncate hover:text-blue-600 transition-colors hover:underline">
                    {tableUrl}
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {tables.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <h3 className="text-gray-500 font-medium">No tables added yet</h3>
            <p className="text-sm text-gray-400 mt-1">Add your first table to start generating QR links.</p>
          </div>
        )}
      </div>
    </div>
  );
}
