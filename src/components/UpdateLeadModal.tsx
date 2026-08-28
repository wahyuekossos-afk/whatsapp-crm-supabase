import React, { useState, useEffect } from 'react';
import { Lead, FlowCategory, LostReason, CSUser, RepeatOrderItem, RepeatOrderLog, ProductsMap } from '../types';
import { FLOW_CATEGORIES, REASONS_FOR_LOST, INDONESIAN_CITIES } from '../data/initialData';
import { formatRupiah, formatHistoryTimestamp, getProductsForDashboard } from '../utils/spreadsheet';
import { X, Edit3, AlertCircle, Save, Lock, Plus, Trash2, RotateCw, ShoppingBag } from 'lucide-react';
import { ProductSelect } from './ProductSelect';

interface UpdateLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
  currentCS: CSUser;
  existingCities?: string[];
  productsMap?: ProductsMap;
}

export const UpdateLeadModal: React.FC<UpdateLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSave,
  currentCS,
  existingCities,
  productsMap,
}) => {
  if (!isOpen || !lead) return null;

  const cityList = existingCities && existingCities.length > 0 ? existingCities : INDONESIAN_CITIES;
  const targetDashboard = lead.clientName || currentCS.clientName || 'Wibu Sales (Utama)';
  const productOptions = getProductsForDashboard(productsMap, targetDashboard);

  const [kategoriFlow, setKategoriFlow] = useState<FlowCategory>(lead.kategoriFlow);
  const [namaCustomer, setNamaCustomer] = useState(lead.namaCustomer || '');
  const [nomorWA, setNomorWA] = useState(lead.nomorWA || '');
  const [tanggalMasuk, setTanggalMasuk] = useState(lead.tanggalMasuk || '');
  const [alasanLost, setAlasanLost] = useState<LostReason | string>(lead.alasanLost || '');
  const [jamBalas, setJamBalas] = useState(lead.jamBalas || '');
  const [lokasiKota, setLokasiKota] = useState(lead.lokasiKota || '');
  const [noteCustomer, setNoteCustomer] = useState(lead.noteCustomer || '');
  
  // Standard Order Fields
  const [itemOrder, setItemOrder] = useState(lead.itemOrder || '');
  const [quantityOrder, setQuantityOrder] = useState<number>(lead.quantityOrder !== undefined ? lead.quantityOrder : 0);
  const [totalInvoice, setTotalInvoice] = useState<number>(lead.totalInvoice || 0);

  // Multi-item Repeat Order State
  const [repeatItems, setRepeatItems] = useState<RepeatOrderItem[]>([
    {
      id: `item-1`,
      itemOrder: lead.itemOrder || '',
      quantityOrder: lead.quantityOrder || 1,
      totalInvoice: lead.totalInvoice || 0,
    },
  ]);

  const [updateLogNote, setUpdateLogNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (lead) {
      setKategoriFlow(lead.kategoriFlow);
      setNamaCustomer(lead.namaCustomer || '');
      setNomorWA(lead.nomorWA || '');
      setTanggalMasuk(lead.tanggalMasuk || '');
      setAlasanLost(lead.alasanLost || '');
      setJamBalas(lead.jamBalas || '');
      setLokasiKota(lead.lokasiKota || '');
      setNoteCustomer(lead.noteCustomer || '');
      setItemOrder(lead.itemOrder || '');
      setQuantityOrder(lead.quantityOrder !== undefined ? lead.quantityOrder : 0);
      setTotalInvoice(lead.totalInvoice || 0);
      setUpdateLogNote('');
      setErrorMsg('');

      // Initialize repeat items
      if (lead.kategoriFlow === 'Repeat Order') {
        setRepeatItems([
          {
            id: `item-${Date.now()}`,
            itemOrder: lead.itemOrder || '',
            quantityOrder: lead.quantityOrder || 1,
            totalInvoice: 0,
          },
        ]);
      } else {
        setRepeatItems([
          {
            id: `item-${Date.now()}`,
            itemOrder: lead.itemOrder || '',
            quantityOrder: 1,
            totalInvoice: 0,
          },
        ]);
      }
    }
  }, [lead]);

  // Effect when CS switches category select dropdown to 'Repeat Order'
  useEffect(() => {
    if (kategoriFlow === 'Repeat Order') {
      setRepeatItems((prev) => {
        if (prev.length === 1 && !prev[0].itemOrder.trim() && lead?.itemOrder) {
          return [
            {
              ...prev[0],
              itemOrder: lead.itemOrder,
            },
          ];
        }
        return prev;
      });
    }
  }, [kategoriFlow, lead]);

  // Handle Repeat Items Dynamic Row Changes
  const handleAddRepeatRow = () => {
    setRepeatItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        itemOrder: '',
        quantityOrder: 1,
        totalInvoice: 0,
      },
    ]);
  };

  const handleRemoveRepeatRow = (id: string) => {
    if (repeatItems.length <= 1) return;
    setRepeatItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateRepeatRow = (
    id: string,
    field: keyof RepeatOrderItem,
    value: string | number
  ) => {
    setRepeatItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Calculations for Current Repeat Order
  const calcCurrentRepeatQty = repeatItems.reduce(
    (acc, item) => acc + (Number(item.quantityOrder) || 0),
    0
  );
  const calcCurrentRepeatInvoice = repeatItems.reduce(
    (acc, item) => acc + (Number(item.totalInvoice) || 0),
    0
  );

  // Calculations for Customer Lifetime Totals
  const existingLifetimeInvoice = lead.totalInvoice || 0;
  const existingLifetimeQty = lead.quantityOrder || 0;

  const calcLifetimeInvoice =
    kategoriFlow === 'Repeat Order'
      ? existingLifetimeInvoice + calcCurrentRepeatInvoice
      : Number(totalInvoice) || 0;

  const calcLifetimeQty =
    kategoriFlow === 'Repeat Order'
      ? existingLifetimeQty + calcCurrentRepeatQty
      : Number(quantityOrder) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nomorWA.trim()) {
      return setErrorMsg('VALIDASI: Nomor WhatsApp wajib diisi!');
    }

    // Specific validation rule: If kategori == "Lost", Alasan Lost is MANDATORY
    if (kategoriFlow === 'Lost' && !alasanLost.trim()) {
      return setErrorMsg('VALIDASI KHUSUS: Alasan Lost WAJIB diisi jika kategori = "Lost"!');
    }

    // Special First Order quantity validation
    if (kategoriFlow === 'First Order' && (isNaN(Number(quantityOrder)) || Number(quantityOrder) <= 0)) {
      return setErrorMsg('VALIDASI KHUSUS: Quantity Order (pcs) WAJIB diisi lebih dari 0 jika kategori adalah "First Order"!');
    }

    // Repeat Order Validation: Items cannot be completely empty
    if (kategoriFlow === 'Repeat Order') {
      const validItems = repeatItems.filter((i) => i.itemOrder.trim().length > 0);
      if (validItems.length === 0) {
        return setErrorMsg('REPEAT ORDER WAJIB: Isi setidaknya 1 nama "Item Order" pesanan repeat order!');
      }
    }

    const nowStr = new Date().toLocaleString('id-ID');

    // Build repeat order log if category is Repeat Order
    let newRiwayatRepeatStr = lead.riwayatRepeatOrder || '';
    let finalItemOrderStr = itemOrder;
    let finalQuantityOrder = Number(quantityOrder) || 0;
    let finalTotalInvoice = Number(totalInvoice) || 0;

    if (kategoriFlow === 'Repeat Order') {
      const validItems = repeatItems.filter((i) => i.itemOrder.trim().length > 0);
      const itemsSummaryText = validItems
        .map((i) => `${i.itemOrder} (${i.quantityOrder || 1} pcs - ${formatRupiah(i.totalInvoice || 0)})`)
        .join('; ');

      finalItemOrderStr = validItems.map((i) => i.itemOrder).join(', ');
      finalQuantityOrder = calcLifetimeQty;
      finalTotalInvoice = calcLifetimeInvoice;

      // Existing logs array
      let existingLogs: RepeatOrderLog[] = [];
      if (lead.riwayatRepeatOrder) {
        try {
          const parsed = JSON.parse(lead.riwayatRepeatOrder);
          if (Array.isArray(parsed) && parsed.length > 0) existingLogs = parsed;
        } catch {
          // ignore
        }
      }

      // If existingLogs is empty BUT lead was ALREADY a Repeat Order lead prior to this update
      if (existingLogs.length === 0 && lead.kategoriFlow === 'Repeat Order') {
        existingLogs = [
          {
            id: `ro-initial-${Date.now()}`,
            timestamp: formatHistoryTimestamp(`${lead.tanggalMasuk} ${lead.jamMasuk || '09:00'}`),
            csName: lead.namaCS,
            items: [
              {
                id: 'item-init-1',
                itemOrder: lead.itemOrder || 'Item Order',
                quantityOrder: lead.quantityOrder || 1,
                totalInvoice: lead.totalInvoice || 0,
              },
            ],
            totalQuantity: lead.quantityOrder || 1,
            totalInvoice: lead.totalInvoice || 0,
            note: lead.noteCustomer || 'Repeat Order Pertama',
          },
        ];
      }

      const newLog: RepeatOrderLog = {
        id: `ro-${Date.now()}`,
        timestamp: nowStr,
        csName: currentCS.nama,
        items: validItems,
        totalQuantity: calcCurrentRepeatQty,
        totalInvoice: calcCurrentRepeatInvoice,
        note: updateLogNote || `Repeat Order (${itemsSummaryText})`,
      };

      existingLogs.unshift(newLog); // latest first
      newRiwayatRepeatStr = JSON.stringify(existingLogs);
    }

    const updatedLead: Lead = {
      ...lead, // Preserves other fields
      namaCustomer,
      nomorWA: nomorWA.trim(),
      tanggalMasuk,
      kategoriFlow,
      alasanLost: kategoriFlow === 'Lost' ? alasanLost : '',
      jamBalas,
      lokasiKota,
      noteCustomer,
      itemOrder: finalItemOrderStr,
      quantityOrder: finalQuantityOrder,
      totalInvoice: finalTotalInvoice,
      riwayatRepeatOrder: newRiwayatRepeatStr,
      updatedAt: new Date().toISOString(),
      history: [
        ...lead.history,
        {
          id: `h-${Date.now()}`,
          timestamp: nowStr,
          csName: currentCS.nama,
          fromFlow: lead.kategoriFlow,
          toFlow: kategoriFlow,
          note:
            updateLogNote ||
            (kategoriFlow === 'Repeat Order'
              ? `Repeat Order Baru (${calcCurrentRepeatQty} pcs, ${formatRupiah(calcCurrentRepeatInvoice)})`
              : kategoriFlow === 'First Order'
              ? `First Order ${finalQuantityOrder} pcs, ${formatRupiah(finalTotalInvoice)}`
              : `Update status ke ${kategoriFlow}`),
          itemOrder: finalItemOrderStr,
          quantityOrder: finalQuantityOrder,
          totalInvoice: finalTotalInvoice,
          alasanLost: kategoriFlow === 'Lost' ? alasanLost : '',
        },
      ],
    };

    onSave(updatedLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl md:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94dvh] sm:max-h-[85vh] my-0 sm:my-8 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        
        {/* Modal Header */}
        <div className={`px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between text-white shrink-0 sticky top-0 z-10 shadow-xs transition-colors ${
          kategoriFlow === 'Repeat Order' ? 'bg-teal-900' : 'bg-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {kategoriFlow === 'Repeat Order' ? (
              <div className="p-1.5 bg-teal-800 rounded-lg">
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300" />
              </div>
            ) : (
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">Update Lead Existing</h3>
                {kategoriFlow === 'Repeat Order' && (
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-teal-400 text-teal-950 rounded-full uppercase tracking-wider">
                    Repeat Order
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300">Progres chat sales &amp; detail transaksi customer</p>
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

        {/* Form Body Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs text-slate-800">
            
             {/* Locked / Read-Only Header (No Need to Re-Input) */}
            <div className="p-2.5 sm:p-3 bg-slate-100/90 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  ✏️ Nama Customer <span className="text-rose-500 font-bold">*</span>
                </span>
                <input
                  type="text"
                  value={namaCustomer}
                  onChange={(e) => setNamaCustomer(e.target.value)}
                  placeholder="Nama Customer..."
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  ✏️ No. WhatsApp <span className="text-rose-500 font-bold">*</span>
                </span>
                <input
                  type="text"
                  value={nomorWA}
                  onChange={(e) => setNomorWA(e.target.value)}
                  placeholder="No. WhatsApp..."
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md font-mono font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  📅 Tanggal Masuk
                </span>
                <input
                  type="date"
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-md font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Editable Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              {/* Kategori Flow Lead */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kategori Flow Lead saat ini <span className="text-rose-500">*</span>
                </label>
                <select
                  value={kategoriFlow}
                  onChange={(e) => setKategoriFlow(e.target.value as FlowCategory)}
                  className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg font-bold text-sm sm:text-xs focus:outline-none focus:ring-2 ${
                    kategoriFlow === 'Repeat Order'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 focus:ring-teal-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-500'
                  }`}
                >
                  {FLOW_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alasan Lost (Mandatory if Flow = Lost) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Alasan Lost {kategoriFlow === 'Lost' && <span className="text-rose-600 font-extrabold">(WAJIB) *</span>}
                </label>
                <select
                  value={alasanLost}
                  onChange={(e) => setAlasanLost(e.target.value)}
                  disabled={kategoriFlow !== 'Lost'}
                  className={`w-full px-3 py-2.5 sm:py-2 border rounded-lg focus:outline-none text-sm sm:text-xs ${
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

            {/* Time & Location Update */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam</label>
                <input
                  type="time"
                  value={jamBalas}
                  onChange={(e) => setJamBalas(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 bg-white border border-slate-300 rounded-lg font-mono text-sm sm:text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Leads (Kota)</label>
                <input
                  type="text"
                  list="update-city-options"
                  value={lokasiKota}
                  onChange={(e) => setLokasiKota(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 bg-white border border-slate-300 rounded-lg text-sm sm:text-xs"
                />
                <datalist id="update-city-options">
                  {cityList.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* SPECIAL SECTION: REPEAT ORDER MULTI-ITEM ORDER FORM */}
            {kategoriFlow === 'Repeat Order' ? (
              <div className="p-3 sm:p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-teal-200/80 pb-2">
                  <div className="flex items-center gap-1.5 text-teal-900">
                    <RotateCw className="w-3.5 h-3.5 text-teal-600 shrink-0 animate-spin-slow" />
                    <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider">Input Pesanan Repeat Order</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRepeatRow}
                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-[10px] sm:text-[11px] rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Item (+)</span>
                  </button>
                </div>

                {/* Dynamic Items Rows */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-0.5">
                  {repeatItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 sm:gap-2.5 items-center bg-white p-2.5 rounded-lg border border-teal-100 shadow-2xs relative"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          Item Order #{idx + 1}
                        </label>
                        <ProductSelect
                          value={item.itemOrder}
                          onChange={(val) => handleUpdateRepeatRow(item.id, 'itemOrder', val)}
                          options={productOptions}
                          placeholder="Pilih / cari Item..."
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          Quantity Order (pcs)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantityOrder || ''}
                          onChange={(e) =>
                            handleUpdateRepeatRow(item.id, 'quantityOrder', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono text-center font-bold text-slate-800"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">
                          Total Invoice (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.totalInvoice || ''}
                          onChange={(e) =>
                            handleUpdateRepeatRow(item.id, 'totalInvoice', Number(e.target.value))
                          }
                          className="w-full px-2.5 py-2 sm:py-1.5 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-teal-500 font-mono font-bold text-emerald-700"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center pt-3 sm:pt-0">
                        {repeatItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRepeatRow(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary Box for Repeat Order */}
                <div className="p-2.5 bg-white border border-teal-100 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2 text-center shadow-3xs">
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quantity Repeat Ini
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                      {calcCurrentRepeatQty} pcs
                    </span>
                  </div>

                  <div className="p-1.5 bg-emerald-50 rounded border border-emerald-100">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">
                      Total Invoice Repeat Ini
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono">
                      {formatRupiah(calcCurrentRepeatInvoice)}
                    </span>
                  </div>

                  <div className="p-1.5 bg-teal-50/50 rounded border border-teal-200">
                    <span className="text-[9px] font-bold text-teal-900 uppercase tracking-wider block">
                      Akumulasi Customer
                    </span>
                    <span className="text-xs sm:text-sm font-black text-teal-950 font-mono block">
                      {formatRupiah(calcLifetimeInvoice)}
                    </span>
                    <span className="block text-[8px] text-teal-700 font-bold mt-0.5">
                      ({calcLifetimeQty} total pcs)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Order Details Update for Non-Repeat Order */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Item Order</span>
                    {productOptions.length > 0 && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 py-0.5 rounded">
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
                    Quantity Order (pcs) {kategoriFlow === 'First Order' ? <span className="text-rose-500">(WAJIB) *</span> : <span className="text-slate-400 font-normal">(Opsional)</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantityOrder === 0 ? '' : quantityOrder}
                    placeholder="0"
                    onChange={(e) => setQuantityOrder(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-2.5 py-2.5 sm:py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-sm sm:text-xs"
                    required={kategoriFlow === 'First Order'}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Invoice (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={totalInvoice}
                    onChange={(e) => setTotalInvoice(Number(e.target.value))}
                    className="w-full px-2.5 py-2.5 sm:py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-emerald-700 text-sm sm:text-xs"
                  />
                </div>
              </div>
            )}

            {/* Notes & Audit Log Comment */}
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Note Customer (Catatan Terbaru)</label>
                <textarea
                  rows={2}
                  value={noteCustomer}
                  onChange={(e) => setNoteCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm sm:text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Log Perubahan (Optional)</label>
                <input
                  type="text"
                  placeholder="Misal: Customer repeat order via WA, transfer DP lunas..."
                  value={updateLogNote}
                  onChange={(e) => setUpdateLogNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg italic text-sm sm:text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Sticky Footer */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 sticky bottom-0 z-10 shadow-xs">
            <span className="text-[10px] sm:text-[11px] text-slate-400 self-start sm:self-auto leading-none">
              CS: <strong className="text-slate-600">{currentCS.nama}</strong>
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 sm:py-2 rounded-lg font-medium text-xs text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-center flex-1 sm:flex-initial"
              >
                Batal
              </button>
              <button
                type="submit"
                className={`px-5 py-2.5 sm:py-2 rounded-lg font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial ${
                  kategoriFlow === 'Repeat Order'
                    ? 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 shadow-teal-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {kategoriFlow === 'Repeat Order'
                    ? 'Simpan Repeat Order'
                    : 'Simpan Update'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

