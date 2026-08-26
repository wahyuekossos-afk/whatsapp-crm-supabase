import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, CSUser, DashboardClient, KPITargets, KPITargetsMap, ProductsMap, SpreadsheetConfig, MetaChat } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

const SUPABASE_CONFIG_KEY = 'crm_wa_supabase_config_v2';

// Load initial config from local storage or environment variables
export function getSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          url: parsed.url || '',
          anonKey: parsed.anonKey || '',
          enabled: parsed.enabled !== undefined ? parsed.enabled : false
        };
      }
    }
  } catch (e) {
    console.error('Failed to load Supabase config:', e);
  }

  // Fallback to env variables if available
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    enabled: !!(envUrl && envKey)
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Supabase config:', e);
  }
}

// Global Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.enabled || !config.url || !config.anonKey) {
    supabaseInstance = null;
    return null;
  }

  // Create a new instance if needed or reuse existing
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false
        }
      });
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      supabaseInstance = null;
    }
  }
  return supabaseInstance;
}

// Reset instance when config changes
export function resetSupabaseInstance() {
  supabaseInstance = null;
}

// Test Connection
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url, anonKey, {
      auth: { persistSession: false }
    });
    // Try querying a dummy select
    const { error } = await tempClient.from('dashboards').select('id').limit(1);
    
    // If table doesn't exist, it means connection succeeded, but schema needs to be created
    if (error && error.code === 'PGRST116') {
      return { success: true, message: 'Koneksi berhasil! Namun tabel belum terbuat di Supabase.' };
    }
    if (error && error.message.includes('relation "dashboards" does not exist')) {
      return { success: true, message: 'Koneksi berhasil! Namun tabel "dashboards" belum terbuat di Supabase. Silakan jalankan SQL Setup.' };
    }
    if (error) {
      return { success: false, message: `Koneksi gagal: ${error.message} (Code: ${error.code})` };
    }
    return { success: true, message: 'Koneksi berhasil & database siap digunakan!' };
  } catch (e: any) {
    return { success: false, message: `Koneksi gagal: ${e?.message || e}` };
  }
}

// === DATABASES CRUD OPERATIONS ===

// --- DASHBOARDS ---
export async function dbGetDashboards(): Promise<DashboardClient[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description || '',
      createdAt: d.created_at
    }));
  } catch (e) {
    console.error('Error fetching dashboards from Supabase:', e);
    throw e;
  }
}

export async function dbUpsertDashboard(dash: DashboardClient): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('dashboards')
      .upsert({
        id: dash.id,
        name: dash.name,
        description: dash.description,
        created_at: dash.createdAt
      });
    if (error) throw error;
  } catch (e) {
    console.error('Error upserting dashboard to Supabase:', e);
    throw e;
  }
}

export async function dbDeleteDashboard(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.error('Error deleting dashboard from Supabase:', e);
    throw e;
  }
}

// --- CS USERS ---
export async function dbGetCSUsers(): Promise<CSUser[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('cs_users')
      .select('*');

    if (error) throw error;
    return (data || []).map(cs => ({
      id: cs.id,
      nama: cs.nama,
      role: cs.role,
      avatar: cs.avatar || '',
      clientName: cs.client_name || undefined
    }));
  } catch (e) {
    console.error('Error fetching CS Users from Supabase:', e);
    throw e;
  }
}

export async function dbUpsertCSUser(cs: CSUser): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('cs_users')
      .upsert({
        id: cs.id,
        nama: cs.nama,
        role: cs.role,
        avatar: cs.avatar,
        client_name: cs.clientName || null
      });
    if (error) throw error;
  } catch (e) {
    console.error('Error upserting CS User to Supabase:', e);
    throw e;
  }
}

export async function dbDeleteCSUser(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('cs_users')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.error('Error deleting CS User from Supabase:', e);
    throw e;
  }
}

// --- LEADS ---
export async function dbGetLeads(): Promise<Lead[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*');

    if (error) throw error;
    return (data || []).map(l => ({
      id: l.id,
      clientId: l.client_id || undefined,
      clientName: l.client_name || undefined,
      namaCS: l.nama_cs || '',
      nomorWA: l.nomor_wa || '',
      namaCustomer: l.nama_customer || '',
      kategoriFlow: l.kategori_flow,
      alasanLost: l.alasan_lost || undefined,
      tanggalMasuk: l.tanggal_masuk || '',
      jamMasuk: l.jam_masuk || '',
      jamBalas: l.jam_balas || '',
      lokasiKota: l.lokasi_kota || '',
      noteCustomer: l.note_customer || '',
      itemOrder: l.item_order || '',
      quantityOrder: Number(l.quantity_order || 0),
      totalInvoice: Number(l.total_invoice || 0),
      updatedAt: l.updated_at,
      history: Array.isArray(l.history) ? l.history : [],
      riwayatRepeatOrder: l.riwayat_repeat_order || undefined
    }));
  } catch (e) {
    console.error('Error fetching Leads from Supabase:', e);
    throw e;
  }
}

export async function dbUpsertLead(lead: Lead): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('leads')
      .upsert({
        id: lead.id,
        client_id: lead.clientId || null,
        client_name: lead.clientName || null,
        nama_cs: lead.namaCS,
        nomor_wa: lead.nomorWA,
        nama_customer: lead.namaCustomer,
        kategori_flow: lead.kategoriFlow,
        alasan_lost: lead.alasanLost || null,
        tanggal_masuk: lead.tanggalMasuk,
        jam_masuk: lead.jamMasuk,
        jam_balas: lead.jamBalas,
        lokasi_kota: lead.lokasiKota,
        note_customer: lead.noteCustomer,
        item_order: lead.itemOrder,
        quantity_order: lead.quantityOrder,
        total_invoice: lead.totalInvoice,
        updated_at: new Date().toISOString(),
        history: lead.history,
        riwayat_repeat_order: lead.riwayatRepeatOrder || null
      });
    if (error) throw error;
  } catch (e) {
    console.error('Error upserting Lead to Supabase:', e);
    throw e;
  }
}

export async function dbDeleteLead(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.error('Error deleting Lead from Supabase:', e);
    throw e;
  }
}

// --- KPI TARGETS ---
export async function dbGetKPITargets(): Promise<KPITargetsMap> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('kpi_targets')
      .select('*');

    if (error) throw error;
    const map: KPITargetsMap = {};
    (data || []).forEach(k => {
      map[k.client_name] = {
        clientName: k.client_name,
        conversionRate: Number(k.conversion_rate || 15),
        avgResponseMinutes: Number(k.avg_response_minutes || 5)
      };
    });
    return map;
  } catch (e) {
    console.error('Error fetching KPI Targets from Supabase:', e);
    throw e;
  }
}

export async function dbUpsertKPITarget(clientName: string, kpi: KPITargets): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('kpi_targets')
      .upsert({
        client_name: clientName,
        conversion_rate: kpi.conversionRate,
        avg_response_minutes: kpi.avgResponseMinutes
      });
    if (error) throw error;
  } catch (e) {
    console.error('Error upserting KPI Target to Supabase:', e);
    throw e;
  }
}

// --- PRODUCTS ---
export async function dbGetProducts(): Promise<ProductsMap> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) throw error;
    const map: ProductsMap = {};
    (data || []).forEach(p => {
      if (!map[p.client_name]) {
        map[p.client_name] = [];
      }
      if (!map[p.client_name].includes(p.product_name)) {
        map[p.client_name].push(p.product_name);
      }
    });
    return map;
  } catch (e) {
    console.error('Error fetching Products from Supabase:', e);
    throw e;
  }
}

export async function dbAddProduct(clientName: string, productName: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('products')
      .upsert({
        client_name: clientName,
        product_name: productName
      }, { onConflict: 'client_name,product_name' });
    if (error) throw error;
  } catch (e) {
    console.error('Error adding product to Supabase:', e);
    throw e;
  }
}

export async function dbDeleteProduct(clientName: string, productName: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('client_name', clientName)
      .eq('product_name', productName);
    if (error) throw error;
  } catch (e) {
    console.error('Error deleting product from Supabase:', e);
    throw e;
  }
}

// --- META CHATS ---
export async function dbGetMetaChats(): Promise<MetaChat[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('meta_chats')
      .select('*');

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('relation "meta_chats" does not exist')) {
        console.warn('Tabel "meta_chats" belum terbuat di Supabase, mengembalikan array kosong.');
        return [];
      }
      throw error;
    }
    return (data || []).map(item => ({
      id: String(item.id),
      tanggal: item.tanggal,
      namaCS: item.nama_cs,
      chatCount: Number(item.chat_count || 0),
      kondisi: item.kondisi || ''
    }));
  } catch (e) {
    console.error('Error fetching Meta Chats from Supabase:', e);
    return [];
  }
}

export async function dbUpsertMetaChat(chat: MetaChat): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('meta_chats')
      .upsert({
        tanggal: chat.tanggal,
        nama_cs: chat.namaCS,
        chat_count: chat.chatCount,
        kondisi: chat.kondisi || ''
      }, { onConflict: 'tanggal,nama_cs' });
    if (error) throw error;
  } catch (e) {
    console.error('Error upserting Meta Chat to Supabase:', e);
    throw e;
  }
}

export async function dbDeleteMetaChat(tanggal: string, namaCS: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('meta_chats')
      .delete()
      .eq('tanggal', tanggal)
      .eq('nama_cs', namaCS);
    if (error) throw error;
  } catch (e) {
    console.error('Error deleting Meta Chat from Supabase:', e);
    throw e;
  }
}

// --- SPREADSHEET CONFIG ---
export async function dbGetSpreadsheetConfig(): Promise<SpreadsheetConfig | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('spreadsheet_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
      fileName: data.file_name || 'Main_Sales_2024.xlsx',
      spreadsheetId: data.spreadsheet_id || '',
      sheetName: data.sheet_name || 'Sheet1',
      webhookUrl: data.webhook_url || '',
      autoSync: data.auto_sync !== undefined ? data.auto_sync : true,
      lastSyncedAt: data.last_synced_at || new Date().toISOString()
    };
  } catch (e) {
    console.error('Error fetching Spreadsheet Config from Supabase:', e);
    throw e;
  }
}

export async function dbUpsertSpreadsheetConfig(config: SpreadsheetConfig): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('spreadsheet_config')
      .upsert({
        id: 'default',
        file_name: config.fileName,
        spreadsheet_id: config.spreadsheetId,
        sheet_name: config.sheetName,
        webhook_url: config.webhookUrl,
        auto_sync: config.autoSync,
        last_synced_at: config.lastSyncedAt
      });
    if (error) throw error;
  } catch (e) {
    console.error('Error upserting Spreadsheet Config to Supabase:', e);
    throw e;
  }
}

// --- BULK SEEDING (One click migration from Local Storage to Supabase) ---
export async function dbBulkSeed(data: {
  dashboards: DashboardClient[];
  csList: CSUser[];
  leads: Lead[];
  kpiTargetsMap: KPITargetsMap;
  productsMap: ProductsMap;
  spreadsheetConfig: SpreadsheetConfig;
}): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, message: 'Supabase belum dikoneksikan.' };

  try {
    // 1. Seed dashboards
    if (data.dashboards.length > 0) {
      const uniqueDashboards: { [id: string]: any } = {};
      data.dashboards.forEach(d => {
        if (d.id) {
          uniqueDashboards[d.id] = {
            id: d.id,
            name: d.name,
            description: d.description || '',
            created_at: d.createdAt
          };
        }
      });
      const payload = Object.values(uniqueDashboards);
      if (payload.length > 0) {
        const { error } = await supabase.from('dashboards').upsert(payload);
        if (error) throw new Error(`Dashboards seed failed: ${error.message}`);
      }
    }

    // 2. Seed CS Users
    if (data.csList.length > 0) {
      const uniqueCS: { [id: string]: any } = {};
      data.csList.forEach(cs => {
        if (cs.id) {
          uniqueCS[cs.id] = {
            id: cs.id,
            nama: cs.nama,
            role: cs.role,
            avatar: cs.avatar,
            client_name: cs.clientName || null
          };
        }
      });
      const payload = Object.values(uniqueCS);
      if (payload.length > 0) {
        const { error } = await supabase.from('cs_users').upsert(payload);
        if (error) throw new Error(`CS Users seed failed: ${error.message}`);
      }
    }

    // 3. Seed KPI Targets
    const kpiKeys = Object.keys(data.kpiTargetsMap);
    if (kpiKeys.length > 0) {
      const payload = kpiKeys.map(k => ({
        client_name: k,
        conversion_rate: data.kpiTargetsMap[k].conversionRate,
        avg_response_minutes: data.kpiTargetsMap[k].avgResponseMinutes
      }));
      const { error } = await supabase.from('kpi_targets').upsert(payload);
      if (error) throw new Error(`KPI Targets seed failed: ${error.message}`);
    }

    // 4. Seed Products
    const prodKeys = Object.keys(data.productsMap);
    if (prodKeys.length > 0) {
      const uniqueProducts: { [key: string]: any } = {};
      prodKeys.forEach(clientName => {
        const list = data.productsMap[clientName];
        if (Array.isArray(list)) {
          list.forEach(p => {
            const cleanClient = String(clientName).trim();
            const cleanProduct = String(p).trim();
            if (cleanClient && cleanProduct) {
              const uniqueKey = `${cleanClient}::${cleanProduct}`;
              uniqueProducts[uniqueKey] = {
                client_name: cleanClient,
                product_name: cleanProduct
              };
            }
          });
        }
      });
      const payload = Object.values(uniqueProducts);
      if (payload.length > 0) {
        const { error } = await supabase.from('products').upsert(payload, { onConflict: 'client_name,product_name' });
        if (error) throw new Error(`Products seed failed: ${error.message}`);
      }
    }

    // 5. Seed Leads (chunked to prevent HTTP size limits)
    if (data.leads.length > 0) {
      const uniqueLeads: { [id: string]: any } = {};
      data.leads.forEach(lead => {
        if (lead.id) {
          uniqueLeads[lead.id] = {
            id: lead.id,
            client_id: lead.clientId || null,
            client_name: lead.clientName || null,
            nama_cs: lead.namaCS,
            nomor_wa: lead.nomorWA,
            nama_customer: lead.namaCustomer,
            kategori_flow: lead.kategoriFlow,
            alasan_lost: lead.alasanLost || null,
            tanggal_masuk: lead.tanggalMasuk,
            jam_masuk: lead.jamMasuk,
            jam_balas: lead.jamBalas,
            lokasi_kota: lead.lokasiKota,
            note_customer: lead.noteCustomer,
            item_order: lead.itemOrder,
            quantity_order: lead.quantityOrder,
            total_invoice: lead.totalInvoice,
            updated_at: lead.updatedAt || new Date().toISOString(),
            history: lead.history,
            riwayat_repeat_order: lead.riwayatRepeatOrder || null
          };
        }
      });
      const payload = Object.values(uniqueLeads);

      if (payload.length > 0) {
        // Chunk size = 100
        const chunkSize = 100;
        for (let i = 0; i < payload.length; i += chunkSize) {
          const chunk = payload.slice(i, i + chunkSize);
          const { error } = await supabase.from('leads').upsert(chunk);
          if (error) throw new Error(`Leads chunk seed failing at ${i}: ${error.message}`);
        }
      }
    }

    // 6. Seed config
    const { error } = await supabase.from('spreadsheet_config').upsert({
      id: 'default',
      file_name: data.spreadsheetConfig.fileName,
      spreadsheet_id: data.spreadsheetConfig.spreadsheetId,
      sheet_name: data.spreadsheetConfig.sheetName,
      webhook_url: data.spreadsheetConfig.webhookUrl,
      auto_sync: data.spreadsheetConfig.autoSync,
      last_synced_at: data.spreadsheetConfig.lastSyncedAt
    });
    if (error) throw new Error(`Spreadsheet Config seed failed: ${error.message}`);

    return { success: true, message: 'Semua data CRM berhasil dimigrasikan ke Supabase!' };
  } catch (e: any) {
    return { success: false, message: `Migrasi gagal: ${e?.message || e}` };
  }
}

// SQL Script generator for Supabase SQL Editor
export const SUPABASE_SQL_SCRIPT = `-- SETUP SCRIPT UNTUK SUPABASE SQL EDITOR --
-- Jalankan kode berikut di menu "SQL Editor" pada dashboard Supabase Anda.

-- 1. Tabel Dashboards
CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel CS Users
CREATE TABLE IF NOT EXISTS cs_users (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    client_name TEXT
);

-- 3. Tabel Leads
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    client_name TEXT,
    nama_cs TEXT,
    nomor_wa TEXT,
    nama_customer TEXT,
    kategori_flow TEXT,
    alasan_lost TEXT,
    tanggal_masuk TEXT,
    jam_masuk TEXT,
    jam_balas TEXT,
    lokasi_kota TEXT,
    note_customer TEXT,
    item_order TEXT,
    quantity_order INTEGER DEFAULT 0,
    total_invoice NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    history JSONB DEFAULT '[]'::jsonb,
    riwayat_repeat_order TEXT
);

-- 4. Tabel KPI Targets
CREATE TABLE IF NOT EXISTS kpi_targets (
    client_name TEXT PRIMARY KEY,
    conversion_rate NUMERIC DEFAULT 15,
    avg_response_minutes NUMERIC DEFAULT 5
);

-- 5. Tabel Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    client_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    UNIQUE(client_name, product_name)
);

-- 6. Tabel Spreadsheet Config
CREATE TABLE IF NOT EXISTS spreadsheet_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    file_name TEXT,
    spreadsheet_id TEXT,
    sheet_name TEXT,
    webhook_url TEXT,
    auto_sync BOOLEAN DEFAULT true,
    last_synced_at TEXT
);

-- 7. Tabel Meta Chats (Target Chat Masuk)
CREATE TABLE IF NOT EXISTS meta_chats (
    id SERIAL PRIMARY KEY,
    tanggal TEXT NOT NULL,
    nama_cs TEXT NOT NULL,
    chat_count INTEGER DEFAULT 0,
    kondisi TEXT DEFAULT '',
    UNIQUE(tanggal, nama_cs)
);

-- AKTIFKAN BARIS INI JIKA ANDA INGIN MENGAKTIFKAN KEAMANAN RLS (Optional)
-- Secara bawaan, Anda bisa membiarkan RLS nonaktif atau buat kebijakan bypass anon jika ingin mudah.
ALTER TABLE dashboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE cs_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE spreadsheet_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE meta_chats DISABLE ROW LEVEL SECURITY;
`;

// Clear all tables in connected Supabase
export async function dbGetDatabaseSize(): Promise<number | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('get_db_size');
    if (!error && data !== null && data !== undefined) {
      return Number(data); // size in bytes
    }
  } catch (e) {
    console.log('Using local fallback for database size estimation');
  }
  return null;
}

export async function dbClearAllSupabaseData(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, message: 'Supabase client belum diinisialisasi atau dinonaktifkan.' };
  }

  try {
    // 1. Delete leads
    const { error: errLeads } = await supabase.from('leads').delete().neq('id', '_dummy_key_');
    if (errLeads) throw new Error(`Leads: ${errLeads.message}`);

    // 2. Delete products
    const { error: errProducts } = await supabase.from('products').delete().gt('id', 0);
    if (errProducts) throw new Error(`Products: ${errProducts.message}`);

    // 3. Delete kpi_targets
    const { error: errKPI } = await supabase.from('kpi_targets').delete().neq('client_name', '_dummy_key_');
    if (errKPI) throw new Error(`KPI Targets: ${errKPI.message}`);

    // 4. Delete cs_users
    const { error: errCS } = await supabase.from('cs_users').delete().neq('id', '_dummy_key_');
    if (errCS) throw new Error(`CS Users: ${errCS.message}`);

    // 5. Delete dashboards
    const { error: errDash } = await supabase.from('dashboards').delete().neq('id', '_dummy_key_');
    if (errDash) throw new Error(`Dashboards: ${errDash.message}`);

    // 6. Delete spreadsheet_config
    const { error: errConfig } = await supabase.from('spreadsheet_config').delete().neq('id', '_dummy_key_');
    if (errConfig) throw new Error(`Spreadsheet Config: ${errConfig.message}`);

    return { success: true, message: 'Seluruh database di Supabase berhasil dikosongkan!' };
  } catch (err: any) {
    return { success: false, message: `Gagal menghapus data di Supabase: ${err.message || err}` };
  }
}
