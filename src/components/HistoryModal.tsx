import React, { useState } from 'react';
import { Lead, RepeatOrderLog, CSUser, FlowCategory } from '../types';
import { formatRupiah, formatHistoryTimestamp } from '../utils/spreadsheet';
import { FLOW_CATEGORIES } from '../data/initialData';
import { History, X, User, ArrowRight, Calendar, AlertTriangle, RotateCw, ShoppingBag, Edit3, Check, Trash2 } from 'lucide-react';

interface HistoryModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedLead: Lead) => void;
  csList?: CSUser[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  lead, 
  isOpen, 
  onClose,
  onSave,
  csList = []
}) => {
  if (!isOpen || !lead) return null;

  const [activeTab, setActiveTab] = useState<'history' | 'repeat'>('history');

  // Editing state for History items
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editCSName, setEditCSName] = useState('');
  const [editToFlow, setEditToFlow] = useState<FlowCategory>('New Leads');
  const [editTotalInvoice, setEditTotalInvoice] = useState<number>(0);
  const [editQuantityOrder, setEditQuantityOrder] = useState<number>(0);

  // Editing state for Repeat Order logs
  const [editingRepeatId, setEditingRepeatId] = useState<string | null>(null);
  const [editRepeatCSName, setEditRepeatCSName] = useState('');
  const [editRepeatTotalInvoice, setEditRepeatTotalInvoice] = useState<number>(0);
  const [editRepeatTotalQuantity, setEditRepeatTotalQuantity] = useState<number>(0);

  const startEditHistory = (item: any) => {
    setEditingHistoryId(item.id);
    setEditCSName(item.csName || lead.namaCS);
    setEditToFlow(item.toFlow || lead.kategoriFlow);
    setEditTotalInvoice(item.totalInvoice || 0);
    setEditQuantityOrder(item.quantityOrder || 0);
  };

  const cancelEditHistory = () => {
    setEditingHistoryId(null);
  };

  const handleSaveHistoryEdit = (itemId: string) => {
    if (!onSave) return;

    const updatedHistory = (lead.history || []).map((h) => {
      if (h.id === itemId) {
        return {
          ...h,
          csName: editCSName,
          toFlow: editToFlow as FlowCategory,
          totalInvoice: editTotalInvoice,
          quantityOrder: editQuantityOrder,
        };
      }
      return h;
    });

    const updatedLead: Lead = {
      ...lead,
      namaCS: editCSName, // Update the lead's active CS name to the edited CS name
      history: updatedHistory,
    };

    // If it is the latest history item, also update main lead properties
    const isLatest = lead.history && lead.history.length > 0 && lead.history[lead.history.length - 1].id === itemId;
    if (isLatest) {
      updatedLead.namaCS = editCSName;
      updatedLead.kategoriFlow = editToFlow as FlowCategory;
      updatedLead.totalInvoice = editTotalInvoice;
      updatedLead.quantityOrder = editQuantityOrder;
    }

    onSave(updatedLead);
    setEditingHistoryId(null);
  };

  const startEditRepeat = (log: RepeatOrderLog) => {
    setEditingRepeatId(log.id);
    setEditRepeatCSName(log.csName || lead.namaCS);
    setEditRepeatTotalInvoice(log.totalInvoice || 0);
    setEditRepeatTotalQuantity(log.totalQuantity || 1);
  };

  const cancelEditRepeat = () => {
    setEditingRepeatId(null);
  };

  const handleSaveRepeatEdit = (logId: string) => {
    if (!onSave) return;

    let repeatLogsList: RepeatOrderLog[] = [];
    if (lead.riwayatRepeatOrder) {
      try {
        const parsed = JSON.parse(lead.riwayatRepeatOrder);
        if (Array.isArray(parsed)) repeatLogsList = parsed;
      } catch {
        // ignore
      }
    }

    if (repeatLogsList.length === 0) {
      repeatLogsList = repeatLogs;
    }

    const originalLog = repeatLogsList.find((l) => l.id === logId);
    if (!originalLog) return;

    const oldInvoice = originalLog.totalInvoice || 0;
    const oldQty = originalLog.totalQuantity || 0;

    const updatedLogs = repeatLogsList.map((log) => {
      if (log.id === logId) {
        const updatedItems = log.items && log.items.length > 0
          ? log.items.map((it, idx) => idx === 0 ? { ...it, totalInvoice: editRepeatTotalInvoice, quantityOrder: editRepeatTotalQuantity } : it)
          : [{ id: 'item-0', itemOrder: lead.itemOrder || 'Item Order', quantityOrder: editRepeatTotalQuantity, totalInvoice: editRepeatTotalInvoice }];

        return {
          ...log,
          csName: editRepeatCSName,
          totalInvoice: editRepeatTotalInvoice,
          totalQuantity: editRepeatTotalQuantity,
          items: updatedItems,
        };
      }
      return log;
    });

    const diffInvoice = editRepeatTotalInvoice - oldInvoice;
    const diffQty = editRepeatTotalQuantity - oldQty;

    const updatedLead: Lead = {
      ...lead,
      namaCS: editRepeatCSName, // ALWAYS update the main lead's CS name to match!
      riwayatRepeatOrder: JSON.stringify(updatedLogs),
      totalInvoice: (lead.totalInvoice || 0) + diffInvoice,
      quantityOrder: (lead.quantityOrder || 0) + diffQty,
    };

    onSave(updatedLead);
    setEditingRepeatId(null);
  };

  const handleDeleteHistoryItem = (itemId: string) => {
    if (!onSave) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus log riwayat ini?')) return;

    const updatedHistory = (lead.history || []).filter((h) => h.id !== itemId);
    const updatedLead: Lead = {
      ...lead,
      history: updatedHistory,
    };

    // If we deleted the latest history item, set the status to the new latest item's status
    if (updatedHistory.length > 0) {
      const newLatest = updatedHistory[updatedHistory.length - 1];
      updatedLead.namaCS = newLatest.csName;
      updatedLead.kategoriFlow = newLatest.toFlow;
      if (newLatest.totalInvoice !== undefined) {
        updatedLead.totalInvoice = newLatest.totalInvoice;
      }
      if (newLatest.quantityOrder !== undefined) {
        updatedLead.quantityOrder = newLatest.quantityOrder;
      }
    }

    onSave(updatedLead);
  };

  const handleDeleteRepeatLog = (logId: string) => {
    if (!onSave) return;
    if (!window.confirm('Apakah Anda yakin ingin menghapus data repeat order ini?')) return;

    let repeatLogsList: RepeatOrderLog[] = [];
    if (lead.riwayatRepeatOrder) {
      try {
        const parsed = JSON.parse(lead.riwayatRepeatOrder);
        if (Array.isArray(parsed)) repeatLogsList = parsed;
      } catch {
        // ignore
      }
    }

    if (repeatLogsList.length === 0) {
      repeatLogsList = repeatLogs;
    }

    const logToDelete = repeatLogsList.find((l) => l.id === logId);
    if (!logToDelete) return;

    const deletedInvoice = logToDelete.totalInvoice || 0;
    const deletedQty = logToDelete.totalQuantity || 0;

    const updatedLogs = repeatLogsList.filter((l) => l.id !== logId);

    const updatedLead: Lead = {
      ...lead,
      riwayatRepeatOrder: JSON.stringify(updatedLogs),
      totalInvoice: Math.max(0, (lead.totalInvoice || 0) - deletedInvoice),
      quantityOrder: Math.max(0, (lead.quantityOrder || 0) - deletedQty),
    };

    onSave(updatedLead);
  };

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

                    {editingHistoryId === item.id ? (
                      /* Editing Mode */
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs space-y-3">
                        <div className="text-[11px] font-bold text-indigo-900 uppercase">Edit Log Status</div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama CS:</label>
                          <select
                            value={editCSName}
                            onChange={(e) => setEditCSName(e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded bg-white text-xs font-bold text-slate-800"
                          >
                            {csList && csList.length > 0 ? (
                              csList.map((cs) => (
                                <option key={cs.id} value={cs.nama}>
                                  {cs.nama} ({cs.role})
                                </option>
                              ))
                            ) : (
                              <option value={item.csName}>{item.csName}</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Status Pipeline:</label>
                          <select
                            value={editToFlow}
                            onChange={(e) => setEditToFlow(e.target.value as FlowCategory)}
                            className="w-full p-1 border border-slate-300 rounded bg-white text-xs font-bold text-slate-800"
                          >
                            {FLOW_CATEGORIES.map((flow) => (
                              <option key={flow} value={flow}>
                                {flow}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nominal (Rp):</label>
                          <input
                            type="number"
                            value={editTotalInvoice}
                            onChange={(e) => setEditTotalInvoice(Number(e.target.value))}
                            className="w-full p-1 border border-slate-300 rounded bg-white text-xs font-mono font-bold text-emerald-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Quantity Order:</label>
                          <input
                            type="number"
                            value={editQuantityOrder}
                            onChange={(e) => setEditQuantityOrder(Number(e.target.value))}
                            className="w-full p-1 border border-slate-300 rounded bg-white text-xs font-mono text-slate-800"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-indigo-150">
                          <button
                            onClick={cancelEditHistory}
                            className="px-2 py-1 text-[11px] border border-slate-300 text-slate-600 rounded bg-white hover:bg-slate-100 font-semibold cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveHistoryEdit(item.id)}
                            className="px-2.5 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Mode */
                      <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <User className="w-3 h-3 text-indigo-500" /> {item.csName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span>{formatHistoryTimestamp(item.timestamp, lead.tanggalMasuk, lead.jamMasuk)}</span>
                            {onSave && (
                              <div className="flex items-center gap-1.5 ml-1">
                                <button
                                  onClick={() => startEditHistory(item)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                                  title="Edit log"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteHistoryItem(item.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                                  title="Hapus log"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            )}
                          </div>
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
                    )}
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
                  editingRepeatId === log.id ? (
                    /* Edit Repeat Order Mode */
                    <div key={log.id || idx} className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl space-y-3 shadow-2xs">
                      <div className="text-[11px] font-extrabold text-teal-950 uppercase flex items-center gap-1 border-b border-teal-200 pb-1">
                        <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                        Edit Repeat Order #{repeatLogs.length - idx}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama CS:</label>
                        <select
                          value={editRepeatCSName}
                          onChange={(e) => setEditRepeatCSName(e.target.value)}
                          className="w-full p-1 border border-slate-300 rounded bg-white text-xs font-bold text-slate-800"
                        >
                          {csList && csList.length > 0 ? (
                            csList.map((cs) => (
                              <option key={cs.id} value={cs.nama}>
                                {cs.nama} ({cs.role})
                              </option>
                            ))
                          ) : (
                            <option value={log.csName}>{log.csName}</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nominal (Rp):</label>
                        <input
                          type="number"
                          value={editRepeatTotalInvoice}
                          onChange={(e) => setEditRepeatTotalInvoice(Number(e.target.value))}
                          className="w-full p-1 border border-slate-300 rounded bg-white text-xs font-mono font-bold text-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Quantity Order (pcs):</label>
                        <input
                          type="number"
                          value={editRepeatTotalQuantity}
                          onChange={(e) => setEditRepeatTotalQuantity(Number(e.target.value))}
                          className="w-full p-1 border border-slate-300 rounded bg-white text-xs font-mono text-slate-800"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-teal-150">
                        <button
                          onClick={cancelEditRepeat}
                          className="px-2 py-1 text-[11px] border border-slate-300 text-slate-600 rounded bg-white hover:bg-slate-100 font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveRepeatEdit(log.id)}
                          className="px-2.5 py-1 text-[11px] bg-teal-600 hover:bg-teal-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Repeat Order Mode */
                    <div key={log.id || idx} className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-teal-200/60 pb-1.5 text-[11px]">
                        <span className="font-extrabold text-teal-900 flex items-center gap-1">
                          <RotateCw className="w-3.5 h-3.5 text-teal-600" />
                          Repeat Order #{repeatLogs.length - idx}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                          {onSave && (
                            <div className="flex items-center gap-1.5 ml-1">
                              <button
                                onClick={() => startEditRepeat(log)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                                title="Edit repeat order"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteRepeatLog(log.id)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                                title="Hapus repeat order"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </div>
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
                  )
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
