-- =============================================================================
-- seed-courses-real.sql
-- Seed 30 kursus REAL dari platform terpercaya untuk SkillGig.id (/learn)
--
-- Distribusi (30 total):
--   GLOBAL (20)
--     Coursera        : 5  (Google Career Certificates)
--     Udemy           : 5  (React, Python, Figma, Digital Marketing, Premiere)
--     edX             : 5  (MIT, CS50, Data Science, AI, Web Dev)
--     LinkedIn Learning: 5 (Excel, SEO, Canva, Copywriting, Leadership)
--   LOKAL (10)
--     Dicoding        : 4  (Web, React, ML, Android)
--     BuildWith Angga : 3  (Design System, Laravel REST API, Flutter)
--     Codepolitan     : 3  (JavaScript, Laravel, Tailwind)
--
-- Catatan skema:
--   * Kolom status BELUM ada di tabel courses (hanya gigs punya, lihat
--     migrasi 007). Ditambahkan di bawah secara idempoten (ADD COLUMN IF NOT
--     EXISTS) persis seperti pola di seed-gigs-real.sql.
--   * Kolom skills[] ditambahkan supaya kartu di /learn tidak kosong
--     (UI membaca skillsTaught via mapCourseRow).
--   * IDEMPOTENSI: id PAKAI prefix '33333333' (BUKAN gen_random_uuid) supaya
--     DELETE di bawah benar-benar membersihkan seed lama saat file di-rerun.
--     (Random UUID tidak akan cocok dengan LIKE '33333333%', sehingga re-run
--      akan menduplikasi data — itulah celah di file gig. Di sini dihindari.)
--   * File ini TIDAK dieksekusi otomatis — jalankan manual di Supabase SQL
--     editor. Aman di-rerun.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Pastikan kolom yang dibutuhkan seed ini ada (idempoten, aman di-rerun).
--    Hanya `status` yang belum ada di tabel courses; sisanya sudah ada sejak
--    migrasi 001/002/007/013.
-- -----------------------------------------------------------------------------
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- -----------------------------------------------------------------------------
-- 2. Hapus semua course seed lama.
-- -----------------------------------------------------------------------------
DELETE FROM courses WHERE id LIKE '33333333%';

-- -----------------------------------------------------------------------------
-- 3. Insert 30 kursus real.
--    Kolom: id, title, platform, category, price, url, thumbnail, rating,
--           students, level, duration_hours, status, featured, affiliate_url,
--           skills, created_at
-- -----------------------------------------------------------------------------
INSERT INTO courses (
  id, title, platform, category, price, url, thumbnail, rating, students,
  level, duration_hours, status, featured, affiliate_url, skills, created_at
) VALUES

-- ============================ COURSERA (5) ==================================
-- Google Career Certificates — langganan ~Rp 500rb/bln (seuai brief).

-- C1 — Google IT Support
(
  '33333333-0000-0000-0000-000000000001',
  'Google IT Support Professional Certificate',
  'Coursera', 'tech', 500000,
  'https://www.coursera.org/professional-certificates/google-it-support',
  '💻', 4.8, 1900000, 'beginner', 150, 'published', false, NULL,
  ARRAY['IT Support','Networking','Operating Systems','System Administration','Security'],
  '2026-06-28T09:15:00Z'
),

-- C2 — Google Data Analytics  ★ FEATURED (data)
(
  '33333333-0000-0000-0000-000000000002',
  'Google Data Analytics Professional Certificate',
  'Coursera', 'data', 500000,
  'https://www.coursera.org/professional-certificates/google-data-analytics',
  '📊', 4.8, 2100000, 'beginner', 180, 'published', true, NULL,
  ARRAY['Data Analysis','SQL','R Programming','Tableau','Spreadsheets'],
  '2026-06-15T11:00:00Z'
),

-- C3 — Google UX Design  ★ FEATURED (design)
(
  '33333333-0000-0000-0000-000000000003',
  'Google UX Design Professional Certificate',
  'Coursera', 'design', 500000,
  'https://www.coursera.org/professional-certificates/google-ux-design',
  '🎨', 4.8, 1100000, 'beginner', 180, 'published', true, NULL,
  ARRAY['UX Design','Wireframing','Prototyping','Figma','User Research'],
  '2026-06-10T13:30:00Z'
),

-- C4 — Google Project Management  (kategori 'tech' — soft-skill, lihat header)
(
  '33333333-0000-0000-0000-000000000004',
  'Google Project Management Professional Certificate',
  'Coursera', 'tech', 500000,
  'https://www.coursera.org/professional-certificates/google-project-management',
  '📋', 4.8, 1700000, 'beginner', 150, 'published', false, NULL,
  ARRAY['Project Management','Agile','Scrum','Stakeholder Management','Risk'],
  '2026-05-28T08:45:00Z'
),

-- C5 — Google Cybersecurity
(
  '33333333-0000-0000-0000-000000000005',
  'Google Cybersecurity Professional Certificate',
  'Coursera', 'tech', 500000,
  'https://www.coursera.org/professional-certificates/google-cybersecurity',
  '🔐', 4.8, 900000, 'beginner', 160, 'published', false, NULL,
  ARRAY['Cybersecurity','Linux','Python','Network Security','SIEM'],
  '2026-06-22T10:20:00Z'
),

-- ============================== UDEMY (5) ===================================
-- Harga diskon Rp 150rb–350rb.

-- U1 — React (Jonas Schmedtmann)
(
  '33333333-0000-0000-0000-000000000006',
  'The Ultimate React Course (with Redux, Router & Hooks)',
  'Udemy', 'tech', 199000,
  'https://www.udemy.com/course/the-ultimate-react-course/',
  '⚛️', 4.7, 250000, 'intermediate', 68, 'published', false, NULL,
  ARRAY['React','JavaScript','Redux','Hooks','Next.js'],
  '2026-06-26T14:05:00Z'
),

-- U2 — Python Bootcamp (Angela Yu)
(
  '33333333-0000-0000-0000-000000000007',
  '100 Days of Code: The Complete Python Pro Bootcamp',
  'Udemy', 'tech', 199000,
  'https://www.udemy.com/course/100-days-of-code/',
  '🐍', 4.7, 350000, 'beginner', 64, 'published', false, NULL,
  ARRAY['Python','Automation','Web Scraping','Flask','APIs'],
  '2026-06-18T16:40:00Z'
),

-- U3 — Figma UI/UX (Daniel Walter Scott)
(
  '33333333-0000-0000-0000-000000000008',
  'Figma UI UX Design Essentials',
  'Udemy', 'design', 179000,
  'https://www.udemy.com/course/figma-essentials/',
  '🖌️', 4.6, 120000, 'beginner', 18, 'published', false, NULL,
  ARRAY['Figma','UI Design','Prototyping','Auto Layout','Design Systems'],
  '2026-06-12T12:15:00Z'
),

-- U4 — Digital Marketing  ★ FEATURED (marketing)
(
  '33333333-0000-0000-0000-000000000009',
  'The Complete Digital Marketing Course — 12 Courses in 1',
  'Udemy', 'marketing', 199000,
  'https://www.udemy.com/course/learn-digital-marketing-course/',
  '📈', 4.5, 900000, 'beginner', 23, 'published', true, NULL,
  ARRAY['SEO','Google Ads','Social Media','Email Marketing','Analytics'],
  '2026-06-20T15:50:00Z'
),

-- U5 — Adobe Premiere Pro  ★ FEATURED (video)
(
  '33333333-0000-0000-0000-000000000010',
  'Adobe Premiere Pro CC: Video Editing for Beginners',
  'Udemy', 'video', 199000,
  'https://www.udemy.com/course/adobe-premiere-pro-video-editing/',
  '🎬', 4.6, 180000, 'beginner', 18, 'published', true, NULL,
  ARRAY['Premiere Pro','Video Editing','Color Grading','Transitions','Audio'],
  '2026-06-24T18:30:00Z'
),

-- =============================== edX (5) ====================================
-- Gratis (audit track).

-- E1 — MIT 6.00.1x
(
  '33333333-0000-0000-0000-000000000011',
  'Introduction to Computer Science and Programming Using Python (MIT 6.00.1x)',
  'edX', 'tech', 0,
  'https://www.edx.org/course/introduction-to-computer-science-and-programming-7',
  '🧠', 4.6, 1900000, 'beginner', 144, 'published', false, NULL,
  ARRAY['Python','Computer Science','Algorithms','Computation','Data Structures'],
  '2026-06-08T07:30:00Z'
),

-- E2 — Harvard CS50  ★ FEATURED (tech)
(
  '33333333-0000-0000-0000-000000000012',
  'CS50''s Introduction to Computer Science (Harvard)',
  'edX', 'tech', 0,
  'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
  '💡', 4.8, 4000000, 'beginner', 180, 'published', true, NULL,
  ARRAY['C','Computer Science','Algorithms','Data Structures','Web Development'],
  '2026-06-05T06:00:00Z'
),

-- E3 — Python for Data Science (IBM)
(
  '33333333-0000-0000-0000-000000000013',
  'Python for Data Science (IBM)',
  'edX', 'data', 0,
  'https://www.edx.org/course/python-data-science-2',
  '📉', 4.5, 500000, 'beginner', 40, 'published', false, NULL,
  ARRAY['Python','Data Science','Pandas','NumPy','Visualization'],
  '2026-06-14T09:45:00Z'
),

-- E4 — Artificial Intelligence (Columbia)
--   NOTE: "AI for Everyone" (Andrew Ng) hanya ada di Coursera, bukan edX.
--   Disubstitusi dengan kursus AI asli di edX dari Columbia University agar
--   URL tetap resmi & valid di platform edX.
(
  '33333333-0000-0000-0000-000000000014',
  'Artificial Intelligence (AI) — Columbia University',
  'edX', 'data', 0,
  'https://www.edx.org/course/artificial-intelligence-ai',
  '🤖', 4.5, 300000, 'intermediate', 96, 'published', false, NULL,
  ARRAY['Artificial Intelligence','Machine Learning','Search Algorithms','Logic','Planning'],
  '2026-06-02T10:10:00Z'
),

-- E5 — CS50W Web Programming (Harvard)
(
  '33333333-0000-0000-0000-000000000015',
  'CS50''s Web Programming with Python and JavaScript (Harvard)',
  'edX', 'tech', 0,
  'https://www.edx.org/course/cs50s-web-programming-with-python-and-javascript',
  '🌐', 4.7, 400000, 'intermediate', 144, 'published', false, NULL,
  ARRAY['Django','JavaScript','React','APIs','Git'],
  '2026-05-30T11:25:00Z'
),

-- ========================= LINKEDIN LEARNING (5) ============================
-- Gratis (free trial / akses via perpustakaan).

-- L1 — Excel Essential Training
(
  '33333333-0000-0000-0000-000000000016',
  'Excel Essential Training (Microsoft 365)',
  'LinkedIn Learning', 'data', 0,
  'https://www.linkedin.com/learning/excel-essential-training-microsoft-365',
  '📑', 4.7, 1000000, 'beginner', 6, 'published', false, NULL,
  ARRAY['Excel','Spreadsheets','Formulas','Pivot Tables','Data Analysis'],
  '2026-06-21T08:00:00Z'
),

-- L2 — SEO Foundations
(
  '33333333-0000-0000-0000-000000000017',
  'SEO Foundations',
  'LinkedIn Learning', 'marketing', 0,
  'https://www.linkedin.com/learning/seo-foundations',
  '🔍', 4.6, 300000, 'beginner', 4, 'published', false, NULL,
  ARRAY['SEO','Keyword Research','Link Building','On-page SEO','Analytics'],
  '2026-06-17T13:20:00Z'
),

-- L3 — Canva Essential Training
(
  '33333333-0000-0000-0000-000000000018',
  'Canva Essential Training',
  'LinkedIn Learning', 'design', 0,
  'https://www.linkedin.com/learning/canva-essential-training',
  '🖼️', 4.6, 150000, 'beginner', 3, 'published', false, NULL,
  ARRAY['Canva','Graphic Design','Social Media Graphics','Branding','Typography'],
  '2026-06-13T14:35:00Z'
),

-- L4 — Copywriting for Social Media  ★ FEATURED (writing)
(
  '33333333-0000-0000-0000-000000000019',
  'Copywriting for Social Media',
  'LinkedIn Learning', 'writing', 0,
  'https://www.linkedin.com/learning/copywriting-for-social-media',
  '✍️', 4.5, 90000, 'beginner', 2, 'published', true, NULL,
  ARRAY['Copywriting','Social Media','Content Writing','Brand Voice','Persuasion'],
  '2026-06-19T16:50:00Z'
),

-- L5 — Leadership Foundations  (kategori 'marketing' — soft-skill, lihat header)
(
  '33333333-0000-0000-0000-000000000020',
  'Leadership Foundations',
  'LinkedIn Learning', 'marketing', 0,
  'https://www.linkedin.com/learning/leadership-foundations',
  '🧭', 4.6, 80000, 'beginner', 1, 'published', false, NULL,
  ARRAY['Leadership','Management','Communication','Team Building','Strategy'],
  '2026-06-27T10:30:00Z'
),

-- ============================= DICODING (4) ================================
-- ID akademi di URL sesuai format resmi dicoding.com/academies/<id>.
-- NOTE: verifikasi kembali ID akademi terhadap katalog live sebelum produksi
-- (ID bisa berubah). Academy 123 (Dasar Pemrograman Web) sudah stabil.

-- D1 — Belajar Dasar Pemrograman Web (GRATIS)
(
  '33333333-0000-0000-0000-000000000021',
  'Belajar Dasar Pemrograman Web',
  'Dicoding', 'tech', 0,
  'https://www.dicoding.com/academies/123',
  '🌐', 4.9, 300000, 'beginner', 45, 'published', false, NULL,
  ARRAY['HTML','CSS','JavaScript','Responsive Web','Git'],
  '2026-06-23T07:45:00Z'
),

-- D2 — Belajar Fundamental Front-End (React) — berbayar
(
  '33333333-0000-0000-0000-000000000022',
  'Belajar Fundamental Front-End Web Development (React)',
  'Dicoding', 'tech', 450000,
  'https://www.dicoding.com/academies/214',
  '⚛️', 4.8, 60000, 'intermediate', 60, 'published', false, NULL,
  ARRAY['React','JavaScript','Web Components','State Management','Testing'],
  '2026-06-16T09:00:00Z'
),

-- D3 — Machine Learning Terapan — berbayar
(
  '33333333-0000-0000-0000-000000000023',
  'Machine Learning Terapan',
  'Dicoding', 'data', 450000,
  'https://www.dicoding.com/academies/185',
  '🤖', 4.8, 80000, 'advanced', 70, 'published', false, NULL,
  ARRAY['Machine Learning','TensorFlow','Python','Data Science','Model Deployment'],
  '2026-06-11T12:40:00Z'
),

-- D4 — Belajar Membuat Aplikasi Android — berbayar
(
  '33333333-0000-0000-0000-000000000024',
  'Belajar Membuat Aplikasi Android untuk Pemula',
  'Dicoding', 'tech', 450000,
  'https://www.dicoding.com/academies/155',
  '📱', 4.8, 150000, 'beginner', 50, 'published', false, NULL,
  ARRAY['Android','Kotlin','Java','UI Design','Mobile Development'],
  '2026-06-07T14:25:00Z'
),

-- ========================= BUILDBITH ANGGA (3) =============================
-- Slug di URL sesuai format resmi buildwithangga.com/courses/<slug>.
-- NOTE: verifikasi slug terhadap katalog live sebelum produksi.

-- BW1 — UI/UX Design System
(
  '33333333-0000-0000-0000-000000000025',
  'Mastering UI/UX Design System',
  'BuildWith Angga', 'design', 450000,
  'https://buildwithangga.com/courses/ui-ux-design-system',
  '🎨', 4.8, 12000, 'intermediate', 40, 'published', false, NULL,
  ARRAY['UI Design','Design System','Figma','Typography','Components'],
  '2026-06-25T15:10:00Z'
),

-- BW2 — Laravel 10 REST API
(
  '33333333-0000-0000-0000-000000000026',
  'Laravel 10 REST API — Build Modern Backend',
  'BuildWith Angga', 'tech', 450000,
  'https://buildwithangga.com/courses/laravel-restful-api',
  '🔧', 4.7, 15000, 'intermediate', 35, 'published', false, NULL,
  ARRAY['Laravel','PHP','REST API','MySQL','Authentication'],
  '2026-06-20T11:30:00Z'
),

-- BW3 — Flutter Fundamental
(
  '33333333-0000-0000-0000-000000000027',
  'Flutter Fundamental — Cross-Platform Mobile Apps',
  'BuildWith Angga', 'tech', 450000,
  'https://buildwithangga.com/courses/flutter-fundamental',
  '🦋', 4.7, 18000, 'intermediate', 38, 'published', false, NULL,
  ARRAY['Flutter','Dart','Mobile Development','Widgets','Firebase'],
  '2026-06-18T13:55:00Z'
),

-- =========================== CODEPOLITAN (3) ===============================
-- Slug di URL sesuai format resmi codepolitan.com/courses/<slug>.
-- NOTE: verifikasi slug terhadap katalog live sebelum produksi.

-- CP1 — JavaScript Fundamental
(
  '33333333-0000-0000-0000-000000000028',
  'JavaScript Fundamental',
  'Codepolitan', 'tech', 350000,
  'https://www.codepolitan.com/courses/intro-to-javascript',
  '⚙️', 4.6, 25000, 'beginner', 30, 'published', false, NULL,
  ARRAY['JavaScript','DOM','ES6','Asynchronous','Debugging'],
  '2026-06-24T08:20:00Z'
),

-- CP2 — PHP Laravel
(
  '33333333-0000-0000-0000-000000000029',
  'PHP Laravel untuk Pemula',
  'Codepolitan', 'tech', 350000,
  'https://www.codepolitan.com/courses/intro-to-laravel',
  '🐘', 4.6, 22000, 'beginner', 35, 'published', false, NULL,
  ARRAY['PHP','Laravel','MVC','MySQL','Blade'],
  '2026-06-22T10:15:00Z'
),

-- CP3 — Tailwind CSS
(
  '33333333-0000-0000-0000-000000000030',
  'Tailwind CSS Modern — Utility-First Styling',
  'Codepolitan', 'design', 350000,
  'https://www.codepolitan.com/courses/intro-to-tailwind',
  '🎯', 4.7, 18000, 'beginner', 20, 'published', false, NULL,
  ARRAY['Tailwind CSS','CSS','Responsive Design','Utility-First','Frontend'],
  '2026-06-19T14:00:00Z'
);

COMMIT;

-- =============================================================================
-- 4. Ringkasan verifikasi (jalankan opsional di SQL editor).
-- =============================================================================
-- SELECT platform, COUNT(*) AS courses
-- FROM   courses
-- WHERE  id LIKE '33333333%'
-- GROUP  BY platform
-- ORDER  BY platform;
--
-- SELECT category, COUNT(*) AS courses
-- FROM   courses
-- WHERE  id LIKE '33333333%'
-- GROUP  BY category
-- ORDER  BY category;
--
-- SELECT COUNT(*) FILTER (WHERE featured)        AS featured_count,
--        COUNT(*) FILTER (WHERE price = 0)       AS free_count,
--        COUNT(*) FILTER (WHERE price > 0)       AS paid_count,
--        COUNT(*)                                 AS total
-- FROM   courses
-- WHERE  id LIKE '33333333%';
