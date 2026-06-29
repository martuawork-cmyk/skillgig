import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refresh the Supabase auth session on every request.
 *
 * Why middleware:
 *   1. Refreshes the Auth token (via `supabase.auth.getClaims()`).
 *   2. Forwards the refreshed token to Server Components downstream.
 *   3. Forwards the refreshed token back to the browser cookie store.
 *
 * The `setAll(cookiesToSet, cacheHeaders)` signature also receives cache
 * headers (`Cache-Control`, `Expires`, `Pragma`) that must be applied to
 * the response to prevent CDNs from caching authenticated responses.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Skip Supabase init if env vars are not configured yet. Lets the app run
  // in dev mode before the user fills in .env.local. Production deployments
  // must have these set — guarded by a clear runtime error if used.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(cacheHeaders).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Triggers the auth refresh. IMPORTANT: do not rely on getSession() in
  // middleware — it's not guaranteed to revalidate the token.
  await supabase.auth.getClaims();

  return response;
}