#!/usr/bin/env node
/**
 * Migration script: organize existing uploads into the structured folders:
 * /uploads/challenges/{challengeId}/image.{ext}
 * /uploads/challenges/{challengeId}/stages/{stageId}/qr.{ext}
 *
 * It will:
 * - create folders if they don't exist
 * - move files if found in the uploads root or legacy location
 * - update the Prisma DB `challenge.image` and `stage.qrCode` fields with the new relative path
 *
 * Usage: from repo root:
 *   node backend/scripts/migrateUploads.js
 *
 * Make sure DATABASE_URL is set in environment or .env and run `npx prisma generate` first.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'backend', 'uploads');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeRel(p) {
  if (!p) return p;
  return p.replace(/\\/g, '/').replace(/^\/+/, '');
}

async function migrate() {
  console.log('Upload dir:', uploadDir);
  await ensureDir(uploadDir);

  // Fetch challenges
  const challenges = await prisma.challenge.findMany({ select: { id: true, image: true, stages: { select: { id: true, qrCode: true } } } });

  for (const c of challenges) {
    const challengeDir = path.join(uploadDir, 'challenges', c.id);
    await ensureDir(challengeDir);

    // Handle challenge image
    if (c.image) {
      const current = normalizeRel(c.image);
      // If already in proper path, ensure file exists
      if (current.startsWith('challenges/')) {
        const full = path.join(uploadDir, current);
        if (!fs.existsSync(full)) {
          console.warn(`Missing file for challenge ${c.id}: ${full}`);
        }
        continue;
      }

      // Try to find the file in uploads root or provided path
      const candidates = [
        path.join(uploadDir, current),
        path.join(uploadDir, path.basename(current)),
      ];

      let found = null;
      for (const cand of candidates) {
        if (fs.existsSync(cand)) { found = cand; break; }
      }

      if (!found) {
        console.warn(`Could not find image for challenge ${c.id} (db value: ${c.image})`);
      } else {
        const ext = path.extname(found) || '.jpg';
        const dest = path.join(challengeDir, 'image' + ext);
        fs.renameSync(found, dest);
        const rel = normalizeRel(path.join('challenges', c.id, path.basename(dest)));
        await prisma.challenge.update({ where: { id: c.id }, data: { image: rel } });
        console.log(`Moved ${found} -> ${dest}`);
      }
    }

    // Handle stages' QR codes
    for (const s of c.stages || []) {
      const stageDir = path.join(uploadDir, 'challenges', c.id, 'stages', s.id);
      await ensureDir(stageDir);

      if (!s.qrCode) continue;
      const current = normalizeRel(s.qrCode);
      if (current.startsWith('challenges/')) {
        const full = path.join(uploadDir, current);
        if (!fs.existsSync(full)) console.warn(`Missing QR for stage ${s.id}: ${full}`);
        continue;
      }

      const candidates = [
        path.join(uploadDir, current),
        path.join(uploadDir, path.basename(current)),
      ];
      let found = null;
      for (const cand of candidates) {
        if (fs.existsSync(cand)) { found = cand; break; }
      }
      if (!found) {
        console.warn(`Could not find QR for stage ${s.id} (db: ${s.qrCode})`);
      } else {
        const ext = path.extname(found) || '.png';
        const dest = path.join(stageDir, 'qr' + ext);
        fs.renameSync(found, dest);
        const rel = normalizeRel(path.join('challenges', c.id, 'stages', s.id, path.basename(dest)));
        await prisma.stage.update({ where: { id: s.id }, data: { qrCode: rel } });
        console.log(`Moved ${found} -> ${dest}`);
      }
    }
  }

  console.log('Migration complete');
  await prisma.$disconnect();
}

migrate().catch(async (err) => {
  console.error('Migration error:', err);
  try { await prisma.$disconnect(); } catch(e){}
  process.exit(1);
});
