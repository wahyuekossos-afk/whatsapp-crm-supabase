import { Lead, CSUser } from '../types';

export const INITIAL_CS_LIST: CSUser[] = [
  { id: 'cs-1', nama: 'Siti Rahma', role: 'Senior CS', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { id: 'cs-2', nama: 'Budi Santoso', role: 'Sales Specialist', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150' },
  { id: 'cs-3', nama: 'Maya Indah', role: 'Customer Success', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  { id: 'cs-4', nama: 'Andi Pratama', role: 'WA Sales Support', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-101',
    namaCS: 'Siti Rahma',
    nomorWA: '081298765432',
    namaCustomer: 'Toko Berkah Utama (Ibu Hani)',
    kategoriFlow: 'Repeat Order',
    alasanLost: '',
    tanggalMasuk: '2026-08-01',
    jamMasuk: '08:30',
    jamBalas: '08:35',
    lokasiKota: 'Jakarta Selatan',
    noteCustomer: 'Repeat order 100 pcs seragam kantor logo custom bordir, minta invoice faktur pajak.',
    itemOrder: 'Kemeja Drill Custom Logo',
    quantityOrder: 100,
    totalInvoice: 12500000,
    updatedAt: '2026-08-01T08:35:00Z',
    history: [
      {
        id: 'h-1',
        timestamp: '2026-08-01 08:30',
        csName: 'Siti Rahma',
        toFlow: 'Repeat Order',
        note: 'Customer lama repeat order kemeja 100 pcs',
        totalInvoice: 12500000
      }
    ]
  },
  {
    id: 'lead-102',
    namaCS: 'Budi Santoso',
    nomorWA: '085712348899',
    namaCustomer: 'PT Maju Bersama (Pak Hendra)',
    kategoriFlow: 'Quotation',
    alasanLost: '',
    tanggalMasuk: '2026-08-02',
    jamMasuk: '09:15',
    jamBalas: '09:20',
    lokasiKota: 'Surabaya',
    noteCustomer: 'Minta penawaran harga & kirim sample totebag kanvas souvenir event seminar.',
    itemOrder: 'Totebag Kanvas Custom 30x40',
    quantityOrder: 250,
    totalInvoice: 8750000,
    updatedAt: '2026-08-02T09:20:00Z',
    history: [
      {
        id: 'h-2',
        timestamp: '2026-08-02 09:15',
        csName: 'Budi Santoso',
        toFlow: 'New Leads',
        note: 'Baru tanya penawaran totebag'
      },
      {
        id: 'h-3',
        timestamp: '2026-08-02 09:20',
        csName: 'Budi Santoso',
        fromFlow: 'New Leads',
        toFlow: 'Quotation',
        note: 'Penawaran harga PDF & penawaran sampel sudah dikirim via WA'
      }
    ]
  },
  {
    id: 'lead-103',
    namaCS: 'Maya Indah',
    nomorWA: '082144556677',
    namaCustomer: 'Klinik Sehat Pertiwi',
    kategoriFlow: 'First Order',
    alasanLost: '',
    tanggalMasuk: '2026-08-03',
    jamMasuk: '10:00',
    jamBalas: '10:08',
    lokasiKota: 'Bandung',
    noteCustomer: 'Deal paket tumbler grafir logo klinik 50 pcs, sudah DP 50%.',
    itemOrder: 'Tumbler Stainless Lock 500ml',
    quantityOrder: 50,
    totalInvoice: 4250000,
    updatedAt: '2026-08-03T10:08:00Z',
    history: [
      {
        id: 'h-4',
        timestamp: '2026-08-03 10:00',
        csName: 'Maya Indah',
        toFlow: 'First Order',
        note: 'Deal Tumbler 50 pcs'
      }
    ]
  },
  {
    id: 'lead-104',
    namaCS: 'Andi Pratama',
    nomorWA: '081399881122',
    namaCustomer: 'Rian Distro',
    kategoriFlow: 'Lost',
    alasanLost: 'Harga Terlalu Mahal',
    tanggalMasuk: '2026-08-04',
    jamMasuk: '11:20',
    jamBalas: '11:45',
    lokasiKota: 'Semarang',
    noteCustomer: 'Tanya kaos polos cotton combed 30s 500 pcs, minta harga di bawah 30rb/pcs.',
    itemOrder: 'Kaos Polos Combed 30s',
    quantityOrder: 500,
    totalInvoice: 17500000,
    updatedAt: '2026-08-04T11:45:00Z',
    history: [
      {
        id: 'h-5',
        timestamp: '2026-08-04 11:20',
        csName: 'Andi Pratama',
        toFlow: 'Follow Up',
        note: 'Diskusi budget grosir'
      },
      {
        id: 'h-6',
        timestamp: '2026-08-04 11:45',
        csName: 'Andi Pratama',
        fromFlow: 'Follow Up',
        toFlow: 'Lost',
        alasanLost: 'Harga Terlalu Mahal',
        note: 'Budget customer hanya Rp 25.000/pcs, HPP kami tidak masuk'
      }
    ]
  },
  {
    id: 'lead-105',
    namaCS: 'Siti Rahma',
    nomorWA: '081700998877',
    namaCustomer: 'CV Sinar Mandiri (Mas Dian)',
    kategoriFlow: 'Follow Up',
    alasanLost: '',
    tanggalMasuk: '2026-08-05',
    jamMasuk: '13:10',
    jamBalas: '13:12',
    lokasiKota: 'Medan',
    noteCustomer: 'Sudah dikirim katalog topi snapback custom, janji kabari hari Jumat.',
    itemOrder: 'Topi Snapback Custom Bordir',
    quantityOrder: 150,
    totalInvoice: 5250000,
    updatedAt: '2026-08-05T13:12:00Z',
    history: [
      {
        id: 'h-7',
        timestamp: '2026-08-05 13:10',
        csName: 'Siti Rahma',
        toFlow: 'Follow Up',
        note: 'Follow up permohonan sampel topi'
      }
    ]
  },
  {
    id: 'lead-106',
    namaCS: 'Budi Santoso',
    nomorWA: '088812345678',
    namaCustomer: 'Sdr. Kevin Wijaya',
    kategoriFlow: 'New Leads',
    alasanLost: '',
    tanggalMasuk: '2026-08-06',
    jamMasuk: '14:05',
    jamBalas: '14:09',
    lokasiKota: 'Tangerang',
    noteCustomer: 'Baru masuk via WA iklan IG, tanya pricelist jacket hoodie custom.',
    itemOrder: 'Jaket Hoodie Fleece',
    quantityOrder: 30,
    totalInvoice: 3900000,
    updatedAt: '2026-08-06T14:09:00Z',
    history: [
      {
        id: 'h-8',
        timestamp: '2026-08-06 14:05',
        csName: 'Budi Santoso',
        toFlow: 'New Leads',
        note: 'Chat pertama dari Iklan Meta'
      }
    ]
  },
  {
    id: 'lead-107',
    namaCS: 'Maya Indah',
    nomorWA: '081233445566',
    namaCustomer: 'Komunitas Runner Makassar',
    kategoriFlow: 'Qualified',
    alasanLost: '',
    tanggalMasuk: '2026-08-06',
    jamMasuk: '15:30',
    jamBalas: '15:33',
    lokasiKota: 'Makassar',
    noteCustomer: 'Minta penawaran jersey lari sublimation 200 pcs, tanggal event 25 Agustus.',
    itemOrder: 'Jersey Sublim Dryfit',
    quantityOrder: 200,
    totalInvoice: 19000000,
    updatedAt: '2026-08-06T15:33:00Z',
    history: [
      {
        id: 'h-9',
        timestamp: '2026-08-06 15:30',
        csName: 'Maya Indah',
        toFlow: 'Qualified',
        note: 'Kebutuhan jelas: jersey dryfit 200 pcs untuk event'
      }
    ]
  },
  {
    id: 'lead-108',
    namaCS: 'Andi Pratama',
    nomorWA: '085299001122',
    namaCustomer: 'Ibu Nani (Boutique Chic)',
    kategoriFlow: 'Lost',
    alasanLost: 'Tidak Ada Kabar / Ghosting',
    tanggalMasuk: '2026-08-07',
    jamMasuk: '08:00',
    jamBalas: '08:40',
    lokasiKota: 'Bekasi',
    noteCustomer: 'Sudah difollow up 3x tapi centang dua tidak dibaca.',
    itemOrder: 'Lanyard Printing ID Card',
    quantityOrder: 100,
    totalInvoice: 1500000,
    updatedAt: '2026-08-07T08:40:00Z',
    history: [
      {
        id: 'h-10',
        timestamp: '2026-08-07 08:00',
        csName: 'Andi Pratama',
        toFlow: 'Lost',
        alasanLost: 'Tidak Ada Kabar / Ghosting',
        note: 'No response setelah dikirim quotation'
      }
    ]
  },
  {
    id: 'lead-109',
    namaCS: 'Siti Rahma',
    nomorWA: '081234567890',
    namaCustomer: 'A2-Ads-Toko Kopi Kelomtong',
    kategoriFlow: 'Repeat Order',
    alasanLost: '',
    tanggalMasuk: '2026-08-08',
    jamMasuk: '09:00',
    jamBalas: '09:05',
    lokasiKota: 'Yogyakarta',
    noteCustomer: 'Repeat order kemasan kopi gayo 500 pcs.',
    itemOrder: 'Kemasan Kopi Custom Logo 250gr',
    quantityOrder: 500,
    totalInvoice: 3500000,
    updatedAt: '2026-08-08T09:05:00Z',
    history: [
      {
        id: 'h-11',
        timestamp: '2026-08-08 09:00',
        csName: 'Siti Rahma',
        toFlow: 'Repeat Order',
        note: 'Repeat Order Pertama 500 pcs, Rp 3.500.000',
        itemOrder: 'Kemasan Kopi Custom Logo 250gr',
        quantityOrder: 500,
        totalInvoice: 3500000
      }
    ]
  }
];

export const FLOW_CATEGORIES = [
  'New Leads',
  'Qualified',
  'Quotation',
  'Follow Up',
  'First Order',
  'Repeat Order',
  'Lost'
] as const;

export const REASONS_FOR_LOST = [
  'Harga Terlalu Mahal',
  'Pilih Kompetitor',
  'Slow Response CS',
  'Stok Habis / Varian Kosong',
  'Tidak Ada Kabar / Ghosting',
  'Lokasi Terlalu Jauh',
  'Batal Butuh',
  'Lainnya'
] as const;

export const INDONESIAN_CITIES = [
  'Jakarta Selatan',
  'Jakarta Barat',
  'Jakarta Pusat',
  'Jakarta Timur',
  'Jakarta Utara',
  'Surabaya',
  'Bandung',
  'Medan',
  'Semarang',
  'Makassar',
  'Tangerang',
  'Bekasi',
  'Depok',
  'Bogor',
  'Yogyakarta',
  'Denpasar',
  'Palembang',
  'Balikpapan',
  'Malang',
  'Solo'
];
