import React, { useState, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Instagram, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  MapPin,
  ShoppingBag,
  Send,
  MessageCircle
} from 'lucide-react';
import { Lead, FilterOptions, CSUser, FlowCategory, ProductsMap } from '../types';
import { DashboardDateFilter } from './DashboardDateFilter';
import { PipelineFunnel } from './PipelineFunnel';
import { LeadTable } from './LeadTable';
import { 
  formatRupiah, 
  calculateResponseMinutes, 
  formatResponseTime, 
  normalizeDateString 
} from '../utils/spreadsheet';

interface InstagramLeadsViewProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => Promise<void>;
  onOpenEditModal: (lead: Lead) => void;
  onOpenHistoryModal: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  csListNames: string[];
  dashboardBelongingCSList: CSUser[];
  currentCS: CSUser;
  onSaveNewLead: (lead: Lead) => Promise<void>;
  activeDashboardName: string;
  productsMap: ProductsMap;
  existingCities: string[];
  designers: string[];
  kpiTargetsMap: Record<string, any>;
}

export const InstagramLeadsView: React.FC<InstagramLeadsViewProps> = ({
  leads,
  onUpdateLead,
  onOpenEditModal,
  onOpenHistoryModal,
  onDeleteLead,
  csListNames,
  dashboardBelongingCSList,
  currentCS,
  onSaveNewLead,
  activeDashboardName,
  productsMap,
  existingCities,
  designers,
  kpiTargetsMap,
}) => {
  // 1. Scoped Instagram Filter Options
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    csName: '',
    kategoriFlow: '',
    lokasiKota: '',
    dateStart: '',
    dateEnd: '',
    selectedMonth: '',
  });

  // Expandable form state
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Form Field States
  const [namaCustomer, setNamaCustomer] = useState('');
  const [nomorWA, setNomorWA] = useState('');
  const [lokasiKota, setLokasiKota] = useState('');
  const [itemOrder, setItemOrder] = useState('');
  const [quantityOrder, setQuantityOrder] = useState(0);
  const [totalInvoice, setTotalInvoice] = useState(0);
  const [kategoriFlow, setKategoriFlow] = useState<FlowCategory>('New Leads');
  const [noteCustomer, setNoteCustomer] = useState('');
  const [selectedCSName, setSelectedCSName] = useState(currentCS?.nama || '');

  // Form Validation & Success States
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill active CS if changed
  React.useEffect(() => {
    if (currentCS?.nama && !selectedCSName) {
      setSelectedCSName(currentCS.nama);
    }
  }, [currentCS]);

  // Available Products for Active Dashboard
  const activeProducts = useMemo(() => {
    return productsMap[activeDashboardName] || [];
  }, [productsMap, activeDashboardName]);

  // 2. Filter Leads to include ONLY Instagram Leads
  const instagramLeadsAll = useMemo(() => {
    return leads.filter((l) => l.isInstagram === true);
  }, [leads]);

  // Apply Date and Month and CS Filters for summary math & pipeline funnel
  const instagramFilteredLeads = useMemo(() => {
    return instagramLeadsAll.filter((lead) => {
      const leadDate = normalizeDateString(lead.tanggalMasuk);
      
      // Filter by Active Dashboard/Client
      if (lead.clientName !== activeDashboardName && activeDashboardName !== 'Wibu Sales (Utama)') {
        // If 'all' dashboard is selected, let it pass or check if activeDashboardName matches
        // Note: App.tsx handles client filtering usually, let's keep it aligned.
      }

      // 1. Month Filter (YYYY-MM)
      if (filters.selectedMonth && (!leadDate || !leadDate.startsWith(filters.selectedMonth))) {
        return false;
      }
      // 2. Date Start
      if (filters.dateStart && leadDate < filters.dateStart) {
        return false;
      }
      // 3. Date End
      if (filters.dateEnd && leadDate > filters.dateEnd) {
        return false;
      }
      // 4. CS Name Filter
      if (filters.csName && lead.namaCS !== filters.csName) {
        return false;
      }
      return true;
    });
  }, [instagramLeadsAll, filters, activeDashboardName]);

  // 3. Summary Calculations
  const targetKpi = kpiTargetsMap[activeDashboardName] || { conversionRate: 15, avgResponseMinutes: 5 };
  const targetConversionRate = targetKpi.conversionRateIG !== undefined ? targetKpi.conversionRateIG : targetKpi.conversionRate;
  const targetAvgResponseMinutes = targetKpi.avgResponseMinutesIG !== undefined ? targetKpi.avgResponseMinutesIG : targetKpi.avgResponseMinutes;

  const totalLeadsCount = instagramFilteredLeads.length;

  // Closed Deals = First Order + Repeat Order + Progres Desaign + Finish Desaign + Produksi + Kirim
  const closedLeads = useMemo(() => {
    return instagramFilteredLeads.filter((l) => 
      ['First Order', 'Repeat Order', 'Progres Desaign', 'Finish Desaign', 'Produksi', 'Kirim'].includes(l.kategoriFlow)
    );
  }, [instagramFilteredLeads]);

  const closedCount = closedLeads.length;
  const totalRevenue = useMemo(() => {
    return closedLeads.reduce((acc, l) => acc + (l.totalInvoice || 0), 0);
  }, [closedLeads]);

  const conversionRate = totalLeadsCount > 0 ? ((closedCount / totalLeadsCount) * 100).toFixed(1) : '0';

  // Average Response Time
  const avgResponseMinutes = useMemo(() => {
    let totalResponseMinutes = 0;
    let responseCount = 0;
    instagramFilteredLeads.forEach((l) => {
      if (l.jamMasuk && l.jamBalas) {
        const minutes = calculateResponseMinutes(l.jamMasuk, l.jamBalas);
        totalResponseMinutes += minutes;
        responseCount++;
      }
    });
    return responseCount > 0 ? Math.round(totalResponseMinutes / responseCount) : 0;
  }, [instagramFilteredLeads]);

  // 4. Handle Save Instagram Lead
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = namaCustomer.trim();
    const trimmedWA = nomorWA.trim();

    if (!trimmedName) {
      setFormError('Nama Customer wajib diisi.');
      return;
    }
    if (!trimmedWA) {
      setFormError('Nomor WhatsApp wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;
      const dateStr = now.toISOString().split('T')[0];

      // Automatically compute a response time for quick-input (default +3 mins)
      const minutesAhead = 3;
      const responseTime = new Date(now.getTime() + minutesAhead * 60000);
      const jamBalasStr = `${String(responseTime.getHours()).padStart(2, '0')}:${String(responseTime.getMinutes()).padStart(2, '0')}`;

      const newLead: Lead = {
        id: `ig-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        clientId: activeDashboardName === 'Wibu Sales (Utama)' ? 'dash-default' : undefined,
        clientName: activeDashboardName,
        namaCS: selectedCSName || currentCS?.nama || 'CS Instagram',
        nomorWA: trimmedWA,
        namaCustomer: trimmedName,
        kategoriFlow: kategoriFlow,
        tanggalMasuk: dateStr,
        jamMasuk: timeStr,
        jamBalas: jamBalasStr,
        lokasiKota: lokasiKota.trim() || 'Instagram Bio',
        noteCustomer: noteCustomer.trim() || 'Masuk dari Klik Link Bio Instagram',
        itemOrder: itemOrder.trim() || (activeProducts[0] || 'Custom Order'),
        quantityOrder: isNaN(Number(quantityOrder)) ? 0 : Number(quantityOrder),
        totalInvoice: Number(totalInvoice) || 0,
        updatedAt: now.toISOString(),
        isInstagram: true,
        history: [
          {
            id: `h-ig-init-${Date.now()}`,
            timestamp: `${dateStr} ${timeStr}`,
            csName: selectedCSName || currentCS?.nama || 'CS Instagram',
            toFlow: kategoriFlow,
            note: 'Lead terbuat otomatis dari form input Instagram Leads (Klik Link Bio).'
          }
        ]
      };

      await onSaveNewLead(newLead);

      // Reset Form fields
      setNamaCustomer('');
      setNomorWA('');
      setLokasiKota('');
      setItemOrder('');
      setQuantityOrder(1);
      setTotalInvoice(0);
      setNoteCustomer('');
      setKategoriFlow('New Leads');

    } catch (err) {
      console.error(err);
      setFormError('Gagal menyimpan lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION WITH BRANDING */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-pink-500/10 via-red-500/5 to-transparent rounded-2xl border border-pink-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 text-white rounded-2xl shadow-md shrink-0">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
              Instagram Link Bio Leads
              <span className="text-[10px] bg-pink-100 text-pink-700 font-extrabold px-2 py-0.5 rounded-full uppercase border border-pink-200">
                Instagram Hub
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Kelola, analisa, dan input seluruh leads yang masuk khusus dari klik link bio Instagram Anda.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border border-pink-200 bg-white hover:bg-pink-50/40 text-pink-700 transition-all cursor-pointer shadow-3xs"
          >
            {isFormOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isFormOpen ? 'Sembunyikan Form' : 'Tampilkan Form Input'}</span>
          </button>
        </div>
      </div>

      {/* 1. INPUT FORM SECTION (COLLAPSIBLE) */}
      {isFormOpen && (
        <form 
          onSubmit={handleSubmitForm}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-3xs transition-all duration-300 relative overflow-hidden"
        >
          {/* Subtle Pink Border Accenter */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500" />
          
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Input Lead Instagram Baru
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              CS Aktif: <strong className="text-slate-700">{selectedCSName || 'Belum dipilih'}</strong>
            </span>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              ⚠️ {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Column 1: Customer Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Nama Customer <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap / Akun IG"
                  value={namaCustomer}
                  onChange={(e) => setNamaCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Nomor WhatsApp <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812xxxxxx"
                  value={nomorWA}
                  onChange={(e) => setNomorWA(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                />
              </div>
            </div>

            {/* Column 2: Order Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Item Order
                </label>
                {activeProducts.length > 0 ? (
                  <select
                    value={itemOrder}
                    onChange={(e) => setItemOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                  >
                    <option value="">Pilih Produk Database...</option>
                    {activeProducts.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="Custom Order">-- Custom Order Lainnya --</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: Kemasan Kopi 250gr"
                    value={itemOrder}
                    onChange={(e) => setItemOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                    Qty (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantityOrder === 0 ? '' : quantityOrder}
                    placeholder="0"
                    onChange={(e) => setQuantityOrder(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                    Invoice (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalInvoice}
                    onChange={(e) => setTotalInvoice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Logistics & Assignment */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Lokasi / Kota
                </label>
                <input
                  type="text"
                  list="ig-cities-list"
                  placeholder="Contoh: Surabaya"
                  value={lokasiKota}
                  onChange={(e) => setLokasiKota(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                />
                <datalist id="ig-cities-list">
                  {existingCities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Petugas CS
                </label>
                <select
                  value={selectedCSName}
                  onChange={(e) => setSelectedCSName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-semibold"
                >
                  {dashboardBelongingCSList.map((cs) => (
                    <option key={cs.id} value={cs.nama}>
                      {cs.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 4: Notes & Status & Submit */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                  Kategori Flow Lead &amp; Catatan
                </label>
                <select
                  value={kategoriFlow}
                  onChange={(e) => setKategoriFlow(e.target.value as FlowCategory)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800 font-extrabold uppercase mb-2"
                >
                  <option value="New Leads">New Leads</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Quotation">Quotation</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Req Sample">Req Sample</option>
                  <option value="Req Desaign">Req Desaign</option>
                  <option value="First Order">First Order</option>
                  <option value="Repeat Order">Repeat Order</option>
                  <option value="Lost">Lost</option>
                </select>
                <input
                  type="text"
                  placeholder="Keterangan / Kebutuhan Desain"
                  value={noteCustomer}
                  onChange={(e) => setNoteCustomer(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:bg-white text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-pink-600 hover:bg-pink-700 text-white transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-500/50 disabled:bg-slate-300 disabled:cursor-not-allowed uppercase"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Instagram Lead'}</span>
              </button>
            </div>

          </div>
        </form>
      )}

      {/* 2. FILTER PERIODE SECTION */}
      <DashboardDateFilter
        filters={filters}
        setFilters={setFilters}
        totalFilteredCount={totalLeadsCount}
        totalAllCount={instagramLeadsAll.length}
      />

      {/* 3. SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total IG Leads */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Leads IG</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalLeadsCount}</p>
          </div>
          <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-pink-600 font-bold">
            <span>Instagram Bio Clicks</span>
            <Instagram className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Omset Deals closing */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Omset Deals IG</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1">{formatRupiah(totalRevenue)}</p>
          </div>
          <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-600 font-bold">
            <span>{closedCount} Deals Closing</span>
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Conversion Rate IG</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{conversionRate}%</p>
          </div>
          <div>
            <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
              <div 
                className="bg-pink-500 h-full rounded-full transition-all" 
                style={{ width: `${Math.min(Number(conversionRate), 100)}%` }} 
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-1">Target CRM: &gt; {targetConversionRate}%</p>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Avg Response Time IG</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{formatResponseTime(avgResponseMinutes)}</p>
          </div>
          <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
            <span className={avgResponseMinutes <= targetAvgResponseMinutes ? 'text-emerald-600' : 'text-amber-600'}>
              {avgResponseMinutes <= targetAvgResponseMinutes ? '🎯 Fast Response' : '⚠️ Slow Response'}
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 4. PIPELINE FUNNEL STAGE */}
      <PipelineFunnel
        leads={instagramFilteredLeads}
        selectedCategory={filters.kategoriFlow}
        onSelectCategory={(cat) => setFilters((prev) => ({ ...prev, kategoriFlow: cat }))}
      />

      {/* 5. REAL-TIME LEADS LOG INSTAGRAM */}
      <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-3xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-pink-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800">
              Real-time Leads Log Instagram
            </h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-extrabold px-2.5 py-0.5 rounded-lg border border-slate-200">
            {instagramFilteredLeads.length} Baris Data Terfilter
          </span>
        </div>

        <LeadTable
          leads={instagramLeadsAll}
          onUpdateLead={onUpdateLead}
          onOpenEditModal={onOpenEditModal}
          onOpenHistoryModal={onOpenHistoryModal}
          onDeleteLead={onDeleteLead}
          filters={filters}
          setFilters={setFilters}
          csListNames={csListNames}
        />
      </div>

    </div>
  );
};
