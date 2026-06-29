import type { Course } from '../types';

export const courses: Course[] = [
  {
    id: 'c1',
    title: 'Next.js 14 — The Complete Guide',
    titleId: 'Next.js 14 — Panduan Lengkap',
    provider: 'BuildWithAngga',
    durationHours: 24,
    level: 'intermediate',
    skillsTaught: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    thumbnail: '🚀',
    enrolled: true,
  },
  {
    id: 'c2',
    title: 'UI/UX Design Fundamentals',
    titleId: 'Dasar-dasar UI/UX Design',
    provider: 'Skilvul',
    durationHours: 18,
    level: 'beginner',
    skillsTaught: ['Figma', 'UI Design', 'UX Research'],
    thumbnail: '🎨',
    enrolled: true,
  },
  {
    id: 'c3',
    title: 'SEO Writing Mastery',
    titleId: 'Menguasai SEO Writing',
    provider: 'Kelaskita',
    durationHours: 8,
    level: 'beginner',
    skillsTaught: ['SEO', 'Content Writing', 'Copywriting'],
    thumbnail: '✍️',
    enrolled: false,
  },
  {
    id: 'c4',
    title: 'Data Analysis with Python',
    titleId: 'Analisis Data dengan Python',
    provider: 'BuildWithAngga',
    durationHours: 32,
    level: 'intermediate',
    skillsTaught: ['Python', 'Pandas', 'Data Visualization', 'SQL'],
    thumbnail: '📊',
    enrolled: false,
  },
  {
    id: 'c5',
    title: 'Advanced React Patterns',
    titleId: 'Pola React Lanjutan',
    provider: 'Mage Academy',
    durationHours: 12,
    level: 'advanced',
    skillsTaught: ['React', 'TypeScript', 'State Management'],
    thumbnail: '⚛️',
    enrolled: false,
  },
  {
    id: 'c6',
    title: 'Video Editing for Content Creators',
    titleId: 'Video Editing untuk Content Creator',
    provider: 'Kelas100',
    durationHours: 15,
    level: 'beginner',
    skillsTaught: ['Premiere Pro', 'After Effects', 'Color Grading'],
    thumbnail: '🎬',
    enrolled: false,
  },
];

export function getCourse(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}