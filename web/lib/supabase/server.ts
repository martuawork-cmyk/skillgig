import { createServerClient } from '@supabase/ssr';
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