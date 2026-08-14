import React from 'react';
import { 
  FileSpreadsheet, 
  PlusCircle, 
  Download, 
  RefreshCw,
  Users,
  LayoutDashboard,
  Table as TableIcon,
  Award,
  ShieldCheck,
  Plus,
  FolderKanban,
  Globe
} from 'lucide-react';
import { CSUser, DashboardClient } from '../types';

interface NavbarProps {
  currentCS: CSUser;
  csList: CSUser[];
  onSelectCS: (cs: CSUser) => void;
  dashboards: DashboardClient[];
  activeDashboardId: string;
  onSelectDashboard: (id: string) => void;
  onOpenCreateDashboardModal: () => void;
  onOpenNewLead: () => void;
  onExportExcel: () => void;
  onResetData: () => void;
  activeTab: 'dashboard' | 'spreadsheet' | 'cs-performance' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'spreadsheet' | 'cs-performance' | 'admin') => void;
  totalLeadsCount: number;
  linkedSpreadsheetName?: string;
  onSyncGoogleSheets?: () => void;
  isSpreadsheetConnected?: boolean;
  isSupabaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCS,
  csList,
  onSelectCS,
  dashboards,
  activeDashboardId,
  onSelectDashboard,
  onOpenCreateDashboardModal,
  onOpenNewLead,
  onExportExcel,
  onResetData,
  activeTab,
  setActiveTab,
  totalLeadsCount,
  linkedSpreadsheetName = 'Main_Sales_2024.xlsx',
  onSyncGoogleSheets,
  isSpreadsheetConnected = false,
  isSupabaseConnected = false,
}) => {
  const getStatusText = () => {
    if (isSpreadsheetConnected && isSupabaseConnected) {
      return 'Sheet & Supabase';
    }
    if (isSupabaseConnected) {
      return 'database supabase';
    }
    if (isSpreadsheetConnected) {
      return 'database sheet';
    }
    return 'database local';
  };

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-3">
          
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-800">
                  WA-CRM <span className="text-slate-400 font-normal">| Sales Monitor &amp; Tracker</span>
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse animate-duration-1000"></div>
                  Linked to: <span className="text-slate-800 font-extrabold">{getStatusText()}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Real-time WhatsApp Leads, Pipeline Status, &amp; Spreadsheet Auto-Sync
              </p>
            </div>
          </div>

          {/* Right Actions: Dashboard Selector, CS Switcher & Primary Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dashboard / Client Selector Dropdown */}
            <div className="flex items-center bg-emerald-50/80 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs text-emerald-900 shadow-2xs">
              <FolderKanban className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
              <span className="text-emerald-700 mr-1 font-semibold">Dashboard:</span>
              <select
                value={activeDashboardId}
                onChange={(e) => {
                  if (e.target.value === '__NEW_DASHBOARD__') {
                    onOpenCreateDashboardModal();
                  } else {
                    onSelectDashboard(e.target.value);
                  }
                }}
                className="bg-transparent font-bold text-emerald-950 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-white text-slate-800 font-semibold">
                  🌐 Semua Klien (Gabungan)
                </option>
                {dashboards.map((dash) => (
                  <option key={dash.id} value={dash.id} className="bg-white text-slate-800 font-medium">
                    📊 {dash.name}
                  </option>
                ))}
                <option value="__NEW_DASHBOARD__" className="bg-emerald-50 text-emerald-800 font-bold">
                  ➕ + Buat Dashboard Klien Baru...
                </option>
              </select>
            </div>

            {/* Quick Button: Buat Dashboard Klien Baru */}
            <button
              onClick={onOpenCreateDashboardModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
              title="Buat Dashboard Klien Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Dashboard</span>
            </button>

            {/* Active CS Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
              <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span className="text-slate-500 mr-1 font-medium">CS:</span>
              <select
                value={currentCS?.id || ''}
                onChange={(e) => {
                  const found = csList.find(c => c.id === e.target.value);
                  if (found) onSelectCS(found);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {csList.map((cs) => (
                  <option key={cs.id} value={cs.id} className="bg-white text-slate-800 font-normal">
                    {cs.nama} ({cs.role})
                  </option>
                ))}
              </select>
            </div>

            {/* New Lead Entry Button */}
            <button
              onClick={onOpenNewLead}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ New Lead Entry</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Excel Tools Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 py-1.5 gap-2">
          {/* Main Views Tabs */}
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Sales Monitor Log</span>
              <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {totalLeadsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                activeTab === 'spreadsheet'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Spreadsheet Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('cs-performance')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                activeTab === 'cs-performance'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Performa CS</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span>Admin Management</span>
            </button>

            <a
              href="https://report-ads-eight.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Globe className="w-3.5 h-3.5 text-green-600" />
              <span>Meta</span>
            </a>
          </div>

          {/* Excel Export & Tools */}
          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto justify-end">
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-semibold text-[11px] cursor-pointer"
            >
              <Download className="w-3 h-3 text-green-600" />
              <span>Export .XLSX</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 text-[11px] cursor-pointer"
              title="Reset ke data contoh awal"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

