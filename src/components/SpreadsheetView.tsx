import React, { useState } from 'react';
import { Lead } from '../types';
import { exportToExcel, exportToCSV, formatRupiah } from '../utils/spreadsheet';
import { Table, Download, Copy, Check, FileSpreadsheet, Info } from 'lucide-react';

interface SpreadsheetViewProps {
  leads: Lead[];
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  leads,
  onExportExcel,
  onExportCSV,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClipboard = () => {
    const headers = [
      'Nama CS',
      'Nomor WhatsApp',
      'Nama Customer',
      'Kategori Flow Lead',
      'Alasan Lost',
      'Tanggal Leads Masuk',
      'Jam Masuk Leads',
      'Jam Balas',
      'Lokasi Leads',
      'Note Customer',
      'Item Order',
      'Quantity Order (pcs)',
      'Total Invoice (Rp)'
    ];

    const rows = leads.map((l) => [
      l.namaCS,
      l.nomorWA,
      l.namaCustomer,
      l.kategoriFlow,
      l.alasanLost || '-',
      l.tanggalMasuk,
      l.jamMasuk,
      l.jamBalas,
      l.lokasiKota,
      (l.noteCustomer || '').replace(/\n/g, ' '),
      l.itemOrder,
      l.quantityOrder,
      l.totalInvoice
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Spreadsheet Bar */}
      <div className="p-4 bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm text-white">Grid Spreadsheet Raw (Spreadsheet View)</h3>
            <p className="text-xs text-slate-400">
              Format data sesuai standar 13 kolom spreadsheet CRM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyClipboard}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Semua (Copy Table)</span>
              </>
            )}
          </button>

          <button
            onClick={onExportExcel}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .XLSX</span>
          </button>
        </div>
      </div>

      {/* Grid Spreadsheet */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 border-r border-slate-200">#</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Nama CS</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Nomor WhatsApp</th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[160px]">Nama Customer</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Kategori Flow Lead</th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[140px]">Alasan Lost</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Tanggal Leads Masuk</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Jam Masuk Leads</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Jam Balas</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Lokasi Leads (Kota)</th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[200px]">Note Customer</th>
              <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px]">Item Order</th>
              <th className="py-2.5 px-3 border-r border-slate-200 text-right">Quantity Order</th>
              <th className="py-2.5 px-3 text-right">Total Invoice (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {leads.map((lead, idx) => (
              <tr key={lead.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                <td className="py-2 px-3 border-r border-slate-200 text-slate-400 font-bold">{idx + 1}</td>
                <td className="py-2 px-3 border-r border-slate-200 font-sans font-semibold text-slate-900">{lead.namaCS}</td>
                <td className="py-2 px-3 border-r border-slate-200 text-emerald-700 font-bold">{lead.nomorWA}</td>
                <td className="py-2 px-3 border-r border-slate-200 font-sans font-bold text-slate-900">{lead.namaCustomer}</td>
                <td className="py-2 px-3 border-r border-slate-200 font-bold">{lead.kategoriFlow}</td>
                <td className="py-2 px-3 border-r border-slate-200 text-rose-700">{lead.alasanLost || '-'}</td>
                <td className="py-2 px-3 border-r border-slate-200">{lead.tanggalMasuk}</td>
                <td className="py-2 px-3 border-r border-slate-200">{lead.jamMasuk}</td>
                <td className="py-2 px-3 border-r border-slate-200">{lead.jamBalas}</td>
                <td className="py-2 px-3 border-r border-slate-200 font-sans">{lead.lokasiKota}</td>
                <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-600 truncate max-w-[220px]" title={lead.noteCustomer}>
                  {lead.noteCustomer}
                </td>
                <td className="py-2 px-3 border-r border-slate-200 font-sans font-medium">{lead.itemOrder}</td>
                <td className="py-2 px-3 border-r border-slate-200 text-right font-bold">{lead.quantityOrder}</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-800">{formatRupiah(lead.totalInvoice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
