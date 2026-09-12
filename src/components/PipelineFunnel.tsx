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
  ChevronRight,
  Package,
  Palette,
  Sparkles,
  PenTool,
  Hammer,
  Truck
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
      case 'Req Sample':
        return <Package className="w-4 h-4 text-orange-500" />;
      case 'Req Desaign':
        return <PenTool className="w-4 h-4 text-violet-500" />;
      case 'Finish Req Design':
        return <Sparkles className="w-4 h-4 text-cyan-500" />;
      case 'Progres Desaign':
        return <Palette className="w-4 h-4 text-pink-500" />;
      case 'Finish Desaign':
        return <Sparkles className="w-4 h-4 text-sky-500" />;
      case 'Produksi':
        return <Hammer className="w-4 h-4 text-amber-600" />;
      case 'Kirim':
        return <Truck className="w-4 h-4 text-blue-600" />;
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
      case 'Req Sample':
        return {
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          activeBg: 'bg-orange-50 border-orange-400 ring-2 ring-orange-500/20',
          bar: 'bg-orange-500'
        };
      case 'Req Desaign':
        return {
          badge: 'bg-violet-100 text-violet-800 border-violet-200',
          activeBg: 'bg-violet-50 border-violet-400 ring-2 ring-violet-500/20',
          bar: 'bg-violet-500'
        };
      case 'Finish Req Design':
        return {
          badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          activeBg: 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-500/20',
          bar: 'bg-cyan-500'
        };
      case 'Progres Desaign':
        return {
          badge: 'bg-pink-100 text-pink-800 border-pink-200',
          activeBg: 'bg-pink-50 border-pink-400 ring-2 ring-pink-500/20',
          bar: 'bg-pink-500'
        };
      case 'Finish Desaign':
        return {
          badge: 'bg-sky-100 text-sky-800 border-sky-200',
          activeBg: 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20',
          bar: 'bg-sky-500'
        };
      case 'Produksi':
        return {
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          activeBg: 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-500/20',
          bar: 'bg-yellow-500'
        };
      case 'Kirim':
        return {
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          activeBg: 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20',
          bar: 'bg-indigo-500'
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

  const row1: FlowCategory[] = ['New Leads', 'Qualified', 'Quotation', 'Follow Up', 'Req Sample'];
  const row2: FlowCategory[] = ['Req Desaign', 'First Order', 'Repeat Order', 'Lost'];

  const isSubPipelineActive = ['First Order', 'Progres Desaign', 'Finish Desaign', 'Produksi', 'Kirim'].includes(selectedCategory);
  const isReqDesignSubPipelineActive = ['Req Desaign', 'Finish Req Design'].includes(selectedCategory);

  const renderCard = (flow: FlowCategory) => {
    const categoryLeads = leads.filter((l) => {
      if (flow === 'First Order') {
        return ['First Order', 'Progres Desaign', 'Finish Desaign', 'Produksi', 'Kirim'].includes(l.kategoriFlow);
      }
      if (flow === 'Progres Desaign') {
        const hasDesignInfo = l.designDeadlineDays && l.designDeadlineDays > 0;
        return l.kategoriFlow === 'Progres Desaign' || (l.kategoriFlow === 'First Order' && hasDesignInfo);
      }
      if (flow === 'Req Desaign') {
        return ['Req Desaign', 'Finish Req Design'].includes(l.kategoriFlow);
      }
      return l.kategoriFlow === flow;
    });
    const count = categoryLeads.length;
    const totalVal = categoryLeads.reduce((acc, l) => acc + (l.totalInvoice || 0), 0);
    const colors = getStageColor(flow);
    const isSelected = selectedCategory === flow;

    return (
      <div
        key={flow}
        onClick={() => onSelectCategory(isSelected ? '' : flow)}
        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between h-[92px] ${
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

          <div className="font-bold text-xs text-slate-800 line-clamp-1">
            {flow === 'Progres Desaign' ? 'Progres/Revisi Design' : flow}
          </div>
        </div>

        <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-700">
            {totalVal > 0 ? formatRupiah(totalVal) : 'Rp 0'}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </div>
      </div>
    );
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

      {/* Row 1: Active Pipeline Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
        {row1.map((flow) => renderCard(flow))}
      </div>

      {/* Row 2: Success / Closed Stages (Centered) */}
      <div className="flex flex-wrap justify-center gap-2 mt-2 pt-2 border-t border-dashed border-slate-100">
        {row2.map((flow) => (
          <div key={flow} className="w-[48%] sm:w-[180px] md:w-[200px] xl:w-[220px]">
            {renderCard(flow)}
          </div>
        ))}
      </div>

      {/* Sub Pipeline for Design under First Order */}
      {isSubPipelineActive && (
        <div className="mt-4 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100/70 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-2.5 px-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Sub Pipeline - First Order
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {renderCard('First Order')}
            {renderCard('Progres Desaign')}
            {renderCard('Finish Desaign')}
            {renderCard('Produksi')}
            {renderCard('Kirim')}
          </div>
        </div>
      )}

      {/* Sub Pipeline for Design under Req Desaign */}
      {isReqDesignSubPipelineActive && (
        <div className="mt-4 p-3.5 bg-violet-50/50 rounded-xl border border-violet-100/70 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-2.5 px-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wider">
              Sub Pipeline Desain - Req Desaign
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {renderCard('Req Desaign')}
            {renderCard('Finish Req Design')}
          </div>
        </div>
      )}
    </div>
  );
};
