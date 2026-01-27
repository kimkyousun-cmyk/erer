const baseUrl = process.env.CRON_BASE_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is required to run cron:test");
  process.exit(1);
}

async function hit(path) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-cron-secret": secret,
      "content-type": "application/json"
    }
  });
  const body = await res.json().catch(() => ({}));
  console.log(path, res.status, body);
}

await hit("/api/cron/hourly");
await hit("/api/cron/daily");
