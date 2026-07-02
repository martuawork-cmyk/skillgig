# SkillGig.id — Progress Report (2 Juli 2026)

> Audit read-only terhadap repository pada commit `13d7362` (HEAD).
> Tidak ada kode yang diubah. Sumber data: `git log`, `git diff`, struktur direktori
> `web/app`, `web/lib`, `web/components`, `web/supabase/migrations`, `package.json`,
> serta isi file integrasi (PostHog, Telegram, Remotive, Adzuna, Resend).

**Stack:** Next.js 14.2.35 (App Router) · React 18 · Supabase (`@supabase/ssr` + `@supabase/supabase-js`) ·
Tailwind 3.4 · Zustand 5 (save layer) · Resend 6 (email) · posthog-js 1.396 · lucide-react.
**Status build (per `LAPORAN_MALAM.md`, sesi sebelumnya):** `tsc --noEmit` → 0 error, `next build` sukses (33/33 static pages).

---

## 1. Halaman yang Sudah Ada

### Halaman publik (page.tsx)
| Route | Keterangan |
|---|---|
| `/` | Home — hero, statistik (total gigs/users/avg budget), featured gigs + jobs + courses, newsletter, CTA `/earn` |
| `/gigs` + `/gigs/[id]` | Board freelance gig + detail gig (dengan ApplyForm) |
| `/jobs` + `/jobs/[id]` | Board full-time/contract (view layer di atas `gigs`, lihat `lib/job-utils.ts`) |
| `/remote-jobs/[category]` | **Route SEO programmatik**, 7 kategori, `generateStaticParams` + `generateMetadata`, `revalidate=3600` |
| `/learn` | Kursus (affiliate/CTA "Mulai Belajar") |
| `/earn` | Halaman monetisasi/affiliate |
| `/skills` | Daftar skill (dengan search via `/api/skills/search`) |
| `/roadmap` | Roadmap belajar per skill (data via `/api/roadmap/[skillId]`) |
| `/about`, `/faq` | Konten statis (real content) |

### Halaman auth / user
| Route | Keterangan |
|---|---|
| `/login`, `/signup` | Auth (Supabase) |
| `/dashboard` | Dashboard user |
| `/profile` + `/profile/[id]` | Profil publik + private |
| `/applications` | Riwayat lamaran user (`applications` table) |

### Admin — route group `(admin)`
| Route | Keterangan |
|---|---|
| `/(admin)/admin` | Panel admin (sidebar + tab, redesign pada `327ffe1`) |
| `/(admin)/admin/gigs` + `/[id]` | Kelola gig (edit, set status → trigger notifikasi Telegram) |
| `/(admin)/admin/courses` + `/[id]` | Kelola kursus (affiliate_url, featured) |
| `/(admin)/admin/subscribers` + `/export` | Daftar subscriber + export (route handler) |

### API routes
| Endpoint | Fungsi |
|---|---|
| `/api/subscribe` | Subscribe newsletter (simpan ke `subscribers` + kirim welcome email via Resend) |
| `/api/affiliate-click` | Catat klik "Mulai Belajar" → tabel `affiliate_clicks` (append-only) |
| `/api/roadmap/[skillId]` | Ambil data roadmap per skill |
| `/api/skills/search` | Pencarian skill |
| `/api/cron/fetch-jobs` | Cron utama: sync Remotive + Adzuna (Bearer `CRON_SECRET`) |
| `/api/cron/sync-jobs` | **Alias** — handler yang sama dengan `fetch-jobs` |

**Metadata bawaan App Router:** `app/layout.tsx`, `app/sitemap.ts` (URL absolut, termasuk 7 route `/remote-jobs/*`), `app/robots.ts`, `app/manifest.ts`, `icon.svg`, `apple-icon.png`, `favicon.ico`.

---

## 2. Fitur yang Sudah Selesai

### Auth
- Supabase Auth dengan trigger `handle_new_auth_user()` (auto-insert ke tabel `users`), diperbaiki di `011_auth_users_trigger_fix.sql`.
- Redirect ke `/profile` setelah login (`4906c96`).
- Middleware session (`lib/supabase/middleware.ts` + `session.ts`).

### Data (sync gig)
- **Remotive API** (`lib/job-sync/remotive.ts`): fetch tanpa key, upsert `ON CONFLICT (source_url)`, dedup via pre-fetch `source_url`, stamp `source_id = remotive:<id>`, status `published`. Mapping kategori + job_type + parse gaji.
- **Adzuna API** (`lib/job-sync/adzuna.ts`): fetch dengan `ADZUNA_APP_ID/KEY/COUNTRY`, mapping kategori dari tag + contract_type, `source_id = adzuna:<id>`.
- **Shared cron handler** (`lib/job-sync/cron-handler.ts`): validasi Bearer secret → jalankan keduanya → gabungkan statistik `{added, updated, skipped}`.

### UI / UX
- **List/Grid toggle** (`useViewPreference` + `ViewToggle`), preferensi di `localStorage` (`skillgig:view-mode`), shared `/gigs` + `/jobs`, slice grid 12 / list 15.
- **Skeleton loading** (`/gigs/loading.tsx`, `/learn/loading.tsx`).
- **Save layer** (`lib/store/savedStore.ts`): Zustand `persist` ke `localStorage` (instant paint) + sync ke `saved_items` Supabase (cross-device). Mendukung course + gig, sesi anon via RPC `saved_items_session_*`.
- **Empty states**, mobile filters, logo fallback, logout confirm (batch `f2304bc`).
- Komponen domain terorganisir: `gig/`, `job/`, `course/`, `earn/`, `profile/`, `admin/`, `skill/`, `roadmap/`, `newsletter/`, `feedback/`, `brand/`, `system/`, `ui/`, `analytics/`, `auth/`, `application/`, `subscriber/`, `layout/`.

### API / Backend
- Newsletter subscribe + welcome email (Resend).
- Affiliate click tracking (append-only + view `affiliate_click_counts`).
- Skills search + roadmap API.
- Cron job-sync dengan otorisasi secret.

### Admin
- Panel redesign (sidebar fixed + tab), edit gig, set status gig (→ trigger `notifyGigApproved` / Telegram), kelola courses (affiliate_url/featured), subscribers + export CSV.

### SEO
- Metadata SEO, `sitemap.ts` (URL **absolut**), `robots.ts`, OG image statis (`public/og-image.png` 1200×630), `manifest.ts`, icon convention benar.
- Route SEO programmatik `/remote-jobs/[category]` (7 kategori long-tail).

### Analytics
- PostHog: `AnalyticsProvider` (kondisional no-op tanpa key), `track()` + event terpusat (`gig_apply_clicked`, `course_start_clicked`, `job_saved`), `PostHogInitializer` untuk web vitals + pageview (`13d7362`).

---

## 3. Database

### Tabel (terbentuk dari `web/supabase/migrations/`)
| Tabel / Objek | Sumber migration | Catatan |
|---|---|---|
| `users` | 001_init | RLS public read; trigger dari auth |
| `courses` | 001_init | + `affiliate_url` (013), `featured` (007), `source_id` (016) |
| `gigs` | 001_init | + `source_url` (015), `source_id` (016), `status`, admin fields (007) |
| `skills` | 001_init | RLS public read |
| `subscribers` | 001_init | insert-only RLS; `skill_name` (009) |
| `applications` | 005 / 010 | lamaran, RLS own + admin select |
| `saved_items` | 008 | + RPC `saved_items_session_{list,save,unsave}` |
| `user_skills` | 012 | skill per user |
| `affiliate_clicks` | 013 | append-only + view `affiliate_click_counts` |

### Daftar migration (di repo)
```
001_init.sql                        002_extend.sql                  003_seed.sql
004_subs_nullable_skill.sql         005_applications.sql            006_auth.sql
007_admin_fields.sql                008_saved_items.sql             009_subscribers_skill_name.sql
010_applications_p2b.sql            011_auth_users_trigger_fix.sql  012_user_skills.sql
013_affiliate.sql                   014_fix_gig_urls.sql
015_remotive_source_url.sql   ⚠     015_source_url_index.sql   ⚠   (tabrakan — lihat §5)
016_source_id.sql
```
> **Catatan:** migration SQL ada di repo, tetapi status *terapan ke database live Supabase* TIDAK bisa diverifikasi dari repo saja (tidak ada akses ke dashboard/CLI). Asumsi: urutan 001→016 sudah dijalankan ke production.

---

## 4. Integrasi Eksternal

| Integrasi | Status kode | Aktif? | Env yang dibutuhkan |
|---|---|---|---|
| **Supabase** (DB + Auth) | ✅ lengkap | ⚠ butuh key | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Remotive** (job sync) | ✅ lengkap | ✅ no key | — (API publik) |
| **Adzuna** (job sync) | ✅ lengkap | ❌ butuh key | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `ADZUNA_COUNTRY` |
| **Telegram** (notifikasi approve) | ✅ lengkap, fail-safe | ❌ butuh token | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| **PostHog** (analytics + web vitals) | ✅ lengkap | ❌ butuh key | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| **Resend** (welcome email) | ✅ lengkap | ❌ butuh key | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Cron secret** | ✅ ada validator | — | `CRON_SECRET` |
| **Site URL** | ✅ default `https://skillgig.id` | — | `NEXT_PUBLIC_SITE_URL` (opsional) |
| **FX rate override** | ✅ ada fallback statis | — | `FX_USD_TO_IDR`, `FX_EUR_TO_IDR` (opsional) |

Semua integrasi sengaja dirancang **fail-safe/no-op** bila env tidak diset — tidak ada yang *crash*, tapi PostHog, Telegram, Adzuna, dan Resend **belum benar-benar aktif** sampai key diisi (di Vercel + `.env.local`). File `web/.env.example` sudah lengkap & terlacak di git.

---

## 5. Bug yang Sudah Difix (dari `git log`)

- `13d7362` — PostHog initializer untuk web vitals + page tracking.
- `b475eb6` — hapus import duplikat di cron handler.
- `7ff3839` — perbaiki path import relatif untuk cron syncing.
- `c1944a9` — hubungkan Adzuna API ke cron handler + routing sync.
- `f2304bc` — save sync semua halaman, learn tab baru, klik roadmap, logo fallback, konfirmasi logout, search skills.
- `3ed4c34` — save sync + UI (hero CTA, icon, mobile filter, empty state).
- `03afb2c` — list/grid toggle, skeleton, route SEO, PostHog, Telegram bot.
- `b4b93f7` — metadata SEO, sitemap, robots untuk GSC.
- `bbf8fce` — update logo, favicon, branding asset.
- `186cae1` — cron job auto-sync Remotive.
- `71eb47f` — save sync ke Supabase, gig card UI (job_type/company/salary), filter job_type.
- `327ffe1` — redesign panel admin.
- `c54af6f` — fix bug cache/RLS/status dari audit penuh.
- `8c87a85` — **critical**: konflik `unstable_cache` + `cookies()` menyebabkan courses/gigs *silently fail*.
- `4906c96` — backfill auth trigger, redirect ke profile setelah login.

---

## 6. Yang Belum Selesai / Masih Bermasalah

> Ditemukan langsung dari kode (bukan asumsi).

### 🔴 Tinggi
1. **Tabrakan migration `015_` (baru ditambahkan di 5 commit terakhir).**
   Ada **dua** file dengan prefix yang sama:
   - `015_remotive_source_url.sql` → unique index **full** `gigs_source_url_key ON gigs(source_url)`.
   - `015_source_url_index.sql` → unique index **partial** `idx_gigs_source_url ON gigs(source_url) WHERE source_url IS NOT NULL`.

   Komentar di `015_remotive_source_url.sql` dan `016_source_id.sql` **secara eksplisit menulis bahwa index partial BUKAN arbiter valid** untuk `ON CONFLICT (source_url)` dari supabase-js. Jadi `idx_gigs_source_url` redundan + bertentangan maksud. Selain itu urutan run antar file `015_*` ambigu (alfabetis: `..._remotive...` < `..._source_url...`). **Risiko:** migration duplikatif/konflik intent saat dijalankan ulang/restore DB baru. **Perlu direkonsiliasi** (hapus salah satu, idealnya yang partial).

2. **Integrasi eksternal belum diaktifkan.** PostHog, Telegram, Adzuna, Resend saat ini no-op di production sampai env key diset di Vercel. Tanpa Adzuna key, cron hanya meng-sync Remotive.

3. **Cron belum dijadwalkan.** Tidak ada `vercel.json` / config scheduler terlihat di repo. Cron bergantung pada Vercel Cron + `CRON_SECRET` — perlu dipastikan schedule-nya terdaftar di dashboard Vercel (kalau tidak, sync tidak pernah jalan otomatis).

### 🟡 Sedang
4. **Repaint brand belum dilakukan.** Palette brand = navy `#17255A` / gold `#F4B400`, tapi UI masih **indigo** (mis. `text-indigo-600` di `app/page.tsx`). Logo/favicon/OG sudah brand, tapi komponen belum.

5. **Tidak ada paginasi / "load more".** `/gigs` & `/jobs` memotong hasil ke 12/15 sesuai spec — tidak ada paginasi. Saat board membesar, gig/jobs di luar 12–15 tak terlihat.

6. **`next.config.js` kosong.** Tidak ada konfigurasi `images.remotePatterns` (seandainya ada gambar external), ISR global, atau env exposure eksplisit. Bukan bug, tapi perlu diperhatikan saat scaling.

7. **Dua cron route redundan.** `/api/cron/sync-jobs` dan `/api/cron/fetch-jobs` keduanya memanggil handler identik — `sync-jobs` murni alias. Pertimbangkan konsolidasi.

### 🟢 Rendah / housekeeping
8. **Tidak ada automated test.** Tidak ada test runner di `package.json` (`scripts` hanya `dev/build/start/lint`), tidak ada file test. Padahal ada fungsi pure yang *unit-testable* (`buildJobApprovedMessage`, mapper kategori, parse gaji, `salaryLine`).

9. **Route SEO `/remote-jobs/*`** butuh data gig `published` per kategori agar tidak kosong; mungkin perlu filter `job_type` non-Freelance agar "remote jobs" eksklusif employment (bukan campur freelance).

10. **Sitemap belum diresubmit ke GSC** setelah penambahan 7 URL `/remote-jobs/*` (catatan `LAPORAN_MALAM.md`).

---

## 7. Langkah Selanjutnya yang Direkomendasikan (urutan prioritas)

1. **🔴 Fix tabrakan migration `015_` sebelum deploy berikutnya.**
   Konsolidasi ke **satu** unique index full (`gigs_source_url_key`), hapus `015_source_url_index.sql` (partial). Verifikasi di DB live bahwa hanya ada satu index yang diinginkan. *Blokir: integritas schema.*

2. **🔴 Aktifkan env di Vercel (+ `.env.local`).**
   Set `ADZUNA_APP_ID/KEY/COUNTRY`, `NEXT_PUBLIC_POSTHOG_KEY/HOST`, `TELEGRAM_BOT_TOKEN/CHAT_ID`, `RESEND_API_KEY/FROM_EMAIL`, `CRON_SECRET`. Verifikasi masing-masing tidak lagi no-op.

3. **🔴 Daftarkan schedule cron** `/api/cron/fetch-jobs` di Vercel Cron (mis. tiap 6 jam) dengan `CRON_SECRET`. Uji panggil manual dengan `Authorization: Bearer <secret>`.

4. **🟡 Repaint brand** (indigo → navy `#17255A` / gold `#F4B400`) di seluruh komponen agar konsisten dengan logo/OG.

5. **🟡 Tambah paginasi / "load lebih"** di `/gigs` & `/jobs` agar seluruh listing dapat dijangkau.

6. **🟡 Setup test dasar** (Vitest) untuk fungsi pure: `buildJobApprovedMessage`, mapper kategori Remotive/Adzuna, parse gaji, `currency.formatSalaryIDRCompact`. Tambahkan `test` script di `package.json`.

7. **🟢 Konsolidasi cron route** (`sync-jobs` vs `fetch-jobs`) — pertahankan satu, jadikan satunya redirect/no-op.

8. **🟢 Verifikasi konten route SEO** `/remote-jobs/*`: pastikan tiap kategori terisi gig published; evaluasi filter `job_type` agar eksklusif employment. Lalu **resubmit sitemap ke GSC**.

9. **🟢 Dokumentasi deploy:** tambahkan `vercel.json` (cron schedule) bila ingin config version-controlled; pertimbangkan `images.remotePatterns` di `next.config.js` bila ada gambar dari domain eksternal.

---

*Dibuat otomatis sebagai audit read-only. Tidak ada file kode yang dimodifikasi; hanya file laporan ini yang dibuat.*
