import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';

type Props = {
  title: string;
  description?: string;
  icon?: string;
  /** Optional CTA — link-based. */
  cta?: { label: string; href: string };
  /** Optional secondary action — button-based (caller handles onClick via spread). */
  action?: React.ReactNode;
};

export function EmptyState({ title, description, icon = '📭', cta, action }: Props) {
  return (
    <Card>
      <CardBody className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 grid place-items-center mb-3 text-2xl">
          {icon}
        </div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
        )}
        {cta && (
          <Link
            href={cta.href}
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
          >
            {cta.label} →
          </Link>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardBody>
    </Card>
  );
}