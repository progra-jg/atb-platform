import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 50 },
    { duration: "3m", target: 300 },
    { duration: "2m", target: 1000 },
    { duration: "2m", target: 1000 },
    { duration: "1m", target: 0 },
  ],
};

const BASE_URL = "http://localhost:8080/api";

export default function () {
  const scenario = Math.floor(Math.random() * 3);

  switch (scenario) {
    case 0: {
      // Create lot
      const res = http.post(`${BASE_URL}/lots`, JSON.stringify({
        owner: `farmer_${__VU}`, culture: "Cacao",
        quantite: 1000, parcelle_id: `p_${__VU}`,
      }), { headers: { "Content-Type": "application/json" } });
      check(res, { "create lot": (r) => r.status === 201 });
      break;
    }
    case 1: {
      // Scan QR
      const res = http.post(`${BASE_URL}/scan`, JSON.stringify({
        qr_data: `hash_${__VU}`,
      }), { headers: { "Content-Type": "application/json" } });
      check(res, { "scan": (r) => r.status === 200 || r.status === 404 });
      break;
    }
    case 2: {
      // Transfer
      const res = http.post(`${BASE_URL}/transfer`, JSON.stringify({
        lot_id: `${__VU}`, from: "farmer", to: "coop",
        signature: "0xsig", location: "Bénin",
      }), { headers: { "Content-Type": "application/json" } });
      check(res, { "transfer": (r) => r.status === 201 || r.status === 400 });
      break;
    }
  }

  sleep(1);
}
