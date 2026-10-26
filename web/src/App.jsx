import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
        <h1 className="text-3xl font-extrabold text-emerald-600 mb-2">VietGuide Web</h1>
        <p className="text-slate-600 mb-6">Cổng thông tin Du lịch Việt Nam & Quản trị</p>
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl font-medium text-sm border border-emerald-200">
          ✓ React + Vite + Tailwind CSS sẵn sàng
        </div>
      </div>
    </div>
  );
}