"use client";
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';

// Mock Data for the chart
const scanData = [
  { name: 'Mon', scans: 120 },
  { name: 'Tue', scans: 150 },
  { name: 'Wed', scans: 180 },
  { name: 'Thu', scans: 140 },
  { name: 'Fri', scans: 250 },
  { name: 'Sat', scans: 320 },
  { name: 'Sun', scans: 280 },
];

const recentActivity = [
  { id: 1, action: 'Marked as Sold Out', item: 'Spicy Chicken Wrap', time: '2 hours ago' },
  { id: 2, action: 'Marked as Sold Out', item: 'New York Cheesecake', time: '5 hours ago' },
  { id: 3, action: 'Price Updated to $18.50', item: 'Wagyu Beef Burger', time: '1 day ago' },
];

export default function AdminDashboardOverview() {
  const [ownerName, setOwnerName] = useState('...');
  const [totalItems, setTotalItems] = useState<number | string>('-');
  const [totalScans, setTotalScans] = useState<number | string>('-');
  const [topDish, setTopDish] = useState<string>('-');
  
  // Estimated Revenue States
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [aov, setAov] = useState<number>(500); // Default AOV if missing
  const [revenueCounter, setRevenueCounter] = useState(0);
  const [isEditingAov, setIsEditingAov] = useState(false);
  const [newAov, setNewAov] = useState<number | string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setOwnerName(session.user.user_metadata?.full_name || 'Owner');

      // Fetch the restaurant profile
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, slug, average_order_value')
        .eq('owner_id', session.user.id)
        .single();
        
      if (restaurant) {
        setRestaurantId(restaurant.id);
        if (restaurant.average_order_value) {
          setAov(restaurant.average_order_value);
        }

        // Calculate Total Items
        const { count: dishCount } = await supabase
          .from('dishes')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', session.user.id);
        
        setTotalItems(dishCount ?? 0);

        // Calculate Total Scans
        const { count: scansCount } = await supabase
          .from('restaurant_views')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_slug', restaurant.slug);
        
        setTotalScans(scansCount ?? 0);

        // Fetch Top Selling Dish
        const { data: topDishes } = await supabase
          .from('dishes')
          .select('name')
          .eq('owner_id', session.user.id)
          .order('order_count', { ascending: false })
          .limit(1);
        
        if (topDishes && topDishes.length > 0) {
          setTopDish(topDishes[0].name);
        } else {
          setTopDish('N/A');
        }
      }
    };
    
    fetchDashboardData();
  }, []);

  // Animated Count-Up for Revenue
  useEffect(() => {
    if (typeof totalScans !== 'number') return;
    
    const targetRev = totalScans * aov;
    if (targetRev === 0) {
      setRevenueCounter(0);
      return;
    }

    let currentRev = 0;
    const duration = 1500; // 1.5 seconds
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

  return (
    <div className="p-4 sm:p-8 relative">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome, {ownerName}</h1>
          <p className="mt-1 text-gray-500">Here's what's happening with your digital menu today.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Estimated Revenue Card (Modern Analytic Style) */}
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex flex-col justify-between hover:shadow-md transition-shadow relative group">
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
                      type="number" 
                      value={newAov} 
                      onChange={e => setNewAov(e.target.value)}
                      placeholder="AOV"
                      className="w-14 px-2 py-1 text-xs font-bold border border-emerald-300 rounded-lg bg-white text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-center"
                      autoFocus
                    />
                    <button onClick={handleSaveAov} className="text-xs font-bold text-white bg-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors">Save</button>
                  </div>
                ) : (
                  <button onClick={() => { setIsEditingAov(true); setNewAov(aov); }} className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 hover:bg-emerald-100/50 px-2 py-1 rounded-md">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Edit AOV
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Total Scans Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Scans</p>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{totalScans}</p>
          </div>
          
          {/* Top Dish Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
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
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">QR Code Scans (Last 7 Days)</h3>
              <p className="text-sm text-gray-500">Track your daily menu engagement.</p>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scanData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1f2937', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="scans" stroke="#2563eb" strokeWidth={4} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
               <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6 flex-1">
              <div className="space-y-6">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="relative pl-6">
                    {/* Timeline line */}
                    {index !== recentActivity.length - 1 && (
                      <div className="absolute left-[7px] top-6 bottom-[-24px] w-0.5 bg-gray-100"></div>
                    )}
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-sm"></div>
                    
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{activity.item}</p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center">
              <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                View All Activity
              </button>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fade-in-up { 
          animation: fadeInUp 0.3s ease forwards; 
        }
      `}</style>
    </div>
  );
}
