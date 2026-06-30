/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://skillgig.id',
  generateRobotsTxt: false, // we ship a hand-curated robots.txt in /public
  // Disable next-sitemap's URL discovery — every page is `force-dynamic` so
  // the manifest has nothing for it to enumerate, and `scripts/build-sitemap.js`
  // writes the final sitemap after next-sitemap runs.
  generateIndexSitemap: false,
  exclude: ['/admin', '/admin/*', '/api', '/api/*', '/*'],
};