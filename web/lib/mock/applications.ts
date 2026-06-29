import type { Application } from '../types';

export const applications: Application[] = [
  {
    id: 'a1',
    gigId: 'g1',
    freelancerId: 'u2', // current user (Sari)
    proposedRate: 12000000,
    proposedDurationWeeks: 2,
    coverLetter: 'Halo! Saya Sari, full-stack developer dengan 5 tahun pengalaman. Sudah beberapa kali bikin landing page untuk startup fintech, portfolio bisa saya share.',
    status: 'pending',
    appliedAt: '2026-06-26T10:00:00Z',
  },
  {
    id: 'a2',
    gigId: 'g7',
    freelancerId: 'u2',
    proposedRate: 16000000,
    proposedDurationWeeks: 5,
    coverLetter: 'Saya pernah migrasi 3 blog WordPress ke Next.js. Bisa preserve SEO dan struktur URL pakai redirects 301.',
    status: 'accepted',
    appliedAt: '2026-06-24T15:30:00Z',
  },
  {
    id: 'a3',
    gigId: 'g3',
    freelancerId: 'u2',
    proposedRate: 600000,
    proposedDurationWeeks: 4,
    coverLetter: 'Meski background saya lebih ke tech writing, saya tertarik explore SEO writing. Saya bisa kasih sample dulu.',
    status: 'rejected',
    appliedAt: '2026-06-23T09:00:00Z',
  },
  {
    id: 'a4',
    gigId: 'g5',
    freelancerId: 'u2',
    proposedRate: 11000000,
    proposedDurationWeeks: 4,
    coverLetter: 'Saya biasa pakai Streamlit untuk internal tools di pekerjaan saya. Tertarik banget sama project ini!',
    status: 'pending',
    appliedAt: '2026-06-28T08:15:00Z',
  },
];

export function getApplicationsByFreelancer(freelancerId: string): Application[] {
  return applications.filter((a) => a.freelancerId === freelancerId);
}