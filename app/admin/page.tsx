"use client";
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function AdminDashboardOverview() {
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

  const [isLoading, setIsLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('...');
  const [totalItems, setTotalItems] = useState<number | string>('-');
  const [totalScans, setTotalScans] = useState<number | string>('-');
  const [topDish, setTopDish] = useState<string>('-');
  
  // Real Data States
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Estimated Revenue States
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [aov, setAov] = useState<number>(500);
  const [revenueCounter, setRevenueCounter] = useState(0);
  const [isEditingAov, setIsEditingAov] = useState(false);
  const [newAov, setNewAov] = useState<number | string>('');
  const [activeModalTitle, setActiveModalTitle] = useState<string | null>(null);
  const [historicalStats, setHistoricalStats] = useState<any[]>([]);

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
        .select('id, slug, average_order_value')
        .eq('owner_id', user.id)
        .single();
        
      if (error || !restaurant) {
        // 5. Loading UI: Redirect if no restaurant found
        router.push('/admin/settings');
        return;
      }

      // 4. State Management: Store restaurantId
      setRestaurantId(restaurant.id);
      
      if (restaurant.average_order_value) {
        setAov(restaurant.average_order_value);
      }

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

      const { count: scansCount } = await supabase
        .from('restaurant_views')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_slug', restaurant.slug)
        .gte('created_at', firstDayOfMonth);
      
      setTotalScans(scansCount ?? 0);

      const { data: dishesData } = await supabase
        .from('dishes')
        .select('name, view_count')
        .eq('owner_id', user.id)
        .order('view_count', { ascending: false })
        .limit(7);
      
      if (dishesData && dishesData.length > 0) {
        setTopDish(dishesData[0].name);
        setChartData(dishesData.map(d => ({
          name: d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name,
          views: d.view_count || 0
        })));
      } else {
        setTopDish('N/A');
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
      };
    };
    
    const cleanup = fetchDashboardData();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [router]);

  // Animated Count-Up for Revenue
  useEffect(() => {
    if (typeof totalScans !== 'number') return;
    
    const targetRev = totalScans * aov;
    if (targetRev === 0) {
      setRevenueCounter(0);
      return;
    }

    let currentRev = 0;
    const duration = 1500;
    const interval = 20;
    const step = Math.max(targetRev / (duration / interval), 1);
    
    const timer = setInterval(() => {
      currentRev += step;
      if (currentRev >= targetRev) {
        setRevenueCounter(targetRev);
        clearInterval(timer);
      } else {
        setRevenueCounter(Math.floor(currentRev));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [totalScans, aov]);

  const handleSaveAov = async () => {
    if (!restaurantId || !newAov) return;
    
    const parsedAov = Number(newAov);
    if (isNaN(parsedAov) || parsedAov < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const { error } = await supabase
      .from('restaurants')
      .update({ average_order_value: parsedAov })
      .eq('id', restaurantId);

    if (error) {
      toast.error('Failed to update AOV');
    } else {
      setAov(parsedAov);
      setIsEditingAov(false);
      toast.success('Average Order Value updated!', { style: { background: '#000', color: '#fff' }});
    }
  };

  // Modern Skeleton Loading State
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Estimated Revenue Card */}
          <div onClick={() => setActiveModalTitle('Estimated Revenue')} className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex flex-col justify-between hover:shadow-md transition-shadow relative group cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Estimated Revenue</p>
                <div className="relative flex items-center justify-center cursor-help">
                  <div className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] font-bold shadow-sm hover:bg-emerald-300 transition-colors">?</div>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-52 p-3 bg-gray-900 text-white text-xs font-medium rounded-xl shadow-xl z-10 text-center leading-relaxed">
                    This is calculated by multiplying your total QR scans by your average bill amount.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>

            <div>
              <p className="text-3xl font-extrabold text-emerald-900 mt-0.5 tracking-tight">
                ₹{revenueCounter.toLocaleString('en-IN')}
              </p>
              
              <div className="mt-3 flex items-center justify-between h-8">
                <p className="text-xs text-emerald-600 font-semibold bg-emerald-100/50 px-2 py-1 rounded-md">
                  Based on {totalScans} scans
                </p>
                
                {isEditingAov ? (
                  <div className="flex items-center gap-1.5 animate-fade-in-up">
                    <span className="text-xs font-bold text-emerald-700">₹</span>
                    <input 
                      onClick={e => e.stopPropagation()}
                      type="number" 
                      value={newAov} 
                      onChange={e => setNewAov(e.target.value)}
                      placeholder="AOV"
                      className="w-14 px-2 py-1 text-xs font-bold border border-emerald-300 rounded-lg bg-white text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-center"
                      autoFocus
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleSaveAov(); }} className="text-xs font-bold text-white bg-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors">Save</button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setIsEditingAov(true); setNewAov(aov); }} className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 hover:bg-emerald-100/50 px-2 py-1 rounded-md">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Edit AOV
                  </button>
                )}
              </div>
            </div>
          </div>

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
          
          {/* Top Dish Card */}
          <div onClick={() => setActiveModalTitle('Top Selling Dish')} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Top Selling Dish</p>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>
              </div>
            </div>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5 truncate max-w-[140px]" title={topDish}>{topDish}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Line Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Menu Item Views</h3>
              <p className="text-sm text-gray-500">Track which dishes customers are looking at the most.</p>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
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
                {(activeModalTitle === 'Estimated Revenue' || activeModalTitle === 'Total Scans') ? (
                  historicalStats.length === 0 ? (
                    <p className="text-sm font-medium text-gray-500 text-center py-4">No historical data available.</p>
                  ) : (
                    historicalStats.map((stat, index) => (
                      <div key={index} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        {index !== historicalStats.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-100"></div>
                        )}
                        <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border-2 border-white ${activeModalTitle === 'Estimated Revenue' ? 'bg-emerald-500' : 'bg-purple-500'} shadow-sm flex items-center justify-center`}>
                          <span className="text-[10px]">{activeModalTitle === 'Estimated Revenue' ? '💰' : '📊'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{stat.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-bold">
                            {activeModalTitle === 'Total Scans' ? `${stat.scans} Scans` : `₹${(stat.scans * aov).toLocaleString('en-IN')} Est. Revenue`}
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
