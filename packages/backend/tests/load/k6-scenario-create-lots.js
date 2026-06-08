import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    create_lots: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "2m", target: 200 },
        { duration: "1m", target: 500 },
        { duration: "2m", target: 500 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.02"],
  },
};

const BASE_URL = "http://localhost:8080/api";

export default function () {
  const cultures = ["Cacao", "Coton", "Anacarde", "Café", "Maïs"];

  const payload = JSON.stringify({
    owner: `farmer_${__VU}`,
    culture: cultures[Math.floor(Math.random() * cultures.length)],
    quantite: Math.floor(Math.random() * 5000) + 100,
    parcelle_id: `parcelle_${__VU}_${__ITER}`,
  });

  const res = http.post(`${BASE_URL}/lots`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 201": (r) => r.status === 201,
    "response has hash": (r) => r.json("hash") !== undefined,
  });

  sleep(0.5);
}
