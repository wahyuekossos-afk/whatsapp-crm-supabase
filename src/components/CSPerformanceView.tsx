import React, { useState, useMemo } from 'react';
import { Lead, CSUser, MetaChat } from '../types';
import { formatRupiah, calculateResponseMinutes, formatResponseTime } from '../utils/spreadsheet';
import { 
  Award, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Search, 
  Filter, 
  Database, 
  TrendingDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
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
  metaChats?: MetaChat[];
}

export const CSPerformanceView: React.FC<CSPerformanceViewProps> = ({ 
  leads, 
  csList, 
  activeDashboardName,
  metaChats = []
}) => {
  const [subTab, setSubTab] = useState<'leaderboard' | 'summary-chat'>('leaderboard');
  
  // State for filtering summary chat
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryCSFilter, setSummaryCSFilter] = useState('');
  const [mismatchOnly, setMismatchOnly] = useState(false);

  // --- LEADERBOARD LOGIC & CALCULATIONS ---
  const csStats = useMemo(() => {
    return csList.map((cs) => {
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
  }, [leads, csList]);

  // Chart data for Sales Flow distribution
  const flowCategoryData = useMemo(() => {
    return [
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
  }, [leads]);

  // Chart data for Lost reasons
  const lostChartData = useMemo(() => {
    const lostReasonsCount: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.kategoriFlow === 'Lost' && l.alasanLost) {
        lostReasonsCount[l.alasanLost] = (lostReasonsCount[l.alasanLost] || 0) + 1;
      }
    });

    return Object.entries(lostReasonsCount).map(([reason, value]) => ({
      name: reason,
      value,
    }));
  }, [leads]);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#6366f1', '#ec4899'];

  // --- SUMMARY CHAT PIVOT TABLE LOGIC (SUPABASE LEADS VS META TARGETS) ---
  const allDates = useMemo(() => {
    const dates = new Set<string>();
    leads.forEach((l) => {
      if (l.tanggalMasuk) {
        dates.add(l.tanggalMasuk);
      }
    });
    metaChats.forEach((m) => {
      if (m.tanggal) {
        dates.add(m.tanggal);
      }
    });
    // Sort descending so the newest dates appear at the very top! No horizontal scroll needed.
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [leads, metaChats]);

  const summaryData = useMemo(() => {
    return allDates.map((date) => {
      const csData = csList.map((cs) => {
        // Count actual leads generated in CRM (Supabase)
        const csLeadCount = leads.filter(
          (l) => l.namaCS === cs.nama && l.tanggalMasuk === date
        ).length;

        // Find meta target chats count entered by admin
        const metaEntry = metaChats.find(
          (m) => m.tanggal === date && m.namaCS === cs.nama
        );
        const metaCount = metaEntry ? metaEntry.chatCount : 0;
        
        const exactMatch = csLeadCount === metaCount;
        const isExceeding = csLeadCount > metaCount;
        const isUnder = csLeadCount < metaCount;
        const isOk = exactMatch || isExceeding;

        return {
          csName: cs.nama,
          csLeadCount,
          metaCount,
          exactMatch,
          isExceeding,
          isUnder,
          isOk,
          difference: csLeadCount - metaCount
        };
      });

      // A date row is flagged as mismatch (red date) only if at least one CS is under performing (isUnder)
      const anyMismatch = csData.some((cd) => cd.isUnder);

      // Extract general date condition or fallback to first CS condition on that date
      const generalEntry = metaChats.find((m) => m.tanggal === date && !m.namaCS);
      const anyCondEntry = metaChats.find((m) => m.tanggal === date && m.kondisi);
      const kondisi = generalEntry?.kondisi || anyCondEntry?.kondisi || '';

      return {
        date,
        csData,
        anyMismatch,
        kondisi
      };
    });
  }, [allDates, csList, leads, metaChats]);

  // Apply UI filters to summary data
  const filteredSummary = useMemo(() => {
    return summaryData.filter((row) => {
      // Filter by Date search input
      if (summarySearch && !row.date.includes(summarySearch)) {
        return false;
      }

      // Filter by mismatch status
      if (mismatchOnly && !row.anyMismatch) {
        return false;
      }

      // Filter by CS name
      if (summaryCSFilter) {
        const hasCS = row.csData.some((cd) => cd.csName === summaryCSFilter);
        if (!hasCS) return false;
      }

      return true;
    });
  }, [summaryData, summarySearch, mismatchOnly, summaryCSFilter]);

  // Total summary aggregates
  const totalCRMLeads = useMemo(() => {
    let sum = 0;
    filteredSummary.forEach((row) => {
      row.csData.forEach((cd) => {
        if (!summaryCSFilter || cd.csName === summaryCSFilter) {
          sum += cd.csLeadCount;
        }
      });
    });
    return sum;
  }, [filteredSummary, summaryCSFilter]);

  const totalMetaChats = useMemo(() => {
    let sum = 0;
    filteredSummary.forEach((row) => {
      row.csData.forEach((cd) => {
        if (!summaryCSFilter || cd.csName === summaryCSFilter) {
          sum += cd.metaCount;
        }
      });
    });
    return sum;
  }, [filteredSummary, summaryCSFilter]);

  return (
    <div className="space-y-6 mb-8">
      {/* Sub-Tab Navigation Bar */}
      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex gap-2 w-fit">
        <button
          onClick={() => setSubTab('leaderboard')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'leaderboard'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>Leaderboard &amp; Analitik CS</span>
        </button>
        <button
          onClick={() => setSubTab('summary-chat')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            subTab === 'summary-chat'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>Summary Chat</span>
          {metaChats.length > 0 && (
            <span className="bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">
              {metaChats.length}
            </span>
          )}
        </button>
      </div>

      {subTab === 'leaderboard' ? (
        <>
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
        </>
      ) : (
        // --- NEW SUMMARY CHAT VIEW TAB ---
        <div className="space-y-4">
          {/* Header & Mini Widgets info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>Kesesuaian Chat Masuk vs Meta Ad Leads</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan rekapitulasi data chat masuk CS di database CRM dibandingkan dengan target input iklan Meta
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-900 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>
                  Newest-On-Top: Terurut dari tanggal terbaru ke tanggal terlama.
                </span>
              </div>
            </div>

            {/* Performance Stats Cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total CRM Chat Terinput</span>
                <span className="text-lg font-black text-slate-800">{totalCRMLeads} <span className="text-xs font-bold text-slate-500">Leads</span></span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Meta Target Chats</span>
                <span className="text-lg font-black text-indigo-700">{totalMetaChats} <span className="text-xs font-bold text-slate-500">Target</span></span>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <span className="text-[10px] text-red-600 font-bold uppercase block">Status Kecocokan</span>
                <span className="text-sm font-bold text-red-800 flex items-center gap-1.5 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Cek selisih tanggal bertanda merah</span>
                </span>
              </div>
            </div>

            {/* Filter controls panel */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={summarySearch}
                    onChange={(e) => setSummarySearch(e.target.value)}
                    placeholder="Cari Tanggal (YYYY-MM-DD)..."
                    className="pl-8 pr-3 py-1.5 w-48 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-700 bg-white"
                  />
                </div>

                {/* CS Selector filter */}
                <div className="flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={summaryCSFilter}
                    onChange={(e) => setSummaryCSFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-slate-300 rounded font-semibold text-slate-700 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Semua Petugas CS --</option>
                    {csList.map((cs) => (
                      <option key={cs.id} value={cs.nama}>
                        👤 {cs.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mismatch toggle checkbox */}
                <label className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer select-none hover:opacity-85">
                  <input
                    type="checkbox"
                    checked={mismatchOnly}
                    onChange={(e) => setMismatchOnly(e.target.checked)}
                    className="w-4 h-4 border-slate-300 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <span>⚠️ Hanya Tampilkan Tanggal Tidak Sesuai</span>
                </label>
              </div>

              {/* Reset filter button */}
              {(summarySearch || summaryCSFilter || mismatchOnly) && (
                <button
                  onClick={() => {
                    setSummarySearch('');
                    setSummaryCSFilter('');
                    setMismatchOnly(false);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-all cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Pivot Table Grid - No horizontal scroll for newest dates! */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5 pl-5 w-44">Tanggal</th>
                    {csList.map((cs) => (
                      <th key={cs.id} className="p-3.5 min-w-48 text-center border-l border-slate-100">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-slate-800 text-[11px] font-black">{cs.nama}</span>
                          <span className="text-[9px] text-slate-400 normal-case font-medium">{cs.clientName || 'Global'}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummary.length > 0 ? (
                    filteredSummary.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-50/50 transition-colors">
                        {/* TANGGAL CELL: Colored red if mismatch occurs in this date */}
                        <td className="p-3.5 pl-5 font-bold text-xs">
                          <div className="flex flex-col gap-1.5 items-start">
                            {row.anyMismatch ? (
                              <div className="flex items-center gap-1.5">
                                <span className="bg-red-500 hover:bg-red-600 text-white font-extrabold px-2.5 py-1 rounded shadow-xs flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-white" />
                                  <span>{row.date}</span>
                                </span>
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Kesesuaian Bermasalah" />
                              </div>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded inline-flex items-center gap-1">
                                <span>📅 {row.date}</span>
                              </span>
                            )}

                            {row.kondisi && (
                              <div className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 rounded px-2 py-1 flex items-start gap-1 max-w-[170px] whitespace-normal break-words shadow-2xs">
                                <span className="text-amber-500 mt-0.5">📝</span>
                                <span>{row.kondisi}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* CS CELLS */}
                        {csList.map((cs) => {
                          const cellData = row.csData.find((cd) => cd.csName === cs.nama) || {
                            csName: cs.nama,
                            csLeadCount: 0,
                            metaCount: 0,
                            exactMatch: true,
                            isExceeding: false,
                            isUnder: false,
                            isOk: true,
                            difference: 0
                          };

                          return (
                            <td 
                              key={cs.id} 
                              className={`p-3 text-xs border-l border-slate-100 transition-all ${
                                cellData.isUnder 
                                  ? 'bg-red-50/40 border-y border-red-100' 
                                  : cellData.isExceeding
                                    ? 'bg-emerald-50/20 border-y border-emerald-100/50'
                                    : 'hover:bg-slate-100/10'
                              }`}
                            >
                              <div className="space-y-1.5 flex flex-col items-center">
                                {/* Stats count comparisons */}
                                <div className="grid grid-cols-2 gap-3 w-36">
                                  <div className="bg-white px-2 py-1 border border-slate-100 rounded text-center shadow-xs">
                                    <span className="text-[9px] text-slate-400 font-bold block">CRM</span>
                                    <strong className="text-slate-800 font-black text-xs">{cellData.csLeadCount}</strong>
                                  </div>
                                  <div className="bg-white px-2 py-1 border border-slate-100 rounded text-center shadow-xs">
                                    <span className="text-[9px] text-slate-400 font-bold block">Meta</span>
                                    <strong className="text-indigo-700 font-black text-xs">{cellData.metaCount}</strong>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                {cellData.exactMatch && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Sesuai</span>
                                  </span>
                                )}
                                {cellData.isExceeding && (
                                  <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full shadow-xs">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                    <span>Lebih (+{cellData.difference})</span>
                                  </span>
                                )}
                                {cellData.isUnder && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-black rounded-full border border-red-200">
                                    <XCircle className="w-2.5 h-2.5 text-red-600" />
                                    <span>Selisih: {cellData.difference}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={csList.length + 1} className="p-10 text-center text-slate-400 text-xs">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="w-8 h-8 text-slate-300" />
                          <span>Tidak ada data kecocokan yang ditemukan. Silakan input target di Admin Management.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
