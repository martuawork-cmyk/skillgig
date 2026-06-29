-- ============================================================================
-- SkillGig.id — Seed data (Phase 2.5 migration)
-- ============================================================================
-- Run AFTER 002_extend.sql. Inserts the mock dataset used by the UI into the
-- 4 catalog tables.
--
-- Re-runnable thanks to deterministic UUIDs (idempotent on PK).
-- ============================================================================

-- ----- skills (insert before users, gigs reference skills indirectly) -------
INSERT INTO skills (id, name, category, icon, recommended) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Next.js',           'web-dev',  '⚛️', false),
  ('11111111-1111-1111-1111-111111111102', 'TypeScript',        'web-dev',  '🔷', false),
  ('11111111-1111-1111-1111-111111111103', 'Tailwind CSS',      'web-dev',  '🎨', false),
  ('11111111-1111-1111-1111-111111111104', 'Figma',             'design',   '🖌️', false),
  ('11111111-1111-1111-1111-111111111105', 'PostgreSQL',        'data',     '🐘', false),
  ('11111111-1111-1111-1111-111111111106', 'Content Writing',   'writing',  '✍️', false),
  ('11111111-1111-1111-1111-111111111107', 'SEO',               'marketing','📈', false),
  ('11111111-1111-1111-1111-111111111108', 'Python',            'data',     '🐍', false),
  -- Recommended skills
  ('11111111-1111-1111-1111-111111111201', 'React Server Components', 'web-dev',  '⚛️', true),
  ('11111111-1111-1111-1111-111111111202', 'Docker',                'web-dev',  '🐳', true),
  ('11111111-1111-1111-1111-111111111203', 'GraphQL',               'data',     '🔗', true)
ON CONFLICT (id) DO NOTHING;

-- ----- users --------------------------------------------------------------
INSERT INTO users (id, name, initials, role, rating, completed_gigs, bio, skills, location) VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    'Andika Pratama', 'AP', 'client',
    4.8, 12,
    'Founder startup fintech. Sering hire freelancer untuk UI/UX dan landing page.',
    ARRAY[]::text[], 'Jakarta'
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Sari Wulandari', 'SW', 'freelancer',
    4.9, 23,
    'Full-stack developer, fokus di Next.js dan TypeScript. Suka bersih-bersih kode.',
    ARRAY['Next.js', 'TypeScript', 'React', 'Tailwind CSS', 'PostgreSQL'],
    'Bandung'
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'Budi Santoso', 'BS', 'freelancer',
    4.7, 18,
    'UI/UX designer dengan 5 tahun pengalaman di e-commerce dan SaaS.',
    ARRAY['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design System'],
    'Yogyakarta'
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    'Rina Hartati', 'RH', 'freelancer',
    4.8, 31,
    'Content writer & SEO specialist. Pernah menulis untuk Kompas dan Tokopedia.',
    ARRAY['Content Writing', 'SEO', 'Copywriting', 'Blog Writing'],
    'Surabaya'
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    'Reza Hidayat', 'RH', 'freelancer',
    4.6, 14,
    'Data analyst, biasa pakai Python dan SQL. Tertarik di visualisasi data.',
    ARRAY['Python', 'SQL', 'Tableau', 'Data Visualization', 'Pandas'],
    'Jakarta'
  ),
  (
    '22222222-2222-2222-2222-222222222206',
    'Maya Kusuma', 'MK', 'freelancer',
    4.9, 27,
    'Video editor untuk YouTube dan short-form content. Fast turnaround.',
    ARRAY['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Color Grading'],
    'Denpasar'
  )
ON CONFLICT (id) DO NOTHING;

-- ----- courses ------------------------------------------------------------
INSERT INTO courses (
  id, title, platform, category, price, url, thumbnail,
  rating, students, skills, level, duration_hours, enrolled, created_at
) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    'Next.js 14 — Panduan Lengkap',
    'Udemy', 'tech', 250000,
    'https://udemy.com/nextjs-14', '🚀',
    4.7, 24500,
    ARRAY['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    'intermediate', 24, true,
    '2026-04-12T00:00:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    'Dasar-dasar UI/UX Design',
    'Coursera', 'design', 0,
    'https://coursera.org/ui-ux', '🎨',
    4.6, 18200,
    ARRAY['Figma', 'UI Design', 'UX Research'],
    'beginner', 18, true,
    '2026-02-28T00:00:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    'Menguasai SEO Writing',
    'Dicoding', 'marketing', 150000,
    'https://dicoding.com/seo', '✍️',
    4.5, 9800,
    ARRAY['SEO', 'Content Writing', 'Copywriting'],
    'beginner', 8, false,
    '2026-05-10T00:00:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333304',
    'Analisis Data dengan Python',
    'Coursera', 'tech', 350000,
    'https://coursera.org/python-data', '📊',
    4.8, 31200,
    ARRAY['Python', 'Pandas', 'Data Visualization', 'SQL'],
    'intermediate', 32, false,
    '2026-01-15T00:00:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333305',
    'Pola React Lanjutan',
    'Udemy', 'tech', 200000,
    'https://udemy.com/advanced-react', '⚛️',
    4.7, 14800,
    ARRAY['React', 'TypeScript', 'State Management'],
    'advanced', 12, false,
    '2026-06-01T00:00:00Z'
  ),
  (
    '33333333-3333-3333-3333-333333333306',
    'Social Media Marketing 101',
    'YouTube', 'marketing', 0,
    'https://youtube.com/smm-101', '📱',
    4.4, 41500,
    ARRAY['Instagram', 'Content Strategy', 'Analytics'],
    'beginner', 6, false,
    '2026-03-20T00:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;

-- ----- gigs ---------------------------------------------------------------
-- All gigs are posted by Andika Pratama (client u1).
INSERT INTO gigs (
  id, title, platform, category, budget_min, budget_max, url,
  level, description, skills, duration_weeks, applicants_count, created_at
) VALUES
  (
    '44444444-4444-4444-4444-444444444401',
    'Bikin landing page untuk startup fintech',
    'Projects.co.id', 'web-dev', 8000000, 15000000,
    'https://projects.co.id/gigs/g1',
    'intermediate',
    'Kami butuh landing page yang high-converting untuk produk P2P lending baru. Desain bersih, load time cepat, dan mobile-first responsive.',
    ARRAY['Next.js', 'Tailwind CSS', 'Figma'],
    3, 12, '2026-06-25T10:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    'Desain UI aplikasi mobile untuk food delivery',
    'Sribulancer', 'design', 6000000, 12000000,
    'https://sribulancer.com/gigs/g2',
    'intermediate',
    'Mencari desainer untuk membuat UI aplikasi food delivery. Wireframe sudah siap, butuh mockup high-fidelity dan prototype interaktif.',
    ARRAY['Figma', 'Mobile UI', 'Prototyping', 'Design System'],
    4, 8, '2026-06-26T08:30:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444403',
    'Penulisan blog SEO untuk produk SaaS',
    'Projects.co.id', 'writing', 500000, 800000,
    'https://projects.co.id/gigs/g3',
    'beginner',
    'Butuh 10 artikel blog SEO (1500 kata per artikel) untuk SaaS project management kami. Topik dan outline sudah disediakan.',
    ARRAY['SEO', 'Content Writing', 'Blog Writing'],
    4, 23, '2026-06-22T14:15:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444404',
    'Strategi pertumbuhan Instagram untuk brand D2C',
    'Sribulancer', 'marketing', 10000000, 18000000,
    'https://sribulancer.com/gigs/g4',
    'advanced',
    'Brand skincare D2C kami butuh rencana pertumbuhan Instagram 3 bulan. Dicari yang punya track record di niche serupa.',
    ARRAY['Instagram Marketing', 'Content Strategy', 'Analytics'],
    12, 15, '2026-06-20T09:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444405',
    'Bikin analytics dashboard pakai Python',
    'Upwork', 'data', 7000000, 14000000,
    'https://upwork.com/gigs/g5',
    'intermediate',
    'Butuh dashboard analytics internal yang narik data dari PostgreSQL dan visualisasi metrik utama. Prefer Streamlit atau Dash.',
    ARRAY['Python', 'PostgreSQL', 'Streamlit', 'Data Visualization'],
    5, 6, '2026-06-27T11:45:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444406',
    'Edit video YouTube - mingguan',
    'Fiverr', 'video', 2500000, 4000000,
    'https://fiverr.com/gigs/g6',
    'intermediate',
    'Dicari video editor yang bisa diandalkan untuk channel YouTube review tech mingguan. 2 video per minggu, masing-masing ~10-15 menit.',
    ARRAY['Premiere Pro', 'After Effects', 'Color Grading'],
    8, 11, '2026-06-24T16:20:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444407',
    'Migrasi WordPress ke Next.js',
    'Upwork', 'web-dev', 12000000, 20000000,
    'https://upwork.com/gigs/g7',
    'advanced',
    'Migrasi blog WordPress kami (200+ artikel) ke Next.js dengan MDX. SEO dan struktur URL harus dipertahankan.',
    ARRAY['Next.js', 'WordPress', 'MDX', 'SEO'],
    6, 9, '2026-06-23T13:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444408',
    'Brand identity untuk kedai kopi',
    'Sribulancer', 'design', 9000000, 16000000,
    'https://sribulancer.com/gigs/g8',
    'intermediate',
    'Kedai kopi specialty baru butuh brand identity lengkap: logo, color palette, typography, desain kemasan, dan template media sosial.',
    ARRAY['Illustrator', 'Photoshop', 'Branding', 'Logo Design'],
    5, 17, '2026-06-21T07:30:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444409',
    'Setup email marketing automation',
    'Projects.co.id', 'marketing', 4000000, 7500000,
    'https://projects.co.id/gigs/g9',
    'intermediate',
    'Setup sequence email otomatis untuk toko e-commerce kami: welcome series, abandoned cart, post-purchase. Pakai Mailchimp atau Klaviyo.',
    ARRAY['Email Marketing', 'Mailchimp', 'Copywriting'],
    3, 7, '2026-06-28T08:00:00Z'
  ),
  (
    '44444444-4444-4444-4444-444444444410',
    'Data cleaning untuk survey pelanggan',
    'Fiverr', 'data', 3000000, 6000000,
    'https://fiverr.com/gigs/g10',
    'beginner',
    'Kami punya 5000+ respon survey mentah (Excel + open text). Butuh cleaning, kategorisasi, dan laporan ringkasan.',
    ARRAY['Python', 'Pandas', 'Excel'],
    2, 14, '2026-06-29T06:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- End of seed. Total: 11 skills, 6 users, 6 courses, 10 gigs.
-- ============================================================================