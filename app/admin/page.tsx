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
import { X, Lock, TrendingUp, Sparkles } from 'lucide-react';
import { useSubscription } from '@/lib/useSubscription';

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
  const [audioMuted, setAudioMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/order_tune.mp3');
      audio.preload = 'auto';
      audio.volume = 0.6;
      audioRef.current = audio;

      // Autoplay precheck/unlocker trigger
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch((err) => {
            console.warn("Autoplay blocked initially, notifying user", err);
            setAudioMuted(true);
          });
      }
    }
  }, []);

  useEffect(() => {
    const handleUnlock = () => {
      if (audioMuted && audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setAudioMuted(false);
            audioRef.current!.pause();
            audioRef.current!.currentTime = 0;
          })
          .catch((e) => {
            console.error("Unlock failed", e);
          });
      }
    };
    window.addEventListener('click', handleUnlock);
    return () => {
      window.removeEventListener('click', handleUnlock);
    };
  }, [audioMuted]);

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
      .channel('live-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.new) {
            setLiveOrders(prev => [payload.new, ...prev]);
            toast.success(`New order received from ${payload.new.table_no}!`, { icon: '🔔' });
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch((e: any) => {
                console.error("Audio play blocked", e);
                setAudioMuted(true);
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.new) {
            setLiveOrders(prev => {
              if (payload.new.status === 'served') {
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

  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col mb-8 relative overflow-hidden min-h-[500px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex flex-wrap items-center gap-2">
            <span>Live Kitchen Orders (KOT)</span>
            {liveOrders.filter(o => o.status === 'pending').length > 0 && (
               <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                 {liveOrders.filter(o => o.status === 'pending').length} Action Required
               </span>
            )}
            {audioMuted && (
              <span className="bg-amber-100 text-amber-800 text-[11px] px-2.5 py-1 rounded-full font-bold border border-amber-200 animate-pulse">
                🔊 Notifications Muted — Click Anywhere to Enable Audio
              </span>
            )}
          </h3>
          <p className="text-sm font-medium text-gray-500 mt-1">Manage real-time incoming orders from your tables.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {liveOrders.map(order => (
          <div key={order.id} className={`p-6 rounded-2xl border ${order.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : order.status === 'preparing' ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 bg-white'} shadow-sm relative transition-all duration-200 ease-in-out hover:shadow-md flex flex-col`}>
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Table</span>
                <h4 className="font-black text-[#111827] text-2xl leading-none">{order.table_no}</h4>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">
                  {timeAgo(order.created_at)}
                </span>
                {order.status === 'pending' && <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending</span>}
                {order.status === 'preparing' && <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Preparing</span>}
                {order.status === 'served' && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Served</span>}
              </div>
            </div>
            
            <div className="space-y-4 mb-6 flex-1">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-sm group transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-[#111827] font-black bg-gray-100 px-2 py-1 rounded-md text-xs">{item.quantity}x</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-[#111827] leading-tight">{item.name}</span>
                      {item.size && item.size !== 'Standard' && <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-0.5">{item.size}</span>}
                    </div>
                  </div>
                  <span className="font-bold text-gray-600 tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black text-[#111827] tabular-nums">₹{Number(order.total_amount || 0).toFixed(2)}</span>
            </div>
            
            <div className="flex gap-3 mt-auto">
              {order.status === 'pending' && (
                <button 
                  onClick={async () => {
                    await supabase.from('orders').update({ status: 'preparing' }).eq('id', order.id);
                  }}
                  className="flex-1 bg-[#111827] hover:bg-black text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Preparing
                </button>
              )}
              {order.status === 'preparing' && (
                <button 
                  onClick={async () => {
                    await supabase.from('orders').update({ status: 'served' }).eq('id', order.id);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
                >
                  Mark as Served
                </button>
              )}
            </div>
          </div>
        ))}
        {liveOrders.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 bg-emerald-50/30 rounded-2xl">
            <div className="w-20 h-20 bg-white shadow-sm text-emerald-300 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h3 className="text-emerald-800 font-black text-xl">No Active Orders</h3>
            <p className="text-emerald-600/70 font-medium mt-1 text-base">Waiting for fresh KOT orders to arrive...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardOverview() {


  const [isLoading, setIsLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('...');
  const [totalItems, setTotalItems] = useState<number | string>('-');
  const [totalScans, setTotalScans] = useState<number | string>('-');
  const [topDish, setTopDish] = useState<string>('-');
  
  // Real Data States
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [activeModalTitle, setActiveModalTitle] = useState<string | null>(null);
  const [historicalStats, setHistoricalStats] = useState<any[]>([]);
  const { planType, canViewRevenue, canViewAllAnalytics } = useSubscription();

  const router = useRouter();
  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Auth Check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      setOwnerName(user.user_metadata?.full_name || 'Owner');

      // 2. Profile Fetch
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('id, slug, average_order_value, plan_type, total_scans')
        .eq('owner_id', user.id)
        .single();
        
      if (error || !restaurant) {
        // 5. Loading UI: Redirect if no restaurant found
        router.push('/admin/settings');
        return;
      }

      // 4. State Management: Store restaurantId
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



      // --- Weekly Reset Logic for Item Views ---
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0,0,0,0);

      const { data: resetLog } = await supabase
        .from('activity_logs')
        .select('created_at')
        .eq('admin_id', user.id)
        .eq('action_type', 'WEEKLY_RESET')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!resetLog || new Date(resetLog.created_at) < monday) {
        await supabase.from('dishes').update({ view_count: 0 }).eq('owner_id', user.id);
        await supabase.from('activity_logs').insert({
          admin_id: user.id,
          restaurant_id: restaurant.id,
          action_type: 'WEEKLY_RESET',
          description: 'Weekly item views reset automatically'
        });
      }

      // 3. Conditional Fetching (Only runs if restaurant is found)
      const { count: dishCount } = await supabase
        .from('dishes')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      setTotalItems(dishCount ?? 0);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: dishesData } = await supabase
        .from('dishes')
        .select('name, view_count')
        .eq('owner_id', user.id)
        .order('view_count', { ascending: false })
        .limit(7);
      
      if (dishesData && dishesData.length > 0) {
        setTopDish(dishesData[0].name);
        
        // Restriction: Free users see only 2 items in chart
        const visibleDishes = canViewAllAnalytics ? dishesData : dishesData.slice(0, 2);
        
        setChartData(visibleDishes.map(d => ({
          name: d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name,
          views: d.view_count || 0
        })));
      } else {
        setTopDish('N/A');
        setChartData([]);
      }

      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const firstDayOf2MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
      const firstDayOf3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();

      const { count: month1 } = await supabase.from('restaurant_views').select('*', { count: 'exact', head: true })
        .eq('restaurant_slug', restaurant.slug).gte('created_at', firstDayOfLastMonth).lt('created_at', firstDayOfMonth);
      const { count: month2 } = await supabase.from('restaurant_views').select('*', { count: 'exact', head: true })
        .eq('restaurant_slug', restaurant.slug).gte('created_at', firstDayOf2MonthsAgo).lt('created_at', firstDayOfLastMonth);
      const { count: month3 } = await supabase.from('restaurant_views').select('*', { count: 'exact', head: true })
        .eq('restaurant_slug', restaurant.slug).gte('created_at', firstDayOf3MonthsAgo).lt('created_at', firstDayOf2MonthsAgo);

      setHistoricalStats([
        { label: 'Last Month', scans: month1 || 0 },
        { label: '2 Months Ago', scans: month2 || 0 },
        { label: '3 Months Ago', scans: month3 || 0 }
      ]);

      const fetchLogs = async () => {
        const { data: logsData, error: logError } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('admin_id', user.id)
          .gte('created_at', monday.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsData && !logError) {
          setRecentActivity(logsData);
        }
      };
      fetchLogs();

      const subscription = supabase
        .channel('public:activity_logs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `admin_id=eq.${user.id}` },
          (payload) => {
            fetchLogs();
          }
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


  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl w-64"></div>
          <div className="h-5 bg-gray-200 rounded-xl w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-gray-200 rounded-3xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <div className="lg:col-span-2 h-[400px] bg-gray-200 rounded-3xl"></div>
          <div className="h-[400px] bg-gray-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 relative animate-fade-in">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome, {ownerName}</h1>
          <p className="mt-1 text-gray-500">Here's what's happening with your digital menu today.</p>
        </div>

        {restaurantId && <LiveOrderQueue restaurantId={restaurantId} />}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Total Scans Card */}
          <div onClick={() => setActiveModalTitle('Total Scans')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Scans</p>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{totalScans}</p>
          </div>
          
          <div onClick={() => canViewAllAnalytics && setActiveModalTitle('Top Selling Dish')} className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group ${!canViewAllAnalytics ? 'cursor-default' : 'cursor-pointer'}`}>
            {!canViewAllAnalytics && (
              <div className="absolute inset-0 z-10 bg-white/75 backdrop-blur-[4px] rounded-2xl flex flex-col items-center justify-center border border-white/20 p-4 text-center">
                <div className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg mb-2 flex items-center gap-1 uppercase tracking-widest">
                  <Lock className="w-3 h-3"/> Locked
                </div>
                <p className="text-[11px] text-orange-900 font-extrabold leading-tight">Advanced Analytics Required</p>
                <Link href="/admin/billing" className="mt-2 text-[10px] bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold hover:bg-orange-200 transition-colors pointer-events-auto">Unlock with Pro</Link>
              </div>
            )}
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Top Selling Dish</p>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>
              </div>
            </div>
            <p className={`text-xl font-extrabold text-gray-900 mt-0.5 truncate max-w-[140px] ${!canViewAllAnalytics ? 'blur-[4px]' : ''}`} title={topDish}>
              {canViewAllAnalytics ? topDish : 'XXXXXXXXXX'}
            </p>
          </div>
          
          {/* Total Items Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Items</p>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{totalItems}</p>
          </div>
        </div>



        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Line Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative">
            {!canViewAllAnalytics && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-end pb-12">
                <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-xs text-center border border-gray-100 mb-4 animate-fade-in-up">
                   <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                     <Lock className="w-6 h-6" />
                   </div>
                   <h3 className="text-gray-900 font-bold mb-2">Want to see your top-performing items?</h3>
                   <p className="text-sm text-gray-500 mb-6">Unlock Advanced Analytics with Pro to track all dish views and growth trends.</p>
                   <Link href="/admin/billing" className="bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl w-full pointer-events-auto hover:bg-blue-700 transition-colors shadow-md">
                     Unlock All Insights
                   </Link>
                </div>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Menu Item Views</h3>
              <p className="text-sm text-gray-500">Track which dishes customers are looking at the most.</p>
            </div>
            <div className="h-[300px] w-full mt-4">
              {chartData.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 30, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={15} angle={-25} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                   <p className="text-gray-400 font-medium text-sm">No view data available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
               <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6 flex-1 overflow-y-auto max-h-[350px]">
              <div className="space-y-6">
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <svg className="w-10 h-10 text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-sm font-medium text-gray-500">No recent activity.</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => {
                    let Icon = <span className="text-[10px]">📝</span>;
                    let bgColor = "bg-blue-500";
                    
                    if (activity.action_type === 'STOCK_UPDATE') {
                      Icon = <span className="text-[10px]">📦</span>;
                      bgColor = "bg-orange-500";
                    } else if (activity.action_type === 'SETTINGS_CHANGE') {
                      Icon = <span className="text-[10px]">⚙️</span>;
                      bgColor = "bg-gray-700";
                    } else if (activity.action_type === 'MENU_CHANGE') {
                      Icon = <span className="text-[10px]">🍔</span>;
                      bgColor = "bg-green-500";
                    }
                    
                    return (
                      <div key={activity.id || index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        {/* Timeline line */}
                        {index !== recentActivity.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-100"></div>
                        )}
                        {/* Dot */}
                        <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white ${bgColor} shadow-sm flex items-center justify-center`}>
                          {Icon}
                        </div>
                        
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{activity.description || activity.action}</p>
                          {activity.item_name && !activity.description && <p className="text-sm text-gray-500 mt-0.5">{activity.item_name}</p>}
                          <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-wider uppercase">
                            {timeAgo(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {recentActivity.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center">
                <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  View All Activity
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* History Log Modal */}
      {activeModalTitle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-gray-100 flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {activeModalTitle} <span className="text-gray-400 font-medium text-base ml-1">History</span>
              </h3>
              <button onClick={() => setActiveModalTitle(null)} className="text-gray-400 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {activeModalTitle === 'Total Scans' ? (
                  historicalStats.length === 0 ? (
                    <p className="text-sm font-medium text-gray-500 text-center py-4">No historical data available.</p>
                  ) : (
                    historicalStats.map((stat, index) => (
                      <div key={index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        {index !== historicalStats.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-100"></div>
                        )}
                        <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white bg-purple-500 shadow-sm flex items-center justify-center`}>
                          <span className="text-[10px]">📊</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{stat.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-bold">
                            {stat.scans} Scans
                          </p>
                        </div>
                      </div>
                    ))
                  )
                ) : activeModalTitle === 'Top Selling Dish' ? (
                  chartData.slice(0, 3).length === 0 ? (
                    <p className="text-sm font-medium text-gray-500 text-center py-4">No dish data available.</p>
                  ) : (
                    chartData.slice(0, 3).map((dish, index) => (
                      <div key={index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        {index !== chartData.slice(0, 3).length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-100"></div>
                        )}
                        <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white bg-orange-500 shadow-sm flex items-center justify-center">
                          <span className="text-[10px]">🏆</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Rank #{index + 1}: {dish.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-bold">{dish.views} Views this week</p>
                        </div>
                      </div>
                    ))
                  )
                ) : null}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                {(activeModalTitle === 'Estimated Revenue' || activeModalTitle === 'Total Scans') ? 'Showing last 3 months' : 'Showing top 3 dishes'}
              </p>
            </div>
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
