import React from 'react';
import { Lead, CSUser } from '../types';
import { formatRupiah, calculateResponseMinutes, formatResponseTime } from '../utils/spreadsheet';
import { Award, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface CSPerformanceViewProps {
  leads: Lead[];
  csList: CSUser[];
  activeDashboardName?: string;
}

export const CSPerformanceView: React.FC<CSPerformanceViewProps> = ({ leads, csList, activeDashboardName }) => {
  // Aggregate stats per CS
  const csStats = csList.map((cs) => {
    const csLeads = leads.filter((l) => l.namaCS === cs.nama);
    const totalCount = csLeads.length;

    const closed = csLeads.filter(
      (l) => l.kategoriFlow === 'First Order' || l.kategoriFlow === 'Repeat Order'
    );
    const closedCount = closed.length;
    const revenue = closed.reduce((acc, l) => acc + (l.totalInvoice || 0), 0);

    const lostCount = csLeads.filter((l) => l.kategoriFlow === 'Lost').length;

    const conversionRate = totalCount > 0 ? (closedCount / totalCount) * 100 : 0;

    let responseSum = 0;
    let responseN = 0;
    csLeads.forEach((l) => {
      if (l.jamMasuk && l.jamBalas) {
        responseSum += calculateResponseMinutes(l.jamMasuk, l.jamBalas);
        responseN++;
      }
    });
    const avgResponseMin = responseN > 0 ? Math.round(responseSum / responseN) : 0;

    return {
      csName: cs.nama,
      role: cs.role,
      avatar: cs.avatar,
      totalCount,
      closedCount,
      revenue,
      lostCount,
      conversionRate: Number(conversionRate.toFixed(1)),
      avgResponseMin,
    };
  });

  // Chart data for Sales Flow distribution
  const flowCategoryData = [
    'New Leads',
    'Qualified',
    'Quotation',
    'Follow Up',
    'First Order',
    'Repeat Order',
    'Lost',
  ].map((cat) => ({
    name: cat,
    total: leads.filter((l) => l.kategoriFlow === cat).length,
  }));

  // Chart data for Lost reasons
  const lostReasonsCount: Record<string, number> = {};
  leads.forEach((l) => {
    if (l.kategoriFlow === 'Lost' && l.alasanLost) {
      lostReasonsCount[l.alasanLost] = (lostReasonsCount[l.alasanLost] || 0) + 1;
    }
  });

  const lostChartData = Object.entries(lostReasonsCount).map(([reason, value]) => ({
    name: reason,
    value,
  }));

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#6366f1', '#ec4899'];

  return (
    <div className="space-y-6 mb-8">
      {/* CS Leaderboard Cards */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Leaderboard &amp; Performa Tim CS
              </h3>
              <p className="text-xs text-slate-500">
                Evaluasi closing rate, omset deals, dan respon speed masing-masing CS
              </p>
            </div>
          </div>

          {/* Active Client Badge */}
          {activeDashboardName && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>
                Dipisah untuk Klien: <strong className="font-black text-emerald-950 underline decoration-emerald-400">{activeDashboardName}</strong>
              </span>
              <span className="ml-1 bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {leads.length} leads
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {csStats.map((cs) => (
            <div key={cs.csName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={cs.avatar}
                  alt={cs.csName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300"
                />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{cs.csName}</h4>
                  <p className="text-[11px] text-slate-500">{cs.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                <div className="bg-white p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Leads</span>
                  <span className="font-black text-slate-900 text-sm">{cs.totalCount} leads</span>
                </div>

                <div className="bg-emerald-50/70 p-2 rounded border border-emerald-100">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Closing Rate</span>
                  <span className="font-black text-emerald-800 text-sm">{cs.conversionRate}%</span>
                </div>

                <div className="bg-white p-2 rounded border border-slate-100 col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Omset Closing</span>
                  <span className="font-black text-emerald-700 text-sm">{formatRupiah(cs.revenue)}</span>
                </div>

                <div className="bg-slate-100 p-2 rounded col-span-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Respon CS:
                  </span>
                  <span className="font-bold text-slate-900">{formatResponseTime(cs.avgResponseMin)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-4">
            Distribusi Lead per Pipeline Stage
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowCategoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lost Reason Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Breakdown Utama Alasan Lost
          </h4>
          {lostChartData.length > 0 ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lostChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {lostChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              Belum ada lead berkategori Lost.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
