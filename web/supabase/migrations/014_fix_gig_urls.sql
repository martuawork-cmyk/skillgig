-- ============================================================================
-- 014_fix_gig_urls.sql
-- ----------------------------------------------------------------------------
-- MASALAH B4-2: banyak gig seed punya URL per-listing yang tidak nyata, mis.
--   https://projects.co.id/project/xxx   -> 404
--   https://www.linkedin.com/jobs/view/senior-product-designer-canva  -> 404
--   https://upwork.com/gigs/g5  (mock legacy seed 003_seed.sql)
--
-- Ganti `url` tiap gig agar mengarah ke halaman pencarian / daftar lowongan
-- platform aslinya, jadi tombol "Lamar" (window.open(gig.url)) selalu membuka
-- halaman yang valid.
--
-- Pencocokan memakai HOST URL (ILIKE), BUKAN kolom `platform`:
--   - Tidak peduli nilai / casing kolom platform (mapper GigPlatform cuma
--     mengenal 4 nilai, sedangkan seed real memakai Wellfound, LinkedIn,
--     Kalibrr, Fastwork, 99designs, We Work Remotely).
--   - Tangani variasi `www.` dan host telanjang sekaligus.
-- Mencakup seed real (seed-gigs-real.sql) MAUPUN mock legacy (003_seed.sql).
--
-- Idempoten: menjalankan ulang hanya menulis ulang mapping host -> halaman
-- pencarian yang sama. Aman dijalankan berulang.
-- ============================================================================

BEGIN;

-- Projects.co.id  ->  halaman daftar proyek
UPDATE gigs
   SET url = 'https://projects.co.id/projects'
 WHERE url ILIKE 'https://projects.co.id/%';

-- Sribulancer (www. maupun telanjang)  ->  /id/jobs
UPDATE gigs
   SET url = 'https://sribulancer.com/id/jobs'
 WHERE url ILIKE 'https://%sribulancer.com/%';

-- Kalibrr  ->  job board
UPDATE gigs
   SET url = 'https://www.kalibrr.com/job-board'
 WHERE url ILIKE 'https://%kalibrr.com/%';

-- Wellfound (AngelList)  ->  /jobs
UPDATE gigs
   SET url = 'https://wellfound.com/jobs'
 WHERE url ILIKE 'https://wellfound.com/%';

-- LinkedIn  ->  lowongan remote
UPDATE gigs
   SET url = 'https://www.linkedin.com/jobs/remote-jobs'
 WHERE url ILIKE 'https://%linkedin.com/%';

-- We Work Remotely  ->  beranda lowongan remote
UPDATE gigs
   SET url = 'https://weworkremotely.com'
 WHERE url ILIKE 'https://%weworkremotely.com/%';

-- Upwork  ->  daftar freelance jobs
UPDATE gigs
   SET url = 'https://www.upwork.com/freelance-jobs'
 WHERE url ILIKE 'https://%upwork.com/%';

-- Fastwork  ->  /jobs
UPDATE gigs
   SET url = 'https://fastwork.id/jobs'
 WHERE url ILIKE 'https://%fastwork.id/%';

-- 99designs  ->  /jobs
UPDATE gigs
   SET url = 'https://99designs.com/jobs'
 WHERE url ILIKE 'https://%99designs.com/%';

-- Fiverr (bonus: mock legacy 003_seed.sql juga punya https://fiverr.com/gigs/*)
UPDATE gigs
   SET url = 'https://www.fiverr.com/categories'
 WHERE url ILIKE 'https://%fiverr.com/%';

COMMIT;

-- ----------------------------------------------------------------------------
-- Sanity-check (opsional, jalankan manual untuk verifikasi):
--   SELECT platform, url, count(*)
--   FROM gigs
--   GROUP BY platform, url
--   ORDER BY platform;
-- Setelah migrasi seharusnya tiap platform hanya punya SATU nilai url
-- (halaman pencarian), bukan slug per-listing.
-- ----------------------------------------------------------------------------
