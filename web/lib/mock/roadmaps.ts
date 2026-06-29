import type { Roadmap } from '../types';

/**
 * SkillGig — mock roadmaps for /roadmap page.
 * Each roadmap shows a 4-step path: skills → courses → gigs → income estimate.
 * Mock-only — replace with Supabase queries when ready.
 */
export const roadmaps: Roadmap[] = [
  {
    skill: 'Video Editing',
    category: 'video',
    difficulty: 'intermediate',
    durationWeeks: 8,
    estimatedIncome: { min: 3_000_000, max: 25_000_000 },
    skills: [
      'Premiere Pro / Final Cut',
      'After Effects (motion graphics)',
      'Color Grading (DaVinci Resolve)',
      'Audio sync & mixing',
      'Storytelling & pacing',
    ],
    courses: [
      { title: 'Premiere Pro CC — Complete Course',  platform: 'Udemy',    url: '#' },
      { title: 'After Effects Motion Mastery',        platform: 'Udemy',    url: '#' },
      { title: 'Color Grading for Beginners',         platform: 'Coursera', url: '#' },
    ],
    gigs: [
      { title: 'Edit 2 video YouTube per minggu',  budgetMin: 2_500_000, budgetMax: 4_000_000, platform: 'Fiverr' },
      { title: 'Brand video promo untuk UMKM',      budgetMin: 5_000_000, budgetMax: 8_000_000, platform: 'Sribulancer' },
      { title: 'Wedding highlight reel',             budgetMin: 3_000_000, budgetMax: 6_000_000, platform: 'Projects.co.id' },
      { title: 'Short-form content (Reels/TikTok)',  budgetMin: 1_500_000, budgetMax: 3_000_000, platform: 'Fiverr' },
    ],
    incomeTiers: [
      { level: 'Pemula',   min: 3_000_000,  max: 5_000_000  },
      { level: 'Menengah', min: 8_000_000,  max: 15_000_000 },
      { level: 'Expert',   min: 20_000_000, max: 40_000_000 },
    ],
  },
  {
    skill: 'Web Development',
    category: 'web-dev',
    difficulty: 'intermediate',
    durationWeeks: 12,
    estimatedIncome: { min: 5_000_000, max: 40_000_000 },
    skills: [
      'HTML, CSS, JavaScript fundamentals',
      'React / Next.js',
      'TypeScript',
      'Tailwind CSS atau design system',
      'REST API + database basics',
      'Git & deployment (Vercel)',
    ],
    courses: [
      { title: 'Next.js 14 — Panduan Lengkap',          platform: 'Udemy',    url: '#' },
      { title: 'TypeScript Deep Dive',                  platform: 'Udemy',    url: '#' },
      { title: 'Full-Stack Web Development',            platform: 'Coursera', url: '#' },
    ],
    gigs: [
      { title: 'Landing page untuk startup',          budgetMin: 8_000_000,  budgetMax: 15_000_000, platform: 'Projects.co.id' },
      { title: 'Migrasi WordPress ke Next.js',         budgetMin: 12_000_000, budgetMax: 20_000_000, platform: 'Upwork' },
      { title: 'Dashboard analytics internal',         budgetMin: 7_000_000,  budgetMax: 14_000_000, platform: 'Upwork' },
      { title: 'Maintenance website bulanan',          budgetMin: 3_000_000,  budgetMax: 5_000_000,  platform: 'Sribulancer' },
    ],
    incomeTiers: [
      { level: 'Pemula',   min: 5_000_000,  max: 10_000_000 },
      { level: 'Menengah', min: 12_000_000, max: 25_000_000 },
      { level: 'Expert',   min: 30_000_000, max: 60_000_000 },
    ],
  },
  {
    skill: 'UI/UX Design',
    category: 'design',
    difficulty: 'beginner',
    durationWeeks: 6,
    estimatedIncome: { min: 3_000_000, max: 30_000_000 },
    skills: [
      'Figma (auto-layout, components)',
      'UX Research (interview, usability test)',
      'Wireframing & prototyping',
      'Design system thinking',
      'Visual hierarchy & typography',
    ],
    courses: [
      { title: 'UI/UX Design Fundamentals',          platform: 'Coursera', url: '#' },
      { title: 'Figma Masterclass',                  platform: 'Udemy',    url: '#' },
      { title: 'Design System dari Nol',             platform: 'Dicoding', url: '#' },
    ],
    gigs: [
      { title: 'Desain UI aplikasi mobile',         budgetMin: 6_000_000,  budgetMax: 12_000_000, platform: 'Sribulancer' },
      { title: 'Brand identity (logo + guidelines)',  budgetMin: 9_000_000,  budgetMax: 16_000_000, platform: 'Sribulancer' },
      { title: 'Landing page design (Figma)',         budgetMin: 4_000_000,  budgetMax: 8_000_000,  platform: 'Projects.co.id' },
    ],
    incomeTiers: [
      { level: 'Pemula',   min: 3_000_000,  max: 7_000_000  },
      { level: 'Menengah', min: 10_000_000, max: 20_000_000 },
      { level: 'Expert',   min: 25_000_000, max: 50_000_000 },
    ],
  },
  {
    skill: 'Data Analysis',
    category: 'data',
    difficulty: 'intermediate',
    durationWeeks: 10,
    estimatedIncome: { min: 5_000_000, max: 35_000_000 },
    skills: [
      'SQL (PostgreSQL)',
      'Python (pandas, numpy)',
      'Data visualization (Tableau / Power BI)',
      'Statistics fundamentals',
      'ETL & data cleaning',
    ],
    courses: [
      { title: 'Data Analysis with Python',         platform: 'Coursera', url: '#' },
      { title: 'SQL untuk Data Analyst',             platform: 'Dicoding', url: '#' },
      { title: 'Tableau Essential Training',         platform: 'Udemy',    url: '#' },
    ],
    gigs: [
      { title: 'Data cleaning untuk survey',        budgetMin: 3_000_000,  budgetMax: 6_000_000,  platform: 'Fiverr' },
      { title: 'Dashboard analytics pakai Python',    budgetMin: 7_000_000,  budgetMax: 14_000_000, platform: 'Upwork' },
      { title: 'Laporan mingguan e-commerce',         budgetMin: 4_000_000,  budgetMax: 8_000_000,  platform: 'Projects.co.id' },
    ],
    incomeTiers: [
      { level: 'Pemula',   min: 5_000_000,  max: 9_000_000  },
      { level: 'Menengah', min: 12_000_000, max: 22_000_000 },
      { level: 'Expert',   min: 25_000_000, max: 45_000_000 },
    ],
  },
  {
    skill: 'Content Writing',
    category: 'writing',
    difficulty: 'beginner',
    durationWeeks: 4,
    estimatedIncome: { min: 2_000_000, max: 15_000_000 },
    skills: [
      'SEO writing fundamentals',
      'Copywriting (headline, CTA)',
      'Research & outline',
      'Editing & proofreading',
      'WordPress / CMS dasar',
    ],
    courses: [
      { title: 'SEO Writing Mastery',               platform: 'Dicoding', url: '#' },
      { title: 'Copywriting for Conversion',         platform: 'Udemy',    url: '#' },
    ],
    gigs: [
      { title: 'Blog SEO 10 artikel per bulan',     budgetMin: 500_000,    budgetMax: 800_000,   platform: 'Projects.co.id' },
      { title: 'Copywriting untuk landing page',     budgetMin: 2_000_000,  budgetMax: 5_000_000, platform: 'Sribulancer' },
      { title: 'Newsletter content mingguan',         budgetMin: 1_500_000,  budgetMax: 3_000_000, platform: 'Fiverr' },
    ],
    incomeTiers: [
      { level: 'Pemula',   min: 2_000_000,  max: 5_000_000  },
      { level: 'Menengah', min: 6_000_000,  max: 12_000_000 },
      { level: 'Expert',   min: 15_000_000, max: 30_000_000 },
    ],
  },
  {
    skill: 'Digital Marketing',
    category: 'marketing',
    difficulty: 'intermediate',
    durationWeeks: 8,
    estimatedIncome: { min: 4_000_000, max: 30_000_000 },
    skills: [
      'Instagram & TikTok strategy',
      'Content calendar & production',
      'Meta Ads / Google Ads',
      'Analytics (GA4, Meta Pixel)',
      'Email marketing automation',
    ],
    courses: [
      { title: 'Social Media Marketing 101',         platform: 'YouTube',  url: '#' },
      { title: 'Meta Ads Blueprint',                  platform: 'Coursera', url: '#' },
      { title: 'Email Marketing Automation',          platform: 'Udemy',    url: '#' },
    ],
    gigs: [
      { title: 'Instagram growth 3 bulan',            budgetMin: 10_000_000, budgetMax: 18_000_000, platform: 'Sribulancer' },
      { title: 'Setup email automation',              budgetMin: 4_000_000,  budgetMax: 7_500_000,  platform: 'Projects.co.id' },
      { title: 'Meta Ads campaign management',         budgetMin: 5_000_000,  budgetMax: 10_000_000, platform: 'Fiverr' },
    ],
    incomeTiers: [
      { level: 'Pemula',   min: 4_000_000,  max: 8_000_000  },
      { level: 'Menengah', min: 10_000_000, max: 20_000_000 },
      { level: 'Expert',   min: 25_000_000, max: 50_000_000 },
    ],
  },
];

export function getRoadmap(skill: string): Roadmap | undefined {
  const q = skill.trim().toLowerCase();
  return roadmaps.find((r) => r.skill.toLowerCase() === q);
}