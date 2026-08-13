import React, { useState } from 'react';
import { LayoutDashboard, X, Plus, Building2, CheckCircle2 } from 'lucide-react';
import { DashboardClient } from '../types';

interface CreateDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDashboard: (newDashboard: DashboardClient) => void;
}

export const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({
  isOpen,
  onClose,
  onCreateDashboard,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDashboard: DashboardClient = {
      id: `dash-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onCreateDashboard(newDashboard);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Buat Dashboard Klien Baru
            </h3>
            <p className="text-xs text-slate-500">
              Tambahkan ruang kerja &amp; pemantauan sales terpisah untuk klien baru.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nama Klien / Nama Dashboard <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Klien PT Abadi, Olshop Skincare, dll."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Setiap klien dapat memantau leads, omset, dan performa CS secara mandiri.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Deskripsi / Catatan Klien (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Project Campaign Agustus 2026..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Single Sheet Info Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Satu Spreadsheet Google Tetap Sama:</strong>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Semua data leads klien baru ini akan otomatis tersimpan dalam 1 Google Sheet yang sama, dengan kolom <strong>&quot;Nama Klien&quot;</strong> terpisah.
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Dashboard Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
