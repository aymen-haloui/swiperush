import { setTimeout as sleep } from 'timers/promises';
import { fetch } from 'undici';

type Args = {
  url: string;
  email?: string;
  password?: string;
  username?: string;
};

function parseArgs(): Args {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const [key, val] = a.replace(/^--/, '').split('=');
      if (val !== undefined) args[key] = val;
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        args[key] = argv[++i];
      } else {
        args[key] = 'true';
      }
    }
  }
  const url = args.url || process.env.API_URL || '';
  if (!url) {
    console.error('Usage: ts-node scripts/login-smoke.ts --url <API_BASE_URL> [--email <email>] [--password <pwd>]');
    process.exit(1);
  }
  const ts = Date.now();
  const email = args.email || `smoke+${ts}@swiperush.test`;
  const username = args.username || `smokeuser_${ts}`;
  const password = args.password || 'Test12345!';
  return { url, email, password, username };
}

async function json<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    const txt = await (res as any).text().catch(() => '');
    throw new Error(`Non-JSON response: ${res.status} ${res.statusText} ${txt}`);
  }
}

async function main() {
  const { url, email, password, username } = parseArgs();
  const base = url.replace(/\/$/, '');

  console.log(`\n🚬 Login smoke against: ${base}`);
  console.log(`→ email=${email} username=${username}`);

  // Try register
  const regBody = { email, username, password };
  const regRes = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regBody),
  });
  let regJson: any = null;
  try {
    regJson = await json<any>(regRes);
  } catch (e: any) {
    console.error('Register parse error:', e.message);
  }
  console.log(`Register: ${regRes.status} ${regRes.statusText}`);
  if (regJson) console.log('Register response:', JSON.stringify(regJson));

  // If 503 or 500, abort
  if (!regRes.ok && (regRes.status === 503 || regRes.status === 500)) {
    console.error('Backend unhealthy (DB or server error). Aborting.');
    process.exit(2);
  }

  // Wait a bit for DB write
  await sleep(500);

  // Try login
  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginJson: any = await json<any>(loginRes).catch(async (e: any) => {
    const txt = await (loginRes as any).text().catch(() => '');
    console.error('Login response (raw):', txt);
    throw e;
  });
  console.log(`Login: ${loginRes.status} ${loginRes.statusText}`);
  console.log('Login response:', JSON.stringify(loginJson));

  if (!loginRes.ok) {
    console.error('❌ Login failed');
    process.exit(3);
  }

  const token = loginJson?.data?.token || loginJson?.token;
  if (!token) {
    console.error('❌ No token in login response');
    process.exit(4);
  }
  console.log('✅ Token received:', token.slice(0, 16) + '...');

  // Fetch profile
  const profRes = await fetch(`${base}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profJson: any = await json<any>(profRes).catch(async (e: any) => {
    const txt = await (profRes as any).text().catch(() => '');
    console.error('Profile response (raw):', txt);
    throw e;
  });
  console.log(`Profile: ${profRes.status} ${profRes.statusText}`);
  console.log('Profile response:', JSON.stringify(profJson));

  if (!profRes.ok) {
    console.error('❌ Profile fetch failed');
    process.exit(5);
  }

  console.log('\n🎉 Smoke OK');
}

main().catch((e) => {
  console.error('Smoke error:', e);
  process.exit(10);
});
