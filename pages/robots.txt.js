import { SITE_URL } from "@/data/site";

export async function getServerSideProps({ res }) {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join("\n");

  res.setHeader("Content-Type", "text/plain");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
