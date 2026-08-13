import React from 'react';
import { Calendar, Filter, RotateCcw, ChevronDown, Clock, Check } from 'lucide-react';
import { FilterOptions } from '../types';

interface DashboardDateFilterProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalFilteredCount: number;
  totalAllCount: number;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DashboardDateFilter: React.FC<DashboardDateFilterProps> = ({
  filters,
  setFilters,
  totalFilteredCount,
  totalAllCount,
}) => {
  // Helpers for current dates
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Check active preset
  const isAllTime = !filters.selectedMonth && !filters.dateStart && !filters.dateEnd;
  const isToday = !filters.selectedMonth && filters.dateStart === todayStr && filters.dateEnd === todayStr;
  const isThisMonth = filters.selectedMonth === currentYearMonth && !filters.dateStart && !filters.dateEnd;
  const isLastMonth = filters.selectedMonth === lastYearMonth && !filters.dateStart && !filters.dateEnd;

  // Preset Handlers
  const handlePresetAllTime = () => {
    setFilters((prev) => ({
      ...prev,
      selectedMonth: '',
      dateStart: '',
      dateEnd: '',
    }));
  };

  const handlePresetToday = () => {
    setFilters((prev) => ({
      ...prev,
      selectedMonth: '',
      dateStart: todayStr,
      dateEnd: todayStr,
    }));
  };

  const handlePresetThisMonth = () => {
    setFilters((prev) => ({
      ...prev,
      selectedMonth: currentYearMonth,
      dateStart: '',
      dateEnd: '',
    }));
  };

  const handlePresetLastMonth = () => {
    setFilters((prev) => ({
      ...prev,
      selectedMonth: lastYearMonth,
      dateStart: '',
      dateEnd: '',
    }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM
    setFilters((prev) => ({
      ...prev,
      selectedMonth: val,
      dateStart: '',
      dateEnd: '',
    }));
  };

  const handleDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      selectedMonth: '', // clear month filter if manual range is picked
      dateStart: val,
    }));
  };

  const handleDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      selectedMonth: '', // clear month filter if manual range is picked
      dateEnd: val,
    }));
  };

  const handleReset = () => {
    setFilters((prev) => ({
      ...prev,
      selectedMonth: '',
      dateStart: '',
      dateEnd: '',
    }));
  };

  // Get readable active period label
  const getPeriodText = () => {
    if (isToday) return `Hari Ini (${todayStr})`;
    if (filters.selectedMonth) {
      const [year, month] = filters.selectedMonth.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      const monthName = MONTH_NAMES_ID[monthIdx] || month;
      return `Bulan ${monthName} ${year}`;
    }
    if (filters.dateStart || filters.dateEnd) {
      if (filters.dateStart && filters.dateEnd) {
        return `${filters.dateStart} s/d ${filters.dateEnd}`;
      }
      if (filters.dateStart) return `Mulai ${filters.dateStart}`;
      if (filters.dateEnd) return `Hingga ${filters.dateEnd}`;
    }
    return 'Semua Waktu';
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Active Filter Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Filter Periode Sales &amp; Leads
              </h2>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <Clock className="w-3 h-3 text-emerald-600" />
                {getPeriodText()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Menampilkan <strong className="text-slate-700">{totalFilteredCount}</strong> dari {totalAllCount} total leads
            </p>
          </div>
        </div>

        {/* Controls: Quick Presets + Month Picker + Date Range */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Preset Pills */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={handlePresetAllTime}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                isAllTime
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={handlePresetToday}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                isToday
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handlePresetThisMonth}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                isThisMonth
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={handlePresetLastMonth}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                isLastMonth
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Lalu
            </button>
          </div>

          {/* Month Picker Input */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bulan:</span>
            <input
              type="month"
              value={filters.selectedMonth || ''}
              onChange={handleMonthChange}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            />
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs">
            <input
              type="date"
              value={filters.dateStart || ''}
              onChange={handleDateStartChange}
              placeholder="Mulai"
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            />
            <span className="text-slate-400 font-bold text-[10px]">s/d</span>
            <input
              type="date"
              value={filters.dateEnd || ''}
              onChange={handleDateEndChange}
              placeholder="Selesai"
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            />
          </div>

          {/* Reset Button */}
          {(!isAllTime) && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset Filter Tanggal"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
