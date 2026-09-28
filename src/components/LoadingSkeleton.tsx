import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded-md w-3/4" />
        <div className="h-3 bg-slate-100 rounded-md w-1/2" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 bg-slate-100 rounded-md w-full" />
      <div className="h-3 bg-slate-100 rounded-md w-5/6" />
    </div>
    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
      <div className="h-4 bg-slate-200 rounded-md w-1/4" />
      <div className="h-8 bg-slate-200 rounded-xl w-1/3" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs animate-pulse">
    <div className="h-12 bg-slate-50 border-b border-slate-100 px-6 flex items-center gap-4">
      <div className="h-4 bg-slate-200 rounded-md w-1/6" />
      <div className="h-4 bg-slate-200 rounded-md w-1/4" />
      <div className="h-4 bg-slate-200 rounded-md w-1/6" />
      <div className="h-4 bg-slate-200 rounded-md w-1/6" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 px-6 flex items-center gap-4">
          <div className="h-4 bg-slate-100 rounded-md w-1/6" />
          <div className="h-4 bg-slate-200 rounded-md w-1/4" />
          <div className="h-4 bg-slate-100 rounded-md w-1/6" />
          <div className="h-4 bg-slate-100 rounded-md w-1/6" />
        </div>
      ))}
    </div>
  </div>
);

export const DashboardCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded-md w-24" />
        <div className="h-7 bg-slate-300 rounded-md w-16" />
      </div>
      <div className="w-12 h-12 rounded-2xl bg-slate-100" />
    </div>
  </div>
);
