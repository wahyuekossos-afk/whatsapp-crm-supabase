import React, { useState, useEffect, useMemo } from 'react';
import { CSUser, Lead, SpreadsheetConfig, DashboardClient, KPITargets, KPITargetsMap, ProductsMap, MetaChat } from '../types';
import { getProductsForDashboard } from '../utils/spreadsheet';
import { SupabaseConfig, testSupabaseConnection, SUPABASE_SQL_SCRIPT, dbGetDatabaseSize } from '../utils/supabase';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  Link,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  Upload,
  Globe,
  Settings,
  Code,
  Copy,
  Share2,
  Target,
  Package,
  Plus,
  HardDrive
} from 'lucide-react';

interface AdminViewProps {
  csList: CSUser[];
  onAddCS: (newCS: Omit<CSUser, 'id'>) => void;
  onUpdateCS: (updatedCS: CSUser) => void;
  onDeleteCS: (id: string) => void;
  leads: Lead[];
  dashboards?: DashboardClient[];
  spreadsheetConfig: SpreadsheetConfig;
  onUpdateSpreadsheetConfig: (newConfig: SpreadsheetConfig) => void;
  kpiTargetsMap?: KPITargetsMap;
  onUpdateKPITargets?: (clientName: string, newTargets: KPITargets) => void;
  productsMap?: ProductsMap;
  onAddProduct?: (dashboardName: string, productName: string) => void;
  onDeleteProduct?: (dashboardName: string, productName: string) => void;
  onShowToast: (msg: string) => void;
  onExportExcel: () => void;
  onImportExcel: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReassignCSNameInLeads?: (oldName: string, newName: string) => void;
  onSyncFromGoogleSheets?: (config: SpreadsheetConfig) => Promise<void>;
  onPushToGoogleSheets?: (config: SpreadsheetConfig) => Promise<void>;
  onClearData?: () => void;
  onRestoreSampleData?: () => void;
  supabaseConfig: SupabaseConfig;
  onUpdateSupabaseConfig: (newConfig: SupabaseConfig) => void;
  onMigrateToSupabase: () => Promise<{ success: boolean; message: string }>;
  onClearSupabaseData?: () => Promise<{ success: boolean; message: string }>;
  activeDashboardName?: string;
  metaChats?: MetaChat[];
  onUpsertMetaChat?: (chat: MetaChat) => void;
  onDeleteMetaChat?: (tanggal: string, namaCS: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  csList,
  onAddCS,
  onUpdateCS,
  onDeleteCS,
  leads,
  dashboards = [],
  spreadsheetConfig,
  onUpdateSpreadsheetConfig,
  kpiTargetsMap,
  onUpdateKPITargets,
  productsMap = {},
  onAddProduct,
  onDeleteProduct,
  onShowToast,
  onExportExcel,
  onImportExcel,
  onReassignCSNameInLeads,
  onSyncFromGoogleSheets,
  onPushToGoogleSheets,
  onClearData,
  onRestoreSampleData,
  supabaseConfig,
  onUpdateSupabaseConfig,
  onMigrateToSupabase,
  onClearSupabaseData,
  activeDashboardName,
  metaChats = [],
  onUpsertMetaChat,
  onDeleteMetaChat,
}) => {
  // All client names list
  const allClientNames = useMemo(() => {
    const defaultClients = ['Wibu Sales (Utama)', 'Sanpota'];
    const customClients = dashboards.map((d) => d.name);
    return Array.from(new Set([...defaultClients, ...customClients]));
  }, [dashboards]);

  // Selected KPI Dashboard Client
  const [selectedKPIClient, setSelectedKPIClient] = useState<string>(activeDashboardName || 'Wibu Sales (Utama)');

  // Selected Product Database Dashboard Client
  const [selectedProdDashboard, setSelectedProdDashboard] = useState<string>(activeDashboardName || 'Wibu Sales (Utama)');
  const [newProductName, setNewProductName] = useState<string>('');

  useEffect(() => {
    if (activeDashboardName) {
      setSelectedKPIClient(activeDashboardName);
      setSelectedProdDashboard(activeDashboardName);
    }
  }, [activeDashboardName]);

  const currentProductList = getProductsForDashboard(productsMap, selectedProdDashboard);

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      onShowToast('⚠️ Masukkan nama produk terlebih dahulu.');
      return;
    }
    if (onAddProduct) {
      onAddProduct(selectedProdDashboard, newProductName.trim());
    }
    setNewProductName('');
  };

  // Selected KPI Targets
  const currentKPITargets = kpiTargetsMap?.[selectedKPIClient] || {
    clientName: selectedKPIClient,
    conversionRate: 15,
    avgResponseMinutes: 5,
  };

  const [targetCRInput, setTargetCRInput] = useState<string>(
    String(currentKPITargets.conversionRate)
  );
  const [targetRTInput, setTargetRTInput] = useState<string>(
    String(currentKPITargets.avgResponseMinutes)
  );

  useEffect(() => {
    const t = kpiTargetsMap?.[selectedKPIClient] || {
      clientName: selectedKPIClient,
      conversionRate: 15,
      avgResponseMinutes: 5,
    };
    setTargetCRInput(String(t.conversionRate));
    setTargetRTInput(String(t.avgResponseMinutes));
  }, [selectedKPIClient, kpiTargetsMap]);

  const handleSaveKPITargets = (e: React.FormEvent) => {
    e.preventDefault();
    const cr = parseFloat(targetCRInput) || 0;
    const rt = parseInt(targetRTInput, 10) || 0;
    if (onUpdateKPITargets) {
      onUpdateKPITargets(selectedKPIClient, {
        clientName: selectedKPIClient,
        conversionRate: cr,
        avgResponseMinutes: rt,
      });
    }
  };

  // CS Add Form State
  const [newCSName, setNewCSName] = useState('');
  const [newCSRole, setNewCSRole] = useState('CS Officer');
  const [newCSAvatar, setNewCSAvatar] = useState('👩‍💼');
  const [newCSClientName, setNewCSClientName] = useState('Semua Klien');

  // CS Edit State
  const [editingCSId, setEditingCSId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editClientName, setEditClientName] = useState('Semua Klien');
  const [reassignLeadsOnRename, setReassignLeadsOnRename] = useState(true);

  // CS Delete Modal State
  const [csToDelete, setCsToDelete] = useState<CSUser | null>(null);

  // Custom modal triggers for clear & restore
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState(false);

  // Spreadsheet Config State
  const [configForm, setConfigForm] = useState<SpreadsheetConfig>({ ...spreadsheetConfig });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Supabase Local Form State
  const [localSupabaseConfig, setLocalSupabaseConfig] = useState<SupabaseConfig>({ ...supabaseConfig });
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isDeletingSupabase, setIsDeletingSupabase] = useState(false);
  const [showSupabaseClearConfirmModal, setShowSupabaseClearConfirmModal] = useState(false);
  const [connectionTestStatus, setConnectionTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Storage usage states
  const [supabaseRealSize, setSupabaseRealSize] = useState<number | null>(null);
  const [isFetchingSize, setIsFetchingSize] = useState(false);

  // Meta Chats Form State
  const [metaDate, setMetaDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [metaCSName, setMetaCSName] = useState<string>('');
  const [metaChatCount, setMetaChatCount] = useState<string>('');
  const [metaKondisi, setMetaKondisi] = useState<string>('');

  const handleSaveMetaChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaDate) {
      onShowToast('⚠️ Harap pilih tanggal.');
      return;
    }

    if (!metaCSName && !metaKondisi.trim()) {
      onShowToast('⚠️ Harap pilih petugas CS atau isi kolom Kondisi terlebih dahulu.');
      return;
    }

    let count = 0;
    if (metaCSName) {
      if (!metaChatCount) {
        onShowToast('⚠️ Harap isi Jumlah Chat Masuk jika petugas CS dipilih.');
        return;
      }
      count = parseInt(metaChatCount, 10);
      if (isNaN(count) || count < 0) {
        onShowToast('⚠️ Jumlah chat masuk harus angka positif.');
        return;
      }
    }

    if (onUpsertMetaChat) {
      onUpsertMetaChat({
        id: `meta-${Date.now()}`,
        tanggal: metaDate,
        namaCS: metaCSName, // can be empty string for general date conditions
        chatCount: count,
        kondisi: metaKondisi.trim(),
      });

      if (metaCSName) {
        onShowToast(`✅ Berhasil menyimpan target Meta Chat untuk ${metaCSName} pada ${metaDate}: ${count} chats.`);
      } else {
        onShowToast(`✅ Berhasil menyimpan Kondisi Hari pada ${metaDate}: "${metaKondisi}".`);
      }

      setMetaChatCount('');
      setMetaKondisi('');
    }
  };

  useEffect(() => {
    const fetchSize = async () => {
      if (localSupabaseConfig.enabled && localSupabaseConfig.url && localSupabaseConfig.anonKey) {
        setIsFetchingSize(true);
        try {
          const bytes = await dbGetDatabaseSize();
          if (bytes !== null) {
            setSupabaseRealSize(bytes);
          }
        } catch (err) {
          console.log('Error fetching physical DB size:', err);
        } finally {
          setIsFetchingSize(false);
        }
      } else {
        setSupabaseRealSize(null);
      }
    };
    fetchSize();
  }, [localSupabaseConfig.enabled, localSupabaseConfig.url, localSupabaseConfig.anonKey, leads, csList, productsMap]);

  const estimatedBytes = useMemo(() => {
    // Basic overhead: 120 KB (Database core schemas & tables definition)
    const overhead = 120 * 1024;
    // Leads size: average 1.2 KB per lead row
    const leadsSize = (leads || []).length * 1228;
    // CS size: average 0.5 KB per CS
    const csSize = (csList || []).length * 512;
    // Products size: average 0.5 KB per product
    let productsCount = 0;
    if (productsMap) {
      Object.keys(productsMap).forEach((key) => {
        productsCount += (productsMap[key] || []).length;
      });
    }
    const productsSize = productsCount * 512;
    // Dashboards size: average 1 KB per dashboard
    const dashboardsCount = dashboards ? dashboards.length : 0;
    const dashboardsSize = dashboardsCount * 1024;

    return overhead + leadsSize + csSize + productsSize + dashboardsSize;
  }, [leads, csList, productsMap, dashboards]);

  const activeBytes = supabaseRealSize !== null ? supabaseRealSize : estimatedBytes;
  // Supabase Free Tier limit: 500 MB (500 * 1024 * 1024 Bytes)
  const LIMIT_BYTES = 500 * 1024 * 1024;
  const usagePercentage = Math.min(100, Math.max(0.01, (activeBytes / LIMIT_BYTES) * 100));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // Sync state if supabaseConfig changed from parent
  useEffect(() => {
    setLocalSupabaseConfig({ ...supabaseConfig });
  }, [supabaseConfig]);

  const handleTestConnection = async () => {
    if (!localSupabaseConfig.url || !localSupabaseConfig.anonKey) {
      onShowToast('⚠️ Harap isi URL dan Anon Key Supabase terlebih dahulu');
      return;
    }
    setIsTestingSupabase(true);
    setConnectionTestStatus(null);
    try {
      const res = await testSupabaseConnection(localSupabaseConfig.url, localSupabaseConfig.anonKey);
      setConnectionTestStatus(res);
      if (res.success) {
        onShowToast('🎉 Koneksi ke Supabase berhasil!');
      } else {
        onShowToast('❌ Koneksi ke Supabase gagal.');
      }
    } catch (e: any) {
      setConnectionTestStatus({ success: false, message: e?.message || String(e) });
      onShowToast('❌ Koneksi ke Supabase gagal.');
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleMigrateData = async () => {
    if (!localSupabaseConfig.url || !localSupabaseConfig.anonKey) {
      onShowToast('⚠️ Konfigurasikan dan simpan URL & Anon Key Supabase Anda terlebih dahulu');
      return;
    }
    setIsMigrating(true);
    try {
      const res = await onMigrateToSupabase();
      if (res.success) {
        onShowToast(`🎉 ${res.message}`);
      } else {
        onShowToast(`❌ ${res.message}`);
      }
    } catch (e: any) {
      onShowToast(`❌ Gagal migrasi: ${e?.message || String(e)}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearSupabaseData = async () => {
    if (!onClearSupabaseData) return;
    setIsDeletingSupabase(true);
    setShowSupabaseClearConfirmModal(false);
    try {
      const res = await onClearSupabaseData();
      if (res.success) {
        onShowToast(`🧹 ${res.message}`);
      } else {
        onShowToast(`❌ ${res.message}`);
      }
    } catch (e: any) {
      onShowToast(`❌ Gagal mengosongkan Supabase: ${e?.message || String(e)}`);
    } finally {
      setIsDeletingSupabase(false);
    }
  };

  // Helper for rendering CS Avatar (URL vs Emoji)
  const renderAvatar = (avatar?: string, name?: string) => {
    if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
      return (
        <img
          src={avatar}
          alt={name || 'Avatar'}
          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
          referrerPolicy="no-referrer"
        />
      );
    }
    return <span className="text-base shrink-0">{avatar || '👤'}</span>;
  };

  // Handle Edit CS Start
  const handleStartEdit = (cs: CSUser) => {
    setEditingCSId(cs.id);
    setEditName(cs.nama);
    setEditRole(cs.role);
    setEditClientName(cs.clientName || 'Semua Klien');
  };

  // Save Edit CS
  const handleSaveEdit = (cs: CSUser) => {
    if (!editName.trim()) {
      onShowToast('⚠️ Nama CS tidak boleh kosong');
      return;
    }

    const oldName = cs.nama;
    const newName = editName.trim();

    onUpdateCS({
      ...cs,
      nama: newName,
      role: editRole.trim() || cs.role,
      clientName: editClientName === 'Semua Klien' ? undefined : editClientName,
    });

    if (reassignLeadsOnRename && oldName !== newName && onReassignCSNameInLeads) {
      onReassignCSNameInLeads(oldName, newName);
    }

    setEditingCSId(null);
    onShowToast(`✅ Berhasil memperbarui data CS: ${newName}`);
  };

  // Handle Add CS
  const handleAddCS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCSName.trim()) return;

    onAddCS({
      nama: newCSName.trim(),
      role: newCSRole.trim() || 'CS Officer',
      avatar: newCSAvatar,
      clientName: newCSClientName === 'Semua Klien' ? undefined : newCSClientName,
    });

    onShowToast(`🎉 Petugas CS Baru '${newCSName}' berhasil ditambahkan!`);
    setNewCSName('');
    setNewCSRole('CS Officer');
    setNewCSClientName('Semua Klien');
  };

  // Save Spreadsheet Config & Sync directly from Google Sheets
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSpreadsheetConfig(configForm);
    if (onSyncFromGoogleSheets && configForm.spreadsheetId) {
      await handleSyncFromSheets();
    } else {
      onShowToast('💾 Konfigurasi Singleton Spreadsheet berhasil disimpan!');
    }
  };

  // Sync directly from Google Sheets (Pull)
  const handleSyncFromSheets = async () => {
    if (!configForm.spreadsheetId) {
      onShowToast('⚠️ Masukkan Spreadsheet ID atau Link terlebih dahulu');
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      onUpdateSpreadsheetConfig(configForm);
      if (onSyncFromGoogleSheets) {
        await onSyncFromGoogleSheets(configForm);
        setTestResult({
          success: true,
          msg: `✅ Sinkronisasi sukses! Data aplikasi telah diselaraskan dengan Google Sheet.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err.message || 'Gagal membaca Google Sheets. Pastikan izin berbagi di-set ke "Anyone with the link".',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Push Data & Auto-Create Header Columns in Google Sheets via Apps Script Web App
  const [isPushingData, setIsPushingData] = useState(false);
  const handlePushToSheets = async () => {
    if (!configForm.webhookUrl) {
      onShowToast('⚠️ Masukkan Auto-Sync Webhook Endpoint (URL Google Apps Script) terlebih dahulu.');
      return;
    }

    setIsPushingData(true);
    setTestResult(null);

    try {
      onUpdateSpreadsheetConfig(configForm);
      if (onPushToGoogleSheets) {
        await onPushToGoogleSheets(configForm);
        setTestResult({
          success: true,
          msg: `🚀 Berhasil mengirim ${leads.length} data & menulis header kolom secara otomatis ke Google Sheet Anda!`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err.message || 'Gagal menulis data ke Google Sheet.',
      });
    } finally {
      setIsPushingData(false);
    }
  };

  // Copy 13 Header Columns for Manual Pasting into Google Sheet Cell A1
  const handleCopyHeaders = () => {
    const headers = [
      'Nama CS',
      'Nomor WhatsApp',
      'Nama Customer',
      'Kategori Flow Lead',
      'Alasan Lost',
      'Tanggal Leads Masuk',
      'Jam Masuk Leads',
      'Jam Balas',
      'Lokasi Leads (Kota)',
      'Note Customer',
      'Item Order',
      'Quantity Order (pcs)',
      'Total Invoice (Rp)',
    ].join('\t');
    navigator.clipboard.writeText(headers);
    onShowToast('📋 13 Header kolom berhasil disalin ke Clipboard! Buka Google Sheet dan Paste (Ctrl+V) di sel A1.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-green-100 text-green-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Admin Control & Data Center</h2>
            <p className="text-xs text-slate-500">
              Kelola Petugas CS, Alokasi Team Sales, dan Pengaturan Singleton Spreadsheet Target
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 border border-slate-200 px-3 py-1 rounded text-slate-700 font-semibold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-green-600" />
            <span>Storage Mode: Singleton Spreadsheet</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: MANAGEMENT CS OFFICER */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CS Officer List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                  Daftar Petugas CS ({csList.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Aktif bertugas menangani leads WhatsApp
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-3 py-2.5">Avatar / ID</th>
                    <th className="px-3 py-2.5">Nama CS</th>
                    <th className="px-3 py-2.5">Tugas Klien / Dasbor</th>
                    <th className="px-3 py-2.5">Role / Jabatan</th>
                    <th className="px-3 py-2.5 text-center">Total Handles</th>
                    <th className="px-3 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {csList.map((cs) => {
                    const totalLeadsByCS = leads.filter((l) => l.namaCS === cs.nama).length;
                    const isEditing = editingCSId === cs.id;

                    return (
                      <tr key={`${cs.id}-${cs.nama}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {renderAvatar(cs.avatar, cs.nama)}
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {cs.id}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 border border-emerald-500 rounded text-xs font-bold text-slate-800 bg-white focus:outline-none w-36"
                            />
                          ) : (
                            <span>{cs.nama}</span>
                          )}
                        </td>

                        {/* Client/Dashboard Assignment */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editClientName}
                              onChange={(e) => setEditClientName(e.target.value)}
                              className="px-2 py-1 border border-emerald-500 rounded text-xs font-bold text-emerald-950 bg-emerald-50 focus:outline-none"
                            >
                              <option value="Semua Klien">🌐 Semua Klien (Global)</option>
                              {dashboards.map((d) => (
                                <option key={d.id} value={d.name}>
                                  📊 {d.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                cs.clientName
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {cs.clientName ? `📊 ${cs.clientName}` : '🌐 Semua Klien'}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-800 bg-white focus:outline-none w-32"
                            />
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                              {cs.role}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5 text-center font-bold font-mono text-slate-800">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px]">
                            {totalLeadsByCS} leads
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveEdit(cs)}
                                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                                title="Simpan Perubahan"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingCSId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEdit(cs)}
                                className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                                title="Edit CS & Penugasan Klien"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (csList.length <= 1) {
                                    onShowToast('⚠️ Minimal harus ada 1 CS aktif di sistem.');
                                    return;
                                  }
                                  setCsToDelete(cs);
                                }}
                                className="p-1 rounded text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                title="Hapus CS"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Checkbox Reassign option */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
              <input
                type="checkbox"
                id="reassignOpt"
                checked={reassignLeadsOnRename}
                onChange={(e) => setReassignLeadsOnRename(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="reassignOpt" className="cursor-pointer font-medium select-none">
                Otomatis perbarui nama CS pada riwayat data leads yang sudah ada ketika nama CS diubah
              </label>
            </div>
          </div>

          {/* Form Tambah CS Baru */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                Tambah Petugas CS Baru
              </h3>
            </div>

            <form onSubmit={handleAddCS} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nama CS <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Maya Indah"
                  value={newCSName}
                  onChange={(e) => setNewCSName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Tugaskan Ke Klien / Dashboard
                </label>
                <select
                  value={newCSClientName}
                  onChange={(e) => setNewCSClientName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-emerald-50/50 font-bold text-emerald-900"
                >
                  <option value="Semua Klien">🌐 Semua Klien (Global)</option>
                  {dashboards.map((d) => (
                    <option key={d.id} value={d.name}>
                      📊 {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Role / Jabatan</label>
                <select
                  value={newCSRole}
                  onChange={(e) => setNewCSRole(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="CS Officer">CS Officer</option>
                  <option value="CS Senior">CS Senior</option>
                  <option value="CS Team Lead">CS Team Lead</option>
                  <option value="Sales Representative">Sales Representative</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Avatar Emoji</label>
                <select
                  value={newCSAvatar}
                  onChange={(e) => setNewCSAvatar(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="👩‍💼">👩‍💼 Wan S</option>
                  <option value="👨‍💼">👨‍💼 Pria S</option>
                  <option value="🎧">🎧 CS Headset</option>
                  <option value="⭐">⭐ CS Star</option>
                  <option value="🚀">🚀 CS Rocket</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-all cursor-pointer shadow-xs"
                >
                  + Tambah CS
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT 1 COL: TARGET KPI & SINGLETON SPREADSHEET STORAGE */}
        <div className="space-y-6">

          {/* TARGET KPI MANAGEMENT CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Target KPI Dashboard
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Atur Target Conversion Rate &amp; Response Time Per Klien
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveKPITargets} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Pilih Dashboard Klien
                </label>
                <select
                  value={selectedKPIClient}
                  onChange={(e) => setSelectedKPIClient(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
                >
                  {allClientNames.map((cName) => (
                    <option key={cName} value={cName}>
                      📊 Dashboard: {cName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Target Conversion Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={targetCRInput}
                      onChange={(e) => setTargetCRInput(e.target.value)}
                      className="w-full px-3 py-1.5 pr-7 text-xs border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                      placeholder="15"
                      required
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Minimal % closing (default: 15%)</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Target Response Time (Menit)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={targetRTInput}
                      onChange={(e) => setTargetRTInput(e.target.value)}
                      className="w-full px-3 py-1.5 pr-11 text-xs border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                      placeholder="5"
                      required
                    />
                    <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-bold">mnt</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Maksimal jam balas CS (default: 5m)</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Simpan Target KPI ({selectedKPIClient})</span>
              </button>
            </form>
          </div>

          {/* DATABASE PRODUK PER DASHBOARD CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Database Produk Per Dashboard
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Atur Opsi Dropdown Item Order per Dashboard / Klien
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Dashboard Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Pilih Dashboard / Klien
                </label>
                <select
                  value={selectedProdDashboard}
                  onChange={(e) => setSelectedProdDashboard(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded font-bold text-amber-900 bg-amber-50/50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  {allClientNames.map((name) => (
                    <option key={name} value={name}>
                      📊 {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Input Product */}
              <form onSubmit={handleAddProductSubmit} className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Nama Produk Baru
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Kemasan Kopi Gayo 250gr"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-medium text-slate-800"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded transition-all cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </form>

              {/* List of Registered Products */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Daftar Produk [{selectedProdDashboard}]:
                  </span>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                    {currentProductList.length} Produk
                  </span>
                </div>

                {currentProductList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded border border-dashed border-slate-200">
                    Belum ada produk terdaftar untuk dashboard ini.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {currentProductList.map((prod, idx) => (
                      <div
                        key={`${prod}-${idx}`}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 hover:bg-amber-50/60 hover:border-amber-200 transition-all"
                      >
                        <span className="truncate pr-2 font-semibold">📦 {prod}</span>
                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(selectedProdDashboard, prod)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  💡 Tab sheet Google Sheets otomatis dinamai: <strong>Data Produk [{selectedProdDashboard}]</strong>
                </p>
              </div>
            </div>
          </div>

          {/* INPUT DATA META CHATS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Input Meta Chat (Target Masuk)
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Input data chat masuk Meta per tanggal untuk masing-masing CS
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveMetaChat} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={metaDate}
                  onChange={(e) => setMetaDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Pilih Petugas CS <span className="text-slate-400 font-semibold">(Wajib jika input target chat)</span>
                </label>
                <select
                  value={metaCSName}
                  onChange={(e) => setMetaCSName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="">-- Pilih CS (Kosongkan jika hanya input Kondisi Hari) --</option>
                  {csList.map((cs) => (
                    <option key={cs.id} value={cs.nama}>
                      👤 {cs.nama} ({cs.clientName || 'Global'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Jumlah Chat Masuk (Meta) <span className="text-slate-400 font-semibold">(Wajib jika petugas CS dipilih)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={metaChatCount}
                  onChange={(e) => setMetaChatCount(e.target.value)}
                  placeholder="Contoh: 40"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Kondisi Hari <span className="text-slate-400 font-semibold">(Opsional - e.g. "Iklan Mati", "Libur")</span>
                </label>
                <input
                  type="text"
                  value={metaKondisi}
                  onChange={(e) => setMetaKondisi(e.target.value)}
                  placeholder="Contoh: Iklan mati atau Libur"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Target Meta Chat</span>
              </button>
            </form>

            {/* List of Entered Meta Chats */}
            {metaChats && metaChats.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Riwayat Input Meta Chat &amp; Kondisi:
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    {metaChats.length} Data
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {metaChats.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map((mc, idx) => (
                    <div
                      key={`${mc.tanggal}-${mc.namaCS || 'Kondisi'}-${idx}`}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 hover:bg-emerald-50/50 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-emerald-800">
                          {mc.namaCS ? mc.namaCS : '📢 KONDISI HARI'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          📅 {mc.tanggal}
                          {mc.namaCS && (
                            <> — <strong className="text-slate-700 font-extrabold">{mc.chatCount} Chats</strong></>
                          )}
                          {mc.kondisi && (
                            <span className="ml-1.5 bg-amber-100 text-amber-800 font-bold px-1 py-0.5 rounded text-[9px]">
                              📝 {mc.kondisi}
                            </span>
                          )}
                        </span>
                      </div>
                      {onDeleteMetaChat && (
                        <button
                          type="button"
                          onClick={() => onDeleteMetaChat(mc.tanggal, mc.namaCS)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Hapus Input"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Singleton Spreadsheet Storage
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Pengaturan File & Link Database Master
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nama File Spreadsheet (Single Source)
                </label>
                <input
                  type="text"
                  value={configForm.fileName}
                  onChange={(e) => setConfigForm((p) => ({ ...p, fileName: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 font-semibold text-slate-800"
                  placeholder="e.g. Main_Sales_2024.xlsx"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Spreadsheet ID / Share URL
                </label>
                <div className="relative mt-1">
                  <Link className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={configForm.spreadsheetId}
                    onChange={(e) => setConfigForm((p) => ({ ...p, spreadsheetId: e.target.value }))}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono text-slate-700"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nama Sheet / Tab Target
                </label>
                <input
                  type="text"
                  value={configForm.sheetName}
                  onChange={(e) => setConfigForm((p) => ({ ...p, sheetName: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-800"
                  placeholder="e.g. Sheet1 / Sales_Log"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Auto-Sync Webhook Endpoint (Optional)
                </label>
                <div className="relative mt-1">
                  <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={configForm.webhookUrl}
                    onChange={(e) => setConfigForm((p) => ({ ...p, webhookUrl: e.target.value }))}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono text-slate-700"
                    placeholder="https://script.google.com/macros/s/..."
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={configForm.autoSync}
                    onChange={(e) => setConfigForm((p) => ({ ...p, autoSync: e.target.checked }))}
                    className="rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <label htmlFor="autoSync" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Auto-Sync Realtime Mode
                  </label>
                </div>

                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>

              <div className="pt-2 gap-2 flex flex-col">
                <button
                  type="button"
                  onClick={handlePushToSheets}
                  disabled={isPushingData}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  title="Mengirim data aplikasi dan membuat 13 header kolom otomatis di Google Sheet"
                >
                  <Upload className={`w-3.5 h-3.5 ${isPushingData ? 'animate-bounce' : ''}`} />
                  {isPushingData ? 'Mengirim ke Google Sheet...' : '📤 Kirim Data Aplikasi ke Google Sheet (Buat Kolom Otomatis)'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncFromSheets}
                  disabled={isTestingConnection}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  title="Tarik data terbaru dari Google Sheet ke Aplikasi"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  {isTestingConnection ? 'Menarik Data...' : '🔄 Tarik Data dari Google Sheet ke Aplikasi'}
                </button>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Simpan Konfigurasi
                </button>

                <div className="pt-2 border-t border-slate-200 mt-2 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600">🧹 Kelola Data Database Aplikasi:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {onClearData && (
                      <button
                        type="button"
                        onClick={onClearData}
                        className="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                        title="Hapus data contoh lokal (Kosongkan menjadi 0 data)"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                        <span>Kosongkan (0 Data)</span>
                      </button>
                    )}
                    {onRestoreSampleData && (
                      <button
                        type="button"
                        onClick={onRestoreSampleData}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                        title="Kembalikan 8 data contoh demo bawaan"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-600" />
                        <span>Isi Data Demo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Test Connection Result & Help Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {testResult && (
                <div
                  className={`p-3 rounded text-[11px] font-medium flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-bold block">{testResult.msg}</span>
                    {!testResult.success && (
                      <div className="text-[10px] text-slate-600 bg-white p-2 rounded border border-amber-200 space-y-1 mt-1">
                        <p className="font-bold text-red-700 bg-red-50 p-1 rounded border border-red-200 mb-1">
                          ⚠️ PERHATIAN: Di screenshot Anda, "Yang memiliki akses" masih terpilih "Siapa saja yang memiliki Akun Google".
                        </p>
                        <p className="font-bold text-slate-800">💡 Cara Memperbaiki Dropdown Google Apps Script:</p>
                        <ol className="list-decimal list-inside space-y-1 text-slate-700">
                          <li>Di jendela <strong>Kelola deployment</strong> (seperti screenshot Anda), klik dropdown <strong>Yang memiliki akses</strong>.</li>
                          <li>Pilih opsi paling bawah: <span className="bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded border border-emerald-300">Siapa saja</span> (Bukan "Siapa saja yang memiliki Akun Google").</li>
                          <li>Klik tombol biru <strong>Terapkan / Deploy</strong> di pojok kanan bawah.</li>
                          <li>Setelah itu, klik tombol <strong>Kirim Data Aplikasi ke Google Sheet</strong> di aplikasi ini lagi. Data Sales &amp; Daftar CS akan otomatis ditulis di tab Google Sheet masing-masing!</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Header Columns Reference & Copy Button */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    📋 Judul Kolom (Header) Google Sheet (13 Kolom):
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyHeaders}
                    className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded text-[10px] cursor-pointer transition-all"
                  >
                    Salin Header
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                  {[
                    'Nama CS',
                    'Nomor WhatsApp',
                    'Nama Customer',
                    'Kategori Flow Lead',
                    'Alasan Lost',
                    'Tanggal Leads Masuk',
                    'Jam Masuk Leads',
                    'Jam Balas',
                    'Lokasi Leads (Kota)',
                    'Note Customer',
                    'Item Order',
                    'Quantity Order (pcs)',
                    'Total Invoice (Rp)',
                  ].map((header) => (
                    <span
                      key={header}
                      className="bg-white px-1.5 py-0.5 border border-slate-300 rounded text-slate-800 font-bold"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>

              {/* Google Apps Script Modal / Copy Button */}
              <div className="pt-1 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const scriptCode = `function getSheetByNameCaseInsensitive(ss, name) {
  var sheets = ss.getSheets();
  var nameClean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (var i = 0; i < sheets.length; i++) {
    var sNameClean = sheets[i].getName().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (sNameClean === nameClean) {
      return sheets[i];
    }
  }
  return null;
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Data Leads (Tab 'Leads' / Sheet Utama)
  var leadsSheet = getSheetByNameCaseInsensitive(ss, 'Leads') || ss.getActiveSheet();
  var leadsData = leadsSheet.getDataRange().getValues();
  var leadsResult = [];
  if (leadsData.length >= 2) {
    var headers = leadsData[0];
    for (var i = 1; i < leadsData.length; i++) {
      var row = leadsData[i];
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      leadsResult.push(obj);
    }
  }
  
  // 2. Data CS List (Tab 'Data_CS')
  var csSheet = getSheetByNameCaseInsensitive(ss, 'Data_CS');
  var csResult = [];
  if (csSheet && csSheet.getDataRange().getLastRow() >= 2) {
    var csData = csSheet.getDataRange().getValues();
    var csHeaders = csData[0];
    for (var k = 1; k < csData.length; k++) {
      var csRow = csData[k];
      var csObj = {};
      for (var m = 0; m < csHeaders.length; m++) {
        csObj[csHeaders[m]] = csRow[m];
      }
      csResult.push(csObj);
    }
  }

  // 3. Data KPI List (Tab 'Data KPI')
  var kpiSheet = getSheetByNameCaseInsensitive(ss, 'Data KPI');
  var kpiResult = [];
  if (kpiSheet && kpiSheet.getDataRange().getLastRow() >= 2) {
    var kpiData = kpiSheet.getDataRange().getValues();
    var kpiHeaders = kpiData[0];
    for (var n = 1; n < kpiData.length; n++) {
      var kpiRow = kpiData[n];
      var kpiObj = {};
      for (var p = 0; p < kpiHeaders.length; p++) {
        kpiObj[kpiHeaders[p]] = kpiRow[p];
      }
      kpiResult.push(kpiObj);
    }
  }

  // 4. Data Produk List per Dashboard (Tab 'Data Produk [nama dashboard]')
  var productsMap = {};
  var allSheets = ss.getSheets();
  for (var s = 0; s < allSheets.length; s++) {
    var sh = allSheets[s];
    var sName = sh.getName();
    var sNameLower = sName.toLowerCase();
    if (sNameLower.indexOf("data produk ") === 0 || sNameLower.indexOf("data_produk_") === 0) {
      var dName = sName.substring(12).trim();
      if (sh.getDataRange().getLastRow() >= 2) {
        var pValues = sh.getDataRange().getValues();
        var pItems = [];
        for (var pr = 1; pr < pValues.length; pr++) {
          if (pValues[pr][0]) pItems.push(String(pValues[pr][0]));
        }
        productsMap[dName] = pItems;
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    leads: leadsResult,
    csList: csResult,
    kpiTargets: kpiResult,
    productsMap: productsMap
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var contents = e && e.postData && e.postData.contents ? e.postData.contents : "";
    var body = contents ? JSON.parse(contents) : {};
    
    // Extract CS List, KPI Targets, Products Map, and Leads Array
    var listCS = [];
    var listKPI = [];
    var mapProducts = {};
    var leadsDataToPush = [];
    
    if (Array.isArray(body)) {
      leadsDataToPush = body;
    } else if (typeof body === 'object' && body !== null) {
      if (body.action === 'sync_cs') {
        listCS = Array.isArray(body.csList) ? body.csList : [];
      } else if (body.action === 'sync_kpi') {
        listKPI = Array.isArray(body.kpiTargets) ? body.kpiTargets : [];
      } else if (body.action === 'sync_products') {
        mapProducts = (body.productsMap && typeof body.productsMap === 'object') ? body.productsMap : {};
      } else {
        leadsDataToPush = Array.isArray(body.leads) ? body.leads : [];
        listCS = Array.isArray(body.csList) ? body.csList : [];
        listKPI = Array.isArray(body.kpiTargets) ? body.kpiTargets : [];
        mapProducts = (body.productsMap && typeof body.productsMap === 'object') ? body.productsMap : {};
      }
    }

    // Sync Tabs 'Data Produk [nama dashboard]' (otomatis buat tab per dashboard)
    if (mapProducts && Object.keys(mapProducts).length > 0) {
      Object.keys(mapProducts).forEach(function(dashName) {
        var items = Array.isArray(mapProducts[dashName]) ? mapProducts[dashName] : [];
        var safeTabName = "Data Produk " + dashName.replace(/[\/\\?\*\]\[]/g, "").substring(0, 18);
        var prodSheet = getSheetByNameCaseInsensitive(ss, safeTabName) || ss.insertSheet(safeTabName);
        prodSheet.clearContents();
        prodSheet.appendRow(["Nama Produk", "Dashboard", "Tanggal Dibuat"]);
        items.forEach(function(pName) {
          prodSheet.appendRow([pName, dashName, new Date().toLocaleString("id-ID")]);
        });
      });
    }
    
    // Sync Tab 'Data_CS' (otomatis buat tab jika belum ada)
    if (listCS.length > 0) {
      var csSheet = getSheetByNameCaseInsensitive(ss, 'Data_CS') || ss.insertSheet('Data_CS');
      csSheet.clearContents();
      csSheet.appendRow(["ID", "Nama CS", "Role", "Tugas Klien", "Avatar URL"]);
      listCS.forEach(function(cs) {
        csSheet.appendRow([
          cs.id || "",
          cs.nama || cs.namaCS || "",
          cs.role || "CS Officer",
          cs.clientName || "Semua Klien",
          cs.avatar || ""
        ]);
      });
    }

    // Sync Tab 'Data KPI' (otomatis buat tab jika belum ada)
    if (listKPI.length > 0) {
      var kpiSheet = getSheetByNameCaseInsensitive(ss, 'Data KPI') || ss.insertSheet('Data KPI');
      kpiSheet.clearContents();
      kpiSheet.appendRow(["Nama Klien", "Target Conversion Rate (%)", "Target Response Time (Menit)", "Terakhir Diubah"]);
      listKPI.forEach(function(kpi) {
        kpiSheet.appendRow([
          kpi.clientName || kpi['Nama Klien'] || "Wibu Sales (Utama)",
          kpi.conversionRate !== undefined ? kpi.conversionRate : (kpi['Target Conversion Rate (%)'] || 15),
          kpi.avgResponseMinutes !== undefined ? kpi.avgResponseMinutes : (kpi['Target Response Time (Menit)'] || 5),
          new Date().toLocaleString("id-ID")
        ]);
      });
    }
    
    // Sync Tab 'Leads' (Semua Klien Gabungan) & Tab Klien Terpisah
    if (leadsDataToPush.length > 0 || !body.action) {
      var leadsSheet = getSheetByNameCaseInsensitive(ss, 'Leads') || ss.getActiveSheet();
      leadsSheet.clearContents();
      var headers = [
        "Nama Klien", "Nama CS", "Nomor WhatsApp", "Nama Customer", "Kategori Flow Lead",
        "Alasan Lost", "Tanggal Leads Masuk", "Jam Masuk Leads", "Jam Balas",
        "Lokasi Leads (Kota)", "Note Customer", "Item Order", "Quantity Order (pcs)", "Total Invoice (Rp)", "Riwayat Perubahan", "Riwayat Repeat Order"
      ];
      leadsSheet.appendRow(headers);
      
      var clientMap = {};

      if (Array.isArray(leadsDataToPush) && leadsDataToPush.length > 0) {
        leadsDataToPush.forEach(function(item) {
          var clientName = item.clientName || item.namaKlien || "Wibu Sales (Utama)";
          var rowData = [
            clientName,
            item.namaCS || "",
            item.nomorWA || "",
            item.namaCustomer || "",
            item.kategoriFlow || "New Leads",
            item.alasanLost || "",
            item.tanggalMasuk || "",
            item.jamMasuk || "",
            item.jamBalas || "",
            item.lokasiKota || "",
            item.noteCustomer || "",
            item.itemOrder || "",
            item.quantityOrder || 1,
            item.totalInvoice || 0,
            JSON.stringify(item.history || []),
            item.riwayatRepeatOrder || ""
          ];
          leadsSheet.appendRow(rowData);

          if (!clientMap[clientName]) {
            clientMap[clientName] = [];
          }
          clientMap[clientName].push(rowData);
        });

        // Otomatis buat Tab Spreadsheet terpisah untuk setiap Klien (misal: Klien_Sanpota)
        Object.keys(clientMap).forEach(function(cName) {
          var safeTabName = "Klien_" + cName.replace(/[\/\\?\*\]\[]/g, "").substring(0, 24);
          var cSheet = getSheetByNameCaseInsensitive(ss, safeTabName) || ss.insertSheet(safeTabName);
          cSheet.clearContents();
          cSheet.appendRow(headers);
          clientMap[cName].forEach(function(r) {
            cSheet.appendRow(r);
          });
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      leadsCount: leadsDataToPush.length,
      csCount: listCS.length,
      kpiCount: listKPI.length
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                    navigator.clipboard.writeText(scriptCode);
                    onShowToast('📋 Kode Apps Script Multi-Tab (Leads, Data_CS, Data KPI, & Data Produk per Dashboard) disalin!');
                  }}
                  className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  Salin Kode Google Apps Script Multi-Tab (Leads, Data_CS, Data KPI, &amp; Data Produk)
                </button>
              </div>
            </div>
          </div>

          {/* SUPABASE DATABASE INTEGRATION CARD */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Supabase Cloud Database
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Integrasi PostgreSQL untuk Penyimpanan Permanen
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Connection Mode Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="font-bold text-slate-700 block text-xs">Mode Sinkronisasi Supabase</span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {localSupabaseConfig.enabled ? 'Aktif (Koneksi Langsung Cloud)' : 'Nonaktif (Menggunakan Local Storage)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !localSupabaseConfig.enabled;
                    setLocalSupabaseConfig(prev => ({ ...prev, enabled: nextVal }));
                    onUpdateSupabaseConfig({ ...localSupabaseConfig, enabled: nextVal });
                    onShowToast(`🔌 Mode Supabase ${nextVal ? 'Diaktifkan' : 'Dinonaktifkan'}`);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    localSupabaseConfig.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      localSupabaseConfig.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={localSupabaseConfig.url}
                  onChange={(e) => setLocalSupabaseConfig(p => ({ ...p, url: e.target.value.trim() }))}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700 text-slate-800 bg-white"
                  placeholder="https://xxxxxx.supabase.co"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Supabase Public Anon Key
                </label>
                <input
                  type="password"
                  value={localSupabaseConfig.anonKey}
                  onChange={(e) => setLocalSupabaseConfig(p => ({ ...p, anonKey: e.target.value.trim() }))}
                  className="w-full mt-1 px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700 text-slate-800 bg-white"
                  placeholder="eyJhbGciOi..."
                />
              </div>

              {/* Connection Status Box */}
              {connectionTestStatus && (
                <div className={`p-2.5 rounded border text-[10px] font-medium flex items-start gap-1.5 ${
                  connectionTestStatus.success ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-900 border-red-200'
                }`}>
                  {connectionTestStatus.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{connectionTestStatus.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingSupabase}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>Test Koneksi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateSupabaseConfig(localSupabaseConfig);
                    onShowToast('💾 Konfigurasi Supabase berhasil disimpan!');
                  }}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <Settings className="w-3 h-3" />
                  <span>Simpan Kunci</span>
                </button>
              </div>

              {/* Migration Action Card */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2 mt-2">
                <p className="font-bold text-indigo-950 text-[11px] flex items-center gap-1">
                  🚀 Migrasikan Data CRM ke Supabase
                </p>
                <p className="text-[10px] text-indigo-700 leading-normal font-medium">
                  Pindahkan seluruh data CS, Leads, Target KPI, & Produk dari Local Storage Anda ke dalam cloud database Supabase dengan satu kali klik.
                </p>
                
                <button
                  type="button"
                  onClick={handleMigrateData}
                  disabled={isMigrating || isDeletingSupabase}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {isMigrating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Bermigrasi...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>📤 Kirim & Migrasi Data ke Supabase</span>
                    </>
                  )}
                </button>

                {onClearSupabaseData && (
                  <button
                    type="button"
                    onClick={() => setShowSupabaseClearConfirmModal(true)}
                    disabled={isMigrating || isDeletingSupabase}
                    className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isDeletingSupabase ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sedang Menghapus Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>🧹 Kosongkan Database Supabase</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Database Storage Meter for Supabase Free Tier */}
              {localSupabaseConfig.enabled && (
                <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-2 mt-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                      Status Penyimpanan (Supabase Free)
                    </span>
                    <span className="font-extrabold text-indigo-950 font-mono">
                      {usagePercentage.toFixed(4)}%
                    </span>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                    <span>Terpakai: <strong className="text-indigo-900">{formatSize(activeBytes)}</strong></span>
                    <span>Batas Free Tier: <strong className="text-slate-700">500 MB</strong></span>
                  </div>

                  <div className="text-[9px] text-slate-400 bg-white/80 p-1.5 rounded border border-indigo-50/80 leading-relaxed font-medium">
                    {supabaseRealSize !== null ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        Ukuran fisik database presisi terbaca secara real-time.
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span>
                          💡 Menampilkan estimasi ukuran data CRM Anda. Ingin membaca ukuran fisik PostgreSQL secara presisi?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const sqlHelper = `CREATE OR REPLACE FUNCTION get_db_size()
RETURNS bigint AS $$
  SELECT pg_database_size(current_database());
$$ LANGUAGE sql SECURITY DEFINER;`;
                            navigator.clipboard.writeText(sqlHelper);
                            onShowToast('📋 Kode SQL Helper disalin! Jalankan di SQL Editor Supabase Anda.');
                          }}
                          className="block text-indigo-600 hover:underline font-extrabold cursor-pointer"
                        >
                          👉 Klik disini untuk menyalin SQL Helper Fungsi Size
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SQL setup copy helper */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium">Butuh Setup Tabel?</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
                    onShowToast('📋 Script SQL Setup Supabase disalin ke clipboard! Silakan paste di SQL Editor Supabase Anda.');
                  }}
                  className="text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Code className="w-3 h-3" />
                  <span>Salin Script SQL Setup</span>
                </button>
              </div>

            </div>
          </div>

          {/* Quick Database Backup & Restore */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-600" />
              Backup & Export Database
            </h4>
            <p className="text-[11px] text-slate-500">
              Download salinan lengkap spreadsheet atau import data baru.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportExcel}
                className="py-1.5 px-3 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Export .XLSX
              </button>

              <label className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1">
                <Upload className="w-3.5 h-3.5 text-green-600" />
                Import Data
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={onImportExcel}
                  className="hidden"
                />
              </label>
            </div>

            {onClearData && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>🧹 Kosongkan Database Lokal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete CS */}
      {csToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Konfirmasi Hapus CS</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus petugas CS{' '}
              <span className="font-bold text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded">
                "{csToDelete.nama}"
              </span>
              ?
            </p>

            {leads.filter((l) => l.namaCS === csToDelete.nama).length > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Terdapat{' '}
                  <strong>{leads.filter((l) => l.namaCS === csToDelete.nama).length} leads</strong>{' '}
                  terdaftar atas nama CS ini. Data leads tidak akan dihapus, namun disarankan untuk
                  reassign/edit nama CS jika diperlukan.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCsToDelete(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCS(csToDelete.id);
                  onShowToast(`🗑️ CS '${csToDelete.nama}' telah berhasil dihapus.`);
                  setCsToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-all cursor-pointer shadow-xs"
              >
                Ya, Hapus CS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All Database (Iframe Safe) */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">⚠️ Konfirmasi Hapus Database</h3>
                <p className="text-xs text-red-600 font-semibold">Tindakan ini permanen & tidak bisa diurungkan!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus bersih seluruh data lokal dari browser Anda? Ini mencakup:
            </p>
            <ul className="text-xs text-slate-500 list-disc list-inside space-y-1 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <li>Semua data Leads/Prospects</li>
              <li>Daftar Customer Service (CS)</li>
              <li>Daftar Klien / Dashboards</li>
              <li>Target KPI Konversi</li>
              <li>Daftar Produk Sales</li>
            </ul>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearData();
                  setShowClearConfirmModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-all cursor-pointer shadow-xs"
              >
                Ya, Kosongkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear Supabase Database */}
      {showSupabaseClearConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">⚠️ Hapus Cloud Database Supabase</h3>
                <p className="text-xs text-red-600 font-semibold">Tindakan ini sangat berbahaya & permanen!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus seluruh data yang tersimpan di cloud database Supabase Anda? Tindakan ini akan mengosongkan semua tabel berikut di Supabase:
            </p>
            <ul className="text-xs text-slate-500 list-disc list-inside space-y-1 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <li>Tabel Leads (Semua Log Prospek)</li>
              <li>Tabel Products (Daftar Produk)</li>
              <li>Tabel KPI Targets (Target Konversi & Response Time)</li>
              <li>Tabel CS Users (Daftar Akun Petugas CS)</li>
              <li>Tabel Dashboards (Pengaturan Klien)</li>
              <li>Tabel Spreadsheet Config (Konfigurasi Google Sheets)</li>
            </ul>

            <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-150 font-medium">
              💡 Tips: Gunakan ini jika data Anda berantakan/terduplikat dan ingin melakukan migrasi bersih ulang dari Google Sheets atau Local Storage.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSupabaseClearConfirmModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearSupabaseData}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-all cursor-pointer shadow-xs"
              >
                Ya, Hapus Bersih Supabase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
