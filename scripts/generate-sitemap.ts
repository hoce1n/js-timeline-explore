// Generates public/sitemap.xml at build time from the same era/concept data
// and SEO constants the app renders with — no duplicated route lists.
//
//   bun run scripts/generate-sitemap.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { ERAS } from "../src/lib/js-eras";
import { SITE_ORIGIN } from "../src/lib/seo";

const today = new Date().toISOString().slice(0, 10);

type UrlEntry = { loc: string; changefreq: string; priority: string };

const urls: UrlEntry[] = [
  { loc: `${SITE_ORIGIN}/`, changefreq: "weekly", priority: "1.0" },
];

for (const era of ERAS) {
  urls.push({
    loc: `${SITE_ORIGIN}/era/${era.id}`,
    changefreq: "monthly",
    priority: "0.9",
  });
  for (const concept of era.concepts) {
    urls.push({
      loc: `${SITE_ORIGIN}/era/${era.id}/${concept.id}`,
      changefreq: "monthly",
      priority: "0.8",
    });
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const out = resolve(process.cwd(), "public", "sitemap.xml");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, xml, "utf8");
console.log(`sitemap.xml written with ${urls.length} URLs -> ${out}`);
