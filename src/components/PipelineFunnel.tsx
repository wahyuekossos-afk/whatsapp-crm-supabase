import React from 'react';
import { Lead, FlowCategory } from '../types';
import { FLOW_CATEGORIES } from '../data/initialData';
import { formatRupiah } from '../utils/spreadsheet';
import { 
  UserPlus, 
  CheckCheck, 
  FileText, 
  PhoneCall, 
  ShoppingBag, 
  RotateCw, 
  XCircle,
  ChevronRight
} from 'lucide-react';

interface PipelineFunnelProps {
  leads: Lead[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({
  leads,
  selectedCategory,
  onSelectCategory,
}) => {
  const getStageIcon = (flow: FlowCategory) => {
    switch (flow) {
      case 'New Leads':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'Qualified':
        return <CheckCheck className="w-4 h-4 text-purple-500" />;
      case 'Quotation':
        return <FileText className="w-4 h-4 text-amber-500" />;
      case 'Follow Up':
        return <PhoneCall className="w-4 h-4 text-indigo-500" />;
      case 'First Order':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'Repeat Order':
        return <RotateCw className="w-4 h-4 text-teal-600" />;
      case 'Lost':
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const getStageColor = (flow: FlowCategory) => {
    switch (flow) {
      case 'New Leads':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          activeBg: 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20',
          bar: 'bg-blue-500'
        };
      case 'Qualified':
        return {
          badge: 'bg-purple-100 text-purple-800 border-purple-200',
          activeBg: 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20',
          bar: 'bg-purple-500'
        };
      case 'Quotation':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          activeBg: 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20',
          bar: 'bg-amber-500'
        };
      case 'Follow Up':
        return {
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          activeBg: 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20',
          bar: 'bg-indigo-500'
        };
      case 'First Order':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          activeBg: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20',
          bar: 'bg-emerald-500'
        };
      case 'Repeat Order':
        return {
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          activeBg: 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20',
          bar: 'bg-teal-600'
        };
      case 'Lost':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          activeBg: 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20',
          bar: 'bg-rose-500'
        };
    }
  };

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 px-1 gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
            Pipeline Funnel Stages
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            Klik stage untuk memfilter log sales
          </p>
        </div>
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory('')}
            className="text-xs font-semibold text-green-600 hover:text-green-800 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
          >
            Reset Funnel Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {FLOW_CATEGORIES.map((flow) => {
          const categoryLeads = leads.filter((l) => l.kategoriFlow === flow);
          const count = categoryLeads.length;
          const totalVal = categoryLeads.reduce((acc, l) => acc + (l.totalInvoice || 0), 0);
          const colors = getStageColor(flow);
          const isSelected = selectedCategory === flow;

          return (
            <div
              key={flow}
              onClick={() => onSelectCategory(isSelected ? '' : flow)}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? colors.activeBg
                  : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Top Bar Indicator */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bar}`} />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1 rounded bg-white shadow-xs border border-slate-100">
                    {getStageIcon(flow)}
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${colors.badge}`}>
                    {count}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-800 line-clamp-1">{flow}</div>
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-700">
                  {totalVal > 0 ? formatRupiah(totalVal) : 'Rp 0'}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
