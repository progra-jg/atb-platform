import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    transfers: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "3m", target: 100 },
        { duration: "2m", target: 200 },
        { duration: "2m", target: 0 },
      ],
    },
  },
};

const BASE_URL = "http://localhost:8080/api";

export default function () {
  const payload = JSON.stringify({
    lot_id: `lot_${__VU}_${__ITER}`,
    from: `farmer_${__VU}`,
    to: `cooperative_${Math.floor(Math.random() * 10)}`,
    signature: `0x${Math.random().toString(16).slice(2)}`,
    location: `Bénin-${Math.floor(Math.random() * 12)}`,
  });

  const res = http.post(`${BASE_URL}/transfer`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 201 or 400": (r) => r.status === 201 || r.status === 400,
  });

  sleep(0.2);
}
