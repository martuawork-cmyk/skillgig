-- =============================================================================
-- seed-gigs-real.sql
-- Seed 30 lowongan/gig REALISTIS berkualitas tinggi untuk SkillGig.id
--
-- Distribusi (30 total):
--   Full-Time  : 8  (2 Tech, 2 Design, 2 Marketing, 2 Data)
--   Contract   : 5  (2 Web Dev, 2 Design, 1 Writing)
--   Freelance  : 10 (3 Projects.co.id, 3 Sribulancer, 2 Fastwork, 2 99designs)
--   Part-Time  : 4  (2 Sosmed, 1 VA, 1 Customer Support)
--   Internship : 3  (1 Tech, 1 Design, 1 Marketing)
--
-- Catatan skema:
--   Beberapa kolom yang diminta (company, company_logo, job_type,
--   salary_currency, is_remote, location) BELUM ada di tabel gigs.
--   Ditambahkan di bawah secara idempoten (ADD COLUMN IF NOT EXISTS).
--   duration_weeks di-SET nullable supaya Full-Time bisa NULL.
--   File ini TIDAK dieksekusi otomatis — jalankan manual di Supabase SQL editor.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Pastikan kolom yang dibutuhkan seed ini ada (idempoten, aman di-rerun).
-- -----------------------------------------------------------------------------
ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS company         text,
  ADD COLUMN IF NOT EXISTS company_logo    text,
  ADD COLUMN IF NOT EXISTS job_type        text,
  ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS location        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_remote       boolean NOT NULL DEFAULT true;

-- Izinkan duration_weeks = NULL (untuk lowongan Full-Time tanpa durasi tetap).
ALTER TABLE gigs ALTER COLUMN duration_weeks DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Hapus semua gig seed lama.
-- -----------------------------------------------------------------------------
DELETE FROM gigs WHERE id LIKE '44444444%';

-- -----------------------------------------------------------------------------
-- 3. Insert 30 gig realistis.
--    Kolom: id(gen_random_uuid), title, company, company_logo, platform,
--    category, job_type, budget_min, budget_max, salary_currency, location,
--    is_remote, url, level, description, skills, duration_weeks, status,
--    applicants_count, created_at
-- -----------------------------------------------------------------------------
INSERT INTO gigs (
  id, title, company, company_logo, platform, category, job_type,
  budget_min, budget_max, salary_currency, location, is_remote, url, level,
  description, skills, duration_weeks, status, applicants_count, created_at
) VALUES

-- =========================== FULL-TIME (8) ==================================

-- FT1 — Tech: React
(
  gen_random_uuid(),
  'Senior Frontend Engineer (React/Next.js) — Fully Remote',
  'Automattic', '🌐', 'We Work Remotely', 'web-dev', 'Full-Time',
  45000, 75000, 'USD', 'Remote Asia', true,
  'https://weworkremotely.com/remote-jobs/senior-frontend-engineer-react-nextjs',
  'advanced',
  'Bergabung dengan tim produk terdistribusi membangun antarmuka berbasis React & Next.js untuk jutaan pengguna. Anda akan mengembangkan fitur end-to-end, mengutamakan performa dan aksesibilitas.',
  ARRAY['React','Next.js','TypeScript','Tailwind CSS'],
  NULL, 'published', 38, '2026-06-28T09:15:00Z'
),
-- FT2 — Tech: Node.js
(
  gen_random_uuid(),
  'Backend Engineer (Node.js) — Remote, Global SaaS',
  'Buffer', '🟧', 'Wellfound', 'web-dev', 'Full-Time',
  52000, 82000, 'USD', 'Remote Asia', true,
  'https://wellfound.com/jobs/backend-engineer-nodejs-buffer',
  'advanced',
  'Membangun dan merawat layanan backend Node.js berskala besar untuk produk social media management. Fokus pada API yang andal, observability, dan praktik clean code.',
  ARRAY['Node.js','PostgreSQL','AWS','REST API','GraphQL'],
  NULL, 'published', 31, '2026-06-26T13:40:00Z'
),
-- FT3 — Design: Product Design
(
  gen_random_uuid(),
  'Senior Product Designer — Remote (Asia)',
  'Canva', '🎨', 'LinkedIn', 'design', 'Full-Time',
  360000000, 540000000, 'IDR', 'Remote Asia', true,
  'https://www.linkedin.com/jobs/view/senior-product-designer-canva',
  'advanced',
  'Memimpin proyek desain produk dari riset hingga ship untuk produk desain grafis skala global. Bekerja dekat dengan PM dan engineer dalam tim cross-functional.',
  ARRAY['Figma','UX Research','Design System','Prototyping'],
  NULL, 'published', 42, '2026-06-27T10:05:00Z'
),
-- FT4 — Design: UI/UX
(
  gen_random_uuid(),
  'UI/UX Designer (Remote) — Workflow Automation SaaS',
  'Zapier', '⚡', 'We Work Remotely', 'design', 'Full-Time',
  42000, 68000, 'USD', 'Remote', true,
  'https://weworkremotely.com/remote-jobs/ui-ux-designer-zapier',
  'intermediate',
  'Mendesain pengalaman pengguna yang intuitif untuk produk automasi no-code. Anda akan membuat wireframe, mockup, dan prototype serta menjalankan usability testing berkala.',
  ARRAY['Figma','UI Design','User Flow','Usability Testing'],
  NULL, 'published', 27, '2026-06-25T08:20:00Z'
),
-- FT5 — Marketing: Digital Marketing
(
  gen_random_uuid(),
  'Digital Marketing Manager — Growth Team',
  'Traveloka', '✈️', 'LinkedIn', 'marketing', 'Full-Time',
  240000000, 360000000, 'IDR', 'Remote Indonesia', true,
  'https://www.linkedin.com/jobs/view/digital-marketing-manager-traveloka',
  'advanced',
  'Memimpin strategi pemasaran digital lintas channel (Paid Ads, SEO, CRM) untuk produk travel. Bertanggung jawab atas funnel akuisisi pengguna dan ROI kampanye.',
  ARRAY['Google Ads','SEO','Meta Ads','Analytics','Growth'],
  NULL, 'published', 34, '2026-06-29T14:30:00Z'
),
-- FT6 — Marketing: Content
(
  gen_random_uuid(),
  'Content Marketing Lead (Remote) — B2B SaaS',
  'HubSpot', '🟠', 'Wellfound', 'marketing', 'Full-Time',
  40000, 62000, 'USD', 'Remote Asia', true,
  'https://wellfound.com/jobs/content-marketing-lead-hubspot',
  'advanced',
  'Memimpin tim content marketing yang membuat artikel, ebook, dan kampanye thought leadership untuk audiens B2B. Menentukan editorial calendar dan strategi distribusi.',
  ARRAY['Content Strategy','SEO','Copywriting','Analytics'],
  NULL, 'published', 23, '2026-06-24T11:00:00Z'
),
-- FT7 — Data: Data Analyst
(
  gen_random_uuid(),
  'Data Analyst — Fintech (Remote Indonesia)',
  'GoTo Financial', '💳', 'Kalibrr', 'data', 'Full-Time',
  220000000, 340000000, 'IDR', 'Remote Indonesia', true,
  'https://www.kalibrr.com/c/go-to-financial/jobs/data-analyst',
  'intermediate',
  'Mengolah data transaksi menjadi insight produk dan bisnis melalui dashboard dan analisis ad-hoc. Bekerja dengan tim produk untuk mengukur eksperimen dan metrik pertumbuhan.',
  ARRAY['SQL','Python','Tableau','Statistics','A/B Testing'],
  NULL, 'published', 29, '2026-06-30T09:45:00Z'
),
-- FT8 — Data: Data Science
(
  gen_random_uuid(),
  'Data Scientist (Python) — Remote, Payments',
  'Xendit', '🟪', 'Wellfound', 'data', 'Full-Time',
  360000000, 560000000, 'IDR', 'Remote Asia', true,
  'https://wellfound.com/jobs/data-scientist-python-xendit',
  'advanced',
  'Membangun model machine learning untuk deteksi fraud dan credit scoring pada platform pembayaran. Dari eksplorasi data hingga deployment model di produksi.',
  ARRAY['Python','Machine Learning','Pandas','SQL','scikit-learn'],
  NULL, 'published', 35, '2026-06-28T16:10:00Z'
),

-- =========================== CONTRACT (5) ===================================

-- C1 — Web Dev
(
  gen_random_uuid(),
  'Rebuild Website Perusahaan dengan Next.js (Kontrak 3 Bulan)',
  'Warung Pintar', '🏪', 'Upwork', 'web-dev', 'Contract',
  25000000, 45000000, 'IDR', 'Remote Indonesia', true,
  'https://www.upwork.com/jobs/nextjs-company-website-rebuild',
  'advanced',
  'Membangun ulang website korporat dengan Next.js dan CMS headless untuk startup retail tech. Termasuk migrasi konten lama, optimasi SEO, dan integrasi analitik.',
  ARRAY['Next.js','TypeScript','Headless CMS','SEO','Vercel'],
  12, 'published', 14, '2026-06-29T10:25:00Z'
),
-- C2 — Web Dev
(
  gen_random_uuid(),
  'Headless Shopify Storefront + React (Kontrak 4 Bulan)',
  'Sociolla', '💄', 'Upwork', 'web-dev', 'Contract',
  8000, 14000, 'USD', 'Remote', true,
  'https://www.upwork.com/jobs/headless-shopify-react-storefront',
  'advanced',
  'Mengembangkan storefront headless dengan Shopify Storefront API dan React/Next.js untuk brand beauty. Fokus pada kecepatan, SEO, dan UX checkout yang mulus.',
  ARRAY['Next.js','Shopify','GraphQL','React','Performance'],
  16, 'published', 9, '2026-06-27T12:50:00Z'
),
-- C3 — Design
(
  gen_random_uuid(),
  'UI/UX SaaS Dashboard End-to-End (Kontrak 3 Bulan)',
  'Mekari', '💼', 'Sribulancer', 'design', 'Contract',
  22000000, 38000000, 'IDR', 'Remote Indonesia', true,
  'https://www.sribulancer.com/id/jobs/saas-dashboard-uiux-contract',
  'advanced',
  'Mendesain ulang dashboard produk SaaS akuntansi dari riset pengguna hingga handoff developer. Termasuk design system, prototype interaktif, dan dokumentasi komponen.',
  ARRAY['Figma','Design System','Dashboard','UX Research'],
  12, 'published', 11, '2026-06-26T15:35:00Z'
),
-- C4 — Design
(
  gen_random_uuid(),
  'Desain System Aplikasi Mobile (Kontrak 5 Bulan)',
  'LinkAja', '🔗', 'Projects.co.id', 'design', 'Contract',
  30000000, 48000000, 'IDR', 'Remote Indonesia', true,
  'https://projects.co.id/jobs/mobile-design-system-contract',
  'intermediate',
  'Membangun design system komprehensif untuk aplikasi mobile e-wallet: komponen reusable, token warna/typography, dan panduan penggunaan untuk seluruh tim produk.',
  ARRAY['Figma','Design System','Mobile UI','Design Tokens'],
  20, 'published', 8, '2026-06-30T13:15:00Z'
),
-- C5 — Writing
(
  gen_random_uuid(),
  'Penulis Konten Blog B2B Tech — Retainer 6 Bulan',
  'Mekari', '💼', 'Sribulancer', 'writing', 'Contract',
  18000000, 30000000, 'IDR', 'Remote Indonesia', true,
  'https://www.sribulancer.com/id/jobs/b2b-tech-blog-writer-retainer',
  'intermediate',
  'Menulis 8–12 artikel blog B2B per bulan seputar produktivitas, HR, dan pajak bisnis. Termasuk riset keyword, outline, dan revisi berdasarkan feedback editor.',
  ARRAY['Content Writing','SEO','B2B Writing','Research'],
  24, 'published', 18, '2026-06-28T11:40:00Z'
),

-- =========================== FREELANCE (10) ================================

-- F1 — Projects.co.id
(
  gen_random_uuid(),
  'Bikin Landing Page Startup Edtech (1 Halaman)',
  'SkillPath', '📚', 'Projects.co.id', 'web-dev', 'Freelance',
  4000000, 9000000, 'IDR', 'Remote Indonesia', true,
  'https://projects.co.id/jobs/landing-page-edtech-startup',
  'intermediate',
  'Butuh landing page high-converting satu halaman untuk kursus online. Desain harus mobile-first, cepat, dan terintegrasi form pendaftaran serta payment link.',
  ARRAY['Next.js','Tailwind CSS','Landing Page','Figma'],
  2, 'published', 16, '2026-06-30T08:10:00Z'
),
-- F2 — Projects.co.id
(
  gen_random_uuid(),
  'Desain Logo + Brand Kit untuk UMKM Kuliner',
  'Warteg Bahari', '🍜', 'Projects.co.id', 'design', 'Freelance',
  2000000, 5000000, 'IDR', 'Remote Indonesia', true,
  'https://projects.co.id/jobs/logo-brand-kit-umkm-kuliner',
  'beginner',
  'Mencari desainer untuk membuat logo, color palette, typography, dan template Instagram untuk brand kuliner lokal. Brief lengkap dan referensi sudah disiapkan.',
  ARRAY['Illustrator','Logo Design','Branding','Photoshop'],
  2, 'published', 21, '2026-06-29T17:00:00Z'
),
-- F3 — Projects.co.id
(
  gen_random_uuid(),
  'Data Entry & Enrichment Database Prospek (Excel)',
  'Komerce', '🛒', 'Projects.co.id', 'data', 'Freelance',
  3000000, 6000000, 'IDR', 'Remote Indonesia', true,
  'https://projects.co.id/jobs/data-entry-enrichment-prospek',
  'beginner',
  'Membersihkan dan memperkaya database prospek dari berbagai sumber ke Excel/Google Sheets. Tugas meliputi deduplikasi, validasi kontak, dan kategorisasi industri.',
  ARRAY['Excel','Google Sheets','Data Entry','Attention to Detail'],
  3, 'published', 12, '2026-06-24T14:25:00Z'
),
-- F4 — Sribulancer
(
  gen_random_uuid(),
  'Bikin Toko Online WooCommerce + 20 Produk',
  'Hijab Modern', '🧕', 'Sribulancer', 'web-dev', 'Freelance',
  5000000, 12000000, 'IDR', 'Remote Indonesia', true,
  'https://www.sribulancer.com/id/jobs/toko-online-woocommerce',
  'intermediate',
  'Setup toko online fashion berbasis WooCommerce: tema, kategori, upload 20 produk beserta deskripsi, dan integrasi payment gateway lokal serta ongkir.',
  ARRAY['WordPress','WooCommerce','PHP','SEO'],
  3, 'published', 19, '2026-06-27T09:30:00Z'
),
-- F5 — Sribulancer
(
  gen_random_uuid(),
  'Redesain UI Aplikasi Mobile — 8 Layar',
  'FitAja', '🏃', 'Sribulancer', 'design', 'Freelance',
  6000000, 11000000, 'IDR', 'Remote Indonesia', true,
  'https://www.sribulancer.com/id/jobs/redesain-ui-mobile-app',
  'intermediate',
  'Mendesain ulang 8 layar utama aplikasi kesehatan mobile agar lebih modern dan mudah dipakai. Wireframe kasar tersedia, butuh mockup high-fidelity di Figma.',
  ARRAY['Figma','Mobile UI','UX','Prototyping'],
  3, 'published', 13, '2026-06-25T16:45:00Z'
),
-- F6 — Sribulancer
(
  gen_random_uuid(),
  'Ghostwriter Ebook Digital Marketing (60 Halaman)',
  'Penerbit Cerdas', '📖', 'Sribulancer', 'writing', 'Freelance',
  4000000, 8000000, 'IDR', 'Remote Indonesia', true,
  'https://www.sribulancer.com/id/jobs/ghostwriter-ebook-marketing',
  'intermediate',
  'Menulis ebook 60 halaman tentang strategi digital marketing untuk UMKM. Outline lengkap disediakan, gaya bahasa praktis dan mudah dipahami pemilik bisnis.',
  ARRAY['Content Writing','Ebook','Research','Copywriting'],
  4, 'published', 10, '2026-06-30T19:20:00Z'
),
-- F7 — Fastwork
(
  gen_random_uuid(),
  'Kelola Instagram + TikTok Brand F&B (Bulanan)',
  'Kopi Senja', '☕', 'Fastwork', 'marketing', 'Freelance',
  3000000, 7000000, 'IDR', 'Remote Indonesia', true,
  'https://www.fastwork.id/services/kelola-instagram-tiktok-fnb',
  'intermediate',
  'Mengelola konten harian Instagram dan TikTok untuk brand kopi: content plan, copy caption, hingga analisis performa. Brief brand dan aset foto sudah tersedia.',
  ARRAY['Instagram','TikTok','Content Strategy','Copywriting'],
  4, 'published', 17, '2026-06-28T18:00:00Z'
),
-- F8 — Fastwork
(
  gen_random_uuid(),
  'Video Editor YouTube & Reels (Mingguan)',
  'Tech Review ID', '🎬', 'Fastwork', 'video', 'Freelance',
  2500000, 5000000, 'IDR', 'Remote Indonesia', true,
  'https://www.fastwork.id/services/video-editor-youtube-reels',
  'intermediate',
  'Mengedit 2 video YouTube panjang + 4 reels per minggu untuk channel review teknologi. Termasuk cut, color grading, subtitle, dan motion graphics sederhana.',
  ARRAY['Premiere Pro','After Effects','Color Grading','CapCut'],
  4, 'published', 22, '2026-06-26T20:15:00Z'
),
-- F9 — 99designs
(
  gen_random_uuid(),
  'Desain Logo + Identitas Visual (Contest)',
  'Nova Coffee', '🫘', '99designs', 'design', 'Freelance',
  500, 1500, 'USD', 'Remote', true,
  'https://99designs.com/logo-design/contests/nova-coffee-brand',
  'intermediate',
  'Kompetisi desain logo dan identitas visual untuk brand kopi specialty. Cari konsep yang hangat, modern, dan fleksibel untuk kemasan serta media sosial.',
  ARRAY['Illustrator','Logo Design','Branding','Photoshop'],
  2, 'published', 28, '2026-06-29T07:40:00Z'
),
-- F10 — 99designs
(
  gen_random_uuid(),
  'Desain Kemasan Produk Skincare (Packaging)',
  'Glow Labs', '🧴', '99designs', 'design', 'Freelance',
  800, 2000, 'USD', 'Remote', true,
  'https://99designs.com/packaging-design/contests/glow-labs-skincare',
  'advanced',
  'Mendesain kemasan box dan label botol untuk lini skincare baru. Butuh konsep premium, ramah lingkungan, dan siap produksi dengan spesifikasi cetak yang tepat.',
  ARRAY['Illustrator','Packaging Design','Photoshop','Branding'],
  3, 'published', 15, '2026-06-24T10:30:00Z'
),

-- =========================== PART-TIME (4) ==================================

-- PT1 — Social Media
(
  gen_random_uuid(),
  'Social Media Specialist (Part-Time, Remote)',
  'Blibli', '🟩', 'Kalibrr', 'marketing', 'Part-Time',
  4500000, 7500000, 'IDR', 'Remote Indonesia', true,
  'https://www.kalibrr.com/c/blibli/jobs/social-media-specialist-parttime',
  'intermediate',
  'Mengelola akun media sosial e-commerce secara part-time (~20 jam/minggu): buat konten, jadwal posting, dan lapor performa. Bekerja sama tim kreatif dan konten.',
  ARRAY['Instagram','Content Strategy','Copywriting','Analytics'],
  12, 'published', 24, '2026-06-27T15:00:00Z'
),
-- PT2 — Social Media
(
  gen_random_uuid(),
  'Social Media Manager Instagram (Part-Time)',
  'Sociolla', '💄', 'LinkedIn', 'marketing', 'Part-Time',
  5000000, 9000000, 'IDR', 'Remote Indonesia', true,
  'https://www.linkedin.com/jobs/view/social-media-manager-parttime-sociolla',
  'intermediate',
  'Memimpin strategi konten Instagram brand beauty secara part-time. Termasuk content calendar, engagement komunitas, dan kolaborasi dengan influencer mikro.',
  ARRAY['Instagram','Influencer Marketing','Content Strategy','Analytics'],
  12, 'published', 20, '2026-06-30T11:55:00Z'
),
-- PT3 — Virtual Assistant
(
  gen_random_uuid(),
  'Virtual Assistant Founder Startup (Part-Time)',
  'ALAMI', '🌱', 'Kalibrr', 'writing', 'Part-Time',
  3000000, 5000000, 'IDR', 'Remote Indonesia', true,
  'https://www.kalibrr.com/c/alamisharia/jobs/virtual-assistant-parttime',
  'beginner',
  'Mendukung founder startup fintech: kelola jadwal, draf email, riset ringan, dan urus administrasi dokumen. Butuh komunikasi rapi dan teliti dengan tenggat.',
  ARRAY['Email','Google Workspace','Scheduling','Organisasi'],
  12, 'published', 18, '2026-06-25T09:10:00Z'
),
-- PT4 — Customer Support
(
  gen_random_uuid(),
  'Customer Support Chat & Email (Part-Time)',
  'SiCepat Ekspres', '📦', 'Kalibrr', 'writing', 'Part-Time',
  3500000, 6000000, 'IDR', 'Remote Indonesia', true,
  'https://www.kalibrr.com/c/sicepat/jobs/customer-support-parttime',
  'beginner',
  'Menangani pertanyaan dan keluhan pelanggan via chat dan email secara part-time (shift). Pencarian solusi cepat, empati, dan dokumentasi tiket yang rapi.',
  ARRAY['Customer Service','Komunikasi','Chat','Problem Solving'],
  12, 'published', 26, '2026-06-28T07:25:00Z'
),

-- =========================== INTERNSHIP (3) ================================

-- I1 — Tech
(
  gen_random_uuid(),
  'Software Engineering Intern — React (Magang Remote)',
  'Stockbit', '📈', 'Kalibrr', 'web-dev', 'Internship',
  3500000, 5000000, 'IDR', 'Remote Indonesia', true,
  'https://www.kalibrr.com/c/stockbit/jobs/software-engineering-intern-react',
  'beginner',
  'Magang 3 bulan di tim engineering aplikasi investasi. Belajar membangun komponen React, menulis unit test, dan berkontribusi pada fitur nyata bersama mentor.',
  ARRAY['React','JavaScript','Git','TypeScript'],
  12, 'published', 33, '2026-06-29T13:05:00Z'
),
-- I2 — Design
(
  gen_random_uuid(),
  'UI/UX Design Intern — Magang Remote',
  'Pinhome', '🏠', 'Kalibrr', 'design', 'Internship',
  3000000, 4500000, 'IDR', 'Remote Indonesia', true,
  'https://www.kalibrr.com/c/pinhome/jobs/uiux-design-intern',
  'beginner',
  'Magang desain 3 bulan: dukung tim produk membuat mockup, ikut riset pengguna, dan bangun portofolio nyata. Cocok untuk mahasiswa semester akhir atau fresh graduate.',
  ARRAY['Figma','UI Design','Wireframing','UX'],
  12, 'published', 29, '2026-06-24T16:40:00Z'
),
-- I3 — Marketing
(
  gen_random_uuid(),
  'Digital Marketing Intern — Magang Remote',
  'Sayurbox', '🥬', 'Kalibrr', 'marketing', 'Internship',
  2500000, 4000000, 'IDR', 'Remote Indonesia', true,
  'https://www.kalibrr.com/c/sayurbox/jobs/digital-marketing-intern',
  'beginner',
  'Magang 3 bulan di tim marketing startup agrokomersial. Bantu riset konten, kelola media sosial, dan analisis kampanye sambil belajar growth marketing dari praktisi.',
  ARRAY['Social Media','Content','Canva','Analytics'],
  12, 'published', 36, '2026-06-30T15:20:00Z'
)

ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =============================================================================
-- RINGKASAN (total 30 gig)
-- =============================================================================
-- Per Job Type:
--   Full-Time  : 8   web-dev:2 | design:2 | marketing:2 | data:2
--   Contract   : 5   web-dev:2 | design:2 | writing:1
--   Freelance  : 10  web-dev:2 | design:4 | data:1 | writing:1 | marketing:1 | video:1
--   Part-Time  : 4   marketing:2 | writing:2
--   Internship : 3   web-dev:1 | design:1 | marketing:1
--
-- Per Kategori:  web-dev:7 | design:9 | marketing:6 | writing:4 | data:3 | video:1
--
-- Per Mata Uang:  IDR:23 | USD:7  (USD = FT1, FT2, FT4, FT6, C2, F9, F10)
--
-- Per Platform:  Kalibrr:7 | Sribulancer:5 | Projects.co.id:4 | Wellfound:3 |
--                LinkedIn:3 | We Work Remotely:2 | Upwork:2 | Fastwork:2 | 99designs:2
-- =============================================================================
