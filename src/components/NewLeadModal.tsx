import React, { useState } from 'react';
import { Lead, FlowCategory, LostReason, CSUser, ProductsMap } from '../types';
import { FLOW_CATEGORIES, REASONS_FOR_LOST, INDONESIAN_CITIES } from '../data/initialData';
import { formatHistoryTimestamp, formatRupiah, getProductsForDashboard } from '../utils/spreadsheet';
import { X, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ProductSelect } from './ProductSelect';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newLead: Lead) => void;
  currentCS: CSUser;
  csList: CSUser[];
  activeDashboardName?: string;
  existingCities?: string[];
  productsMap?: ProductsMap;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentCS,
  csList,
  activeDashboardName = 'Wibu Sales (Utama)',
  existingCities,
  productsMap,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [namaCS, setNamaCS] = useState(() => {
    if (csList && csList.some((cs) => cs.nama === currentCS?.nama)) return currentCS?.nama || '';
    return csList?.[0]?.nama || currentCS?.nama || '';
  });

  const cityList = existingCities && existingCities.length > 0 ? existingCities : INDONESIAN_CITIES;

  const selectedCSUser = (csList || []).find((c) => c.nama === namaCS);
  const targetDashboard = selectedCSUser?.clientName && selectedCSUser.clientName !== 'Semua Klien' ? selectedCSUser.clientName : activeDashboardName;
  const productOptions = getProductsForDashboard(productsMap, targetDashboard).length > 0 
    ? getProductsForDashboard(productsMap, targetDashboard) 
    : getProductsForDashboard(productsMap, activeDashboardName);

  const [nomorWA, setNomorWA] = useState('');
  const [namaCustomer, setNamaCustomer] = useState('');
  const [kategoriFlow, setKategoriFlow] = useState<FlowCategory>('New Leads');
  const [alasanLost, setAlasanLost] = useState<LostReason | string>('');
  const [tanggalMasuk, setTanggalMasuk] = useState(todayStr);
  const [jamMasuk, setJamMasuk] = useState(currentTimeStr);
  const [jamBalas, setJamBalas] = useState(currentTimeStr);
  const [lokasiKota, setLokasiKota] = useState('Jakarta Selatan');
  const [noteCustomer, setNoteCustomer] = useState('');
  const [itemOrder, setItemOrder] = useState('');
  const [quantityOrder, setQuantityOrder] = useState<number>(0);
  const [totalInvoice, setTotalInvoice] = useState<number>(0);

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field Validations
    if (!namaCS.trim()) return setErrorMsg('1. Nama CS wajib dipilih/diisi.');
    if (!nomorWA.trim()) return setErrorMsg('2. Nomor WhatsApp customer wajib diisi.');
    if (!namaCustomer.trim()) return setErrorMsg('3. Nama Customer wajib diisi.');
    if (!kategoriFlow) return setErrorMsg('4. Kategori Flow Lead wajib dipilih.');
    
    // Special Lost validation rule
    if (kategoriFlow === 'Lost' && !alasanLost.trim()) {
      return setErrorMsg('5. Alasan Lost WAJIB diisi jika kategori Flow adalah "Lost"!');
    }

    // Special First Order quantity validation
    if (kategoriFlow === 'First Order' && (isNaN(Number(quantityOrder)) || Number(quantityOrder) <= 0)) {
      return setErrorMsg('12. Quantity Order (pcs) WAJIB diisi lebih dari 0 jika kategori Flow adalah "First Order"!');
    }

    if (!tanggalMasuk) return setErrorMsg('6. Tanggal Leads Masuk wajib diisi.');
    if (!jamMasuk) return setErrorMsg('7. Jam Masuk Leads wajib diisi.');
    if (!jamBalas) return setErrorMsg('8. Jam Balas CS wajib diisi.');
    if (!lokasiKota.trim()) return setErrorMsg('9. Lokasi Leads (Kota) wajib diisi.');
    if (!noteCustomer.trim()) return setErrorMsg('10. Note Customer wajib diisi.');

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      clientName: activeDashboardName,
      namaCS: namaCS.trim(),
      nomorWA: nomorWA.trim(),
      namaCustomer: namaCustomer.trim(),
      kategoriFlow,
      alasanLost: kategoriFlow === 'Lost' ? alasanLost : '',
      tanggalMasuk,
      jamMasuk,
      jamBalas,
      lokasiKota: lokasiKota.trim(),
      noteCustomer: noteCustomer.trim(),
      itemOrder: itemOrder.trim(),
      quantityOrder: isNaN(Number(quantityOrder)) ? 0 : Number(quantityOrder),
      totalInvoice: isNaN(Number(totalInvoice)) ? 0 : Number(totalInvoice),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          timestamp: formatHistoryTimestamp(`${tanggalMasuk} ${jamMasuk || jamBalas || '09:00'}`),
          csName: namaCS.trim(),
          toFlow: kategoriFlow,
          note:
            kategoriFlow === 'First Order'
              ? `First Order ${isNaN(Number(quantityOrder)) ? 0 : Number(quantityOrder)} pcs, ${formatRupiah(Number(totalInvoice) || 0)}`
              : `Input lead baru via WhatsApp (${noteCustomer})`,
          itemOrder: itemOrder.trim(),
          quantityOrder: isNaN(Number(quantityOrder)) ? 0 : Number(quantityOrder),
          totalInvoice: Number(totalInvoice) || 0,
          alasanLost: kategoriFlow === 'Lost' ? alasanLost : '',
        },
      ],
    };

    onSave(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94dvh] sm:max-h-[90vh] my-0 sm:my-8 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">Input Lead Baru (Chat WhatsApp)</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Isi seluruh 13 field wajib untuk menyimpan ke spreadsheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-800">
            
            {/* Row 1: CS & WA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Nama CS <span className="text-rose-500">*</span>
                </label>
                <select
                  value={namaCS}
                  onChange={(e) => setNamaCS(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {csList.map((cs) => (
                    <option key={cs.id} value={cs.nama}>
                      {cs.nama} ({cs.role}){cs.clientName ? ` - ${cs.clientName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Nomor WhatsApp Customer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081298765432"
                  value={nomorWA}
                  onChange={(e) => setNomorWA(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Row 2: Customer Name & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Nama Customer <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toko Maju Jaya / Bpk. Rudi"
                  value={namaCustomer}
                  onChange={(e) => setNamaCustomer(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  9. Lokasi Leads (Kota) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="city-options"
                  placeholder="Pilih atau ketik kota..."
                  value={lokasiKota}
                  onChange={(e) => setLokasiKota(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <datalist id="city-options">
                  {cityList.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Row 3: Kategori Flow & Alasan Lost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  4. Kategori Flow Lead <span className="text-rose-500">*</span>
                </label>
                <select
                  value={kategoriFlow}
                  onChange={(e) => setKategoriFlow(e.target.value as FlowCategory)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {FLOW_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  5. Alasan Lost {kategoriFlow === 'Lost' && <span className="text-rose-600 font-extrabold">(WAJIB) *</span>}
                </label>
                <select
                  value={alasanLost}
                  onChange={(e) => setAlasanLost(e.target.value)}
                  disabled={kategoriFlow !== 'Lost'}
                  className={`w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs border rounded-lg focus:outline-none ${
                    kategoriFlow === 'Lost'
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold focus:ring-2 focus:ring-rose-500'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <option value="">-- Pilih Alasan Lost --</option>
                  {REASONS_FOR_LOST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Dates & Times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  6. Tanggal Leads Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full px-2.5 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    7. Jam Masuk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={jamMasuk}
                    onChange={(e) => setJamMasuk(e.target.value)}
                    className="w-full px-2.5 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  8. Jam Balas CS <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={jamBalas}
                  onChange={(e) => setJamBalas(e.target.value)}
                  className="w-full px-2.5 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>
            </div>

            {/* Row 5: Orders, Qty, Total Invoice */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>11. Item Order <span className="text-slate-400 font-normal text-xs">(Opsional)</span></span>
                  {productOptions.length > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      {productOptions.length} Produk
                    </span>
                  )}
                </label>
                <ProductSelect
                  value={itemOrder}
                  onChange={setItemOrder}
                  options={productOptions}
                  placeholder="Pilih atau cari produk..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  12. Quantity Order (pcs) {kategoriFlow === 'First Order' ? <span className="text-rose-500">(WAJIB) *</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantityOrder === 0 ? '' : quantityOrder}
                  placeholder="0"
                  onChange={(e) => setQuantityOrder(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg font-mono"
                  required={kategoriFlow === 'First Order'}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  13. Total Invoice (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 5000000"
                  value={totalInvoice}
                  onChange={(e) => setTotalInvoice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg font-bold text-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Row 6: Note Customer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                10. Note Customer <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Catatan kebutuhan customer, permintaan sampel, alamat pengiriman, dll..."
                value={noteCustomer}
                onChange={(e) => setNoteCustomer(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Action Buttons Sticky Footer */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:py-2 rounded-lg font-medium text-xs sm:text-xs text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 sm:py-2 rounded-lg font-bold text-xs sm:text-xs bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Lead ke Spreadsheet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
