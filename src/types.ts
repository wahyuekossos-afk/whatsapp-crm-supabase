export type FlowCategory =
  | 'New Leads'
  | 'Qualified'
  | 'Quotation'
  | 'Follow Up'
  | 'First Order'
  | 'Repeat Order'
  | 'Lost';

export type LostReason =
  | 'Harga Terlalu Mahal'
  | 'Pilih Kompetitor'
  | 'Slow Response CS'
  | 'Stok Habis / Varian Kosong'
  | 'Tidak Ada Kabar / Ghosting'
  | 'Lokasi Terlalu Jauh'
  | 'Batal Butuh'
  | 'Lainnya';

export interface LeadHistoryItem {
  id: string;
  timestamp: string;
  csName: string;
  fromFlow?: FlowCategory;
  toFlow: FlowCategory;
  note?: string;
  itemOrder?: string;
  quantityOrder?: number;
  totalInvoice?: number;
  alasanLost?: string;
}

export interface DashboardClient {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface RepeatOrderItem {
  id: string;
  itemOrder: string;
  quantityOrder: number;
  totalInvoice: number;
}

export interface RepeatOrderLog {
  id: string;
  timestamp: string;
  csName: string;
  items: RepeatOrderItem[];
  totalQuantity: number;
  totalInvoice: number;
  note?: string;
}

export interface Lead {
  id: string;
  clientId?: string;
  clientName?: string;
  namaCS: string;
  nomorWA: string;
  namaCustomer: string;
  kategoriFlow: FlowCategory;
  alasanLost?: LostReason | string;
  tanggalMasuk: string; // YYYY-MM-DD
  jamMasuk: string;     // HH:mm
  jamBalas: string;     // HH:mm
  lokasiKota: string;
  noteCustomer: string;
  itemOrder: string;
  quantityOrder: number;
  totalInvoice: number;
  updatedAt: string;
  history: LeadHistoryItem[];
  riwayatRepeatOrder?: string; // Serialized JSON string for Column P in Google Sheets
  uploadBatch?: string;        // Track which batch this lead was uploaded from (e.g. "Batch - filename - timestamp")
  isNewUpload?: boolean;       // Flag if this lead was newly created from upload vs updated
}

export interface CSUser {
  id: string;
  nama: string;
  role: string;
  avatar: string;
  clientName?: string; // Specific client dashboard name, or undefined/'Semua Klien' for global/all clients
}

export interface FilterOptions {
  search: string;
  csName: string;
  kategoriFlow: string;
  lokasiKota: string;
  dateStart: string;
  dateEnd: string;
  selectedMonth?: string;
  clientId?: string;
}

export interface SpreadsheetConfig {
  fileName: string;
  spreadsheetId: string;
  sheetName: string;
  webhookUrl: string;
  autoSync: boolean;
  lastSyncedAt: string;
}

export interface KPITargets {
  clientName?: string;
  conversionRate: number;
  avgResponseMinutes: number;
}

export type KPITargetsMap = Record<string, KPITargets>;

export type ProductsMap = Record<string, string[]>;

export interface MetaChat {
  id?: string;
  tanggal: string;
  namaCS: string;
  chatCount: number;
  kondisi?: string;
}


