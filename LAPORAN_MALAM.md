# LAPORAN_MALAM — 2 Juli 2026

Batch fitur: list/grid toggle, loading skeleton, SEO routes, PostHog, Telegram bot.

- `tsc --noEmit` → **0 error**
- `next build` → **sukses** (33/33 static pages, route baru SSG-prerendered)

---

## 1. File yang DIBUAT

| File | Fungsi |
|---|---|
| `web/lib/hooks/useViewPreference.ts` | Hook preference List/Grid (localStorage key `skillgig:view-mode`, shared /gigs + /jobs), + `limitForView()` (grid 12 / list 15). Hydration-safe. |
| `web/components/ui/ViewToggle.tsx` | Tombol segmented Grid ⇄ List (dipakai ulang di /gigs & /jobs). |
| `web/components/gig/GigListItem.tsx` | Card compact 1-baris untuk List View /gigs. |
| `web/app/gigs/loading.tsx` | Skeleton /gigs (animate-pulse, 9 card). |
| `web/app/learn/loading.tsx` | Skeleton /learn (animate-pulse, 9 card). |
| `web/app/remote-jobs/[category]/page.tsx` | Programmatic SEO route per kategori. `generateStaticParams()` (7 kategori), `generateMetadata()` long-tail, H1 `Lowongan [Kategori] Remote Indonesia`, `revalidate=3600`. |
| `web/components/analytics/PostHogProvider.tsx` | `AnalyticsProvider` — `PostHogProvider` kondisional (no-op tanpa key). |
| `web/lib/analytics.ts` | `track()` + `AnalyticsEvent` (gig_apply_clicked, course_start_clicked, job_saved). |

## 2. File yang DIMODIFIKASI

| File | Perubahan |
|---|---|
| `web/components/job/JobsClient.tsx` | Toggle inline → `<ViewToggle>` + hook; preference ke localStorage; slice grid 12 / list 15; hapus `ViewButton` lokal. |
| `web/components/gig/GigsClient.tsx` | Tambah toggle (kanan-atas hasil) + List View (`GigListItem`) + slice 12/15. |
| `web/components/job/JobCard.tsx` | PostHog: `gig_apply_clicked`, `job_saved`. |
| `web/components/job/JobListItem.tsx` | PostHog: `gig_apply_clicked`, `job_saved`. |
| `web/components/gig/GigCard.tsx` | PostHog: `gig_apply_clicked`, `job_saved`. |
| `web/components/course/CourseCard.tsx` | PostHog: `course_start_clicked` di tombol "Mulai Belajar". |
| `web/lib/supabase/queries.ts` | Tambah `getAllPublishedGigsByCategory()` (limit 60, cached). |
| `web/app/sitemap.ts` | Daftarkan 7 route `/remote-jobs/[category]`. |
| `web/app/layout.tsx` | Bungkus app dengan `<AnalyticsProvider>`. |
| `web/lib/telegram.ts` | Alias `sendTelegramNotification(message)`. |
| `web/.env.example` | Tambah `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`. |
| `web/package.json` / `pnpm-lock.yaml` | Tambah dependency `posthog-js@1.396.3`. |

## 3. Sudah ADA — verifikasi (TIDAK diduplikasi)

- **Telegram bot** (`web/lib/telegram.ts`): sudah lengkap — `sendTelegramMessage`, `buildJobApprovedMessage`, `notifyJobApproved`. Sudah dipanggil di `admin-queries.ts` (`adminSetGigStatus` → `notifyGigApproved` saat status `published`). Env `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` sudah ada di `.env.example`. Saya hanya menambah alias `sendTelegramNotification` sesuai nama API yang diminta.
- **Toggle /jobs**: sudah ada UI-nya; saya tingkatkan (localStorage + limit 12/15).
- **Skeleton /jobs** (`web/app/jobs/loading.tsx`): sudah ada (9 card ≥ 6).

## 4. Error yang ditemukan

- Tidak ada error build/type. Satu catatan pnpm: `core-js` build-script di-skip (`ERR_PNPM_IGNORED_BUILDS`) — polyfill opsional, tidak memengaruhi `posthog-js`/build.

## 5. Langkah besok pagi

1. **Aktifkan PostHog**: set `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` di Vercel (dan `.env.local`). Tanpa key, `track()` no-op dan provider render children apa adala — analytics belum benar-benar aktif.
2. **Telegram**: buat bot via @BotFather, set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` agar notifikasi approve gig hidup (saat ini no-op).
3. **Verifikasi browser**: toggle List/Grid di /gigs & /jobs — preference harus persist antar halaman & reload; skeleton muncul saat load.
4. **SEO route**: pastikan tiap kategori (`/remote-jobs/web-dev`, dll.) terisi gig published setelah data Supabase ada; cek GSC setelah di-crawl. Pertimbangkan filter `job_type` non-Freelance bila "remote jobs" harus eksklusif employment.
5. **Limit 12/15**: saat ini List/Grid memotong hasil ke 12/15 (sesuai spec) tanpa "load more"/paginasi — kalau board makin besar, tambahkan paginasi atau tombol "Lihat lainnya".
6. Submit ulang sitemap ke GSC setelah deploy (sekarang berisi 7 URL `/remote-jobs/*` baru).
