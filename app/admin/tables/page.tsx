"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Link as LinkIcon, QrCode, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/lib/RestaurantContext';
import { QRCodeSVG } from 'qrcode.react';

export default function TablesPage() {
  const { restaurant, isLoading: isRestaurantLoading } = useRestaurant();
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTableName, setNewTableName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

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
      if (data && data.length > 0 && !selectedTable) {
        setSelectedTable(data[0]);
      }
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
        table_no: newTableName.trim(),
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
      setSelectedTable(data);
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
      const newTables = tables.filter(t => t.id !== id);
      setTables(newTables);
      if (selectedTable?.id === id) {
        setSelectedTable(newTables.length > 0 ? newTables[0] : null);
      }
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

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Controls & List */}
        <div className="flex-1 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map(table => {
              const tableUrl = `${origin}/menu/${restaurant?.slug}?table=${encodeURIComponent(table.table_no)}`;
              const isSelected = selectedTable?.id === table.id;
              return (
                <div 
                  key={table.id} 
                  onClick={() => setSelectedTable(table)}
                  className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm flex flex-col ${isSelected ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/10' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-black text-lg truncate pr-2">{table.table_no}</h3>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }} 
                      className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 bg-white shadow-sm border border-gray-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-auto pt-3 border-t border-gray-100/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 shadow-sm p-2 rounded-lg overflow-hidden group w-full">
                      <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                      <a href={tableUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="truncate hover:text-blue-600 transition-colors font-medium">
                        {tableUrl}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}

            {tables.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <h3 className="text-gray-500 font-bold">No tables added yet</h3>
                <p className="text-sm text-gray-400 mt-1 font-medium">Add your first table to start generating QR links.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: QR Live Preview */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl sticky top-8 text-center flex flex-col items-center">
            {selectedTable ? (
              <>
                <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                   <h2 className="text-xl font-black text-gray-900">QR Code Preview</h2>
                   <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                     Table {selectedTable.table_no}
                   </span>
                </div>
                
                <div id="qr-container" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm inline-block mb-8">
                  <QRCodeSVG
                    value={`${origin}/menu/${restaurant?.slug}?table=${encodeURIComponent(selectedTable.table_no)}`}
                    size={240}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    level="H"
                  />
                </div>
                
                <p className="text-gray-500 font-medium mb-8 text-sm">
                  This QR code is uniquely tied to <span className="text-gray-900 font-bold">{selectedTable.table_no}</span>. Any orders placed via this link will show up on your KOT dashboard with the correct table number.
                </p>
                
                <div className="w-full space-y-3">
                  <a
                    href={`${origin}/menu/${restaurant?.slug}?table=${encodeURIComponent(selectedTable.table_no)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-5 h-5" /> Visit Live Menu
                  </a>
                  <button
                    onClick={() => {
                      const svg = document.querySelector('#qr-container svg');
                      if (!svg) return;
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx?.drawImage(img, 0, 0);
                        const a = document.createElement('a');
                        a.download = `QR-${restaurant?.slug}-${selectedTable.table_no}.png`;
                        a.href = canvas.toDataURL('image/png');
                        a.click();
                      };
                      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                    }}
                    className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download QR (PNG)
                  </button>
                </div>
              </>
            ) : (
              <div className="py-24 flex flex-col items-center text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <QrCode className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">No Table Selected</h3>
                <p className="font-medium text-sm mt-1">Select a table to preview and download its QR Code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
