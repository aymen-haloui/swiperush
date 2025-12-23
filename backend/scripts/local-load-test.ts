/*
  Local Load Test
  - Simulates N concurrent users hitting local API endpoints
  - Reports avg/peak CPU and memory (via pidusage for target PID)
  - Reports requests/sec and latency (avg/max)

  Usage (PowerShell):
    cd backend
    npx ts-node scripts/local-load-test.ts --url http://localhost:5000/api --users 50 --seconds 30 --pid <SERVER_PID>

  To find server PID on Windows:
    netstat -ano | findstr :5000
    # or
    (Get-Process -Name node).Id
*/

import { setTimeout as delay } from 'timers/promises';
import pidusage from 'pidusage';
import { fetch } from 'undici';

type Sample = { url: string; method: string; status: number; ms: number };

const argv = process.argv.slice(2);
const getArg = (key: string, def?: string) => {
  const idx = argv.findIndex(a => a === `--${key}`);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return def;
};

const API_BASE = (getArg('url') || 'http://localhost:5000/api').replace(/\/$/, '');
const USERS = Number(getArg('users', '50'));
const SECONDS = Number(getArg('seconds', '30'));
const PID = Number(getArg('pid', '0')) || 0; // server PID to monitor; 0 means skip
const SERVER_BASE = API_BASE.replace(/\/api$/, '');

// Fallback endpoints if API root doesn't enumerate routes
const fallbackEndpoints: { method: 'GET'|'POST'; path: string; body?: any }[] = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/health/db' },
  { method: 'GET', path: '/leaderboard' },
  { method: 'GET', path: '/leaderboard/stats' },
  { method: 'GET', path: '/categories' },
  { method: 'GET', path: '/levels' },
  { method: 'GET', path: '/challenges' },
];

async function discoverEndpoints(): Promise<{ method: 'GET'|'POST'; path: string; body?: any }[]> {
  try {
    const resp = await fetch(`${API_BASE}/`);
    if (!resp.ok) return fallbackEndpoints;
    const info: any = await resp.json();
    const eps: { method: 'GET'|'POST'; path: string }[] = [];
    const groups = info?.endpoints || {};
    for (const group of Object.values(groups)) {
      for (const val of Object.values(group as Record<string,string>)) {
        const [method, path] = String(val).split(' ');
        if ((method === 'GET' || method === 'POST') && path?.startsWith('/')) {
          eps.push({ method: method as any, path });
        }
      }
    }
    // Ensure health endpoints are hit via SERVER_BASE
    return eps.length ? eps : fallbackEndpoints;
  } catch {
    return fallbackEndpoints;
  }
}

async function registerAndLogin(userIdx: number) {
  const email = `load_local_${Date.now()}_${userIdx}@example.com`;
  const username = `ll_user_${userIdx}_${Math.floor(Math.random()*10000)}`;
  const password = 'Passw0rd!';
  await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  }).catch(() => null);
  const loginResp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!loginResp.ok) throw new Error(`Login failed: ${loginResp.status}`);
  const loginData: any = await loginResp.json();
  const token = loginData?.data?.token || loginData?.token;
  return token as string;
}

async function hit(endpoint: { method: 'GET'|'POST'; path: string; body?: any }, token?: string): Promise<Sample> {
  const isHealth = endpoint.path.startsWith('/health');
  const url = isHealth ? `${SERVER_BASE}${endpoint.path}` : `${API_BASE}${endpoint.path}`;
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
  return { url, method: endpoint.method, status: resp.status, ms };
}

async function main() {
  console.log(`Local load test: ${USERS} users for ${SECONDS}s against ${API_BASE}`);
  const endpoints = await discoverEndpoints();
  const samples: Sample[] = [];
  const cpuSamples: number[] = [];
  const memSamples: number[] = [];

  // Metrics sampler for target PID (server)
  const metricsStop = { stop: false };
  (async () => {
    if (!PID) return; // skip if no PID
    const end = Date.now() + SECONDS * 1000;
    while (Date.now() < end && !metricsStop.stop) {
      try {
        const stats = await pidusage(PID);
        cpuSamples.push(stats.cpu); // percentage
        memSamples.push(stats.memory); // bytes
      } catch {
        // ignore sampling errors
      }
      await delay(1000);
    }
  })();

  // Create concurrent user tasks
  const tasks = Array.from({ length: USERS }, (_v, i) => i).map(async (i) => {
    let token: string | undefined;
    try {
      token = await registerAndLogin(i);
    } catch {
      // proceed unauthenticated
    }

    const end = Date.now() + SECONDS * 1000;
    while (Date.now() < end) {
      for (const ep of endpoints) {
        try {
          const s = await hit(ep, token);
          samples.push(s);
        } catch {
          // ignore
        }
      }
      // Also hit profile if token available
      if (token) {
        try {
          const s = await hit({ method: 'GET', path: '/auth/profile' }, token);
          samples.push(s);
        } catch {
          // ignore
        }
      }
    }
  });

  const started = Date.now();
  await Promise.all(tasks);
  metricsStop.stop = true;
  const durationSec = (Date.now() - started) / 1000;

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
  console.log('--- Local Load Test Report ---');
  console.log(`Duration: ${durationSec.toFixed(1)}s`);
  console.log(`Users: ${USERS}`);
  console.log(`Requests: ${total}`);
  console.log(`Requests/sec: ${rps.toFixed(2)}`);
  console.log(`Latency avg: ${avg.toFixed(2)} ms`);
  console.log(`Latency max: ${max.toFixed(2)} ms`);
  if (cpuAvg != null) {
    console.log(`CPU avg: ${cpuAvg.toFixed(2)}%`);
    console.log(`CPU peak: ${cpuMax!.toFixed(2)}%`);
  } else {
    console.log('CPU: No PID provided, skipping CPU metrics. Pass --pid <SERVER_PID>');
  }
  if (memAvg != null) {
    console.log(`Memory RSS avg: ${(memAvg/1024/1024).toFixed(2)} MB`);
    console.log(`Memory RSS peak: ${(memMax!/1024/1024).toFixed(2)} MB`);
  } else {
    console.log('Memory: No PID provided, skipping memory metrics. Pass --pid <SERVER_PID>');
  }
}

main().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
});
