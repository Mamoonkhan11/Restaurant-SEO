"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  return (
    <div className="p-4 sm:p-8 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-gray-500">Welcome back! Here's what's happening with your digital menu today.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Scans</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-0.5">1,440</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Top Selling Dish</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5 truncate max-w-[140px]">Wagyu Burger</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Revenue Est.</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-0.5">$4,250</p>
            </div>
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
    </div>
  );
}
