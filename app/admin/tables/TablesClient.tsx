"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Trash2, Link as LinkIcon, QrCode, Download, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRestaurant } from '@/lib/RestaurantContext';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { useSubscription } from '@/lib/useSubscription';

const TableSkeleton = () => (
  <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen bg-transparent font-sans animate-pulse text-white">
    {/* Header Skeleton */}
    <div className="mb-10 flex flex-col justify-center">
      <div className="h-8 bg-white/5 rounded-lg w-1/3 mb-2" />
      <div className="h-4 bg-white/5 rounded-lg w-1/2" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
      {/* Left Column: Form & List */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white/5 p-5 rounded-xl border border-white/10 shadow-sm">
          <div className="h-10 bg-white/5 rounded-lg w-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white/5" />
                <div className="h-4 bg-white/5 rounded w-20" />
              </div>
              <div className="w-8 h-8 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Preview QR */}
      <div className="lg:col-span-7">
        <div className="bg-white/5 p-6 md:p-12 rounded-2xl border border-white/10 shadow-sm flex flex-col items-center">
          <div className="bg-white/5 p-8 rounded-xl border border-white/10 shadow-sm flex flex-col items-center w-[320px] h-[380px] shrink-0 justify-between">
            <div className="w-3/4 h-6 bg-white/5 rounded mb-4" />
            <div className="w-[200px] h-[200px] bg-white/5 rounded-lg" />
            <div className="w-1/2 h-4 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function TablesPage() {
  const { restaurant, isLoading: isRestaurantLoading } = useRestaurant();
  const { hasActivePlan } = useSubscription();
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTableName, setNewTableName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const planType = restaurant?.plan_type || 'free';
  const getPlanLimits = (plan: string) => {
    const limits: Record<string, { items: number; tables: number }> = {
      free: { items: 12, tables: 5 },
      basic: { items: 50, tables: 10 },
      pro: { items: 999999, tables: 30 },
      premium: { items: 999999, tables: 60 },
      enterprise: { items: 999999, tables: 999999 }
    };
    return limits[plan] || limits.free;
  };

  const limits = getPlanLimits(planType);
  const isAddLocked = tables.length >= limits.tables;

  const handleDownloadPNG = async () => {
    if (!selectedTable || !restaurant) return;

    const toastId = toast.loading('Generating PNG...');
    try {
      // --- Dimensions (2x scale for crisp print quality) ---
      const SCALE = 2;
      const W = 320 * SCALE;
      const PAD = 32 * SCALE;
      const QR_SIZE = 200 * SCALE;
      const HEADER_H = 80 * SCALE;
      const FOOTER_H = 56 * SCALE;
      const QRPAD = 16 * SCALE;
      const H = PAD + HEADER_H + QRPAD + QR_SIZE + QRPAD + FOOTER_H + PAD;

      // --- Get the hidden QR canvas that has the logo baked in ---
      const hiddenQrCanvas = document.getElementById('hidden-qr-canvas') as HTMLCanvasElement | null;
      if (!hiddenQrCanvas) throw new Error('Hidden QR canvas not found');

      // --- Build flyer canvas ---
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);

      // Thin border
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);

      // Restaurant name
      ctx.fillStyle = '#111827';
      ctx.font = `bold ${16 * SCALE}px 'Arial', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        (restaurant.name || 'Restaurant').toUpperCase(),
        W / 2,
        PAD + 20 * SCALE
      );

      // Table number
      ctx.fillStyle = '#4B5563';
      ctx.font = `bold ${10 * SCALE}px 'Arial', sans-serif`;
      ctx.letterSpacing = `${2 * SCALE}px`;
      ctx.fillText(
        (selectedTable.table_no || '').toUpperCase(),
        W / 2,
        PAD + 44 * SCALE
      );
      ctx.letterSpacing = '0px';

      // QR code (draw from hidden canvas which has the logo)
      const qrY = PAD + HEADER_H + QRPAD;
      const qrX = (W - QR_SIZE) / 2;
      ctx.drawImage(hiddenQrCanvas, qrX, qrY, QR_SIZE, QR_SIZE);

      // Footer
      const footerY = qrY + QR_SIZE + QRPAD;
      ctx.fillStyle = '#111827';
      ctx.font = `bold ${11 * SCALE}px 'Arial', sans-serif`;
      ctx.fillText('CONTACTLESS DINING', W / 2, footerY + 18 * SCALE);
      ctx.fillStyle = '#6B7280';
      ctx.font = `bold ${8 * SCALE}px 'Arial', sans-serif`;
      ctx.fillText('SCAN FOR MENU', W / 2, footerY + 34 * SCALE);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (restaurant.name || 'Restaurant').replace(/[^a-z0-9]/gi, '_');
      const safeTable = (selectedTable.table_no || 'Table').replace(/[^a-z0-9]/gi, '_');
      link.download = `${safeName}_${safeTable}_QR.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PNG Downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PNG', { id: toastId });
    }
  };

  const fetchLiveOrdersOnly = async () => {
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

  useEffect(() => {
    if (!restaurant) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [tablesRes, ordersRes] = await Promise.all([
          supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('orders')
            .select('table_no')
            .eq('restaurant_id', restaurant.id)
            .in('status', ['pending', 'preparing'])
        ]);

        if (tablesRes.error) {
          toast.error('Failed to load tables');
        } else {
          setTables(tablesRes.data || []);
          if (tablesRes.data && tablesRes.data.length > 0 && !selectedTable) {
            setSelectedTable(tablesRes.data[0]);
          }
        }

        if (ordersRes.data) {
          setLiveOrders(ordersRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // ⚡ Realtime subscription for tables changes
    const tablesChannel = supabase
      .channel(`tables-realtime-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${restaurant.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTables(prev => {
              if (prev.some(t => t.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'DELETE') {
            setTables(prev => prev.filter(t => t.id !== payload.old.id));
            setSelectedTable((prev: any) => prev?.id === payload.old.id ? null : prev);
          } else if (payload.eventType === 'UPDATE') {
            setTables(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
            setSelectedTable((prev: any) => prev?.id === payload.new.id ? payload.new : prev);
          }
        }
      )
      .subscribe();

    // ⚡ Realtime subscription for orders changes to update live table status
    const ordersChannel = supabase
      .channel(`orders-realtime-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        () => {
          fetchLiveOrdersOnly();
        }
      )
      .subscribe();

    // ⚡ CLEANUP: Prevents zombie channels on unmount
    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [restaurant]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim() || !restaurant) return;

    if (tables.length >= limits.tables) {
      toast.error(`Table limit reached (${limits.tables}). Please upgrade your plan.`);
      return;
    }

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
    setConfirmModal({
      isOpen: true,
      title: 'Delete Table?',
      message: 'Are you sure you want to delete this table? This will disable its unique QR code.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase
          .from('tables')
          .delete()
          .eq('id', id)
          .eq('restaurant_id', restaurant.id);

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
      }
    });
  };

  const wrapWithLock = (content: React.ReactNode) => {
    if (hasActivePlan) return content;

    return (
      <div className="relative w-full min-h-screen">
        <div className="pointer-events-none select-none blur-md opacity-60">
          {content}
        </div>
        <div className="absolute inset-0 flex items-start justify-center pt-12 sm:pt-24 p-4 z-20 pointer-events-auto">
          <div className="bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-md w-full text-center border border-white/10 animate-fade-in-up">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Active Plan</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Please select a subscription tier from the Billing panel to unlock these management interfaces.
            </p>
            <Link
              href="/admin/billing"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] animate-pulse"
            >
              Go to Billing
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (isRestaurantLoading || isLoading) {
    return <TableSkeleton />;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vionys.com';

  return wrapWithLock(
    <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen bg-transparent font-sans text-white">
      <style dangerouslySetInnerHTML={{
        __html: `
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
        <h1 className="text-3xl font-black text-white tracking-tight">Table Management</h1>
        <p className="mt-1 text-gray-400 font-medium text-sm">
          Add tables to generate specific ordering links and track orders (used {tables.length} of {limits.tables === 999999 ? 'unlimited' : limits.tables} tables).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">

        {/* Left Side: Controls & List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-md p-5 rounded-[2rem] border border-white/10 shadow-lg">
            {isAddLocked && (
              <div className="mb-4 text-xs font-semibold text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                Table limit reached. Please upgrade your plan in billing to add more tables.
              </div>
            )}
            <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder={isAddLocked ? `Limit of ${limits.tables} tables reached` : "e.g. Table 1, VIP Room"}
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                disabled={isAddLocked}
                className="flex-1 px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-white font-medium placeholder:text-gray-500 focus:bg-white/[0.04] focus:outline-none focus:border-white/20 transition-all text-sm disabled:cursor-not-allowed disabled:opacity-75"
                required
              />
              <button
                type="submit"
                disabled={isAdding || !newTableName.trim() || isAddLocked}
                className="bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-[0_4px_12px_rgba(234,88,12,0.25)] hover:shadow-[0_4px_20px_rgba(234,88,12,0.4)] hover:scale-[1.02] active:scale-[0.98]"
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
                  className={`bg-white/[0.03] backdrop-blur-md p-4 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${isSelected ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-500/[0.02]' : 'border-white/5 hover:border-white/15'}`}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className={`w-5 h-5 transition-all duration-300 ${isLive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse' : 'text-white/40'}`} />
                    <div className="flex flex-col">
                      <h3 className="font-bold text-white text-sm tracking-tight leading-tight">{table.table_no}</h3>
                      {isLive && (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 leading-tight mt-0.5">Occupied</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(table.id); }}
                    className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {tables.length === 0 && (
              <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <h3 className="text-gray-400 font-bold">No tables added yet</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Add your first table to start generating QR links.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: QR Live Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white/[0.03] backdrop-blur-md p-6 md:p-12 rounded-[2rem] border border-white/10 shadow-lg sticky top-8 flex flex-col items-center">
            {selectedTable ? (() => {
              const shortId = selectedTable?.id ? selectedTable.id.substring(0, 4) : '';
              const qrUrl = shortId
                ? `${origin}/t/${restaurant?.slug}/${shortId}`
                : `${origin}/menu/${restaurant?.slug}?tableId=${selectedTable?.id}`;

              return (
                <>
                  <div id="printable-qr-frame" className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm inline-flex flex-col items-center mb-8 w-[320px] shrink-0 print:border-none print:shadow-none print:w-[100vw]">
                    <div className="qr-print-frame">
                      <div className="mb-8 text-center">
                        <h3 className="text-xl font-bold text-[#111827] tracking-tight uppercase leading-tight">{restaurant?.name || 'Restaurant Name'}</h3>
                        <p className="text-xs font-bold text-gray-600 mt-1 uppercase tracking-widest leading-tight">{selectedTable.table_no}</p>
                      </div>

                      <div className="bg-white p-2 border border-gray-100 rounded-lg mb-8 flex justify-center items-center">
                        {/* Visible on-screen preview — SVG with logo */}
                        <QRCodeSVG
                          value={qrUrl}
                          size={200}
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                          level="H"
                          imageSettings={{
                            src: "/favicon-tab.png",
                            x: undefined,
                            y: undefined,
                            height: 28,
                            width: 28,
                            excavate: true,
                          }}
                        />
                        {/* Hidden canvas used for PNG export — canvas has logo pixels baked in */}
                        <QRCodeCanvas
                          id="hidden-qr-canvas"
                          value={qrUrl}
                          size={200}
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                          level="H"
                          imageSettings={{
                            src: "/favicon-tab.png",
                            x: undefined,
                            y: undefined,
                            height: 28,
                            width: 28,
                            excavate: true,
                          }}
                          style={{ display: 'none' }}
                        />
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-bold text-[#111827] tracking-widest uppercase leading-tight">Contactless Dining</p>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-tight">Scan for Menu</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-[320px] space-y-3 print:hidden">
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                    >
                      <LinkIcon className="w-4 h-4" /> Live Preview
                    </a>
                    <button
                      onClick={handleDownloadPNG}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                </>
              );
            })() : (
              <div className="py-24 flex flex-col items-center text-white/20">
                <QrCode className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
                <h3 className="font-bold text-gray-400 text-sm">No Table Selected</h3>
              </div>
            )}
          </div>
        </div>
      </div>
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white">
          <div className="bg-[#121318] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-white/10 text-center transform scale-100 transition-all animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-3 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
