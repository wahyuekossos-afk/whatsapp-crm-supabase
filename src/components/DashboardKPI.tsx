import React from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { Lead, KPITargets } from '../types';
import { formatRupiah, calculateResponseMinutes, formatResponseTime } from '../utils/spreadsheet';

interface DashboardKPIProps {
  leads: Lead[];
  kpiTargets?: KPITargets;
}

export const DashboardKPI: React.FC<DashboardKPIProps> = ({ leads, kpiTargets }) => {
  const targetConversionRate = kpiTargets?.conversionRate ?? 15;
  const targetAvgResponseMinutes = kpiTargets?.avgResponseMinutes ?? 5;

  const totalLeads = leads.length;

  // Closed Won = First Order + Repeat Order
  const closedLeads = leads.filter(
    (l) => l.kategoriFlow === 'First Order' || l.kategoriFlow === 'Repeat Order'
  );
  const closedCount = closedLeads.length;

  // Lost Leads
  const lostLeads = leads.filter((l) => l.kategoriFlow === 'Lost');
  const lostCount = lostLeads.length;

  // Revenue = Sum of totalInvoice from closed leads
  const totalRevenue = closedLeads.reduce((acc, l) => acc + (l.totalInvoice || 0), 0);

  // Conversion rate %
  const conversionRate = totalLeads > 0 ? ((closedCount / totalLeads) * 100).toFixed(1) : '0';

  // Lost rate %
  const lostRate = totalLeads > 0 ? ((lostCount / totalLeads) * 100).toFixed(1) : '0';

  // Calculate Average Response Time (minutes)
  let totalResponseMinutes = 0;
  let responseCount = 0;
  leads.forEach((l) => {
    if (l.jamMasuk && l.jamBalas) {
      const minutes = calculateResponseMinutes(l.jamMasuk, l.jamBalas);
      totalResponseMinutes += minutes;
      responseCount++;
    }
  });
  const avgResponseMinutes = responseCount > 0 ? Math.round(totalResponseMinutes / responseCount) : 0;

  // Find top reason for lost
  const lostReasonMap: Record<string, number> = {};
  lostLeads.forEach((l) => {
    if (l.alasanLost) {
      lostReasonMap[l.alasanLost] = (lostReasonMap[l.alasanLost] || 0) + 1;
    }
  });
  let topLostReason = '-';
  let maxLostCount = 0;
  Object.entries(lostReasonMap).forEach(([reason, count]) => {
    if (count > maxLostCount) {
      maxLostCount = count;
      topLostReason = reason;
    }
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {/* 1. Total Leads (Periode) */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Leads (Periode)</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalLeads}</p>
        </div>
        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-emerald-600 font-semibold">{totalLeads} Leads Terfilter</span>
          <Users className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* 2. Total Omset (Closing) */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Omset Deals (Closing)</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-green-600 font-semibold">{closedCount} Deals Closed</span>
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      </div>

      {/* 3. Conversion Rate */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Conversion Rate</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{conversionRate}%</p>
        </div>
        <div>
          <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all" 
              style={{ width: `${Math.min(Number(conversionRate), 100)}%` }} 
            />
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Target: &gt; {targetConversionRate}%</p>
        </div>
      </div>

      {/* 4. Avg Response Time */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Avg Response Time</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatResponseTime(avgResponseMinutes)}</p>
        </div>
        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-blue-600 font-medium">Target: &lt; {targetAvgResponseMinutes}m</span>
          <Clock className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </div>

      {/* 5. Lost Rate */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Lost Rate</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{lostRate}%</p>
        </div>
        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-red-500 font-medium truncate max-w-[130px]" title={topLostReason}>
            {lostCount} Lost ({topLostReason})
          </span>
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        </div>
      </div>
    </div>
  );
};
