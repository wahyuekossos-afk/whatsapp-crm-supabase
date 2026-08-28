import * as XLSX from 'xlsx';
import { Lead, CSUser, LeadHistoryItem, KPITargets, KPITargetsMap, ProductsMap } from '../types';

export interface FetchGSheetResult {
  leads: Partial<Lead>[];
  csList?: CSUser[];
  kpiTargets?: KPITargetsMap;
  productsMap?: ProductsMap;
}

/**
 * Formats a raw timestamp or date string into standard Indonesian format (D/M/YYYY, HH.mm)
 */
export function formatHistoryTimestamp(
  rawTimestamp?: string,
  fallbackDateStr?: string,
  fallbackTimeStr?: string
): string {
  if (!rawTimestamp && !fallbackDateStr) {
    return new Date().toLocaleString('id-ID');
  }

  const sourceStr = rawTimestamp || `${fallbackDateStr} ${fallbackTimeStr || '09:00'}`;

  // If source contains 1899 Excel time-only epoch
  if (sourceStr.includes('1899') || sourceStr.includes('1899-12-30')) {
    const cleanTime = normalizeTimeString(sourceStr);
    const cleanDate = normalizeDateString(fallbackDateStr || '');
    const dateParts = cleanDate.split('-');
    if (dateParts.length === 3) {
      return `${parseInt(dateParts[2], 10)}/${parseInt(dateParts[1], 10)}/${dateParts[0]}, ${cleanTime.replace(':', '.')}`;
    }
  }

  const trimmed = sourceStr.trim();

  // If already in D/M/YYYY or DD/MM/YYYY format with optional time
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(trimmed)) {
    return trimmed;
  }

  // Try parsing ISO or standard date/time string
  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900) {
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const mins = String(parsedDate.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}.${mins}`;
  }

  // If YYYY-MM-DD or YYYY-MM-DD HH:mm
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]+(\d{2}:\d{2}(?::\d{2})?))?/);
  if (ymdMatch) {
    const [, year, month, day, time] = ymdMatch;
    const formattedTime = time
      ? time.replace(':', '.')
      : (fallbackTimeStr ? fallbackTimeStr.replace(':', '.') : '09.00');
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}, ${formattedTime}`;
  }

  return trimmed;
}

/**
 * Clean & normalize time strings (e.g. 1899-12-30T06:15:48.000Z -> 06:15, 09:30:00 -> 09:30)
 */
export function normalizeTimeString(rawTimeStr?: string): string {
  if (!rawTimeStr) return '09:00';
  const trimmed = String(rawTimeStr).trim();
  if (!trimmed) return '09:00';

  // If ISO string containing 'T' (e.g. 1899-12-30T13:55:00.000Z or 1899-12-30T06:15:48.000Z)
  if (trimmed.includes('T')) {
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      // Get local hours and minutes (converting UTC string back to client local time)
      const hours = String(parsedDate.getHours()).padStart(2, '0');
      const mins = String(parsedDate.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    }

    // Fallback: raw slicing if parsing fails
    const timePart = trimmed.split('T')[1];
    if (timePart) {
      const match = timePart.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
    }
  }

  // Standard HH:mm or HH:mm:ss
  const match = trimmed.match(/(\d{1,2})[\:\.](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  return '09:00';
}

/**
 * Ensures lead history is present and that the initial creation log (history[0]) matches the lead's actual entry date (tanggalMasuk)
 */
export function ensureValidLeadHistory(lead: Lead): Lead {
  const cleanTanggal = normalizeDateString(lead.tanggalMasuk);
  const cleanJam = normalizeTimeString(lead.jamMasuk);
  const expectedInitialTimestamp = formatHistoryTimestamp(`${cleanTanggal} ${cleanJam}`);

  if (!lead.history || lead.history.length === 0) {
    return {
      ...lead,
      tanggalMasuk: cleanTanggal,
      jamMasuk: cleanJam,
      jamBalas: normalizeTimeString(lead.jamBalas),
      history: [
        {
          id: `h-init-${Date.now()}`,
          timestamp: expectedInitialTimestamp,
          csName: lead.namaCS || 'System',
          toFlow: lead.kategoriFlow || 'New Leads',
          note: 'Lead tercatat',
        },
      ],
    };
  }

  const updatedHistory = [...lead.history];
  const firstItem = { ...updatedHistory[0] };

  // For the initial entry log (firstItem), verify if its timestamp matches lead.tanggalMasuk
  const firstItemDateYMD = normalizeDateString(firstItem.timestamp);
  if (!firstItem.fromFlow || firstItem.note?.includes('Disinkronisasi') || firstItem.note?.includes('Diimport') || firstItemDateYMD !== cleanTanggal || firstItem.timestamp.includes('1899')) {
    firstItem.timestamp = expectedInitialTimestamp;
    updatedHistory[0] = firstItem;
  }

  return {
    ...lead,
    tanggalMasuk: cleanTanggal,
    jamMasuk: cleanJam,
    jamBalas: normalizeTimeString(lead.jamBalas),
    history: updatedHistory,
  };
}

/**
 * Clean & normalize date strings (ISO 8601, DD/MM/YYYY, YYYY-MM-DD HH:mm, etc.) to standard YYYY-MM-DD format.
 */
export function normalizeDateString(rawDateStr?: string): string {
  if (!rawDateStr) return new Date().toISOString().split('T')[0];
  
  const trimmed = String(rawDateStr).trim();
  if (!trimmed) return new Date().toISOString().split('T')[0];

  // Ignore Excel/Google Sheets time-only epoch year 1899 (e.g., 1899-12-30T06:15:48.000Z)
  if (trimmed.startsWith('1899') || trimmed.includes('1899-12-30')) {
    return new Date().toISOString().split('T')[0];
  }

  // If already YYYY-MM-DD without time
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // If DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try Date parsing to convert ISO strings / UTC timestamps (e.g. 2026-08-08T17:00:00.000Z)
  // properly into local timezone YYYY-MM-DD (e.g. 2026-08-09 in UTC+7 WIB)
  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime())) {
    if (parsedDate.getFullYear() <= 1900) {
      return new Date().toISOString().split('T')[0];
    }
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // If string starts with YYYY-MM-DD
  const ymdTime = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (ymdTime) {
    return ymdTime[1];
  }

  return trimmed;
}

/**
 * Format number to Indonesian Rupiah currency format
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Format phone number to clean WhatsApp international format (e.g., 62812345678)
 */
export function formatWAUrl(phone: string, textMessage: string = ''): string {
  if (!phone) return '#';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  const encodedMsg = encodeURIComponent(textMessage);
  return `https://wa.me/${cleaned}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}

/**
 * Calculate response delay in minutes between jamMasuk and jamBalas
 */
export function calculateResponseMinutes(jamMasuk: string, jamBalas: string): number {
  if (!jamMasuk || !jamBalas) return 0;
  const [h1, m1] = jamMasuk.split(':').map(Number);
  const [h2, m2] = jamBalas.split(':').map(Number);
  
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
  
  const min1 = h1 * 60 + m1;
  const min2 = h2 * 60 + m2;
  
  const diff = min2 - min1;
  return diff >= 0 ? diff : 0;
}

/**
 * Format response minutes to human readable string (e.g. 5 mnt, 1 jam 15 mnt)
 */
export function formatResponseTime(minutes: number): string {
  if (minutes <= 0) return '< 1 mnt';
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} jam ${mins} mnt` : `${hours} jam`;
}

/**
 * Export Leads to Excel XLSX format including Nama Klien column
 */
export function exportToExcel(leads: Lead[], filename: string = 'CRM_WhatsApp_Leads_Report.xlsx') {
  const exportData = leads.map((lead) => ({
    'Nama Klien': lead.clientName || 'Wibu Sales (Utama)',
    'Nama CS': lead.namaCS,
    'Nomor WhatsApp': lead.nomorWA,
    'Nama Customer': lead.namaCustomer,
    'Kategori Flow Lead': lead.kategoriFlow,
    'Alasan Lost': lead.alasanLost || '-',
    'Tanggal Leads Masuk': normalizeDateString(lead.tanggalMasuk),
    'Jam Masuk Leads': lead.jamMasuk,
    'Jam Balas': lead.jamBalas,
    'Lokasi Leads': lead.lokasiKota,
    'Note Customer': lead.noteCustomer,
    'Item Order': lead.itemOrder,
    'Quantity Order (pcs)': lead.quantityOrder,
    'Total Invoice (Rp)': lead.totalInvoice,
    'Riwayat Perubahan': JSON.stringify(lead.history || []),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 22 }, // Nama Klien
    { wch: 18 }, // Nama CS
    { wch: 16 }, // Nomor WA
    { wch: 25 }, // Nama Customer
    { wch: 18 }, // Kategori Flow
    { wch: 22 }, // Alasan Lost
    { wch: 18 }, // Tanggal Masuk
    { wch: 14 }, // Jam Masuk
    { wch: 12 }, // Jam Balas
    { wch: 18 }, // Lokasi Leads
    { wch: 35 }, // Note Customer
    { wch: 25 }, // Item Order
    { wch: 16 }, // Qty
    { wch: 18 }, // Total Invoice
    { wch: 40 }, // Riwayat Perubahan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Leads WA');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export Leads to CSV format
 */
export function exportToCSV(leads: Lead[], filename: string = 'CRM_WhatsApp_Leads.csv') {
  const headers = [
    'Nama Klien',
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
    'Total Invoice (Rp)',
    'Riwayat Perubahan'
  ];

  const rows = leads.map((lead) => [
    `"${lead.clientName || 'Wibu Sales (Utama)'}"`,
    `"${lead.namaCS || ''}"`,
    `"${lead.nomorWA || ''}"`,
    `"${lead.namaCustomer || ''}"`,
    `"${lead.kategoriFlow || ''}"`,
    `"${lead.alasanLost || ''}"`,
    `"${normalizeDateString(lead.tanggalMasuk)}"`,
    `"${lead.jamMasuk || ''}"`,
    `"${lead.jamBalas || ''}"`,
    `"${lead.lokasiKota || ''}"`,
    `"${(lead.noteCustomer || '').replace(/"/g, '""')}"`,
    `"${(lead.itemOrder || '').replace(/"/g, '""')}"`,
    lead.quantityOrder || 0,
    lead.totalInvoice || 0,
    `"${JSON.stringify(lead.history || []).replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to extract Google Spreadsheet ID from URL or raw ID
 */
export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return '';
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim();
}

/**
 * Push current app leads, CS list, KPI targets, and Products Map to Google Sheets via Google Apps Script Web App Endpoint
 */
export async function pushLeadsToGoogleSheets(
  webhookUrl: string,
  leads: Lead[],
  csList?: CSUser[],
  kpiTargetsMap?: KPITargetsMap,
  productsMap?: ProductsMap
): Promise<{ success: boolean; count: number; csCount?: number; kpiCount?: number; message?: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    throw new Error(
      'URL Webhook Endpoint (Google Apps Script) belum diisi. Masukkan URL Apps Script Web App terlebih dahulu.'
    );
  }

  try {
    const kpiList = kpiTargetsMap
      ? Object.entries(kpiTargetsMap).map(([clientName, targets]) => ({
          clientName,
          conversionRate: targets.conversionRate,
          avgResponseMinutes: targets.avgResponseMinutes,
        }))
      : undefined;

    const payload = (csList || kpiList || productsMap)
      ? { leads, csList, kpiTargets: kpiList, productsMap }
      : leads;

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    let resData: any = null;
    try {
      resData = JSON.parse(text);
    } catch {
      // If response is HTML (login page), it means Google required login
      if (text.includes('<!DOCTYPE html>') || text.includes('google-site-verification') || text.includes('ServiceLogin')) {
        throw new Error(
          'Google Apps Script memerlukan Login. Harap ubah opsi "Yang memiliki akses" di Deployment Apps Script menjadi "Siapa saja" (Anyone).'
        );
      }
    }

    if (resData && resData.status === 'error') {
      throw new Error(resData.message || 'Gagal menulis data ke Google Sheets.');
    }

    const leadsCount = resData && resData.leadsCount !== undefined ? resData.leadsCount : (resData && resData.count !== undefined ? resData.count : leads.length);
    const csCount = resData && resData.csCount !== undefined ? resData.csCount : (csList ? csList.length : 0);
    const kpiCount = resData && resData.kpiCount !== undefined ? resData.kpiCount : (kpiList ? kpiList.length : 0);

    return { success: true, count: leadsCount, csCount, kpiCount };
  } catch (err: any) {
    console.error('Push to Google Sheets error:', err);
    throw new Error(
      err.message || `Gagal mengirim data ke Google Sheets! Pastikan URL Webhook benar dan akses publik "Siapa saja" diaktifkan.`
    );
  }
}

/**
 * Push Product Database Map to Google Sheets 'Data Produk [nama dashboard]' Tabs via Apps Script Web App
 */
export async function pushProductsToGoogleSheets(
  webhookUrl: string,
  productsMap: ProductsMap
): Promise<{ success: boolean; count: number; message?: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, count: 0, message: 'URL Webhook belum diisi.' };
  }

  try {
    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'sync_products', productsMap }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script HTTP Error: ${response.status}`);
    }

    return { success: true, count: Object.keys(productsMap).length };
  } catch (err: any) {
    console.error('Push Products to Google Sheets error:', err);
    return { success: false, count: 0, message: err.message };
  }
}

/**
 * Push CS User List to Google Sheets 'Data_CS' Tab via Apps Script Web App
 */
export async function pushCSToGoogleSheets(
  webhookUrl: string,
  csList: CSUser[]
): Promise<{ success: boolean; count: number; message?: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, count: 0, message: 'URL Webhook belum diisi.' };
  }

  try {
    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'sync_cs', csList }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    let resData: any = null;
    try {
      resData = JSON.parse(text);
    } catch {
      // ignore
    }

    return { success: true, count: resData && resData.count !== undefined ? resData.count : csList.length };
  } catch (err: any) {
    console.error('Push CS to Google Sheets error:', err);
    return { success: false, count: 0, message: err.message };
  }
}

/**
 * Push Target KPI List to Google Sheets 'Data KPI' Tab via Apps Script Web App
 */
export async function pushKPIToGoogleSheets(
  webhookUrl: string,
  kpiTargets: KPITargets[] | KPITargetsMap
): Promise<{ success: boolean; count: number; message?: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, count: 0, message: 'URL Webhook belum diisi.' };
  }

  try {
    const kpiList: KPITargets[] = Array.isArray(kpiTargets)
      ? kpiTargets
      : Object.entries(kpiTargets).map(([clientName, targets]) => ({
          clientName,
          conversionRate: targets.conversionRate,
          avgResponseMinutes: targets.avgResponseMinutes,
        }));

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'sync_kpi', kpiTargets: kpiList }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    let resData: any = null;
    try {
      resData = JSON.parse(text);
    } catch {
      // ignore
    }

    return { success: true, count: resData && resData.kpiCount !== undefined ? resData.kpiCount : kpiList.length };
  } catch (err: any) {
    console.error('Push KPI to Google Sheets error:', err);
    return { success: false, count: 0, message: err.message };
  }
}

/**
 * Fetch and parse data from Google Sheets via Apps Script Web App or direct CSV endpoint
 */
export async function fetchGoogleSheetsLeads(
  spreadsheetUrlOrId: string,
  sheetName: string = '',
  webhookUrl: string = ''
): Promise<FetchGSheetResult> {
  let jsonData: any[] = [];
  let fetchedCSList: CSUser[] = [];
  let fetchedKPITargets: KPITargetsMap = {};
  let fetchedProductsMap: ProductsMap = {};
  let fetchErrors: string[] = [];

  // Mode 1: Try Google Apps Script Web App Endpoint if webhookUrl is provided
  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      const resp = await fetch(webhookUrl.trim());
      if (resp.ok) {
        const text = await resp.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            jsonData = data;
          } else if (data && typeof data === 'object') {
            if (Array.isArray(data.leads)) {
              jsonData = data.leads;
            }
            if (Array.isArray(data.csList)) {
              fetchedCSList = data.csList
                .filter((cs: any) => Boolean(cs.nama || cs['Nama CS'] || cs.namaCS))
                .map((cs: any, i: number) => ({
                  id: cs.id || cs.ID || `cs-gsheet-${i}`,
                  nama: cs['Nama CS'] || cs.nama || cs.namaCS || `CS #${i + 1}`,
                  role: cs.Role || cs.role || 'CS Officer',
                  clientName: cs['Tugas Klien'] || cs.clientName || cs.namaKlien || undefined,
                  avatar: cs['Avatar URL'] || cs.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                }));
            }
            if (Array.isArray(data.kpiTargets)) {
              data.kpiTargets.forEach((kpi: any) => {
                const cName = kpi['Nama Klien'] || kpi.clientName;
                const cr = Number(kpi['Target Conversion Rate (%)'] ?? kpi.conversionRate);
                const rt = Number(kpi['Target Response Time (Menit)'] ?? kpi.avgResponseMinutes);
                if (cName) {
                  fetchedKPITargets[cName] = {
                    clientName: cName,
                    conversionRate: !isNaN(cr) && cr >= 0 ? cr : 15,
                    avgResponseMinutes: !isNaN(rt) && rt >= 0 ? rt : 5,
                  };
                }
              });
            }
            if (data.productsMap && typeof data.productsMap === 'object') {
              fetchedProductsMap = data.productsMap;
            } else if (Array.isArray(data.products)) {
              data.products.forEach((prod: any) => {
                const pName = prod['Nama Produk'] || prod.productName;
                const dName = prod['Dashboard'] || prod.dashboardName || 'Wibu Sales (Utama)';
                if (pName && dName) {
                  if (!fetchedProductsMap[dName]) fetchedProductsMap[dName] = [];
                  if (!fetchedProductsMap[dName].includes(pName)) {
                    fetchedProductsMap[dName].push(pName);
                  }
                }
              });
            }
          }
        } catch {
          fetchErrors.push('Respon Google Apps Script Web App bukan JSON array.');
        }
      } else {
        fetchErrors.push(`Apps Script HTTP Status: ${resp.status}`);
      }
    } catch (err: any) {
      fetchErrors.push(`Gagal konek Apps Script Web App: ${err.message || 'CORS / Network Error'}`);
    }
  }

  // Mode 2: Fallback to Google Sheets CSV Export Endpoint (/gviz/tq?tqx=out:csv)
  if (jsonData.length === 0) {
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrlOrId);
    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID atau Share URL tidak valid. Pastikan URL Google Sheet benar.');
    }

    let csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
    if (sheetName && sheetName.trim()) {
      csvUrl += `&sheet=${encodeURIComponent(sheetName.trim())}`;
    }

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(
          `Google Sheets HTTP ${response.status}. Pastikan file Google Sheet di-Share ke "Anyone with the link" (Siapa saja yang memiliki link).`
        );
      }

      const csvText = await response.text();
      if (!csvText || csvText.trim().length === 0) {
        return { leads: [] };
      }

      // Check if Google returned HTML login page instead of CSV
      if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes('google-site-verification')) {
        throw new Error(
          'Google Sheet terproteksi (Private). Silakan ubah opsi Akses Berbagi / Share di Google Sheet menjadi "Siapa saja yang memiliki link" (Anyone with the link).'
        );
      }

      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) || [];
    } catch (csvErr: any) {
      fetchErrors.push(csvErr.message);
      if (jsonData.length === 0) {
        throw new Error(csvErr.message || 'Gagal membaca data dari Google Sheets.');
      }
    }
  }

  if (!jsonData || jsonData.length === 0) {
    return {
      leads: [],
      csList: fetchedCSList.length > 0 ? fetchedCSList : undefined,
      kpiTargets: Object.keys(fetchedKPITargets).length > 0 ? fetchedKPITargets : undefined,
    };
  }

  // Helper for flexible case-insensitive and alphanumeric column header matching
  const parseRowToLead = (row: any, idx: number): Partial<Lead> => {
    const getVal = (possibleKeys: string[]) => {
      if (!row || typeof row !== 'object') return '';
      const rowKeys = Object.keys(row);
      for (const targetKey of possibleKeys) {
        const cleanTarget = targetKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const actualKey of rowKeys) {
          const cleanActual = actualKey.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanActual === cleanTarget && row[actualKey] !== undefined && row[actualKey] !== null) {
            return String(row[actualKey]).trim();
          }
        }
      }
      return '';
    };

    const clientName = getVal(['Nama Klien', 'Nama Client', 'Client', 'Klien', 'Dashboard']);
    const namaCS = getVal(['Nama CS', 'Nama CS/Sales', 'CS Name', 'CS', 'Sales']);
    const nomorWA = getVal(['Nomor WhatsApp', 'No WA', 'Nomor WA', 'WhatsApp', 'Phone', 'HP']);
    const namaCustomer = getVal(['Nama Customer', 'Nama Pelanggan', 'Customer Name', 'Customer', 'Nama']);
    const kategoriFlow = getVal(['Kategori Flow Lead', 'Kategori Flow', 'Status', 'Flow', 'Tahap']) || 'New Leads';
    const alasanLost = getVal(['Alasan Lost', 'Lost Reason', 'Alasan']);
    const rawTanggal = getVal(['Tanggal Leads Masuk', 'Tanggal Masuk', 'Tanggal', 'Date']);
    const tanggalMasuk = normalizeDateString(rawTanggal);
    const jamMasuk = normalizeTimeString(getVal(['Jam Masuk Leads', 'Jam Masuk', 'Time']) || '09:00');
    const jamBalas = normalizeTimeString(getVal(['Jam Balas', 'Time Replied']) || '09:05');
    const lokasiKota = getVal(['Lokasi Leads (Kota)', 'Lokasi Leads', 'Kota', 'Location']) || 'Jakarta';
    const noteCustomer = getVal(['Note Customer', 'Note', 'Catatan']);
    const itemOrder = getVal(['Item Order', 'Item', 'Produk']);
    const quantityOrder = Number(getVal(['Quantity Order (pcs)', 'Quantity', 'Qty'])) || 1;
    const totalInvoice = Number(getVal(['Total Invoice (Rp)', 'Total Invoice', 'Total', 'Invoice'])) || 0;
    const riwayatRepeatOrder = getVal(['Riwayat Repeat Order', 'Riwayat Repeat', 'Repeat Order History', 'Repeat Orders']);

    let historyList: LeadHistoryItem[] = [];
    if (Array.isArray(row.history) && row.history.length > 0) {
      historyList = row.history;
    } else {
      const rawHistoryStr = getVal(['Riwayat Perubahan', 'Riwayat', 'History Log', 'History', 'Log Perubahan']);
      if (rawHistoryStr) {
        try {
          const parsed = JSON.parse(rawHistoryStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            historyList = parsed;
          }
        } catch {
          // ignore
        }
      }
    }

    const leadCandidate: Lead = {
      id: row.id || `gsheet-${Date.now()}-${idx}`,
      clientName: clientName || undefined,
      namaCS: namaCS || 'CS Sheet',
      nomorWA: nomorWA || '0812000000',
      namaCustomer: namaCustomer || `Customer #${idx + 1}`,
      kategoriFlow: (kategoriFlow as any) || 'New Leads',
      alasanLost,
      tanggalMasuk,
      jamMasuk,
      jamBalas,
      lokasiKota,
      noteCustomer,
      itemOrder,
      quantityOrder,
      totalInvoice,
      riwayatRepeatOrder: riwayatRepeatOrder || undefined,
      updatedAt: new Date().toISOString(),
      history: historyList.length > 0 ? historyList : [
        {
          id: `h-gsheet-${idx}`,
          timestamp: formatHistoryTimestamp(`${tanggalMasuk} ${jamMasuk || '09:00'}`),
          csName: namaCS || 'Google Sheets',
          toFlow: (kategoriFlow as any) || 'New Leads',
          note: 'Disinkronisasi dari Google Sheets',
        },
      ],
    };

    return ensureValidLeadHistory(leadCandidate);
  };

  const parsedLeads = jsonData.map(parseRowToLead);
  return {
    leads: parsedLeads,
    csList: fetchedCSList.length > 0 ? fetchedCSList : undefined,
    kpiTargets: Object.keys(fetchedKPITargets).length > 0 ? fetchedKPITargets : undefined,
    productsMap: Object.keys(fetchedProductsMap).length > 0 ? fetchedProductsMap : undefined,
  };
}

export function parseExcelFile(file: File): Promise<Partial<Lead>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Extract headers and check if they match the required database layout
        const headersRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as any[];
        const fileHeaders = (headersRaw || []).map(h => String(h).trim().toLowerCase());
        
        const hasWhatsApp = fileHeaders.some(h => ['nomor whatsapp', 'no wa', 'nomor wa', 'whatsapp', 'phone'].includes(h));
        const hasCustomer = fileHeaders.some(h => ['nama customer', 'nama pelanggan', 'customer name', 'customer'].includes(h));
        const hasDate = fileHeaders.some(h => ['tanggal leads masuk', 'tanggal masuk', 'tanggal', 'date'].includes(h));
        const hasCS = fileHeaders.some(h => ['nama cs', 'nama cs/sales', 'cs name', 'cs'].includes(h));

        if (!hasWhatsApp || !hasCustomer || !hasDate || !hasCS) {
          const missing = [];
          if (!hasWhatsApp) missing.push("Nomor WhatsApp");
          if (!hasCustomer) missing.push("Nama Customer");
          if (!hasDate) missing.push("Tanggal Leads Masuk");
          if (!hasCS) missing.push("Nama CS");
          
          throw new Error(`Format kolom dokumen tidak cocok dengan database Supabase. Silakan unduh template CSV di atas. Kolom penting yang tidak ditemukan: ${missing.join(', ')}`);
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsedLeads: Partial<Lead>[] = jsonData.map((row: any, idx: number) => {
          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              if (row[key] !== undefined && row[key] !== null) return String(row[key]).trim();
            }
            return '';
          };

          const clientName = getVal(['Nama Klien', 'Client Name', 'Klien', 'Client']) || 'Wibu Sales (Utama)';
          const namaCS = getVal(['Nama CS', 'Nama CS/Sales', 'CS Name', 'CS']);
          const nomorWA = getVal(['Nomor WhatsApp', 'No WA', 'Nomor WA', 'WhatsApp', 'Phone']);
          const namaCustomer = getVal(['Nama Customer', 'Nama Pelanggan', 'Customer Name', 'Customer']);
          const kategoriFlow = getVal(['Kategori Flow Lead', 'Kategori Flow', 'Status', 'Flow']) || 'New Leads';
          const alasanLost = getVal(['Alasan Lost', 'Lost Reason', 'Alasan']);
          const rawTanggal = getVal(['Tanggal Leads Masuk', 'Tanggal Masuk', 'Tanggal', 'Date']);
          const tanggalMasuk = normalizeDateString(rawTanggal);
          const jamMasuk = normalizeTimeString(getVal(['Jam Masuk Leads', 'Jam Masuk', 'Time']) || '09:00');
          const jamBalas = normalizeTimeString(getVal(['Jam Balas', 'Time Replied']) || '09:05');
          const lokasiKota = getVal(['Lokasi Leads (Kota)', 'Lokasi Leads', 'Kota', 'Location']) || 'Jakarta';
          const noteCustomer = getVal(['Note Customer', 'Note', 'Catatan']);
          const itemOrder = getVal(['Item Order', 'Item', 'Produk']);
          const quantityOrder = Number(getVal(['Quantity Order (pcs)', 'Quantity', 'Qty'])) || 1;
          const totalInvoice = Number(getVal(['Total Invoice (Rp)', 'Total Invoice', 'Total', 'Invoice'])) || 0;

          let historyList: LeadHistoryItem[] = [];
          const rawHistoryStr = getVal(['Riwayat Perubahan', 'Riwayat', 'History Log', 'History', 'Log Perubahan']);
          if (rawHistoryStr) {
            try {
              const parsed = JSON.parse(rawHistoryStr);
              if (Array.isArray(parsed) && parsed.length > 0) {
                historyList = parsed;
              }
            } catch {
              // ignore
            }
          }

          const leadCandidate: Lead = {
            id: `import-${Date.now()}-${idx}`,
            clientName,
            namaCS: namaCS || 'CS Import',
            nomorWA: nomorWA || '0812000000',
            namaCustomer: namaCustomer || `Customer Import #${idx + 1}`,
            kategoriFlow: (kategoriFlow as any) || 'New Leads',
            alasanLost,
            tanggalMasuk,
            jamMasuk,
            jamBalas,
            lokasiKota,
            noteCustomer,
            itemOrder,
            quantityOrder,
            totalInvoice,
            updatedAt: new Date().toISOString(),
            history: historyList.length > 0 ? historyList : [
              {
                id: `h-imp-${idx}`,
                timestamp: formatHistoryTimestamp(`${tanggalMasuk} ${jamMasuk || '09:00'}`),
                csName: namaCS || 'System Import',
                toFlow: (kategoriFlow as any) || 'New Leads',
                note: 'Diimport dari file Excel/CSV'
              }
            ]
          };

          return ensureValidLeadHistory(leadCandidate);
        });

        resolve(parsedLeads);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Safely look up products from ProductsMap for a given dashboard name using robust,
 * case-insensitive, and prefix/truncation-resistant matching. This resolves the Google Sheets
 * tab name truncation bug (where Google limits sheet names, truncating dashboard names like 
 * "Wibu Sales (Utama)" into "Wibu Sales (Utama").
 */
export function getProductsForDashboard(productsMap: ProductsMap | undefined, dashboardName: string): string[] {
  if (!productsMap) return [];
  
  const keys = Object.keys(productsMap);
  if (keys.length === 0) return [];

  // --- RULE 1: SINGLE MASTER SHEET ---
  // Jika hanya ada 1 tab produk di spreadsheet, gunakan tab tersebut sebagai sumber master mutlak
  if (keys.length === 1) {
    return productsMap[keys[0]] || [];
  }

  if (!dashboardName) return [];
  
  // 1. Exact match (highest priority, but bypass if it is a stale mock/default list and a master list is available)
  const masterKey = keys.find(key => {
    const kLower = key.toLowerCase();
    return kLower.includes('wibu') && kLower.includes('sales') && kLower.includes('utama');
  }) || keys.find(key => {
    const kLower = key.toLowerCase();
    return kLower.includes('wibu') && kLower.includes('utama');
  }) || keys.find(key => {
    const kLower = key.toLowerCase();
    return kLower.includes('utama');
  });

  const isDefaultMockList = (list: string[], dName: string) => {
    if (!list || list.length === 0) return true;
    const lowerDName = dName.toLowerCase();
    if (lowerDName.includes('sanpota') && list.length === 3) {
      return list.includes('Kemasan Kopi Custom Logo 250gr') && list.includes('Kemasan Kopi Gayo 500gr');
    }
    if (lowerDName.includes('wibucreative') && !lowerDName.includes('sales') && list.length === 3) {
      return list.includes('Merchandise Acrylic Keychain') && list.includes('Custom Sticker Pack Vinyl');
    }
    return false;
  };

  if (productsMap[dashboardName]) {
    const exactList = productsMap[dashboardName];
    if (masterKey && masterKey !== dashboardName && isDefaultMockList(exactList, dashboardName)) {
      // Bypass stale mock and use master
      return productsMap[masterKey];
    }
    return exactList;
  }
  
  // Normalize function: lowercase and keep alphanumeric only
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetNormalized = normalize(dashboardName);
  if (!targetNormalized) return [];

  // Sort keys by length descending to match the most specific/longest prefix first
  const sortedKeys = [...keys].sort((a, b) => b.length - a.length);

  // 2. Alphanumeric normalized exact match
  for (const key of sortedKeys) {
    if (normalize(key) === targetNormalized) {
      return productsMap[key];
    }
  }

  // 3. Robust Truncation Prefix Match (e.g. key "wibucreative sales" is a prefix of target "wibucreative sales (utama)")
  // This is highly safe as Apps Script truncates sheet tab names to a maximum of 30 characters.
  // We match when the full app client name begins with the Google Sheets tab key.
  for (const key of sortedKeys) {
    const keyNormalized = normalize(key);
    if (keyNormalized && targetNormalized.startsWith(keyNormalized)) {
      return productsMap[key];
    }
  }

  // 4. Reverse prefix match as fallback
  for (const key of sortedKeys) {
    const keyNormalized = normalize(key);
    if (keyNormalized && keyNormalized.startsWith(targetNormalized)) {
      return productsMap[key];
    }
  }

  // 5. Substring / Case-insensitive match as a last resort
  const targetLower = dashboardName.toLowerCase();
  for (const key of sortedKeys) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes(targetLower) || targetLower.includes(keyLower)) {
      return productsMap[key];
    }
  }

  // --- RULE 2: MASTER FALLBACK "WIBU SALES (UTAMA)" ---
  // Jika tidak ditemukan kecocokan spesifik, cari tab master "wibu sales (utama)" yang sudah dihitung di atas
  if (masterKey) {
    return productsMap[masterKey];
  }

  return [];
}

