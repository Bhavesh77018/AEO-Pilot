// Submit AEO Pilot's URLs to IndexNow → instantly notifies Bing (powers
// Microsoft Copilot), Yandex, DuckDuckGo, Naver, Seznam, etc.
//
// Run AFTER the key file is live (it ships in frontend/public):
//   node scripts/indexnow.mjs
//
// The key file must be reachable at https://<HOST>/<KEY>.txt — it already is,
// via frontend/public/<KEY>.txt, once the site is deployed.

const HOST = process.env.INDEXNOW_HOST || "aeopilot.in";
const KEY = "a3f8c1e94b2d47f6a0e5d8c3b6f1029e";

const paths = ["", "learn", "guides", "comparisons", "glossary", "use-cases", "faq"];
const urlList = paths.map((p) => `https://${HOST}/${p}`.replace(/\/$/, "") || `https://${HOST}/`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }),
});

console.log(`IndexNow → ${res.status} ${res.statusText}`);
console.log(`Submitted ${urlList.length} URLs:`);
urlList.forEach((u) => console.log("  " + u));
if (res.status === 200 || res.status === 202) {
  console.log("✓ Accepted. Bing/Yandex/DuckDuckGo will crawl shortly.");
} else {
  console.log("⚠ Non-success. Most common cause: the key file isn't live yet at",
    `https://${HOST}/${KEY}.txt`);
}
