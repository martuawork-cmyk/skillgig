'use client';

import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast, Toast } from '@/components/ui/Toast';
import { useSavedStore, type SavedCourse, type SavedGig } from '@/lib/store/savedStore';
import { COURSE_PLATFORMS } from '@/lib/types';

type Props =
  | { type: 'course'; title: string; items: SavedCourse[] }
  | { type: 'gig'; title: string; items: SavedGig[] };

export function SavedItemsGrid(props: Props) {
  const { type, title, items } = props;
  const unsaveCourse = useSavedStore((s) => s.unsaveCourse);
  const unsaveGig = useSavedStore((s) => s.unsaveGig);
  const hydrated = useSavedStore((s) => s._hasHydrated);
  const { toast, showToast } = useToast();

  const handleUnsave = async (id: string, label: string) => {
    if (type === 'course') void unsaveCourse(id);
    else void unsaveGig(id);
    showToast(`${label} dihapus dari simpanan`, 'info');
  };

  if (!hydrated) {
    return (
      <Card>
        <CardBody className="text-center py-10 text-sm text-slate-500">
          Memuat simpanan…
        </CardBody>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-10 space-y-1">
          <p className="text-3xl">{type === 'course' ? '📚' : '💼'}</p>
          <p className="text-sm font-semibold text-slate-700">
            Belum ada {type === 'course' ? 'kursus' : 'gig'} tersimpan
          </p>
          <p className="text-xs text-slate-500">
            Klik tombol <span className="font-semibold">Save</span> /{' '}
            <span className="font-semibold">Simpan</span> di card untuk menambahkan.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">{items.length} tersimpan</span>
      </div>

      <div className={type === 'course'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
        : 'space-y-2'
      }>
        {items.map((item) => (
          <SavedItem
            key={item.id}
            type={type}
            item={item}
            onUnsave={() =>
              handleUnsave(item.id, type === 'course' ? 'Kursus' : 'Gig')
            }
          />
        ))}
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </section>
  );
}

function SavedItem({
  type,
  item,
  onUnsave,
}: {
  type: 'course' | 'gig';
  item: SavedCourse | SavedGig;
  onUnsave: () => void;
}) {
  const isCourse = type === 'course';
  const course = isCourse ? (item as SavedCourse) : null;
  const gig = !isCourse ? (item as SavedGig) : null;
  const href = isCourse ? `/learn` : `/earn`;

  if (isCourse && course) {
    return (
      <Card>
        <CardBody className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 grid place-items-center text-2xl shrink-0">
              {course.thumbnail}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm line-clamp-2">{course.title}</p>
              <Badge className={COURSE_PLATFORMS[course.platform as keyof typeof COURSE_PLATFORMS] ?? 'bg-slate-100 text-slate-700'}>
                {course.platform}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href={href}
              className="flex-1 text-center px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            >
              Lihat
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUnsave}
              className="text-rose-600 hover:bg-rose-50"
            >
              Hapus
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (gig) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 text-sm truncate">{gig.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{gig.platform}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={href}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                Lihat
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUnsave}
                className="text-rose-600 hover:bg-rose-50"
              >
                Hapus
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return null;
}
