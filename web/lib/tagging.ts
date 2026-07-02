// SkillGig.id — automatic job tagging.
//
// Scans a listing's title + description (and a few structured fields) for
// keyword signals and returns a deduplicated tag list, e.g.
// ["Asia-friendly", "React.js", "Remote", "USD salary"]. Used to surface
// quick-scan badges on the jobs board and (later) to power tag-based filters.
//
// Rule-based on purpose: deterministic, cheap, no external API. To extend, add
// an entry to RULES (or FIELD_RULES) — no other change needed.
//
// Pure & client-safe: no 'server-only', no Supabase.

/** Structured fields the tagger can read, all optional. */
export interface TagInput {
  /** Pre-joined text to scan (title + description). Wins over title/description. */
  text?: string;
  title?: string;
  description?: string;
  location?: string;
  category?: string;
  jobType?: string;
  salaryCurrency?: string;
  isRemote?: boolean;
}

/** A keyword-rule: fires the tag when ANY keyword appears in the haystack. */
type TagRule = { tag: string; keywords: string[] };

// ----- text-scan rules (matched against title + description) ----------------
const RULES: readonly TagRule[] = [
  // Frontend frameworks
  { tag: 'React.js', keywords: ['react', 'reactjs', 'react.js'] },
  { tag: 'Next.js', keywords: ['next.js', 'nextjs', 'next js'] },
  { tag: 'Vue.js', keywords: ['vue', 'vuejs', 'vue.js', 'nuxt'] },
  { tag: 'Angular', keywords: ['angular'] },
  { tag: 'Svelte', keywords: ['svelte', 'sveltekit'] },
  // Languages / runtimes
  { tag: 'JavaScript', keywords: ['javascript', 'js'] },
  { tag: 'TypeScript', keywords: ['typescript', 'ts'] },
  { tag: 'Node.js', keywords: ['node.js', 'nodejs', 'node js'] },
  { tag: 'Python', keywords: ['python', 'django', 'flask', 'fastapi'] },
  { tag: 'Go', keywords: ['golang', 'go lang'] },
  { tag: 'Rust', keywords: ['rust'] },
  { tag: 'PHP', keywords: ['php', 'laravel', 'symfony'] },
  { tag: 'Ruby', keywords: ['ruby', 'rails', 'ruby on rails'] },
  { tag: 'Java', keywords: ['java', 'spring', 'kotlin'] },
  // Platforms / CMS
  { tag: 'WordPress', keywords: ['wordpress', 'wp'] },
  { tag: 'Shopify', keywords: ['shopify', 'liquid'] },
  { tag: 'Webflow', keywords: ['webflow'] },
  // Infra / data
  { tag: 'AWS', keywords: ['aws', 'amazon web services'] },
  { tag: 'Docker', keywords: ['docker', 'container', 'containerization'] },
  { tag: 'Kubernetes', keywords: ['kubernetes', 'k8s'] },
  { tag: 'SQL', keywords: ['sql', 'postgres', 'postgresql', 'mysql'] },
  // Design / marketing
  { tag: 'Figma', keywords: ['figma'] },
  { tag: 'UI/UX', keywords: ['ui/ux', 'ux', 'user experience', 'user interface'] },
  { tag: 'SEO', keywords: ['seo', 'search engine optimization'] },
  // Seniority
  { tag: 'Senior', keywords: ['senior', 'lead', 'staff engineer', 'principal'] },
  { tag: 'Entry-level', keywords: ['entry level', 'entry-level', 'junior', 'intern', 'graduate'] },
  // Perks / comp signals
  { tag: 'Equity', keywords: ['equity', 'stock options', 'share options', 'esop'] },
  { tag: 'Health benefits', keywords: ['health insurance', 'medical insurance', 'healthcare', 'dental'] },
  { tag: 'Flexible hours', keywords: ['flexible hours', 'flexible schedule', 'async', 'asynchronous'] },
  // Language
  { tag: 'English', keywords: ['english', 'fluent english', 'english speaker'] },
  { tag: 'Bahasa Indonesia', keywords: ['bahasa indonesia', 'indonesian language'] },
];

/**
 * Whole-word, case-insensitive "does the haystack contain any of these?".
 * Uses `\b` word boundaries so "js" doesn't match inside "json" and bare
 * word-style keywords don't catch substrings. Every keyword in RULES starts
 * and ends with a word character, so `\b` anchors correctly on both sides
 * (the "." / "/" inside "node.js" / "ui/ux" is matched literally). Plain `\b`
 * is chosen over lookbehind so this stays client-safe on older Safari.
 */
function matchesAny(haystack: string, keywords: string[]): boolean {
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    if (re.test(haystack)) return true;
  }
  return false;
}

/** Lowercase haystack for keyword scans. */
function buildHaystack(input: TagInput): string {
  if (input.text) return input.text.toLowerCase();
  return [input.title, input.description].filter(Boolean).join(' \n ').toLowerCase();
}

/** Locations (or "Anywhere") that are hospitable to Asia / SEA-based talent. */
const ASIA_LOCATION_SIGNALS = [
  'asia', 'southeast', 'south east', 'sea',
  'indonesia', 'indonesian',
  'philippines', 'filipino',
  'india', 'indian',
  'vietnam', 'vietnamese',
  'malaysia', 'malay',
  'singapore',
  'thailand', 'thai',
  'japan', 'japanese',
  'south korea', 'korea',
  'china', 'chinese',
  'taiwan',
  'bangladesh', 'pakistan', 'sri lanka',
  'emea', // broad regions usually mean location-flexible
];

/**
 * Derive a tag for the location field. "Anywhere"/"Worldwide" listings are the
 * most Asia-friendly of all (no location restriction); explicit Asian countries
 * map to "Asia-friendly". Unknown / specific non-Asian locations yield nothing.
 */
function locationTags(location: string | undefined, out: Set<string>): void {
  const loc = (location ?? '').toLowerCase().trim();
  if (!loc) return;
  if (/anywhere|worldwide|global|remote|any location/.test(loc)) {
    out.add('Worldwide');
    out.add('Asia-friendly');
    return;
  }
  if (ASIA_LOCATION_SIGNALS.some((s) => loc.includes(s))) {
    out.add('Asia-friendly');
  }
}

/**
 * Scan a listing and return its auto-generated tags (deduped, rule order
 * preserved so output is stable). Never throws — bad/empty input yields [].
 *
 * @example
 *   autoTag({
 *     title: 'Senior React Engineer',
 *     description: 'Work anywhere. ESOP + health insurance.',
 *     location: 'Anywhere',
 *     salaryCurrency: 'USD',
 *   })
 *   // → ['React.js', 'Senior', 'Equity', 'Health benefits',
 *   //    'Worldwide', 'Asia-friendly', 'USD salary', 'Remote']
 */
export function autoTag(input: TagInput): string[] {
  const haystack = buildHaystack(input);
  const tags = new Set<string>();

  for (const rule of RULES) {
    if (haystack && matchesAny(haystack, rule.keywords)) {
      tags.add(rule.tag);
    }
  }

  locationTags(input.location, tags);

  // Field-derived tags (don't need text scanning).
  if (input.isRemote === true || input.jobType === 'Remote') {
    tags.add('Remote');
  }
  const ccy = (input.salaryCurrency ?? '').trim().toUpperCase();
  if (ccy === 'USD') tags.add('USD salary');
  else if (ccy === 'EUR') tags.add('EUR salary');

  // Preserve RULES order in the output for stability, then append field tags.
  const ordered = RULES.map((r) => r.tag).filter((t) => tags.has(t));
  const fieldExtras = ['Worldwide', 'Asia-friendly', 'Remote', 'USD salary', 'EUR salary'].filter(
    (t) => tags.has(t) && !ordered.includes(t),
  );
  return [...ordered, ...fieldExtras];
}

/**
 * Convenience: build tags from a Gig domain object. Reads the same fields the
 * rule-set cares about, so callers don't have to assemble a TagInput by hand.
 */
export function tagsFromGig(gig: {
  title?: string;
  description?: string;
  descriptionId?: string;
  location?: string;
  category?: string;
  jobType?: string | null;
  salaryCurrency?: string;
  isRemote?: boolean;
}): string[] {
  return autoTag({
    title: gig.title,
    // mapGigRow puts the real DB blurb in `descriptionId` and leaves
    // `description` as '' — prefer the populated one for scanning.
    description: gig.descriptionId || gig.description,
    location: gig.location,
    category: gig.category,
    // Gig.jobType is nullable (legacy rows); autoTag expects a string.
    jobType: gig.jobType ?? undefined,
    salaryCurrency: gig.salaryCurrency,
    isRemote: gig.isRemote,
  });
}
