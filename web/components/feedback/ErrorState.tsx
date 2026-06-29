import { Card, CardBody } from '@/components/ui/Card';

type Props = {
  title?: string;
  message: string;
  hint?: string;
  /** Optional secondary line for actionable instructions. */
  action?: React.ReactNode;
  icon?: string;
};

/**
 * Friendly error display — used when Supabase data is unavailable so the page
 * still renders something useful instead of a blank screen.
 */
export function ErrorState({
  title = 'Database belum tersedia',
  message,
  hint,
  action,
  icon = '🛠️',
}: Props) {
  return (
    <Card>
      <CardBody className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 grid place-items-center mb-3 text-2xl">
          {icon}
        </div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
          {message}
        </p>
        {hint && (
          <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
            {hint}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardBody>
    </Card>
  );
}

/**
 * Helper to detect the "Supabase not configured yet" state. Pages call this
 * to decide between rendering data vs the setup-onboarding error state.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}