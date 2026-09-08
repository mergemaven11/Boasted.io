import assert from "node:assert/strict";

const ORIGIN = "https://boasted.io";
const PASSES = 3;
const ROUTES = [
  "/",
  "/robots.txt",
  "/sitemap.xml",
  "/resume-accomplishments",
  "/interview-preparation",
  "/impact-receipts",
  "/pricing",
  "/education",
  "/docs",
  "/docs/education",
  "/how-it-works",
  "/use-cases",
  "/security",
  "/contact",
  "/team",
  "/enterprise",
  "/career-portfolio",
  "/performance-reviews",
  "/promotion-packet",
  "/career-analytics",
  "/public-proof-profiles",
  "/nda-safety",
  "/privacy",
  "/terms",
  "/login",
  "/register",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function probe(route, pass) {
  const url = `${ORIGIN}${route}`;
  const started = performance.now();
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: {
      "user-agent": "Boasted-production-smoke/1.0 (+https://boasted.io)",
      accept: route.endsWith(".xml") ? "application/xml,text/xml;q=0.9,*/*;q=0.8" : "text/html,*/*;q=0.8",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  const elapsed = Math.round(performance.now() - started);
  const server = response.headers.get("server") || "-";
  const via = response.headers.get("via") || "-";
  const renderOrigin = response.headers.get("x-render-origin-server") || "-";
  const requestId = response.headers.get("x-request-id") || "-";
  console.log(
    `PROD ROUTE pass=${pass} status=${response.status} ms=${elapsed} bytes=${body.length} route=${route} server=${server} via=${via} render=${renderOrigin} request_id=${requestId}`,
  );
  assert.equal(response.status, 200, `${url} returned HTTP ${response.status} on pass ${pass}`);
  assert.ok(body.length > 20, `${url} returned an unexpectedly small body (${body.length} bytes) on pass ${pass}`);
  return { route, pass, status: response.status, elapsed, bytes: body.length };
}

const results = [];
for (let pass = 1; pass <= PASSES; pass += 1) {
  for (const route of ROUTES) {
    results.push(await probe(route, pass));
  }
  if (pass < PASSES) await sleep(750);
}

const slowest = [...results].sort((a, b) => b.elapsed - a.elapsed).slice(0, 5);
console.log(`\nProduction route smoke passed ${ROUTES.length} routes × ${PASSES} passes = ${results.length} HTTP 200 responses.`);
console.log(`Slowest checks: ${slowest.map((item) => `${item.route} ${item.elapsed}ms`).join(", ")}`);
