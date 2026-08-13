import React, { useState } from 'react';
import { Lead, RepeatOrderLog } from '../types';
import { formatRupiah, formatHistoryTimestamp } from '../utils/spreadsheet';
import { History, X, User, ArrowRight, Calendar, AlertTriangle, RotateCw, ShoppingBag } from 'lucide-react';

interface HistoryModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ lead, isOpen, onClose }) => {
  if (!isOpen || !lead) return null;

  const [activeTab, setActiveTab] = useState<'history' | 'repeat'>('history');

  let repeatLogs: RepeatOrderLog[] = [];
  if (lead.riwayatRepeatOrder) {
    try {
      const parsed = JSON.parse(lead.riwayatRepeatOrder);
      if (Array.isArray(parsed) && parsed.length > 0) repeatLogs = parsed;
    } catch {
      // ignore
    }
  }

  // Fallback: If repeatLogs is empty BUT lead is Repeat Order or has Repeat Order in history
  if (repeatLogs.length === 0 && (lead.kategoriFlow === 'Repeat Order' || lead.history?.some((h) => h.toFlow === 'Repeat Order'))) {
    const roHistory = lead.history ? lead.history.filter((h) => h.toFlow === 'Repeat Order') : [];
    if (roHistory.length > 0) {
      repeatLogs = roHistory
        .map((h, idx) => ({
          id: h.id || `ro-fallback-${idx}`,
          timestamp: h.timestamp || formatHistoryTimestamp(`${lead.tanggalMasuk} ${lead.jamMasuk || '09:00'}`),
          csName: h.csName || lead.namaCS,
          items: [
            {
              id: `item-${idx}`,
              itemOrder: h.itemOrder || lead.itemOrder || 'Item Order',
              quantityOrder: h.quantityOrder || lead.quantityOrder || 1,
              totalInvoice: h.totalInvoice || lead.totalInvoice || 0,
            },
          ],
          totalQuantity: h.quantityOrder || lead.quantityOrder || 1,
          totalInvoice: h.totalInvoice || lead.totalInvoice || 0,
          note: h.note || `Repeat Order #${idx + 1}`,
        }))
        .reverse();
    } else if (lead.kategoriFlow === 'Repeat Order') {
      repeatLogs = [
        {
          id: 'ro-fallback-1',
          timestamp: formatHistoryTimestamp(`${lead.tanggalMasuk} ${lead.jamMasuk || '09:00'}`),
          csName: lead.namaCS,
          items: [
            {
              id: 'item-1',
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
  }

  const getFormattedHistoryNote = (item: any) => {
    if (
      item.toFlow === 'First Order' &&
      (!item.note || item.note === 'Update status ke First Order' || item.note.includes('Update status ke First Order'))
    ) {
      const qty = item.quantityOrder || lead.quantityOrder || 1;
      const inv =
        item.totalInvoice !== undefined && item.totalInvoice !== null && item.totalInvoice > 0
          ? item.totalInvoice
          : lead.totalInvoice || 0;
      return `First order ${qty} pcs, ${formatRupiah(inv)}`;
    }
    return item.note;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base text-white">Log Riwayat &amp; Repeat Order Lead</h3>
              <p className="text-xs text-slate-400">Customer: {lead.namaCustomer} ({lead.nomorWA})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Perubahan Status ({lead.history?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('repeat')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'repeat'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-teal-600" />
            <span>Riwayat Repeat Order ({repeatLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-800">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status Terakhir</span>
              <p className="font-bold text-sm text-slate-900">{lead.kategoriFlow}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Akumulasi Total Sales</span>
              <p className="font-bold text-sm text-emerald-700">{formatRupiah(lead.totalInvoice || 0)}</p>
            </div>
          </div>

          {activeTab === 'history' ? (
            /* Audit Log Timeline */
            <div className="relative border-l-2 border-indigo-200 ml-3 space-y-6">
              {lead.history && lead.history.length > 0 ? (
                lead.history.slice().reverse().map((item, idx) => (
                  <div key={item.id || idx} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white" />

                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3 h-3 text-indigo-500" /> {item.csName}
                        </span>
                        <span>{formatHistoryTimestamp(item.timestamp, lead.tanggalMasuk, lead.jamMasuk)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {item.fromFlow && (
                          <>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold text-[10px]">
                              {item.fromFlow}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </>
                        )}
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          {item.toFlow}
                        </span>
                      </div>

                      {/* Item Produk yang Dipesan */}
                      {(() => {
                        const prodName = item.itemOrder || (item.toFlow === 'First Order' || item.toFlow === 'Repeat Order' ? lead.itemOrder : '');
                        const qty = item.quantityOrder !== undefined && item.quantityOrder > 0 ? item.quantityOrder : (prodName ? lead.quantityOrder : 0);
                        const inv = item.totalInvoice !== undefined && item.totalInvoice > 0 ? item.totalInvoice : (prodName ? lead.totalInvoice : 0);

                        if (!prodName && !qty && !inv) return null;

                        return (
                          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-150 px-2.5 py-1.5 rounded-md mt-2 text-[11px]">
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-bold text-slate-800 truncate">
                                {prodName || 'Item Order'}
                              </span>
                            </div>
                            {(qty > 0 || inv > 0) && (
                              <div className="flex items-center gap-2 font-mono shrink-0">
                                {qty > 0 && <span className="text-slate-600 font-semibold">{qty} pcs</span>}
                                {inv > 0 && <span className="font-bold text-emerald-700">{formatRupiah(inv)}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {item.alasanLost && (
                        <div className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 p-1.5 rounded text-[11px] flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Alasan Lost: {item.alasanLost}
                        </div>
                      )}

                      {(() => {
                        const displayNote = getFormattedHistoryNote(item);
                        if (!displayNote) return null;
                        return (
                          <p className="text-slate-600 italic text-[11px] pt-1 border-t border-slate-100 mt-1">
                            "{displayNote}"
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">Belum ada riwayat perubahan tercatat.</p>
              )}
            </div>
          ) : (
            /* Repeat Order Logs List */
            <div className="space-y-3">
              {repeatLogs.length > 0 ? (
                repeatLogs.map((log, idx) => (
                  <div key={log.id || idx} className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-teal-200/60 pb-1.5 text-[11px]">
                      <span className="font-extrabold text-teal-900 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                        Repeat Order #{repeatLogs.length - idx}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Daftar Item Pesanan:</span>
                      <div className="space-y-1 pl-1">
                        {log.items && log.items.length > 0 ? (
                          log.items.map((item, iIdx) => (
                            <div key={item.id || iIdx} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-teal-100 text-[11px]">
                              <span className="font-bold text-slate-800">{item.itemOrder}</span>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-slate-600 font-semibold">{item.quantityOrder || 1} pcs</span>
                                <span className="font-bold text-emerald-700">{formatRupiah(item.totalInvoice || 0)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-600 font-medium">{lead.itemOrder}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-teal-200/60 text-[11px] font-bold">
                      <span className="text-slate-600">CS Handle: {log.csName}</span>
                      <span className="text-teal-900 font-mono">Total: {formatRupiah(log.totalInvoice)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-600" />
                  <p>Belum ada riwayat repeat order untuk customer ini.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
