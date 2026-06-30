import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client (per-request).
 *
 * Use inside React Server Components, Route Handlers, and Server Actions.
 * Always call this inside the request scope — never at module level.
 *
 * On RSC, `cookies().set()` is a no-op (headers cannot be modified). The
 * try/catch swallows that error because the middleware (Proxy) handles
 * writing the refreshed cookies back to the browser on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — read-only context.
            // The middleware handles writes on the response side.
          }
        },
      },
    },
  );
}

/**
 * Cookie-free Supabase client for PUBLIC, auth-free catalog reads that execute
 * inside a cache scope (`unstable_cache` / the `cached()` helper).
 *
 * `createClient()` above calls `cookies()`, which is a dynamic data source —
 * invoking it from within `unstable_cache` throws
 * "Accessing Dynamic data sources inside a cache scope is not supported" and
 * silently nukes every cached public read (it falls back to [] / null). This
 * client bypasses the cookie adapter entirely and connects as the `anon` role.
 *
 * That is safe for auth-free reads because every table it touches — `courses`,
 * `gigs`, `skills`, `users` — carries a `FOR SELECT USING (true)` policy (see
 * migrations 001/002), so `anon` sees the same rows an authenticated client
 * would. Use this ONLY for public reads wrapped in `unstable_cache`; anything
 * that depends on the signed-in user must keep using `createClient()` and must
 * NOT be wrapped in a cache scope.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}