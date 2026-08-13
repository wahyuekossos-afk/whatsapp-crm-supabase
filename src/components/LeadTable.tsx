import React, { useState } from 'react';
import { Lead, FlowCategory, FilterOptions } from '../types';
import { FLOW_CATEGORIES, REASONS_FOR_LOST, INDONESIAN_CITIES } from '../data/initialData';
import { 
  formatRupiah, 
  formatWAUrl, 
  calculateResponseMinutes, 
  formatResponseTime,
  normalizeDateString
} from '../utils/spreadsheet';
import { 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  History, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  User,
  ShoppingBag,
  Info
} from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onUpdateLead: (updatedLead: Lead) => void;
  onOpenEditModal: (lead: Lead) => void;
  onOpenHistoryModal: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  csListNames: string[];
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onUpdateLead,
  onOpenEditModal,
  onOpenHistoryModal,
  onDeleteLead,
  filters,
  setFilters,
  csListNames,
}) => {
  const [sortField, setSortField] = useState<keyof Lead>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Inline Quick Flow Update Handler (Validates Alasan Lost if updated to 'Lost', opens popup for 'Repeat Order' or 'First Order')
  const handleQuickFlowChange = (lead: Lead, newFlow: FlowCategory) => {
    if (newFlow === 'Lost' && !lead.alasanLost) {
      // Must open edit modal to require Alasan Lost input
      onOpenEditModal({ ...lead, kategoriFlow: 'Lost' });
      return;
    }

    if (newFlow === 'Repeat Order') {
      // Must open edit modal "Update Lead Existing" for entering repeat order items & total invoice
      onOpenEditModal({ ...lead, kategoriFlow: 'Repeat Order' });
      return;
    }

    if (newFlow === 'First Order') {
      // Must open edit modal "Update Lead Existing" for entering first order details (item, qty, total invoice)
      onOpenEditModal({ ...lead, kategoriFlow: 'First Order' });
      return;
    }

    const updated: Lead = {
      ...lead,
      kategoriFlow: newFlow,
      updatedAt: new Date().toISOString(),
      history: [
        ...lead.history,
        {
          id: `h-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          csName: lead.namaCS,
          fromFlow: lead.kategoriFlow,
          toFlow: newFlow,
          note: `Quick flow update to ${newFlow}`,
          alasanLost: newFlow === 'Lost' ? lead.alasanLost : '',
        },
      ],
    };
    onUpdateLead(updated);
  };

  // Dynamic list of unique cities extracted from database leads + standard Indonesian cities
  const availableCities = React.useMemo(() => {
    const citiesFromLeads = leads
      .map((l) => l.lokasiKota?.trim())
      .filter((c): c is string => Boolean(c));
    const combined = Array.from(new Set([...citiesFromLeads, ...INDONESIAN_CITIES]));
    return combined.sort((a, b) => a.localeCompare(b, 'id'));
  }, [leads]);

  // Filter Logic
  const filteredLeads = leads.filter((lead) => {
    // Search matching Nama Customer, Nomor WA, Nama CS, Lokasi, Item Order, Note
    const query = filters.search.toLowerCase().trim();
    if (query) {
      const matchSearch =
        lead.namaCustomer.toLowerCase().includes(query) ||
        lead.nomorWA.includes(query) ||
        lead.namaCS.toLowerCase().includes(query) ||
        lead.lokasiKota.toLowerCase().includes(query) ||
        lead.itemOrder.toLowerCase().includes(query) ||
        lead.noteCustomer.toLowerCase().includes(query) ||
        (lead.alasanLost || '').toLowerCase().includes(query);
      if (!matchSearch) return false;
    }

    // Filter CS Name
    if (filters.csName && lead.namaCS !== filters.csName) {
      return false;
    }

    // Filter Kategori Flow
    if (filters.kategoriFlow && lead.kategoriFlow !== filters.kategoriFlow) {
      return false;
    }

    // Filter Lokasi
    if (filters.lokasiKota && lead.lokasiKota !== filters.lokasiKota) {
      return false;
    }

    // Month Filter
    const leadDate = normalizeDateString(lead.tanggalMasuk);
    if (filters.selectedMonth && (!leadDate || !leadDate.startsWith(filters.selectedMonth))) {
      return false;
    }

    // Date Range Filter
    if (filters.dateStart && leadDate < filters.dateStart) {
      return false;
    }
    if (filters.dateEnd && leadDate > filters.dateEnd) {
      return false;
    }

    return true;
  });

  // Sorting Logic
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
    if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper for Flow Badge Styling
  const getBadgeStyle = (flow: FlowCategory) => {
    switch (flow) {
      case 'New Leads':
        return 'bg-blue-100 text-blue-700 border-blue-200 text-[9px] font-bold uppercase';
      case 'Qualified':
        return 'bg-blue-100 text-blue-700 border-blue-200 text-[9px] font-bold uppercase';
      case 'Quotation':
        return 'bg-amber-100 text-amber-700 border-amber-200 text-[9px] font-bold uppercase';
      case 'Follow Up':
        return 'bg-purple-100 text-purple-700 border-purple-200 text-[9px] font-bold uppercase';
      case 'First Order':
        return 'bg-green-100 text-green-700 border-green-200 text-[9px] font-bold uppercase';
      case 'Repeat Order':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px] font-bold uppercase';
      case 'Lost':
        return 'bg-red-100 text-red-700 border-red-200 text-[9px] font-bold uppercase';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 text-[9px] font-bold uppercase';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-6">
      {/* Search & Filter Header Bar */}
      <div className="p-3 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Real-time Sales Log</h2>
          <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded font-bold">
            {sortedLeads.length} Leads
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, WA, CS..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="text-[11px] pl-8 pr-3 py-1 border border-slate-200 rounded bg-white w-48 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* CS Filter */}
          <select
            value={filters.csName}
            onChange={(e) => setFilters((prev) => ({ ...prev, csName: e.target.value }))}
            className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer font-medium"
          >
            <option value="">Semua CS</option>
            {csListNames.map((cs) => (
              <option key={cs} value={cs}>{cs}</option>
            ))}
          </select>

          {/* Flow Filter */}
          <select
            value={filters.kategoriFlow}
            onChange={(e) => setFilters((prev) => ({ ...prev, kategoriFlow: e.target.value }))}
            className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer font-medium"
          >
            <option value="">Semua Stage</option>
            {FLOW_CATEGORIES.map((flow) => (
              <option key={flow} value={flow}>{flow}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={filters.lokasiKota}
            onChange={(e) => setFilters((prev) => ({ ...prev, lokasiKota: e.target.value }))}
            className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer font-medium"
          >
            <option value="">Semua Kota ({availableCities.length})</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {(filters.search || filters.csName || filters.kategoriFlow || filters.lokasiKota) && (
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  csName: '',
                  kategoriFlow: '',
                  lokasiKota: '',
                  dateStart: '',
                  dateEnd: '',
                })
              }
              className="text-[11px] text-red-500 hover:text-red-700 font-bold px-1.5 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
            <tr className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              <th className="px-3 py-2.5">#</th>
              <th 
                onClick={() => toggleSort('namaCS')} 
                className="px-3 py-2.5 cursor-pointer hover:text-slate-600"
              >
                CS Name
              </th>
              <th className="px-3 py-2.5">Customer Info</th>
              <th className="px-3 py-2.5">Category</th>
              <th className="px-3 py-2.5">Entry Time</th>
              <th className="px-3 py-2.5">Order Info</th>
              <th className="px-3 py-2.5">Lost Reason</th>
              <th className="px-3 py-2.5">Location</th>
              <th 
                onClick={() => toggleSort('totalInvoice')} 
                className="px-3 py-2.5 text-right cursor-pointer hover:text-slate-600"
              >
                Total
              </th>
              <th className="px-3 py-2.5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-[11px] divide-y divide-slate-100">
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  Tidak ada data sales yang ditemukan.
                </td>
              </tr>
            ) : (
              sortedLeads.map((lead, idx) => {
                const isLost = lead.kategoriFlow === 'Lost';

                return (
                  <tr key={lead.id} className={`hover:bg-slate-50 transition-colors ${isLost ? 'bg-red-50/20' : ''}`}>
                    {/* Index */}
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>

                    {/* CS Name & Client */}
                    <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{lead.namaCS}</div>
                      {lead.clientName && (
                        <div className="inline-block mt-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                          {lead.clientName}
                        </div>
                      )}
                    </td>

                    {/* Customer Info */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{lead.namaCustomer}</div>
                      <a
                        href={formatWAUrl(lead.nomorWA, `Halo Kak ${lead.namaCustomer}, saya ${lead.namaCS}...`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-green-600 font-mono text-[10px]"
                      >
                        {lead.nomorWA}
                      </a>
                    </td>

                    {/* Category Flow */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <select
                        value={lead.kategoriFlow}
                        onChange={(e) => handleQuickFlowChange(lead, e.target.value as FlowCategory)}
                        className={`px-2 py-0.5 rounded-full border focus:outline-none cursor-pointer ${getBadgeStyle(
                          lead.kategoriFlow
                        )}`}
                      >
                        {FLOW_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-white text-slate-800 font-normal">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Entry Time */}
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                      {lead.jamMasuk || '14:02'} <span className="text-[9px] ml-1 opacity-60">{lead.tanggalMasuk}</span>
                    </td>

                    {/* Order Info */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-800">{lead.itemOrder || 'Custom Request'}</div>
                      <div className="text-[10px] text-slate-400">{lead.quantityOrder || 1} pcs</div>
                    </td>

                    {/* Lost Reason */}
                    <td className="px-3 py-2.5 max-w-[140px]">
                      {isLost ? (
                        <span className="italic text-red-600 text-[10px]">
                          {lead.alasanLost || '⚠️ Alasan belum diisi'}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap text-[10px]">
                      {lead.lokasiKota || 'Indonesia'}
                    </td>

                    {/* Total Invoice */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      {formatRupiah(lead.totalInvoice || 0)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenEditModal(lead)}
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                          title="Edit Lead Detail"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenHistoryModal(lead)}
                          className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
                          title="Log History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setLeadToDelete(lead)}
                          className="p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                          title="Hapus Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Delete Lead */}
      {leadToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Hapus Lead Customer</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus data lead dari{' '}
              <span className="font-bold text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded">
                "{leadToDelete.namaCustomer}"
              </span>{' '}
              (WA: {leadToDelete.nomorWA}) dari log sales?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLead(leadToDelete.id);
                  setLeadToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-all cursor-pointer shadow-xs"
              >
                Ya, Hapus Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
