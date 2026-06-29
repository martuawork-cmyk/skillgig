import type { Skill } from '../types';

export const userSkills: Skill[] = [
  { id: 's1', name: 'Next.js',           category: 'web-dev',  level: 'intermediate', progress: 78 },
  { id: 's2', name: 'TypeScript',        category: 'web-dev',  level: 'intermediate', progress: 65 },
  { id: 's3', name: 'Tailwind CSS',      category: 'web-dev',  level: 'advanced',     progress: 90 },
  { id: 's4', name: 'Figma',             category: 'design',   level: 'intermediate', progress: 55 },
  { id: 's5', name: 'PostgreSQL',        category: 'data',     level: 'beginner',     progress: 32 },
  { id: 's6', name: 'Content Writing',   category: 'writing',  level: 'beginner',     progress: 20 },
  { id: 's7', name: 'SEO',               category: 'marketing',level: 'beginner',     progress: 15 },
  { id: 's8', name: 'Python',            category: 'data',     level: 'beginner',     progress: 28 },
];

export const recommendedSkills: Skill[] = [
  { id: 'r1', name: 'React Server Components', category: 'web-dev', level: 'advanced',     progress: 0 },
  { id: 'r2', name: 'Docker',                category: 'web-dev', level: 'intermediate', progress: 0 },
  { id: 'r3', name: 'GraphQL',               category: 'data',    level: 'intermediate', progress: 0 },
];