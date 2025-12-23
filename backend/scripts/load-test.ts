/*
  Load Test Script
  - Simulates 50 concurrent users
  - Hits core API endpoints
  - Reports CPU %, memory (rss), requests/sec, avg + max response time
  Usage:
    npx ts-node backend/scripts/load-test.ts --url https://swiperush.onrender.com/api --seconds 30
*/

import { setTimeout as delay } from 'timers/promises';
import { fetch } from 'undici';

type Sample = { url: string; method: string; status: number; ms: number };

const argv = process.argv.slice(2);
const getArg = (key: string, def?: string) => {
  const idx = argv.findIndex(a => a === `--${key}`);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return def;
};

const API_BASE = (getArg('url') || process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const USERS = Number(getArg('users', '50'));
const SECONDS = Number(getArg('seconds', '30'));
const SERVER_BASE = API_BASE.replace(/\/api$/, '');

const endpointsPublic: { method: 'GET' | 'POST'; path: string; body?: any }[] = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/health', },
  { method: 'GET', path: '/health/db', },
  { method: 'GET', path: '/leaderboard' },
  { method: 'GET', path: '/leaderboard/stats' },
  { method: 'GET', path: '/categories' },
  { method: 'GET', path: '/levels' },
  { method: 'GET', path: '/challenges' },
];

async function registerAndLogin(userIdx: number) {
  const email = `loadtest_${Date.now()}_${userIdx}@example.com`;
  const username = `lt_user_${userIdx}_${Math.floor(Math.random()*10000)}`;
  const password = 'Passw0rd!';
  const registerResp = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  }).catch(() => null);
  if (!registerResp || !registerResp.ok) {
    // If register fails (duplicate or disabled), try login
  }
  const loginResp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!loginResp.ok) throw new Error(`Login failed: ${loginResp.status}`);
  const loginData = await loginResp.json();
  const token = loginData?.data?.token || loginData?.token;
  return token as string;
}

async function hit(endpoint: { method: 'GET'|'POST'; path: string; body?: any }, token?: string): Promise<Sample> {
  const url = endpoint.path.startsWith('/health') ? `${SERVER_BASE}${endpoint.path}` : `${API_BASE}${endpoint.path}`;
  const start = performance.now();
  const resp = await fetch(url, {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
  });
  const ms = performance.now() - start;
  // Avoid parsing payload to reduce overhead in the load script
  return { url, method: endpoint.method, status: resp.status, ms };
}

async function sampleMetrics() {
  try {
    const resp = await fetch(`${SERVER_BASE}/metrics`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      cpuPercent: Number(data?.cpu?.percent ?? 0),
      rss: Number(data?.memory?.rss ?? 0),
      heapUsed: Number(data?.memory?.heapUsed ?? 0)
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Running load test: ${USERS} users for ${SECONDS}s against ${API_BASE}`);
  const samples: Sample[] = [];
  const cpuSamples: number[] = [];
  const memSamples: number[] = [];

  // Start metrics sampler
  const metricsStop = { stop: false };
  (async () => {
    const end = Date.now() + SECONDS * 1000;
    while (Date.now() < end && !metricsStop.stop) {
      const m = await sampleMetrics();
      if (m) {
        cpuSamples.push(m.cpuPercent);
        memSamples.push(m.rss);
      }
      await delay(1000);
    }
  })();

  // Create 50 concurrent user tasks
  const tasks = Array.from({ length: USERS }, (_v, i) => i).map(async (i) => {
    let token: string | undefined;
    try {
      token = await registerAndLogin(i);
    } catch (e) {
      // proceed without token for public endpoints
    }

    const end = Date.now() + SECONDS * 1000;
    while (Date.now() < end) {
      // Hit all public endpoints
      for (const ep of endpointsPublic) {
        try {
          const s = await hit(ep, token);
          samples.push(s);
        } catch {
          /* ignore errors */
          void 0;
        }
      }
      // If logged in, also hit profile
      if (token) {
        try {
          const s = await hit({ method: 'GET', path: '/auth/profile' }, token);
          samples.push(s);
        } catch {
          /* ignore errors */
          void 0;
        }
      }
    }
  });

  const started = Date.now();
  await Promise.all(tasks);
  const durationSec = (Date.now() - started) / 1000;
  metricsStop.stop = true;

  // Aggregate
  const total = samples.length;
  const rps = total / durationSec;
  const latencies = samples.map(s => s.ms).sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const max = latencies[latencies.length - 1] || 0;
  const cpuAvg = cpuSamples.length ? cpuSamples.reduce((a,b)=>a+b,0)/cpuSamples.length : null;
  const cpuMax = cpuSamples.length ? Math.max(...cpuSamples) : null;
  const memAvg = memSamples.length ? memSamples.reduce((a,b)=>a+b,0)/memSamples.length : null;
  const memMax = memSamples.length ? Math.max(...memSamples) : null;

  // Report
  console.log('--- Load Test Report ---');
  console.log(`Duration: ${durationSec.toFixed(1)}s`);
  console.log(`Users: ${USERS}`);
  console.log(`Requests: ${total}`);
  console.log(`Requests/sec: ${rps.toFixed(2)}`);
  console.log(`Latency avg: ${avg.toFixed(2)} ms`);
  console.log(`Latency max: ${max.toFixed(2)} ms`);
  if (cpuAvg != null) {
    console.log(`CPU avg: ${cpuAvg.toFixed(2)}%`);
    console.log(`CPU max: ${cpuMax!.toFixed(2)}%`);
  } else {
    console.log('CPU: metrics endpoint not available (skipped)');
  }
  if (memAvg != null) {
    console.log(`Memory RSS avg: ${(memAvg/1024/1024).toFixed(2)} MB`);
    console.log(`Memory RSS max: ${(memMax!/1024/1024).toFixed(2)} MB`);
  } else {
    console.log('Memory: metrics endpoint not available (skipped)');
  }
}

main().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
});
