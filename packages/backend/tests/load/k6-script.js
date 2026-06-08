import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "2m", target: 100 },  // Ramp up to 100 users
    { duration: "5m", target: 500 },  // Ramp to 500 users
    { duration: "2m", target: 1000 }, // Ramp to 1000 users
    { duration: "3m", target: 1000 }, // Stay at 1000
    { duration: "2m", target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ["rate<0.05"], // Error rate < 5%
    http_req_duration: ["p(95)<2000"], // 95% of requests < 2s
  },
};

const BASE_URL = "http://localhost:8080/api";

export default function () {
  // Scenario 1: Create lot
  const createPayload = JSON.stringify({
    owner: `farmer_${__VU}`,
    culture: "Cacao",
    quantite: Math.random() * 1000,
    parcelle_id: `parcelle_${__VU}`,
  });

  const createResp = http.post(`${BASE_URL}/lots`, createPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(createResp, {
    "create lot status 201": (r) => r.status === 201,
  }) || errorRate.add(1);

  // Scenario 2: Scan QR (every other iteration)
  if (__ITER % 2 === 0) {
    const scanResp = http.post(`${BASE_URL}/scan`, JSON.stringify({
      qr_data: `hash_${__VU}_${__ITER}`,
    }), {
      headers: { "Content-Type": "application/json" },
    });

    check(scanResp, {
      "scan status is 200 or 404": (r) => r.status === 200 || r.status === 404,
    }) || errorRate.add(1);
  }

  sleep(1);
}
