#!/usr/bin/env node
/**
 * Smoke: Grader Speaking list scope vs ACA full staff view.
 * Usage: node scripts/smoke-grader-speaking-scope.js
 * Env: API_BASE (default http://127.0.0.1:5001)
 */
const API = process.env.API_BASE || 'http://127.0.0.1:5001';

async function login(email, password) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`Login failed ${email}: ${r.status}`);
  return j.access_token;
}

async function get(path, token) {
  const r = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

function count(body) {
  return Array.isArray(body) ? body.length : -1;
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERT FAIL: ${msg}`);
}

(async () => {
  const aca = await login('aca@xaloenglish.vn', 'test@123!');
  const phu = await login('aca_1@gmail.com', 'test@123!');
  const linh = await login('aca_2@gmail.com', 'test@123!');
  const sale = await login('sale@xalo.edu.vn', 'Sale@123!');
  const gv = await login('quynhchau.nghiem@xalo.edu.vn', 'Teacher@123!');

  const acaMock = await get('/api/aca/mock-tests', aca);
  const phuMock = await get('/api/aca/mock-tests', phu);
  const linhMock = await get('/api/aca/mock-tests', linh);
  const saleMock = await get('/api/aca/mock-tests', sale);
  const gvMock = await get('/api/aca/mock-tests', gv);

  const acaN = count(acaMock.body);
  const phuN = count(phuMock.body);
  const linhN = count(linhMock.body);
  const saleN = count(saleMock.body);
  const gvN = count(gvMock.body);

  console.log('mock-tests counts', { acaN, phuN, linhN, saleN, gvN });

  assert(acaMock.status === 200 && acaN >= 0, 'ACA mock list ok');
  assert(phuMock.status === 200, 'Phú mock list ok');
  assert(phuN < acaN, `Phú mock (${phuN}) must be < ACA mock (${acaN})`);
  assert(linhN <= acaN, `Linh mock (${linhN}) must be <= ACA (${acaN})`);
  assert(saleN === acaN, `Sale should see full staff list (${saleN} vs ${acaN})`);
  assert(gvN === acaN, `GV should see full staff list (${gvN} vs ${acaN})`);

  // examTeacher only Phú for Phú token
  if (Array.isArray(phuMock.body) && phuMock.body.length) {
    const foreign = phuMock.body.filter((r) => {
      const t = String(r.examTeacher || '').toLowerCase();
      return t && !t.includes('phú') && !t.includes('phu') && !t.includes('grader 1');
    });
    assert(foreign.length === 0, `Phú mock leak examTeacher: ${foreign.slice(0, 3).map((x) => x.examTeacher)}`);
  }

  const acaEn = await get('/api/aca/entrance-bookings', aca);
  const phuEn = await get('/api/aca/entrance-bookings', phu);
  assert(acaEn.status === 200 && phuEn.status === 200, 'entrance status');
  assert(
    count(phuEn.body) <= count(acaEn.body),
    `Phú entrance (${count(phuEn.body)}) <= ACA (${count(acaEn.body)})`,
  );

  const acaFin = await get('/api/aca/final-tests', aca);
  const phuFin = await get('/api/aca/final-tests', phu);
  assert(acaFin.status === 200 && phuFin.status === 200, 'final status');
  assert(
    count(phuFin.body) <= count(acaFin.body),
    `Phú final (${count(phuFin.body)}) <= ACA (${count(acaFin.body)})`,
  );

  console.log('SMOKE PASS');
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
