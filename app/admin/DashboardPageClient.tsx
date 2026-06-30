"use client";
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false });
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Lock, TrendingUp, Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '@/lib/useSubscription';
import { useRestaurant } from '@/lib/RestaurantContext';

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

function LiveOrderQueue({ restaurantId }: { restaurantId: string }) {
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const {
    audioMuted,
    isAlerting,
    audioNeedsInteraction,
    handleToggleAudio
  } = useRestaurant();
  const { hasActivePlan, planType, isLoading: isSubLoading } = useSubscription();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkScreen = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

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

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = async () => {
      const { data: initialOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: false });

      if (initialOrders) setLiveOrders(initialOrders);
    };
    fetchOrders();

    const ordersSubscription = supabase
      .channel(`live-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          if (payload.new && payload.new.restaurant_id === restaurantId) {
            console.log(" REALTIME NEW ORDER DETECTED FOR TABLE:", payload.new.table_no);
            setLiveOrders(prev => [payload.new, ...prev]);
            toast.success(`New order received from ${payload.new.table_no}!`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          if (payload.new && payload.new.restaurant_id === restaurantId) {
            console.log("REALTIME ORDER UPDATE DETECTED:", payload.new.id, payload.new.status);
            setLiveOrders(prev => {
              if (payload.new.status === 'served' || payload.new.status === 'cancelled') {
                return prev.filter(o => o.id !== payload.new.id);
              }
              return prev.map(o => o.id === payload.new.id ? payload.new : o);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [restaurantId]);

  const wrapWithLock = (content: React.ReactNode) => {
    if (isSubLoading) {
      return (
        <div className="bg-white/[0.03] backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-sm flex items-center justify-center mb-8 relative min-h-[220px]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      );
    }
    if (!hasActivePlan) {
      return (
        <div className="relative w-full mb-8">
          <div className="pointer-events-none select-none blur-md opacity-50">
            {content}
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-md w-full text-center border border-white/10 animate-fade-in-up">
              <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">No Active Plan</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Please select a subscription tier from the Billing panel to unlock these management interfaces.
              </p>
              <Link
                href="/admin/billing"
                className="inline-block bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-[0_4px_15px_rgba(234,88,12,0.25)] transition-all hover:scale-[1.02]"
              >
                Go to Billing
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (planType === 'basic' && isDesktop) {
      return (
        <div className="relative w-full mb-8">
          <div className="pointer-events-none select-none blur-md opacity-50">
            {content}
          </div>
          <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] max-w-md w-full text-center border border-white/10 animate-fade-in-up">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-sm">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Desktop KOT Locked</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Your **Basic Plan** includes Mobile KOT only. To track live orders, please open this dashboard on a mobile device, or upgrade to a **Pro Plan** to access the desktop dashboard.
              </p>
              <Link
                href="/admin/billing"
                className="inline-block bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-[0_4px_15px_rgba(234,88,12,0.25)] transition-all hover:scale-[1.02]"
              >
                Upgrade to Pro Plan
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return content;
  };

  return wrapWithLock(
    <div className="bg-white/[0.03] backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col mb-8 relative overflow-hidden min-h-[500px]">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-white flex flex-wrap items-center gap-2">
            <span>Live Kitchen Orders (KOT)</span>
            {liveOrders.filter(o => o.status === 'pending').length > 0 && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
                {liveOrders.filter(o => o.status === 'pending').length} Action Required
              </span>
            )}
            {['pro', 'premium', 'enterprise'].includes(planType) && (
              !audioMuted ? (
                <button
                  onClick={handleToggleAudio}
                  className="bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 text-[11px] px-3.5 py-1 rounded-full font-extrabold border border-orange-500/20 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Click to Mute Notifications"
                >
                  Tap Here to Disable Audio
                </button>
              ) : (
                <button
                  onClick={handleToggleAudio}
                  className="bg-white/5 hover:bg-white/10 text-white/80 text-[11px] px-3.5 py-1 rounded-full font-extrabold border border-white/10 transition-colors animate-pulse flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Click to Enable Audio"
                >
                  Tap Here to Enable Audio
                </button>
              )
            )}
          </h3>
          <p className="text-sm font-medium text-gray-400 mt-1">Manage real-time incoming orders from your tables.</p>
        </div>
      </div>

      {liveOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {liveOrders.map(order => {
            const cleanTableNo = String(order.table_no).replace(/^table\s+/i, '');
            const tableLabel = /^table\b/i.test(String(order.table_no)) ? order.table_no : `Table ${order.table_no}`;

            return (
              <div key={order.id} className={`p-6 rounded-2xl border transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md flex flex-col relative ${order.status === 'pending' ? 'border-amber-500/20 bg-amber-500/[0.03] shadow-[0_0_15px_rgba(245,158,11,0.08)]' : order.status === 'preparing' ? 'border-orange-500/20 bg-orange-500/[0.03] shadow-[0_0_15px_rgba(249,115,22,0.08)]' : 'border-white/10 bg-white/[0.02] shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 block">Table</span>
                    <h4 className="font-black text-white text-2xl leading-none">{cleanTableNo}</h4>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold text-gray-300 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded border border-white/10">
                        {timeAgo(order.created_at)}
                      </span>
                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: 'Cancel Order?',
                            message: `Are you sure you want to cancel and delete the entire order for ${tableLabel}?`,
                            onConfirm: async () => {
                              setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
                              toast.success(`Order from ${tableLabel} has been cancelled`);
                            }
                          });
                        }}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-red-500/20"
                        title="Cancel Order"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {order.status === 'pending' && <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending</span>}
                    {order.status === 'preparing' && <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Preparing</span>}
                    {order.status === 'served' && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Served</span>}
                  </div>
                </div>

                <div className="space-y-4 mb-6 flex-1">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-sm group transition-all duration-200">
                      <div className="flex items-start gap-3">
                        <span className="text-white font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-white leading-tight">{item.name}</span>
                          {item.size && item.size !== 'Standard' && <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">{item.size}</span>}
                        </div>
                      </div>
                      <span className="font-bold text-gray-300 tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-dashed border-white/5 flex justify-between items-center mb-6">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-xl font-black text-white tabular-nums">₹{Number(order.total_amount || 0).toFixed(2)}</span>
                </div>

                <div className="flex gap-3 mt-auto">
                  {order.status === 'pending' && (
                    <button
                      onClick={async () => {
                        await supabase.from('orders').update({ status: 'preparing' }).eq('id', order.id);
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white text-sm font-extrabold py-3.5 px-4 rounded-xl shadow-[0_4px_12px_rgba(234,88,12,0.25)] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={async () => {
                        await supabase.from('orders').update({ status: 'served' }).eq('id', order.id);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Mark as Served
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl py-16 flex flex-col items-center justify-center border-2 border-dashed border-white/10 bg-white/[0.01] rounded-3xl">
            <h3 className="text-white font-black text-xl">No Active Orders</h3>
            <p className="text-gray-400 font-semibold mt-1 text-sm">Waiting for fresh KOT orders to arrive...</p>
          </div>
        </div>
      )}
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

export default function AdminDashboardOverview() {


  const [isLoading, setIsLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('...');
  const [totalItems, setTotalItems] = useState<number | string>('-');
  const [totalTables, setTotalTables] = useState<number | string>('-');
  const [totalScans, setTotalScans] = useState<number | string>('-');
  const [topDish, setTopDish] = useState<string>('-');

  // Real Data States
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allWeeklyActivity, setAllWeeklyActivity] = useState<any[]>([]);
  const [allTablesList, setAllTablesList] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [activeModalTitle, setActiveModalTitle] = useState<string | null>(null);
  const [historicalStats, setHistoricalStats] = useState<any[]>([]);
  const { planType, isTrial, isExpired, isLoading: isSubLoading } = useSubscription();

  // Basic Dine-In Plan (and above) has access to Total Scans and Item View Performance Graphs
  const hasBasicAccess = ['basic', 'pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired);

  // Pro Live-KOT Plan (and above) has access to Top Selling Dish Analytics
  const hasProAccess = ['pro', 'premium', 'enterprise'].includes(planType) || (planType === 'free' && isTrial && !isExpired);

  const showTotalScansLock = !hasBasicAccess;
  const showTopSellingDishLock = !hasProAccess;
  const canViewAdvancedAnalytics = hasBasicAccess;

  const router = useRouter();
  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Auth Check (use fast local session check first)
      const { data: { session } } = await supabase.auth.getSession();
      let user = session?.user;
      if (!user) {
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        user = fetchedUser || undefined;
      }
      if (!user) {
        router.push('/login');
        return;
      }

      setOwnerName(user.user_metadata?.full_name || 'Owner');

      // 2. Profile Fetch
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('id, slug, plan_type, total_scans')
        .eq('owner_id', user.id)
        .single();

      if (error || !restaurant) {
        router.push('/admin/settings');
        return;
      }

      setRestaurantId(restaurant.id);
      setTotalScans(restaurant.total_scans || 0);

      // Realtime listener for total_scans
      const scansSubscription = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'restaurants',
            filter: `id=eq.${restaurant.id}`,
          },
          (payload) => {
            if (payload.new && typeof payload.new.total_scans === 'number') {
              setTotalScans(payload.new.total_scans);
            }
          }
        )
        .subscribe();

      // --- Time Calculations ---
      const now = new Date();
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const firstDayOf2MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
      const firstDayOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();

      // 3. Launch all dependent queries concurrently using Promise.all to eliminate sequential blocking roundtrips
      const [
        resetLogRes,
        dishCountRes,
        tablesDataRes,
        dishesDataRes,
        month1Res,
        month2Res,
        month3Res,
        logsDataRes,
        activeOrdersRes
      ] = await Promise.all([
        supabase
          .from('activity_logs')
          .select('created_at')
          .eq('admin_id', user.id)
          .eq('action_type', 'WEEKLY_RESET')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('dishes')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id),
        supabase
          .from('tables')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('table_no', { ascending: true }),
        supabase
          .from('dishes')
          .select('name, view_count')
          .eq('restaurant_id', restaurant.id)
          .order('view_count', { ascending: false })
          .limit(7),
        supabase.from('restaurants').select('*', { count: 'exact', head: true })
          .eq('slug', restaurant.slug).gte('created_at', firstDayOfLastMonth).lt('created_at', firstDayOfMonth),
        supabase.from('restaurants').select('*', { count: 'exact', head: true })
          .eq('slug', restaurant.slug).gte('created_at', firstDayOf2MonthsAgo).lt('created_at', firstDayOfLastMonth),
        supabase.from('restaurants').select('*', { count: 'exact', head: true })
          .eq('slug', restaurant.slug).gte('created_at', firstDayOf3MonthsAgo).lt('created_at', firstDayOf2MonthsAgo),
        supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('status', 'served')
          .gte('created_at', monday.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('table_no')
          .eq('restaurant_id', restaurant.id)
          .in('status', ['pending', 'preparing'])
      ]);

      // 4. Handle Weekly Reset logic
      const resetLog = resetLogRes.data;
      if (!resetLog || new Date(resetLog.created_at) < monday) {
        await Promise.all([
          supabase.from('dishes').update({ view_count: 0 }).eq('restaurant_id', restaurant.id),
          supabase.from('activity_logs').insert({
            admin_id: user.id,
            restaurant_id: restaurant.id,
            action_type: 'WEEKLY_RESET',
            description: 'Weekly item activity reset automatically'
          })
        ]);
        setTopDish('N/A');
        setChartData([]);
      } else {
        const dishesData = dishesDataRes.data;
        if (dishesData && dishesData.length > 0) {
          setTopDish(dishesData[0].name);
          const visibleDishes = canViewAdvancedAnalytics ? dishesData : dishesData.slice(0, 2);
          setChartData(visibleDishes.map(d => ({
            name: d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name,
            views: d.view_count || 0
          })));
        } else {
          setTopDish('N/A');
          setChartData([]);
        }
      }

      // 5. Populate stats and metrics from concurrent responses
      setTotalItems(dishCountRes.count ?? 0);
      setTotalTables(tablesDataRes.data?.length ?? 0);
      setAllTablesList(tablesDataRes.data || []);
      setActiveOrders(activeOrdersRes.data || []);

      const month1 = month1Res.count;
      const month2 = month2Res.count;
      const month3 = month3Res.count;

      setHistoricalStats([
        { label: 'Last Month', scans: month1 || 0 },
        { label: '2 Months Ago', scans: month2 || 0 },
        { label: '3 Months Ago', scans: month3 || 0 }
      ]);

      if (logsDataRes.data) {
        setRecentActivity(logsDataRes.data.slice(0, 10));
        setAllWeeklyActivity(logsDataRes.data);
      }

      // Incremental local state updates on realtime event payloads to prevent heavy database query roundtrips
      const handleRealtimeOrderInsert = (payload: any) => {
        const newOrder = payload.new;
        if (!newOrder) return;

        setActiveOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          if (newOrder.status === 'pending' || newOrder.status === 'preparing') {
            return [...prev, newOrder];
          }
          return prev;
        });

        if (newOrder.status === 'served') {
          setAllWeeklyActivity(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            if (new Date(newOrder.created_at) >= monday) {
              const updated = [newOrder, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              setRecentActivity(updated.slice(0, 10));
              return updated;
            }
            return prev;
          });
        }
      };

      const handleRealtimeOrderUpdate = (payload: any) => {
        const updatedOrder = payload.new;
        if (!updatedOrder) return;

        setActiveOrders(prev => {
          if (updatedOrder.status === 'pending' || updatedOrder.status === 'preparing') {
            const exists = prev.some(o => o.id === updatedOrder.id);
            if (exists) {
              return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
            }
            return [...prev, updatedOrder];
          }
          return prev.filter(o => o.id !== updatedOrder.id);
        });

        if (updatedOrder.status === 'served') {
          setAllWeeklyActivity(prev => {
            const exists = prev.some(o => o.id === updatedOrder.id);
            let updated = prev;
            if (exists) {
              updated = prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
            } else if (new Date(updatedOrder.created_at) >= monday) {
              updated = [updatedOrder, ...prev];
            }
            const sorted = [...updated].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setRecentActivity(sorted.slice(0, 10));
            return sorted;
          });
        } else {
          setAllWeeklyActivity(prev => {
            const updated = prev.filter(o => o.id !== updatedOrder.id);
            setRecentActivity(updated.slice(0, 10));
            return updated;
          });
        }
      };

      const subscription = supabase
        .channel('public:orders-activity')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
          handleRealtimeOrderUpdate
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
          handleRealtimeOrderInsert
        )
        .subscribe();

      setIsLoading(false);

      return () => {
        supabase.removeChannel(subscription);
        supabase.removeChannel(scansSubscription);
      };
    };

    const cleanup = fetchDashboardData();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [router]);

  if (isLoading || isSubLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 min-h-screen text-white">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/5 rounded-xl w-64"></div>
          <div className="h-5 bg-white/5 rounded-xl w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-white/5 rounded-3xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-3xl"></div>
          <div className="h-[400px] bg-white/5 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 relative animate-fade-in text-white">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Welcome, {ownerName}
              <span className="text-xs font-extrabold bg-orange-500/10 text-orange-400 px-3 py-0.5 rounded-full border border-orange-500/20">Owner</span>
            </h1>
            <p className="mt-1 text-sm text-gray-400 font-medium">Here's what's happening with your digital menu today.</p>
          </div>
        </div>

        {restaurantId && <LiveOrderQueue restaurantId={restaurantId} />}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Total Scans Card */}
          <div
            onClick={() => {
              if (showTotalScansLock) {
                setActiveModalTitle('UpgradeToBasicTotalScans');
              } else {
                setActiveModalTitle('Total Scans');
              }
            }}
            className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between hover:border-orange-500/20 hover:shadow-[0_8px_30px_rgba(234,88,12,0.1)] transition-all duration-300 relative cursor-pointer group"
          >
            <div className={`flex flex-col h-full ${showTotalScansLock ? 'blur-[5px] select-none pointer-events-none' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Scans</p>
              </div>
              <p className="text-3xl font-black text-white mt-1">{showTotalScansLock ? '999' : totalScans}</p>
            </div>
          </div>

          {/* Top Selling Dish Card */}
          <div
            onClick={() => {
              if (showTopSellingDishLock) {
                setActiveModalTitle('UpgradeToProTopSellingDish');
              } else {
                setActiveModalTitle('Top Selling Dish');
              }
            }}
            className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between hover:border-orange-500/20 hover:shadow-[0_8px_30px_rgba(234,88,12,0.1)] transition-all duration-300 relative cursor-pointer group"
          >
            <div className={`flex flex-col h-full ${showTopSellingDishLock ? 'blur-[5px] select-none pointer-events-none' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Top Selling Dish</p>
              </div>
              <p className="text-xl font-black text-white mt-1 truncate max-w-[140px]" title={topDish}>
                {showTopSellingDishLock ? 'XXXXXXXXXX' : topDish}
              </p>
            </div>
          </div>

          {/* Total Items Card */}
          <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between hover:border-orange-500/20 hover:shadow-[0_8px_30px_rgba(234,88,12,0.1)] transition-all duration-300 group">
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Items</p>
            </div>
            <p className="text-3xl font-black text-white mt-1">{totalItems} <span className="text-xs text-gray-400 font-bold">dishes</span></p>
          </div>

          {/* Total Tables Card */}
          <div
            onClick={() => setActiveModalTitle('Total Tables')}
            className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between hover:border-orange-500/20 hover:shadow-[0_8px_30px_rgba(234,88,12,0.1)] transition-all duration-300 group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Tables</p>
            </div>
            <p className="text-3xl font-black text-white mt-1">{totalTables} <span className="text-xs text-gray-400 font-bold">tables</span></p>
          </div>
        </div>



        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

          {/* Line Chart Section */}
          <div
            onClick={() => {
              if (!canViewAdvancedAnalytics) {
                setActiveModalTitle('UpgradeToBasicAdvancedAnalytics');
              }
            }}
            className={`lg:col-span-2 bg-white/[0.03] backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col relative ${!canViewAdvancedAnalytics ? 'cursor-pointer' : ''}`}
          >
            <div className={`flex flex-col h-full ${!canViewAdvancedAnalytics ? 'blur-[5px] select-none pointer-events-none' : ''}`}>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">Menu Item Views</h3>
                <p className="text-sm text-gray-400">Track which dishes customers are looking at the most.</p>
              </div>
              <div className="h-[300px] w-full mt-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="99%" height={300}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }} dy={15} angle={-25} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', background: 'rgba(7, 8, 11, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                        itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="views" stroke="#ea580c" strokeWidth={4} dot={{ r: 4, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
                    <p className="text-gray-400 font-medium text-sm">No view data available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl border border-white/10 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[350px]">
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center select-none">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Happy New Week!</p>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                      Activity resets weekly on Mondays. Let's get some orders rolling!
                    </p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => {
                    const cleanTableNo = String(activity.table_no).replace(/^table\s+/i, '');
                    return (
                      <div key={activity.id || index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        {/* Timeline line */}
                        {index !== recentActivity.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-white/10"></div>
                        )}
                        {/* Dot with green checkmark */}
                        <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white/10 bg-emerald-600 shadow-sm flex items-center justify-center">
                          <span className="text-[10px] text-white">✓</span>
                        </div>

                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-sm font-bold text-white">
                              {activity.table_no ? `Table ${cleanTableNo}` : 'Direct Order'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {activity.items?.length || 0} item{activity.items?.length === 1 ? '' : 's'} served
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1 font-bold tracking-wider uppercase">
                              {timeAgo(activity.created_at)}
                            </p>
                          </div>
                          <span className="text-sm font-black text-emerald-400 tabular-nums">
                            ₹{Number(activity.total_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {recentActivity.length > 0 && (
              <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] text-center">
                <button
                  onClick={() => setActiveModalTitle('All Activity')}
                  className="text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                >
                  View All Activity
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* History Log Modal */}
      {activeModalTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121318] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-white/10 flex flex-col max-h-[80vh] text-white">
            {activeModalTitle.startsWith('UpgradeTo') ? (
              <>
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.01] shrink-0">
                  <h3 className="text-xl font-black text-white">
                    {activeModalTitle === 'UpgradeToProTopSellingDish' ? 'Upgrade to Pro' : 'Upgrade to Basic'}
                  </h3>
                  <button onClick={() => setActiveModalTitle(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {activeModalTitle === 'UpgradeToBasicTotalScans'
                      ? 'Total Scans Metrics Locked'
                      : activeModalTitle === 'UpgradeToBasicAdvancedAnalytics'
                        ? 'Advanced Analytics Locked'
                        : 'Top Selling Dish Locked'}
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {activeModalTitle === 'UpgradeToBasicTotalScans'
                      ? 'Upgrade to Basic Dine-In to see the total scans and analyze customer traffic on your digital menu.'
                      : activeModalTitle === 'UpgradeToBasicAdvancedAnalytics'
                        ? 'Upgrade to Basic Dine-In to track all dish views, customer behavior, and detailed menu growth trends.'
                        : 'Upgrade to Pro Live-KOT to identify your top selling dish and optimize your menu pricing.'}
                  </p>
                  <Link
                    href={activeModalTitle === 'UpgradeToProTopSellingDish' ? '/admin/billing#pro' : '/admin/billing#basic'}
                    onClick={() => setActiveModalTitle(null)}
                    className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-md text-sm text-center"
                  >
                    {activeModalTitle === 'UpgradeToProTopSellingDish' ? 'Upgrade to Pro' : 'Upgrade to Basic'}
                  </Link>
                </div>
              </>
            ) : activeModalTitle === 'All Activity' ? (
              <>
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.01] shrink-0">
                  <h3 className="text-xl font-bold text-white">
                    Weekly Activity <span className="text-gray-450 font-medium text-xs ml-1">(Since Mon Reset)</span>
                  </h3>
                  <button onClick={() => setActiveModalTitle(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="space-y-6">
                    {allWeeklyActivity.length === 0 ? (
                      <p className="text-sm font-medium text-gray-400 text-center py-4">No served orders this week.</p>
                    ) : (
                      allWeeklyActivity.map((activity, index) => {
                        const cleanTableNo = String(activity.table_no).replace(/^table\s+/i, '');
                        return (
                          <div key={activity.id || index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
                            {index !== allWeeklyActivity.length - 1 && (
                              <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-white/10"></div>
                            )}
                            <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white/10 bg-emerald-600 shadow-sm flex items-center justify-center">
                              <span className="text-[10px] text-white">✓</span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <p className="text-sm font-bold text-white">
                                  {activity.table_no ? `Table ${cleanTableNo}` : 'Direct Order'}
                                </p>
                                <div className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">
                                  {activity.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 font-bold tracking-wider uppercase">
                                  {new Date(activity.created_at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <span className="text-sm font-black text-emerald-400 tabular-nums">
                                ₹{Number(activity.total_amount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 bg-white/[0.01] border-t border-white/10 text-center">
                  <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                    <span>Total Sales this week</span>
                    <span className="text-emerald-400 text-sm font-black">
                      ₹{allWeeklyActivity.reduce((sum, item) => sum + Number(item.total_amount || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.01] shrink-0">
                  <h3 className="text-xl font-bold text-white">
                    {activeModalTitle === 'Total Tables' ? 'Tables Overview' : activeModalTitle} <span className="text-gray-450 font-medium text-base ml-1">{activeModalTitle === 'Total Tables' ? 'Live Status' : 'History'}</span>
                  </h3>
                  <button onClick={() => setActiveModalTitle(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="space-y-6">
                    {activeModalTitle === 'Total Scans' ? (
                      historicalStats.length === 0 ? (
                        <p className="text-sm font-medium text-gray-400 text-center py-4">No historical data available.</p>
                      ) : (
                        historicalStats.map((stat, index) => (
                          <div key={index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                            {index !== historicalStats.length - 1 && (
                              <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-white/10"></div>
                            )}
                            <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white/10 bg-purple-500 shadow-sm flex items-center justify-center`}>
                              <span className="text-[10px]">📊</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{stat.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5 font-bold">
                                {stat.scans} Scans
                              </p>
                            </div>
                          </div>
                        ))
                      )
                    ) : activeModalTitle === 'Top Selling Dish' ? (
                      chartData.slice(0, 3).length === 0 ? (
                        <p className="text-sm font-medium text-gray-400 text-center py-4">No dish data available.</p>
                      ) : (
                        chartData.slice(0, 3).map((dish, index) => (
                          <div key={index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                            {index !== chartData.slice(0, 3).length - 1 && (
                              <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-white/10"></div>
                            )}
                            <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white/10 bg-orange-500 shadow-sm flex items-center justify-center">
                              <span className="text-[10px]">🏆</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">Rank #{index + 1}: {dish.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5 font-bold">{dish.views} Views this week</p>
                            </div>
                          </div>
                        ))
                      )
                    ) : activeModalTitle === 'Total Tables' ? (
                      allTablesList.length === 0 ? (
                        <p className="text-sm font-medium text-gray-400 text-center py-4">No tables registered yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {allTablesList.map((table, index) => {
                            const cleanTableNo = String(table.table_no).replace(/^table\s+/i, '');
                            const isOccupied = activeOrders.some(o => {
                              const orderTableNo = String(o.table_no).replace(/^table\s+/i, '').toLowerCase();
                              return orderTableNo === cleanTableNo.toLowerCase();
                            });
                            return (
                              <div
                                key={table.id || index}
                                className={`p-4 rounded-2xl border transition-all ${isOccupied ? 'border-amber-500/20 bg-amber-500/[0.03] shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-white/5 bg-white/[0.01]'}`}
                              >
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Table</span>
                                <h4 className="font-black text-white text-lg leading-none mb-3">{cleanTableNo}</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isOccupied ? 'text-amber-400' : 'text-emerald-500'}`}>
                                    {isOccupied ? 'Occupied' : 'Empty'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
                <div className="px-6 py-4 bg-white/[0.01] border-t border-white/10 text-center">
                  <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">
                    {activeModalTitle === 'Total Tables' ? (
                      <span className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <span>Total Occupied</span>
                        <span className="text-amber-400 font-black text-sm">
                          {allTablesList.filter(t => {
                            const cleanT = String(t.table_no).replace(/^table\s+/i, '').toLowerCase();
                            return activeOrders.some(o => String(o.table_no).replace(/^table\s+/i, '').toLowerCase() === cleanT);
                          }).length} / {allTablesList.length}
                        </span>
                      </span>
                    ) : (activeModalTitle === 'Estimated Revenue' || activeModalTitle === 'Total Scans') ? 'Showing last 3 months' : 'Showing top 3 dishes'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes fadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        .animate-fade-in-up { 
          animation: fadeInUp 0.4s ease forwards; 
        }
        .animate-fade-in { 
          animation: fadeIn 0.4s ease forwards; 
        }
      `}</style>
    </div>
  );
}