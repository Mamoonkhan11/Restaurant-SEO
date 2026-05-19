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
  const [liveOrders, setLiveOrders] = useState<any[]>([]);

  const handleDownloadPDF = () => {
    if (!selectedTable || !restaurant) return;
    const printElement = document.getElementById('printable-qr-frame');
    if (!printElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups to export PDF.');
      return;
    }

    const sanitizedRestaurantName = (restaurant.name || 'Restaurant').replace(/[^a-z0-9]/gi, '_');
    const sanitizedTableNo = (selectedTable.table_no || 'Table').replace(/[^a-z0-9]/gi, '_');

    // Clone all document style tags and stylesheet links to preserve Tailwind styles
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => {
        if (el.tagName.toLowerCase() === 'link') {
          const cloned = el.cloneNode(true) as HTMLLinkElement;
          cloned.href = cloned.href; // Resolves relative href to absolute URL
          return cloned.outerHTML;
        }
        return el.outerHTML;
      })
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>${sanitizedRestaurantName}_${sanitizedTableNo}</title>
          ${styles}
          <style>
            @page {
              size: portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #ffffff;
            }
            #printable-qr-frame {
              border: 2px solid #000000 !important;
              box-shadow: none !important;
              display: inline-flex !important;
              visibility: visible !important;
            }
            #printable-qr-frame * {
              color: #000000 !important;
              border-color: #000000 !important;
            }
          </style>
        </head>
        <body>
          ${printElement.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    // Give browser a short window to process and paint the SVG/styles
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  useEffect(() => {
    if (restaurant) {
      fetchTables();
      fetchLiveOrders();
    }
  }, [restaurant]);

  const fetchLiveOrders = async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from('orders')
      .select('table_no')
      .eq('restaurant_id', restaurant.id)
      .in('status', ['pending', 'preparing']);
    if (data) {
      setLiveOrders(data);
    }
  };

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
    <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen bg-[#F9FAFB] font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: auto;
          margin: 0mm;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-frame, #printable-qr-frame * {
            visibility: visible;
          }
          #printable-qr-frame {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
          }
          .qr-print-frame {
            padding: 3rem !important;
            border: 2px solid #f3f4f6 !important;
            border-radius: 1.5rem !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 400px !important;
            background: white !important;
          }
        }
      `}} />
      <div className="mb-10 flex flex-col justify-center print:hidden">
        <h1 className="text-3xl font-black text-[#111827] tracking-tight">Table Management</h1>
        <p className="mt-1 text-gray-500 font-medium text-sm">Add tables to generate specific ordering links and track orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
        
        {/* Left Side: Controls & List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="e.g. Table 1, VIP Room"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[#111827] font-medium placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-gray-300 transition-all text-sm"
                required
              />
              <button
                type="submit"
                disabled={isAdding || !newTableName.trim()}
                className="bg-[#111827] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {tables.filter(table => table && table.table_no).map(table => {
              const isSelected = selectedTable?.id === table.id;
              const isLive = liveOrders.some(o => o.table_no === table.table_no);
              return (
                <div 
                  key={table.id} 
                  onClick={() => setSelectedTable(table)}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${isSelected ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-200'}`}></div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-[#111827] text-sm tracking-tight leading-tight">{table.table_no}</h3>
                      {isLive && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 leading-tight mt-0.5">Occupied</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }} 
                    className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
        <div className="lg:col-span-7">
          <div className="bg-white p-6 md:p-12 rounded-2xl border border-gray-100 shadow-sm sticky top-8 flex flex-col items-center">
            {selectedTable ? (
              <>
                <div id="printable-qr-frame" className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm inline-flex flex-col items-center mb-8 w-[320px] shrink-0 print:border-none print:shadow-none print:w-[100vw]">
                  <div className="qr-print-frame">
                    <div className="mb-8 text-center">
                      <h3 className="text-xl font-bold text-[#111827] tracking-tight uppercase leading-tight">{restaurant?.name || 'Restaurant Name'}</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest leading-tight">{selectedTable.table_no}</p>
                    </div>
                    
                    <div className="bg-white p-2 border border-gray-100 rounded-lg mb-8 flex justify-center items-center">
                      <QRCodeSVG
                        value={`${origin}/menu/${restaurant?.slug}?table=${encodeURIComponent(selectedTable.table_no)}`}
                        size={200}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                        level="H"
                      />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#111827] tracking-widest uppercase leading-tight">Contactless Dining</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest leading-tight">Scan for Menu</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-[320px] space-y-3 print:hidden">
                  <a
                    href={`${origin}/menu/${restaurant?.slug}?table=${encodeURIComponent(selectedTable.table_no)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-[#111827] font-bold py-3 px-6 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                  >
                    <LinkIcon className="w-4 h-4" /> Live Preview
                  </a>
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full bg-[#111827] hover:bg-black text-white font-bold py-3 px-6 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </>
            ) : (
              <div className="py-24 flex flex-col items-center text-gray-400">
                <QrCode className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="font-bold text-[#111827] text-sm">No Table Selected</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
