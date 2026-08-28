import React, { useState, useEffect, useMemo } from 'react';
import { Lead, CSUser, FilterOptions, SpreadsheetConfig, DashboardClient, KPITargets, KPITargetsMap, ProductsMap, MetaChat } from './types';
import { INITIAL_LEADS, INITIAL_CS_LIST, INDONESIAN_CITIES } from './data/initialData';
import { exportToExcel, exportToCSV, parseExcelFile, fetchGoogleSheetsLeads, pushLeadsToGoogleSheets, pushCSToGoogleSheets, pushKPIToGoogleSheets, pushProductsToGoogleSheets, normalizeDateString, normalizeTimeString, formatHistoryTimestamp, ensureValidLeadHistory } from './utils/spreadsheet';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
  resetSupabaseInstance,
  dbGetDashboards,
  dbUpsertDashboard,
  dbGetCSUsers,
  dbUpsertCSUser,
  dbDeleteCSUser,
  dbGetLeads,
  dbUpsertLead,
  dbBulkUpsertLeads,
  dbDeleteUploadBatch,
  dbDeleteLead,
  dbDeleteLeadsByDateRange,
  dbGetKPITargets,
  dbUpsertKPITarget,
  dbGetProducts,
  dbAddProduct,
  dbDeleteProduct,
  dbGetSpreadsheetConfig,
  dbUpsertSpreadsheetConfig,
  dbBulkSeed,
  dbClearAllSupabaseData,
  SupabaseConfig,
  dbGetMetaChats,
  dbUpsertMetaChat,
  dbBulkUpsertMetaChats,
  dbDeleteMetaChat
} from './utils/supabase';
import { Navbar } from './components/Navbar';
import { DashboardKPI } from './components/DashboardKPI';
import { PipelineFunnel } from './components/PipelineFunnel';
import { DashboardDateFilter } from './components/DashboardDateFilter';
import { LeadTable } from './components/LeadTable';
import { NewLeadModal } from './components/NewLeadModal';
import { UpdateLeadModal } from './components/UpdateLeadModal';
import { HistoryModal } from './components/HistoryModal';
import { CreateDashboardModal } from './components/CreateDashboardModal';
import { SpreadsheetView } from './components/SpreadsheetView';
import { CSPerformanceView } from './components/CSPerformanceView';
import { AdminView } from './components/AdminView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { CheckCircle2, Database, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'crm_wa_spreadsheet_leads_v2';
const CS_STORAGE_KEY = 'crm_wa_cs_list_v2';
const CONFIG_STORAGE_KEY = 'crm_wa_spreadsheet_config_v2';
const DASHBOARDS_STORAGE_KEY = 'crm_wa_dashboards_v2';
const KPI_TARGETS_STORAGE_KEY = 'crm_wa_kpi_targets_v1';
const KPI_TARGETS_MAP_STORAGE_KEY = 'crm_wa_kpi_targets_map_v2';
const PRODUCTS_STORAGE_KEY = 'crm_wa_products_map_v2';

const DEFAULT_PRODUCTS_MAP: ProductsMap = {
  'Wibu Sales (Utama)': [
    'Kemasan Kopi Custom Logo 250gr',
    'Kemasan Kopi Standing Pouch 500gr',
    'Kaos Polo Sablon Custom',
  ],
  'Sanpota': [
    'Kemasan Kopi Custom Logo 250gr',
    'Kemasan Kopi Gayo 500gr',
    'Botol Cold Brew 250ml',
  ],
  'Wibucreative': [
    'Merchandise Acrylic Keychain',
    'Custom Sticker Pack Vinyl',
    'Desain Branding Logo Package',
  ],
};

const DEFAULT_KPI_TARGETS_MAP: KPITargetsMap = {
  'Wibu Sales (Utama)': { clientName: 'Wibu Sales (Utama)', conversionRate: 15, avgResponseMinutes: 5 },
  'Sanpota': { clientName: 'Sanpota', conversionRate: 20, avgResponseMinutes: 3 },
};

const DEFAULT_KPI_TARGETS: KPITargets = {
  conversionRate: 15,
  avgResponseMinutes: 5,
};

const INITIAL_DASHBOARDS: DashboardClient[] = [
  {
    id: 'dash-default',
    name: 'Wibu Sales (Utama)',
    description: 'Dashboard Sales & Leads Utama',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_CONFIG: SpreadsheetConfig = {
  fileName: 'Main_Sales_2024.xlsx',
  spreadsheetId: '',
  sheetName: 'Sheet1',
  webhookUrl: '',
  autoSync: true,
  lastSyncedAt: new Date().toISOString(),
};

export default function App() {
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Pull data from Supabase if enabled
  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!supabaseConfig.enabled) return;
      setIsDbLoading(true);
      try {
        const client = getSupabaseClient();
        if (!client) return;

        const [dbLeads, dbCS, dbDashes, dbKPI, dbProds, dbSsheet, dbMetaChats] = await Promise.all([
          dbGetLeads().catch(() => null),
          dbGetCSUsers().catch(() => null),
          dbGetDashboards().catch(() => null),
          dbGetKPITargets().catch(() => null),
          dbGetProducts().catch(() => null),
          dbGetSpreadsheetConfig().catch(() => null),
          dbGetMetaChats().catch(() => null)
        ]);

        if (dbLeads) {
          setLeads(dbLeads.map(l => ensureValidLeadHistory(l)));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbLeads));
        }
        if (dbCS && dbCS.length > 0) {
          const seenIds = new Set<string>();
          const seenNames = new Set<string>();
          const uniqueCS = dbCS.filter(c => {
            if (!c || !c.id || !c.nama) return false;
            if (seenIds.has(c.id) || seenNames.has(c.nama)) return false;
            seenIds.add(c.id);
            seenNames.add(c.nama);
            return true;
          });
          setCsList(uniqueCS);
          localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(uniqueCS));
        }
        if (dbDashes && dbDashes.length > 0) {
          setDashboards(dbDashes);
          localStorage.setItem(DASHBOARDS_STORAGE_KEY, JSON.stringify(dbDashes));
        }
        if (dbKPI && Object.keys(dbKPI).length > 0) {
          setKpiTargetsMap(dbKPI);
          localStorage.setItem(KPI_TARGETS_MAP_STORAGE_KEY, JSON.stringify(dbKPI));
        }
        if (dbProds && Object.keys(dbProds).length > 0) {
          setProductsMap(dbProds);
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(dbProds));
        }
        if (dbSsheet) {
          setSpreadsheetConfig(dbSsheet);
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(dbSsheet));
        }
        if (dbMetaChats && dbMetaChats.length > 0) {
          setMetaChats(dbMetaChats);
          localStorage.setItem('crm_wa_meta_chats_v1', JSON.stringify(dbMetaChats));
        }

        showToast('⚡ Data CRM berhasil dimuat dari Supabase Cloud Database!');
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        showToast('⚠️ Gagal memuat beberapa data dari Supabase. Menggunakan local storage.');
      } finally {
        setIsDbLoading(false);
      }
    };

    loadFromSupabase();
  }, [supabaseConfig.enabled, supabaseConfig.url, supabaseConfig.anonKey]);

  const handleUpdateSupabaseConfig = (newConfig: SupabaseConfig) => {
    setSupabaseConfig(newConfig);
    saveSupabaseConfig(newConfig);
    resetSupabaseInstance();
  };

  const handleMigrateToSupabase = async () => {
    const res = await dbBulkSeed({
      dashboards,
      csList,
      leads,
      kpiTargetsMap,
      productsMap,
      spreadsheetConfig,
      metaChats
    });
    return res;
  };

  const handleClearSupabaseData = async () => {
    const res = await dbClearAllSupabaseData();
    return res;
  };

  // Dashboards State
  const [dashboards, setDashboards] = useState<DashboardClient[]>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load dashboards:', e);
    }
    return INITIAL_DASHBOARDS;
  });

  const [activeDashboardId, setActiveDashboardId] = useState<string>('dash-default');
  const [isCreateDashboardOpen, setIsCreateDashboardOpen] = useState(false);

  // Active Dashboard Metadata
  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId);
  const activeDashboardName = activeDashboard ? activeDashboard.name : 'Wibu Sales (Utama)';
  // Local Storage Load Leads
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((l: Lead) => ensureValidLeadHistory(l));
        }
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    return INITIAL_LEADS.map((l) => ensureValidLeadHistory(l));
  });

  // Local Storage Load CS List (Deduplicated on load)
  const [csList, setCsList] = useState<CSUser[]>(() => {
    try {
      const saved = localStorage.getItem(CS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set<string>();
          const seenNames = new Set<string>();
          const uniqueCS: CSUser[] = [];
          for (const cs of parsed) {
            if (cs && cs.id && cs.nama && !seenIds.has(cs.id) && !seenNames.has(cs.nama)) {
              seenIds.add(cs.id);
              seenNames.add(cs.nama);
              uniqueCS.push(cs);
            }
          }
          return uniqueCS.length > 0 ? uniqueCS : INITIAL_CS_LIST;
        }
      }
    } catch (e) {
      console.error('Failed to load CS list from storage:', e);
    }
    return INITIAL_CS_LIST;
  });

  // Current Active CS
  const [currentCS, setCurrentCS] = useState<CSUser>(() => csList[0] || INITIAL_CS_LIST[0]);

  // Local Storage Load Spreadsheet Config
  const [spreadsheetConfig, setSpreadsheetConfig] = useState<SpreadsheetConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load spreadsheet config:', e);
    }
    return DEFAULT_CONFIG;
  });

  // KPI Targets Map State per Dashboard
  const [kpiTargetsMap, setKpiTargetsMap] = useState<KPITargetsMap>(() => {
    try {
      const saved = localStorage.getItem(KPI_TARGETS_MAP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load KPI targets map:', e);
    }
    return DEFAULT_KPI_TARGETS_MAP;
  });

  useEffect(() => {
    try {
      localStorage.setItem(KPI_TARGETS_MAP_STORAGE_KEY, JSON.stringify(kpiTargetsMap));
    } catch (e) {
      console.error('Failed to save KPI targets map:', e);
    }
  }, [kpiTargetsMap]);

  // Product Database Map State per Dashboard
  const [productsMap, setProductsMap] = useState<ProductsMap>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load products map from storage:', e);
    }
    return DEFAULT_PRODUCTS_MAP;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(productsMap));
    } catch (e) {
      console.error('Failed to save products map:', e);
    }
  }, [productsMap]);

  // Meta Chats state for target chat counts input by admin
  const [metaChats, setMetaChats] = useState<MetaChat[]>(() => {
    try {
      const saved = localStorage.getItem('crm_wa_meta_chats_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load meta chats from storage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('crm_wa_meta_chats_v1', JSON.stringify(metaChats));
    } catch (e) {
      console.error('Failed to save meta chats:', e);
    }
  }, [metaChats]);

  // Handler to add or update a MetaChat target entry
  const handleUpsertMetaChat = async (chat: MetaChat): Promise<boolean> => {
    const existingIdx = metaChats.findIndex(
      (m) => m.tanggal === chat.tanggal && m.namaCS === chat.namaCS
    );

    let updated: MetaChat[];
    if (existingIdx >= 0) {
      updated = [...metaChats];
      updated[existingIdx] = chat;
    } else {
      updated = [...metaChats, chat];
    }
    setMetaChats(updated);

    if (supabaseConfig.enabled) {
      try {
        await dbUpsertMetaChat(chat);
        showToast('✅ Berhasil menyimpan target Meta Chat ke Supabase Cloud!');
        return true;
      } catch (err: any) {
        showToast(`❌ Gagal menyimpan ke Supabase: ${err.message || err}. Pastikan Tabel 'meta_chats' sudah terbuat.`);
        console.error('Supabase upsert meta chat error:', err);
        return false;
      }
    } else {
      showToast('✅ Berhasil menyimpan target Meta Chat ke Local Storage!');
      return true;
    }
  };

  const handleDeleteMetaChatItem = async (tanggal: string, namaCS: string): Promise<boolean> => {
    const updated = metaChats.filter((m) => !(m.tanggal === tanggal && m.namaCS === namaCS));
    setMetaChats(updated);

    if (supabaseConfig.enabled) {
      try {
        await dbDeleteMetaChat(tanggal, namaCS);
        showToast('🗑️ Berhasil menghapus Meta Chat dari Supabase!');
        return true;
      } catch (err: any) {
        showToast(`❌ Gagal menghapus dari Supabase: ${err.message || err}`);
        console.error('Supabase delete meta chat error:', err);
        return false;
      }
    } else {
      showToast('🗑️ Berhasil menghapus Meta Chat dari Local Storage!');
      return true;
    }
  };

  const handleSyncAllMetaChats = async (): Promise<boolean> => {
    if (!supabaseConfig.enabled) {
      showToast('⚠️ Hubungkan database Supabase terlebih dahulu untuk melakukan sinkronisasi data!');
      return false;
    }
    if (metaChats.length === 0) {
      showToast('⚠️ Tidak ada data Meta Chat lokal yang dapat disinkronkan.');
      return false;
    }
    try {
      await dbBulkUpsertMetaChats(metaChats);
      showToast(`✅ Berhasil menyinkronkan ${metaChats.length} data Meta Chat lokal ke Supabase Cloud!`);
      const freshMetaChats = await dbGetMetaChats();
      if (freshMetaChats && freshMetaChats.length > 0) {
        setMetaChats(freshMetaChats);
      }
      return true;
    } catch (err: any) {
      showToast(`❌ Gagal sinkronisasi data Meta Chat: ${err.message || err}`);
      console.error(err);
      return false;
    }
  };

  // Google Sheets Sync Status Overlay
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'completed'>('idle');

  const handleAddProduct = async (dashboardName: string, productName: string) => {
    const trimmed = productName.trim();
    if (!trimmed) return;
    const currentList = productsMap[dashboardName] || [];
    if (currentList.includes(trimmed)) {
      showToast(`⚠️ Produk '${trimmed}' sudah ada di database [${dashboardName}]`);
      return;
    }

    const updatedMap = {
      ...productsMap,
      [dashboardName]: [...currentList, trimmed],
    };
    setProductsMap(updatedMap);
    showToast(`✅ Produk '${trimmed}' berhasil ditambahkan ke database [${dashboardName}]!`);

    if (supabaseConfig.enabled) {
      await dbAddProduct(dashboardName, trimmed).catch(err => console.error(err));
    }

    // Auto sync product tab if Webhook URL is set
    if (spreadsheetConfig.webhookUrl && spreadsheetConfig.webhookUrl.trim().startsWith('http')) {
      try {
        await pushProductsToGoogleSheets(spreadsheetConfig.webhookUrl, updatedMap);
      } catch (e) {
        console.error('Failed to push products to Google Sheets:', e);
      }
    }
  };

  const handleDeleteProduct = async (dashboardName: string, productName: string) => {
    const currentList = productsMap[dashboardName] || [];
    const updatedList = currentList.filter((p) => p !== productName);
    const updatedMap = {
      ...productsMap,
      [dashboardName]: updatedList,
    };
    setProductsMap(updatedMap);
    showToast(`🗑️ Produk '${productName}' dihapus dari database [${dashboardName}].`);

    if (supabaseConfig.enabled) {
      await dbDeleteProduct(dashboardName, productName).catch(err => console.error(err));
    }

    if (spreadsheetConfig.webhookUrl && spreadsheetConfig.webhookUrl.trim().startsWith('http')) {
      try {
        await pushProductsToGoogleSheets(spreadsheetConfig.webhookUrl, updatedMap);
      } catch (e) {
        console.error('Failed to push products to Google Sheets:', e);
      }
    }
  };

  const handleUpdateKPITargets = async (clientName: string, newTargets: KPITargets) => {
    const updatedMap = {
      ...kpiTargetsMap,
      [clientName]: newTargets,
    };
    setKpiTargetsMap(updatedMap);

    if (supabaseConfig.enabled) {
      await dbUpsertKPITarget(clientName, newTargets).catch(err => console.error(err));
    }

    // Auto sync to Google Sheets if Webhook URL exists
    if (spreadsheetConfig.webhookUrl && spreadsheetConfig.webhookUrl.trim().startsWith('http')) {
      try {
        await pushKPIToGoogleSheets(spreadsheetConfig.webhookUrl, updatedMap);
        showToast(`🎯 Target KPI (${clientName}) disimpan & ter-sinkron ke tab 'Data KPI' Google Sheet!`);
      } catch (err) {
        showToast(`🎯 Target KPI (${clientName}) disimpan secara lokal.`);
      }
    } else {
      showToast(`🎯 Target KPI (${clientName}) berhasil disimpan!`);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'spreadsheet' | 'cs-performance' | 'admin'>('dashboard');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isDashboardAuthModalOpen, setIsDashboardAuthModalOpen] = useState(false);

  const handleSelectTab = (tab: 'dashboard' | 'spreadsheet' | 'cs-performance' | 'admin') => {
    if (tab === 'admin' && !isAdminAuthenticated) {
      setIsAdminAuthModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleOpenCreateDashboardModal = () => {
    if (isAdminAuthenticated) {
      setIsCreateDashboardOpen(true);
    } else {
      setIsDashboardAuthModalOpen(true);
    }
  };

  // Filter Options State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    csName: '',
    kategoriFlow: '',
    lokasiKota: '',
    dateStart: '',
    dateEnd: '',
    selectedMonth: '',
  });

  // Dynamic list of unique cities extracted from all recorded database leads + standard Indonesian cities
  const existingCities = useMemo(() => {
    const citiesFromLeads = leads
      .map((l) => l.lokasiKota?.trim())
      .filter((c): c is string => Boolean(c));
    const combined = Array.from(new Set([...citiesFromLeads, ...INDONESIAN_CITIES]));
    return combined.sort((a, b) => a.localeCompare(b, 'id'));
  }, [leads]);

  // Modal States
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [isUpdateLeadOpen, setIsUpdateLeadOpen] = useState(false);

  const [selectedLeadForHistory, setSelectedLeadForHistory] = useState<Lead | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Toast Banner Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // LocalStorage Save Effect
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch (e) {
      console.error('Failed to save leads to localStorage:', e);
    }
  }, [leads]);

  useEffect(() => {
    try {
      localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(csList));
    } catch (e) {
      console.error('Failed to save CS list to localStorage:', e);
    }
  }, [csList]);

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARDS_STORAGE_KEY, JSON.stringify(dashboards));
    } catch (e) {
      console.error('Failed to save dashboards to localStorage:', e);
    }
  }, [dashboards]);

  const handleCreateDashboard = (newDash: DashboardClient) => {
    setDashboards((prev) => [...prev, newDash]);
    setActiveDashboardId(newDash.id);
    if (supabaseConfig.enabled) {
      dbUpsertDashboard(newDash).catch(err => console.error(err));
    }
    showToast(`🎉 Dashboard "${newDash.name}" berhasil dibuat! Berpindah ke dashboard baru.`);
  };

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(spreadsheetConfig));
    } catch (e) {
      console.error('Failed to save config to localStorage:', e);
    }
  }, [spreadsheetConfig]);

  // Initial Auto-Sync on Mount & URL Parameter Parsing for CS devices
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSheetId = params.get('sheetId') || params.get('sheet');
    const urlWebhook = params.get('webhookUrl') || params.get('webhook');
    const urlSheetName = params.get('sheetName');

    if (urlSheetId || urlWebhook) {
      const newConfig: SpreadsheetConfig = {
        ...spreadsheetConfig,
        spreadsheetId: urlSheetId || spreadsheetConfig.spreadsheetId,
        webhookUrl: urlWebhook || spreadsheetConfig.webhookUrl,
        sheetName: urlSheetName || spreadsheetConfig.sheetName || 'Sheet1',
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
      };

      setSpreadsheetConfig(newConfig);
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));

      handleSyncFromGoogleSheets(newConfig)
        .then(() => {
          showToast('🔗 Terhubung & tersinkronisasi otomatis dari Google Sheet!');
        })
        .catch((err) => {
          console.error('Failed auto sync from URL params:', err);
        });
    } else if (spreadsheetConfig.spreadsheetId && spreadsheetConfig.spreadsheetId.trim() && spreadsheetConfig.autoSync && !supabaseConfig.enabled) {
      handleSyncFromGoogleSheets(spreadsheetConfig).catch((err) => {
        console.log('Initial Google Sheets sync skipped or unconfigured:', err);
      });
    }
  }, []);

  // Background auto-push CS list to Google Sheets (Tab 'Data_CS')
  const autoSyncPushCS = (updatedCSList: CSUser[]) => {
    if (spreadsheetConfig.webhookUrl && spreadsheetConfig.webhookUrl.trim().startsWith('http')) {
      pushCSToGoogleSheets(spreadsheetConfig.webhookUrl, updatedCSList)
        .then(() => {
          setSpreadsheetConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
          }));
        })
        .catch((err) => {
          console.error('Auto sync push CS to Google Sheets error:', err);
        });
    }
  };

  // Admin Actions: Add CS
  const handleAddCS = (newCSData: Omit<CSUser, 'id'>) => {
    const newCS: CSUser = {
      ...newCSData,
      id: `cs-${Date.now()}`,
    };
    const updated = [...csList, newCS];
    setCsList(updated);
    localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(updated));
    if (supabaseConfig.enabled) {
      dbUpsertCSUser(newCS).catch(err => console.error(err));
    }
    autoSyncPushCS(updated);
    showToast(`✅ CS '${newCS.nama}' ditambahkan & disinkronkan ke Google Sheet (Tab Data_CS)!`);
  };

  // Admin Actions: Update CS
  const handleUpdateCS = (updatedCS: CSUser) => {
    const updated = csList.map((c) => (c.id === updatedCS.id ? updatedCS : c));
    setCsList(updated);
    localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(updated));
    if (currentCS.id === updatedCS.id) {
      setCurrentCS(updatedCS);
    }
    if (supabaseConfig.enabled) {
      dbUpsertCSUser(updatedCS).catch(err => console.error(err));
    }
    autoSyncPushCS(updated);
    showToast(`✅ Nama/Data CS '${updatedCS.nama}' diperbarui & disinkronkan ke Google Sheet!`);
  };

  // Admin Actions: Delete CS
  const handleDeleteCS = (id: string) => {
    const filtered = csList.filter((c) => c.id !== id);
    setCsList(filtered);
    localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(filtered));
    if (currentCS.id === id && filtered.length > 0) {
      setCurrentCS(filtered[0]);
    }
    if (supabaseConfig.enabled) {
      dbDeleteCSUser(id).catch(err => console.error(err));
    }
    autoSyncPushCS(filtered);
    showToast('🗑️ CS berhasil dihapus & diperbarui di Google Sheet.');
  };

  // Admin Actions: Reassign CS Name in Leads
  const handleReassignCSNameInLeads = (oldName: string, newName: string) => {
    const updated = leads.map((lead) => {
      if (lead.namaCS === oldName) {
        const item = {
          ...lead,
          namaCS: newName,
          updatedAt: new Date().toISOString(),
        };
        if (supabaseConfig.enabled) {
          dbUpsertLead(item).catch(err => console.error(err));
        }
        return item;
      }
      return lead;
    });
    setLeads(updated);
    autoSyncPush(updated);
  };

  // Admin Actions: Update Spreadsheet Config
  const handleUpdateSpreadsheetConfig = (newConfig: SpreadsheetConfig) => {
    setSpreadsheetConfig(newConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    if (supabaseConfig.enabled) {
      dbUpsertSpreadsheetConfig(newConfig).catch(err => console.error(err));
    }
  };

  // Sync Data directly from Google Sheets CSV Endpoint
  const handleSyncFromGoogleSheets = async (targetConfig?: SpreadsheetConfig) => {
    const cfg = targetConfig || spreadsheetConfig;
    if (!cfg.spreadsheetId) {
      showToast('⚠️ Masukkan Link atau ID Google Sheets terlebih dahulu.');
      return;
    }

    setSyncState('syncing');
    try {
      const syncResult = await fetchGoogleSheetsLeads(cfg.spreadsheetId, cfg.sheetName, cfg.webhookUrl);
      const fetchedLeadsPartial = syncResult.leads;

      let latestCSList = [...csList];

      // Use CS List if tab Data_CS returned custom CS users
      if (syncResult.csList && syncResult.csList.length > 0) {
        latestCSList = syncResult.csList;
      }

      // Update KPI Targets Map if tab Data KPI returned client targets
      if (syncResult.kpiTargets && Object.keys(syncResult.kpiTargets).length > 0) {
        setKpiTargetsMap((prev) => {
          const merged = { ...prev, ...syncResult.kpiTargets };
          localStorage.setItem(KPI_TARGETS_MAP_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }

      // Update Products Map if Data Produk tabs returned product lists
      if (syncResult.productsMap && Object.keys(syncResult.productsMap).length > 0) {
        setProductsMap((prev) => {
          const merged = { ...prev };
          Object.keys(syncResult.productsMap).forEach((key) => {
            const newList = syncResult.productsMap[key] || [];
            if (!merged[key]) {
              merged[key] = newList;
            } else {
              const existingList = merged[key];
              const uniqueItems = [...existingList];
              newList.forEach((item) => {
                const trimmedItem = item.trim();
                if (trimmedItem && !uniqueItems.some(x => x.trim().toLowerCase() === trimmedItem.toLowerCase())) {
                  uniqueItems.push(trimmedItem);
                }
              });
              merged[key] = uniqueItems;
            }
          });
          localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }

      if (fetchedLeadsPartial) {
        const fullLeads: Lead[] = fetchedLeadsPartial.map((p, idx) =>
          ensureValidLeadHistory({
            id: p.id || `gsheet-${Date.now()}-${idx}`,
            clientName: p.clientName || 'Wibu Sales (Utama)',
            namaCS: p.namaCS || 'CS Sheet',
            nomorWA: p.nomorWA || '0812000000',
            namaCustomer: p.namaCustomer || `Customer #${idx + 1}`,
            kategoriFlow: p.kategoriFlow || 'New Leads',
            alasanLost: p.alasanLost || '',
            tanggalMasuk: p.tanggalMasuk || new Date().toISOString().split('T')[0],
            jamMasuk: p.jamMasuk || '09:00',
            jamBalas: p.jamBalas || '09:05',
            lokasiKota: p.lokasiKota || 'Jakarta',
            noteCustomer: p.noteCustomer || '',
            itemOrder: p.itemOrder || '',
            quantityOrder: p.quantityOrder || 1,
            totalInvoice: p.totalInvoice || 0,
            updatedAt: new Date().toISOString(),
            history: p.history || [],
          })
        );

        // Always update leads state to reflect Google Sheet data exactly (even if 0 rows)
        setLeads(fullLeads);

        // Auto-register any new Client Dashboard names found in Google Sheet
        const sheetClientNames = Array.from(new Set(fullLeads.map((l) => l.clientName).filter(Boolean)));
        if (sheetClientNames.length > 0) {
          setDashboards((prev) => {
            const existingNames = new Set(prev.map((d) => d.name));
            const newDashboards: DashboardClient[] = sheetClientNames
              .filter((name) => name && !existingNames.has(name))
              .map((name, i) => ({
                id: `dash-auto-${Date.now()}-${i}`,
                name: name as string,
                description: `Dashboard Klien ${name}`,
                createdAt: new Date().toISOString(),
              }));
            if (newDashboards.length > 0) {
              const updated = [...prev, ...newDashboards];
              localStorage.setItem(DASHBOARDS_STORAGE_KEY, JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }

        // Auto-register any new CS names found in Google Sheet rows if not in latest CS list
        const sheetCSNames = Array.from(new Set(fullLeads.map((l) => l.namaCS).filter(Boolean)));
        if (sheetCSNames.length > 0) {
          const existingNames = new Set(latestCSList.map((c) => c.nama));
          const newCSUsers: CSUser[] = sheetCSNames
            .filter((name) => !existingNames.has(name) && name !== 'CS Sheet')
            .map((name, i) => ({
              id: `cs-gsheet-${Date.now()}-${i}`,
              nama: name,
              role: 'CS Officer',
              avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            }));
          if (newCSUsers.length > 0) {
            latestCSList = [...latestCSList, ...newCSUsers];
            autoSyncPushCS(latestCSList);
          }
        }

        // Commit unified final CS List exactly once
        setCsList(latestCSList);
        localStorage.setItem(CS_STORAGE_KEY, JSON.stringify(latestCSList));

        setSpreadsheetConfig((prev) => ({
          ...prev,
          ...cfg,
          lastSyncedAt: new Date().toISOString(),
        }));

        if (fullLeads.length === 0) {
          showToast(`🔄 Sinkronisasi Berhasil: Google Sheet kosong (0 data). Data diselaraskan.`);
        } else {
          showToast(`🔄 Berhasil menyinkronkan ${fullLeads.length} data & daftar CS dari Google Sheets!`);
        }
        setSyncState('completed');
        setTimeout(() => {
          setSyncState('idle');
        }, 1800);
      }
    } catch (err: any) {
      setSyncState('idle');
      console.error('Google Sheets Sync Error:', err);
      showToast(`❌ Gagal Sync: ${err.message || 'Google Sheets tidak dapat dibaca.'}`);
      throw err;
    }
  };

  // Push Data & Headers from App to Google Sheets via Apps Script Web App
  const handlePushToGoogleSheets = async (targetConfig?: SpreadsheetConfig, targetLeads?: Lead[]) => {
    const cfg = targetConfig || spreadsheetConfig;
    const leadsToPush = targetLeads || leads;
    if (!cfg.webhookUrl) {
      showToast('⚠️ Masukkan URL Webhook Endpoint Google Apps Script terlebih dahulu.');
      return;
    }

    try {
      const result = await pushLeadsToGoogleSheets(cfg.webhookUrl, leadsToPush, csList, kpiTargetsMap, productsMap);
      setSpreadsheetConfig((prev) => ({
        ...prev,
        ...cfg,
        lastSyncedAt: new Date().toISOString(),
      }));
      showToast(`🚀 Berhasil mengirim ${result.count} Leads, ${csList.length} CS, Target KPI, & Database Produk ke Google Sheets!`);
    } catch (err: any) {
      console.error('Push Error:', err);
      showToast(`❌ ${err.message || 'Gagal mengirim data ke Google Sheets.'}`);
      throw err;
    }
  };

  // Background auto-push to Google Sheets when webhook URL is set
  const autoSyncPush = (updatedLeads: Lead[], updatedCS?: CSUser[]) => {
    if (spreadsheetConfig.webhookUrl && spreadsheetConfig.webhookUrl.trim().startsWith('http')) {
      pushLeadsToGoogleSheets(spreadsheetConfig.webhookUrl, updatedLeads, updatedCS || csList, kpiTargetsMap, productsMap)
        .then(() => {
          setSpreadsheetConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
          }));
        })
        .catch((err) => {
          console.error('Auto sync push to Google Sheets error:', err);
        });
    }
  };

  // Handle Add New Lead
  const handleSaveNewLead = async (newLead: Lead) => {
    const updated = [newLead, ...leads];
    setLeads(updated);
    
    let supabaseSuccess = true;
    let supabaseErrorMsg = '';

    if (supabaseConfig.enabled) {
      try {
        await dbUpsertLead(newLead);
      } catch (err: any) {
        supabaseSuccess = false;
        supabaseErrorMsg = err.message || JSON.stringify(err);
        console.error('Failed to save to Supabase:', err);
      }
    }

    autoSyncPush(updated);

    if (supabaseConfig.enabled) {
      if (supabaseSuccess) {
        showToast(`✅ Lead baru '${newLead.namaCustomer}' berhasil disimpan ke Supabase Cloud & Google Sheet!`);
      } else {
        showToast(`⚠️ Tersimpan di lokal, tapi GAGAL menyimpan ke Supabase: ${supabaseErrorMsg}`);
      }
    } else {
      showToast(`✅ Lead baru '${newLead.namaCustomer}' berhasil disimpan & dicatat ke Google Sheet!`);
    }
  };

  // Handle Update Existing Lead
  const handleSaveUpdatedLead = async (updatedLead: Lead) => {
    const updated = leads.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    setLeads(updated);

    let supabaseSuccess = true;
    let supabaseErrorMsg = '';

    if (supabaseConfig.enabled) {
      try {
        await dbUpsertLead(updatedLead);
      } catch (err: any) {
        supabaseSuccess = false;
        supabaseErrorMsg = err.message || JSON.stringify(err);
        console.error('Failed to update in Supabase:', err);
      }
    }

    autoSyncPush(updated);

    if (supabaseConfig.enabled) {
      if (supabaseSuccess) {
        showToast(`✅ Progres lead '${updatedLead.namaCustomer}' berhasil diperbarui di Supabase & Google Sheet!`);
      } else {
        showToast(`⚠️ Terperbarui di lokal, tapi GAGAL sinkron ke Supabase: ${supabaseErrorMsg}`);
      }
    } else {
      showToast(`✅ Progres lead '${updatedLead.namaCustomer}' berhasil diperbarui di Google Sheet!`);
    }
  };

  // Handle Delete Lead
  const handleDeleteLead = async (id: string) => {
    const updated = leads.filter((l) => l.id !== id);
    setLeads(updated);

    let supabaseSuccess = true;
    let supabaseErrorMsg = '';

    if (supabaseConfig.enabled) {
      try {
        await dbDeleteLead(id);
      } catch (err: any) {
        supabaseSuccess = false;
        supabaseErrorMsg = err.message || JSON.stringify(err);
        console.error('Failed to delete in Supabase:', err);
      }
    }

    autoSyncPush(updated);

    if (supabaseConfig.enabled) {
      if (supabaseSuccess) {
        showToast('🗑️ Lead telah dihapus dari Supabase & Google Sheet.');
      } else {
        showToast(`⚠️ Terhapus di lokal, tapi GAGAL hapus di Supabase: ${supabaseErrorMsg}`);
      }
    } else {
      showToast('🗑️ Lead telah dihapus & diperbarui di Google Sheet.');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(leads);
    showToast('📥 Data spreadsheet berhasil diexport ke format Excel (.xlsx)');
  };

  const handleExportCSV = () => {
    exportToCSV(leads);
    showToast('📥 Data spreadsheet berhasil diexport ke format CSV');
  };

  // Import handler
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length > 0) {
        // Merge with existing
        const newLeadsList: Lead[] = parsed.map((p, idx) => ({
          id: p.id || `imp-${Date.now()}-${idx}`,
          namaCS: p.namaCS || currentCS.nama,
          nomorWA: p.nomorWA || '0812000000',
          namaCustomer: p.namaCustomer || 'Customer Import',
          kategoriFlow: p.kategoriFlow || 'New Leads',
          alasanLost: p.alasanLost || '',
          tanggalMasuk: p.tanggalMasuk || new Date().toISOString().split('T')[0],
          jamMasuk: p.jamMasuk || '09:00',
          jamBalas: p.jamBalas || '09:05',
          lokasiKota: p.lokasiKota || 'Jakarta',
          noteCustomer: p.noteCustomer || 'Diimport dari spreadsheet',
          itemOrder: p.itemOrder || 'Produk',
          quantityOrder: p.quantityOrder || 1,
          totalInvoice: p.totalInvoice || 0,
          updatedAt: new Date().toISOString(),
          history: p.history || [],
        }));

        const updated = [...newLeadsList, ...leads];
        setLeads(updated);
        autoSyncPush(updated);
        showToast(`🎉 Berhasil mengimport ${newLeadsList.length} leads dari file Excel/CSV!`);
      }
    } catch (err) {
      alert('Gagal mengimport file Excel/CSV. Pastikan format file sesuai.');
    }
  };

  // Handle bulk import as-is ("apa adanya", no phone matching/overwrite) and save to local state only
  const handleBulkUpsertLeads = async (parsed: Partial<Lead>[], filename: string): Promise<{ added: number; updated: number; batchId: string }> => {
    const batchId = `Batch - ${filename} - ${new Date().toLocaleString('id-ID', { hour12: false })}`;
    
    let currentLeads = [...leads];
    let addedCount = 0;
    const leadsToImport: Lead[] = [];

    parsed.forEach((p, idx) => {
      const cleanNomorWA = String(p.nomorWA || '0812000000').trim();
      
      const newLead: Lead = {
        id: p.id || `imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        clientName: p.clientName || 'Wibu Sales (Utama)',
        namaCS: p.namaCS || currentCS.nama,
        nomorWA: cleanNomorWA,
        namaCustomer: p.namaCustomer || `Customer Import #${idx + 1}`,
        kategoriFlow: p.kategoriFlow || 'New Leads',
        alasanLost: p.alasanLost || '',
        tanggalMasuk: p.tanggalMasuk || new Date().toISOString().split('T')[0],
        jamMasuk: p.jamMasuk || '09:00',
        jamBalas: p.jamBalas || '09:05',
        lokasiKota: p.lokasiKota || 'Jakarta',
        noteCustomer: p.noteCustomer || 'Diimport dari file spreadsheet',
        itemOrder: p.itemOrder || 'Produk',
        quantityOrder: Number(p.quantityOrder || 1),
        totalInvoice: Number(p.totalInvoice || 0),
        updatedAt: new Date().toISOString(),
        history: p.history || [
          {
            id: `h-imp-init-${Date.now()}-${idx}`,
            timestamp: formatHistoryTimestamp(`${p.tanggalMasuk || new Date().toISOString().split('T')[0]} ${p.jamMasuk || '09:00'}`),
            csName: p.namaCS || currentCS.nama,
            toFlow: p.kategoriFlow || 'New Leads',
            note: `Dicatat via upload file [${filename}]`
          }
        ],
        uploadBatch: batchId,
        isNewUpload: true
      };

      leadsToImport.push(newLead);
      addedCount++;
    });

    const updated = [...leadsToImport, ...currentLeads];

    // Commit to state & LocalStorage
    setLeads(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('crm_last_upload_batch', batchId);

    // Trigger background push to sheets
    autoSyncPush(updated);

    return { added: addedCount, updated: 0, batchId };
  };

  // Upload a specific batch of imported leads from local storage to Supabase database
  const handleUploadBatchToSupabase = async (batchId: string): Promise<{ success: boolean; uploadedCount: number; message: string }> => {
    if (!supabaseConfig.enabled) {
      return { success: false, uploadedCount: 0, message: 'Koneksi database Supabase belum diaktifkan.' };
    }
    
    const leadsToUpload = leads.filter(l => l.uploadBatch === batchId);
    if (leadsToUpload.length === 0) {
      return { success: false, uploadedCount: 0, message: 'Tidak ada data lokal baru yang siap diunggah untuk batch ini.' };
    }

    try {
      await dbBulkUpsertLeads(leadsToUpload);
      return {
        success: true,
        uploadedCount: leadsToUpload.length,
        message: `Berhasil menyimpan & menyinkronkan seluruh ${leadsToUpload.length} baris data leads ke cloud database Supabase!`
      };
    } catch (err: any) {
      console.error('Error uploading batch to Supabase:', err);
      throw new Error(err.message || 'Gagal mengunggah data ke database Supabase.');
    }
  };

  // Rollback function to undo only the last imported batch's newly created leads from local and Supabase (if synced)
  const handleDeleteLastImportBatch = async (): Promise<{ success: boolean; deletedCount: number; clearedCount: number; message: string }> => {
    const lastBatchId = localStorage.getItem('crm_last_upload_batch');
    if (!lastBatchId) {
      return { success: false, deletedCount: 0, clearedCount: 0, message: 'Tidak ada riwayat berkas unggahan lokal terbaru yang ditemukan.' };
    }

    const leadsToDelete = leads.filter((l) => l.uploadBatch === lastBatchId);
    const remainingLeads = leads.filter((l) => l.uploadBatch !== lastBatchId);

    const deletedCount = leadsToDelete.length;

    // Perform rollback on client-side state
    setLeads(remainingLeads);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingLeads));
    localStorage.removeItem('crm_last_upload_batch');

    // Perform rollback on Supabase if enabled
    if (supabaseConfig.enabled && deletedCount > 0) {
      try {
        await dbDeleteUploadBatch(lastBatchId);
      } catch (err: any) {
        console.error('Error rolling back Supabase batch data:', err);
      }
    }

    // Sync back to Google Sheets if connected
    autoSyncPush(remainingLeads);

    return {
      success: true,
      deletedCount,
      clearedCount: 0,
      message: `Sukses membatalkan dan menghapus ${deletedCount} data leads lokal dari berkas unggahan terakhir.`
    };
  };

  const handleDeleteLeadsByDateRange = async (startDate: string, endDate: string): Promise<{ success: boolean; deletedCount: number; message: string }> => {
    // 1. Client-side filter
    const remainingLeads = leads.filter(l => {
      const date = l.tanggalMasuk; // YYYY-MM-DD
      return !(date >= startDate && date <= endDate);
    });
    
    const deletedCount = leads.length - remainingLeads.length;
    
    // Update local state
    setLeads(remainingLeads);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingLeads));
    
    // 2. Supabase deletion if connected
    if (supabaseConfig.enabled) {
      try {
        const deletedInDb = await dbDeleteLeadsByDateRange(startDate, endDate);
        console.log(`Deleted ${deletedInDb} records in Supabase.`);
      } catch (err: any) {
        console.error('Error deleting date range in Supabase:', err);
      }
    }
    
    // Sync Google Sheets
    autoSyncPush(remainingLeads);
    
    return {
      success: true,
      deletedCount,
      message: `Berhasil menghapus ${deletedCount} data leads antara tanggal ${startDate} s/d ${endDate}.`
    };
  };

  // Reset or Clear Data
  const handleResetData = () => {
    setLeads([]);
    setCsList([]);
    setDashboards([]);
    setKpiTargetsMap({});
    setProductsMap({});
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CS_STORAGE_KEY);
    localStorage.removeItem(DASHBOARDS_STORAGE_KEY);
    localStorage.removeItem(KPI_TARGETS_MAP_STORAGE_KEY);
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    showToast('🧹 Seluruh Database Lokal berhasil dikosongkan (0 data). Ready untuk sinkronisasi baru!');
  };

  const handleRestoreSampleData = () => {
    setLeads(INITIAL_LEADS);
    autoSyncPush(INITIAL_LEADS);
    showToast('🔄 8 Data contoh demo berhasil dikembalikan.');
  };

  // Open Edit Modal
  const handleOpenEditModal = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setIsUpdateLeadOpen(true);
  };

  // Open History Modal
  const handleOpenHistoryModal = (lead: Lead) => {
    setSelectedLeadForHistory(lead);
    setIsHistoryOpen(true);
  };

  // Filter CS officers that belong to the active dashboard / client and deduplicate
  const dashboardBelongingCSList = useMemo(() => {
    const list = csList.filter((cs) => {
      if (activeDashboardId === 'all') return true;
      if (!cs.clientName || cs.clientName === 'Semua Klien' || cs.clientName === 'Semua Klien (Global)') return true;
      return cs.clientName === activeDashboardName;
    });
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return list.filter((cs) => {
      if (!cs || !cs.id || !cs.nama) return false;
      if (seenIds.has(cs.id) || seenNames.has(cs.nama)) return false;
      seenIds.add(cs.id);
      seenNames.add(cs.nama);
      return true;
    });
  }, [csList, activeDashboardId, activeDashboardName]);

  const csListNames = useMemo(() => {
    return dashboardBelongingCSList.map((c) => c.nama);
  }, [dashboardBelongingCSList]);

  // Filter leads that belong to the active dashboard / client
  const dashboardBelongingLeads = leads.filter((lead) => {
    if (activeDashboardId === 'all') return true;
    if (!activeDashboard) return true;
    if (lead.clientId === activeDashboard.id) return true;
    if (lead.clientName === activeDashboard.name) return true;
    // Default fallback if lead has no client tag and active dashboard is default
    if (!lead.clientId && !lead.clientName && (activeDashboard.id === 'dash-default' || activeDashboard.name === 'Wibu Sales (Utama)')) {
      return true;
    }
    return false;
  });

  // Filter leads for Dashboard (KPI Cards & Pipeline Funnel) based on Date & Month filters and CS Name
  const dashboardFilteredLeads = dashboardBelongingLeads.filter((lead) => {
    const leadDate = normalizeDateString(lead.tanggalMasuk);
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

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        currentCS={currentCS}
        csList={dashboardBelongingCSList}
        onSelectCS={setCurrentCS}
        dashboards={dashboards}
        activeDashboardId={activeDashboardId}
        onSelectDashboard={setActiveDashboardId}
        onOpenCreateDashboardModal={handleOpenCreateDashboardModal}
        onOpenNewLead={() => setIsNewLeadOpen(true)}
        onExportExcel={handleExportExcel}
        onResetData={handleResetData}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        totalLeadsCount={dashboardBelongingLeads.length}
        linkedSpreadsheetName={spreadsheetConfig.fileName}
        onSyncGoogleSheets={() => handleSyncFromGoogleSheets()}
        isSpreadsheetConnected={!!(spreadsheetConfig.spreadsheetId && spreadsheetConfig.spreadsheetId.trim() !== '')}
        isSupabaseConnected={supabaseConfig.enabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: DASHBOARD & TRACKING */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Filter Periode Tanggal & Bulan */}
            <DashboardDateFilter
              filters={filters}
              setFilters={setFilters}
              totalFilteredCount={dashboardFilteredLeads.length}
              totalAllCount={dashboardBelongingLeads.length}
            />

            {/* KPI Summary Cards */}
            <DashboardKPI
              leads={dashboardFilteredLeads}
              kpiTargets={
                kpiTargetsMap[activeDashboardName] || {
                  clientName: activeDashboardName,
                  conversionRate: 15,
                  avgResponseMinutes: 5,
                }
              }
            />

            {/* Pipeline Stages Funnel */}
            <PipelineFunnel
              leads={dashboardFilteredLeads}
              selectedCategory={filters.kategoriFlow}
              onSelectCategory={(cat) => setFilters((prev) => ({ ...prev, kategoriFlow: cat }))}
            />

            {/* Main Leads Table (13 Columns + Filters + Actions) */}
            <LeadTable
              leads={dashboardBelongingLeads}
              onUpdateLead={handleSaveUpdatedLead}
              onOpenEditModal={handleOpenEditModal}
              onOpenHistoryModal={handleOpenHistoryModal}
              onDeleteLead={handleDeleteLead}
              filters={filters}
              setFilters={setFilters}
              csListNames={csListNames}
            />
          </div>
        )}

        {/* TAB 2: SPREADSHEET RAW GRID VIEW */}
        {activeTab === 'spreadsheet' && (
          <SpreadsheetView
            leads={dashboardBelongingLeads}
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* TAB 3: CS PERFORMANCE & LEADERBOARD */}
        {activeTab === 'cs-performance' && (
          <CSPerformanceView
            leads={dashboardBelongingLeads}
            csList={dashboardBelongingCSList}
            activeDashboardName={activeDashboardName}
            metaChats={metaChats}
          />
        )}

        {/* TAB 4: ADMIN MANAGEMENT & SINGLETON SPREADSHEET STORAGE */}
        {activeTab === 'admin' && (
          <AdminView
            csList={csList}
            dashboards={dashboards}
            onAddCS={handleAddCS}
            onUpdateCS={handleUpdateCS}
            onDeleteCS={handleDeleteCS}
            leads={leads}
            spreadsheetConfig={spreadsheetConfig}
            onUpdateSpreadsheetConfig={handleUpdateSpreadsheetConfig}
            kpiTargetsMap={kpiTargetsMap}
            onUpdateKPITargets={handleUpdateKPITargets}
            productsMap={productsMap}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onShowToast={showToast}
            onExportExcel={handleExportExcel}
            onImportExcel={handleImportExcel}
            onReassignCSNameInLeads={handleReassignCSNameInLeads}
            onSyncFromGoogleSheets={handleSyncFromGoogleSheets}
            onPushToGoogleSheets={handlePushToGoogleSheets}
            onClearData={handleResetData}
            onRestoreSampleData={handleRestoreSampleData}
            supabaseConfig={supabaseConfig}
            onUpdateSupabaseConfig={handleUpdateSupabaseConfig}
            onMigrateToSupabase={handleMigrateToSupabase}
            onClearSupabaseData={handleClearSupabaseData}
            activeDashboardName={activeDashboardName}
            metaChats={metaChats}
            onUpsertMetaChat={handleUpsertMetaChat}
            onDeleteMetaChat={handleDeleteMetaChatItem}
            onSyncAllMetaChats={handleSyncAllMetaChats}
            onBulkImportLeads={handleBulkUpsertLeads}
            onUploadBatchToSupabase={handleUploadBatchToSupabase}
            onDeleteLastImportBatch={handleDeleteLastImportBatch}
            onDeleteLeadsByDateRange={handleDeleteLeadsByDateRange}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            Sistem CRM WhatsApp Sales & Tracking Spreadsheet | Dikembangkan untuk Efisiensi CS & Sales Pipeline
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>🟢 Status: Online</span>
            <span>•</span>
            <span>Local Storage Active</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateDashboardModal
        isOpen={isCreateDashboardOpen}
        onClose={() => setIsCreateDashboardOpen(false)}
        onCreateDashboard={handleCreateDashboard}
      />

      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onSave={handleSaveNewLead}
        currentCS={currentCS}
        csList={dashboardBelongingCSList}
        activeDashboardName={activeDashboardName}
        existingCities={existingCities}
        productsMap={productsMap}
      />

      <UpdateLeadModal
        lead={selectedLeadForEdit}
        isOpen={isUpdateLeadOpen}
        onClose={() => {
          setIsUpdateLeadOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSave={handleSaveUpdatedLead}
        currentCS={currentCS}
        existingCities={existingCities}
        productsMap={productsMap}
      />

      <HistoryModal
        lead={selectedLeadForHistory}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedLeadForHistory(null);
        }}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setIsAdminAuthModalOpen(false);
          setActiveTab('admin');
          showToast('🔓 Akses Admin Management berhasil terverifikasi!');
        }}
      />

      <AdminAuthModal
        isOpen={isDashboardAuthModalOpen}
        onClose={() => setIsDashboardAuthModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setIsDashboardAuthModalOpen(false);
          setIsCreateDashboardOpen(true);
          showToast('🔓 Akses terverifikasi! Silakan buat dashboard klien baru.');
        }}
        title="Verifikasi Akses Buat Dashboard"
        description="Masukkan username & password untuk membuat Dashboard Klien Baru"
        buttonText="Verifikasi & Buat Dashboard"
       />

      {/* Centered Backdrop-blurred Sync Overlay */}
      {syncState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white/95 border border-slate-100 max-w-sm w-full mx-4 p-8 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            {syncState === 'syncing' ? (
              <>
                <div className="relative mb-6">
                  {/* Pulsing effect */}
                  <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75"></div>
                  <div className="relative bg-gradient-to-tr from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-lg">
                    <Database className="w-8 h-8 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Sinkronisasi Google Sheet
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  Sabar ya.. sedang ambil data
                </p>

                {/* Animated loading bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-[40%]" 
                    style={{
                      animation: 'progress-infinite 1.5s infinite linear'
                    }}
                  ></div>
                </div>
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes progress-infinite {
                    0% { left: -40%; }
                    100% { left: 100%; }
                  }
                `}} />
              </>
            ) : (
              <>
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50"></div>
                  <div className="relative bg-emerald-100 text-emerald-600 p-4 rounded-full shadow-md animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  Sinkronisasi Selesai
                </h3>
                <p className="text-sm font-semibold text-emerald-600">
                  Silahkan lanjut kerja
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
