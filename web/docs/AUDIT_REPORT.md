# SkillGig.id — Full Audit Report

**Tanggal audit:** 2026-06-30
**Cabang:** `main`
**Scope:** Verifikasi menyeluruh bahwa semua yang "sudah selesai" benar-benar
berfungsi. **Bukan** menambah fitur, **bukan** mengubah UI. Fokus: bug yang
membuat data tidak muncul atau fungsi tidak bekerja.

---

## 🟢 STATUS AKHIR

**SEMUA HALAMAN DATA MENAMPILKAN DATA RIIL DENGAN BENAR.**

Tidak ada lagi halaman yang jatuh ke fallback kosong. Verifikasi langsung
terhadap dev server (port 3001) pada DB Supabase yang aktif:

| Route | HTTP | Data yang muncul | Verdict |
|---|---|---|---|
| `/` | 200 | Stats: **22 gigs · 7 freelancers · Rp 6.568.182** | ✅ DATA |
| `/learn` | 200 | **16 kursus** | ✅ DATA |
| `/gigs` | 200 | **22 gigs** (cocok jumlah di DB/sitemap) | ✅ DATA |
| `/roadmap` | 200 | Search picker render (autocomplete + step UI) | ✅ OK |
| `/skills` | 200 | Katalog skill render | ✅ DATA |
| `/earn` | 200 | **22 gigs · avg Rp 4.990.909 · 4 platform** | ✅ DATA |
| `/admin` | 200 | "Admin belum tersedia" — *by design* (lihat §3) | ⚠️ config |
| `/applications` | 307 | Redirect → `/login?next=/applications` | ✅ benar |

Build: **0 error, 0 warning** (19 static pages generated). `tsc --noEmit`: **exit 0**.

---

## Ringkasan per langkah

### Langkah 1 — Fungsi `cached()` di `lib/supabase/queries.ts`
Ada **7 fungsi** dibungkus helper `cached()` (= `unstable_cache`). Helper ini
**hanya** dipakai di `queries.ts` (tidak di `admin-queries.ts` / `save-queries.ts`).
Semuanya sudah benar memakai `createPublicClient()` (cookie-free):

`getCourses`, `getGigs`, `getRecommendedSkills`, `getAllSkills`,
`getSkillsForNewsletter`, `getCoursesByCategory`, `getPublishedGigsByCategory`.

Fungsi non-cached (`getCourse`, `getGig`, `getUser`, `getUserSkills`,
`getSkillProgressForUser`, `getApplicationsByFreelancer`, `getMyApplications`,
`hasAppliedToGig`, `searchSkills`, `getCategoryBudgetEstimate`, `getSkill`,
`getHomepageStats`) memakai `createClient()` — **benar**, karena di luar cache
scope (butuh session). Fix sebelumnya (commit `8c87a85`) sudah lengkap.

**Temuan: tidak ada bug.**

### Langkah 2 — Build & type check
`npm run build` sukses, 0 error, 0 warning. `postbuild` menulis 27 URL (22 gigs)
ke `public/sitemap.xml` → konfirmasi tambahan bahwa DB terjangkau & ter-seed.

**Temuan: tidak ada bug.**

### Langkah 3 — Test setiap halaman (live fetch)
Lihat tabel di STATUS AKHIR. Catatan khusus `/admin` & `/applications` di §3.

**Temuan: tidak ada bug pada rendering data.**

### Langkah 4 — RLS policy (query SQL)
File `docs/rls-audit.sql` dibuat (7 section, **semua read-only**, tidak
dieksekusi sesuai instruksi). RLS ter-deklarasi konsisten di semua 9 tabel pada
migrasi (view `affiliate_click_counts` di-handle §6 file). File ini berguna untuk
memverifikasi **live DB** cocok dengan migrasi — kelas bug lama "migrasi tidak
ter-apply".

**Temuan: tidak bisa dikonfirmasi tanpa eksekusi (lihat §3 "belum diperbaiki").**

### Langkah 5 — RPC function
3 RPC dipanggil kode: `saved_items_session_save`, `saved_items_session_unsave`,
`saved_items_session_list`. **Ketiganya ada** di migrasi `008_saved_items.sql`.
Function ke-4 di migrasi (`handle_new_auth_user`) adalah trigger function, bukan
RPC — sesuai.

**Temuan: tidak ada RPC hilang.**

### Langkah 6 — Konsistensi status enum
- **Gig**: kode `'draft'|'published'|'expired'` ↔ DB `CHECK (status IN
  ('draft','published','expired'))` (mig 007) — **cocok**.
- **Application**: kode `'pending'|'reviewed'|'accepted'|'rejected'` ↔ DB
  `CHECK (status IN ('pending','reviewed','accepted','rejected'))` (mig 010) —
  **cocok**.
- **`'active'`/`'inactive'`**: TIDAK dipakai sebagai nilai status DB. Semua match
  "active" hanyalah label UI (`'Active gigs'`), class Tailwind (`active:scale`),
  atau variabel state filter. **Bug lama "active vs published" sudah bersih total.**
- **Courses**: tabel tidak punya kolom status (mig 001) — N/A.

**Temuan: tidak ada inkonsistensi.**

### Langkah 7 — Environment variable
6 env var dipakai kode. `.env.example` (dulu) hanya punya 4 → **kurang 2**.

---

## ✅ Bug DITEMUKAN & SUDAH DIPERBAIKI

1. **`.env.example` tidak lengkap** — `SUPABASE_SERVICE_ROLE_KEY` dan
   `NEXT_PUBLIC_SITE_URL` dipakai kode tapi tidak ada di template. Efek: siapa pun
   yang menyalin `.env.example` → `.env.local` akan dapat admin yang tampak rusak
   ("Admin belum tersedia") walau Supabase sudah dikonfigurasi.
   **Fix:** tambah kedua var ke `.env.example` dengan komentar (termasuk peringatan
   keamanan bahwa service-role key SERVER-ONLY, jangan di-prefix `NEXT_PUBLIC_`).

2. **Guard admin layout `isAdminConfigured()`** (perubahan *pre-existing*, belum
   di-commit saat sesi ini). Tanpa guard ini, admin yang login tapi tanpa
   service-role key akan **500** di dashboard karena `createAdminClient()` throw.
   Guard ini menampilkan fallback setup yang ramah sebagai gantinya.
   **Fix:** perubahan ini di-keep & ikut di-commit (defensive, benar).

---

## ⚠️ Bug DITEMUKAN tapi BELUM DIPERBAIKI (dengan alasan)

1. **`/admin` menampilkan "Admin belum tersedia", bukan redirect ke `/login`.**
   - **Kenapa tidak difix:** ini **by design**, bukan bug. Layer admin butuh
     `SUPABASE_SERVICE_ROLE_KEY` (semua admin query lewat `createAdminClient()`
     yang bypass RLS). `.env.local` dev saat ini tidak punya key itu, jadi
     `isAdminConfigured()` = false dan layout menampilkan halaman setup **sebelum**
     `requireAdmin()` (yang baru redirect ke `/login` saat sudah login). Path
     redirect-login (`requireAdmin` di `admin.ts:63`) sudah ada & benar — hanya
     tidak tercapai karena gate env kena duluan.
   - **Solusi yang benar** (config, bukan kode): isi `SUPABASE_SERVICE_ROLE_KEY` di
     `.env.local` (sekarang sudah terdokumentasi di `.env.example`). Jika gate ini
     dihapus, admin akan 500. Karena itu dibiarkan apa adanya.

2. **Verifikasi RLS pada live DB belum dijalankan.**
   - **Kenapa tidak difix:** instruksi audit eksplisit "tulis ke file, jangan
     eksekusi". File `docs/rls-audit.sql` sudah siap. Ini satu-satu area yang
     belum bisa diberi verdict pasti karena kelas bug lama ("migrasi tidak
     ter-apply") hanya bisa dideteksi dengan menjalankan query itu di Supabase SQL
     editor. Semua halaman publik sudah menampilkan data → RLS `FOR SELECT USING
     (true)` pada tabel katalog (courses/gigs/skills/users) terbukti aktif di live
     DB. Yang belum terverifikasi: kebijakan owner-scoped (saved_items,
     applications, user_skills, subscribers) — **rekomendasi: jalankan
     `docs/rls-audit.sql`.**

---

## Lampiran
- `docs/rls-audit.sql` — query audit RLS (read-only).
- `.env.example` — template env yang sudah lengkap (6 var).
