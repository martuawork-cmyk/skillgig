import type { User } from '../types';

export const users: User[] = [
  {
    id: 'u1',
    name: 'Andika Pratama',
    initials: 'AP',
    role: 'client',
    rating: 4.8,
    completedGigs: 12,
    bio: 'Founder startup fintech. Sering hire freelancer untuk UI/UX dan landing page.',
    skills: [],
    location: 'Jakarta',
  },
  {
    id: 'u2',
    name: 'Sari Wulandari',
    initials: 'SW',
    role: 'freelancer',
    rating: 4.9,
    completedGigs: 23,
    bio: 'Full-stack developer, fokus di Next.js dan TypeScript. Suka bersih-bersih kode.',
    skills: ['Next.js', 'TypeScript', 'React', 'Tailwind CSS', 'PostgreSQL'],
    location: 'Bandung',
  },
  {
    id: 'u3',
    name: 'Budi Santoso',
    initials: 'BS',
    role: 'freelancer',
    rating: 4.7,
    completedGigs: 18,
    bio: 'UI/UX designer dengan 5 tahun pengalaman di e-commerce dan SaaS.',
    skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design System'],
    location: 'Yogyakarta',
  },
  {
    id: 'u4',
    name: 'Rina Hartati',
    initials: 'RH',
    role: 'freelancer',
    rating: 4.8,
    completedGigs: 31,
    bio: 'Content writer & SEO specialist. Pernah menulis untuk Kompas dan Tokopedia.',
    skills: ['Content Writing', 'SEO', 'Copywriting', 'Blog Writing'],
    location: 'Surabaya',
  },
  {
    id: 'u5',
    name: 'Reza Hidayat',
    initials: 'RH',
    role: 'freelancer',
    rating: 4.6,
    completedGigs: 14,
    bio: 'Data analyst, biasa pakai Python dan SQL. Tertarik di visualisasi data.',
    skills: ['Python', 'SQL', 'Tableau', 'Data Visualization', 'Pandas'],
    location: 'Jakarta',
  },
  {
    id: 'u6',
    name: 'Maya Kusuma',
    initials: 'MK',
    role: 'freelancer',
    rating: 4.9,
    completedGigs: 27,
    bio: 'Video editor untuk YouTube dan short-form content. Fast turnaround.',
    skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Color Grading'],
    location: 'Denpasar',
  },
];

export function getUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

// The "current user" for the dashboard (mock logged-in freelancer)
export const CURRENT_USER_ID = 'u2';