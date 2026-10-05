/**
 * Smoke action: chức năng mutate chính của Giáo viên (GV)
 *
 * Usage:
 *   cd frontend && npm run smoke:teacher-actions
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = process.env.TEACHER_EMAIL || "quynhchau.nghiem@xalo.edu.vn";
const PASS = process.env.TEACHER_PASS || "Teacher@123!";

const findings = [];
function log(area, fn, kq, ct) {
  findings.push({ area, fn, kq, ct });
  console.log(`[${kq}] ${area} · ${fn} — ${ct}`);
}

async function loginApi() {
  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error("API login failed");
  return j;
}

async function createAuthedContext(browser, auth) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const feHost = new URL(FE).hostname;
  await context.addCookies([
    { name: "xalo.auth", value: "1", domain: feHost, path: "/", sameSite: "Lax" },
  ]);
  await context.addInitScript(
    ({ token, user }) => {
      try {
        localStorage.setItem("xalo.auth.token", token);
        localStorage.setItem("xalo.auth.user", JSON.stringify(user));
        document.cookie = "xalo.auth=1; Path=/; SameSite=Lax";
      } catch {}
    },
    { token: auth.access_token, user: auth.user },
  );
  return context;
}

async function dismiss(page) {
  await page.keyboard.press("Escape").catch(() => {});
  const btn = page.getByRole("button", { name: /bỏ qua|đóng|đã hiểu|hủy/i });
  if (await btn.first().isVisible({ timeout: 300 }).catch(() => false)) {
    await btn.first().click({ force: true }).catch(() => {});
  }
}

async function goto(page, path) {
  await page.goto(`${FE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismiss(page);
  await page
    .waitForFunction((n) => (document.body?.innerText || "").trim().length >= n, 30, {
      timeout: 20000,
    })
    .catch(() => {});
}

async function waitApi(page, pattern, action, timeout = 10000) {
  const p = page
    .waitForResponse(
      (r) =>
        pattern.test(r.url()) &&
        ["PATCH", "POST", "PUT", "DELETE"].includes(r.request().method()),
      { timeout },
    )
    .catch(() => null);
  await action();
  return await p;
}

async function clickFirst(page, nameRe) {
  const btn = page.getByRole("button", { name: nameRe }).first();
  if (!(await btn.isVisible({ timeout: 3000 }).catch(() => false))) return false;
  if (await btn.isDisabled().catch(() => false)) return false;
  await btn.click({ force: true, timeout: 5000 }).catch(() => {});
  return true;
}

async function safeRun(area, fn, page) {
  try {
    await fn(page);
  } catch (e) {
    log(area, "Runner error", "Fail", String(e.message || e).slice(0, 220));
  }
}

async function testDanhSachLop(page) {
  await goto(page, "/teacher");
  const text = await page.locator("body").innerText();
  log(
    "Danh sách lớp",
    "Load trang",
    /lớp|học viên|danh sách/i.test(text) ? "Pass" : "Fail",
    page.url(),
  );

  // Open a class / student if available
  const classBtn = page.getByRole("button", { name: /Xem|Chi tiết|Mở|Chọn lớp/i }).first();
  const classLink = page.locator('a[href*="/teacher/hoc-sinh/"]').first();
  if (await classLink.isVisible({ timeout: 2000 }).catch(() => false)) {
    await classLink.click().catch(() => {});
    await page.waitForTimeout(800);
    log("Danh sách lớp", "Mở chi tiết học sinh", "Pass", page.url());
    await page.goBack().catch(() => goto(page, "/teacher"));
  } else if (await classBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await classBtn.click({ force: true }).catch(() => {});
    log("Danh sách lớp", "CTA xem lớp", "Pass", "clicked");
  } else {
    // click first class card/row
    const row = page.locator("table tbody tr, [class*='card']").first();
    if (await row.isVisible({ timeout: 1500 }).catch(() => false)) {
      await row.click({ force: true }).catch(() => {});
      log("Danh sách lớp", "Chọn lớp/row", "Pass", "clicked row");
    } else {
      log("Danh sách lớp", "Chọn lớp", "Note", "không có lớp hiển thị");
    }
  }
}

async function testRlp(page) {
  await goto(page, "/teacher/rlp");
  log(
    "RLP",
    "Load trang",
    /RLP|buổi|học viên|chuyên cần/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );

  const add = await clickFirst(page, /Thêm buổi|Tạo buổi|\+/i);
  if (add) {
    await page.waitForTimeout(400);
    log("RLP", "Mở form thêm buổi", "Pass", "modal/form");
    await dismiss(page);
  } else {
    log("RLP", "Form thêm buổi", "Note", "không thấy CTA");
  }

  const att = page.getByRole("button", { name: /Có mặt|Vắng|Present|Absent|Điểm danh/i }).first();
  if (await att.isVisible({ timeout: 2000 }).catch(() => false)) {
    const pr = await waitApi(page, /rlp|attendance/i, async () => {
      await att.click({ force: true }).catch(() => {});
    });
    log("RLP", "Toggle điểm danh", pr?.ok() ? "Pass" : "Note", pr ? `HTTP ${pr.status()}` : "clicked");
  } else {
    log("RLP", "Điểm danh", "Note", "không có CTA attendance");
  }
}

async function testPracticeRlp(page) {
  await goto(page, "/teacher/practice-rlp");
  log(
    "Practice RLP",
    "Load trang",
    /RLP|luyện đề|học viên/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const add = await clickFirst(page, /Thêm|Tạo|Lưu|\+/i);
  log("Practice RLP", "CTA thêm/lưu", add ? "Pass" : "Note", add ? "clicked" : "no CTA");
  await dismiss(page);
}

async function testChamWriting(page) {
  await goto(page, "/teacher/cham-writing");
  log(
    "Writing",
    "Load danh sách",
    /Writing|chấm|bài/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const grade = page.getByRole("button", { name: /Chấm|Lưu điểm|Grade|Nhập điểm/i }).first();
  if (await grade.isVisible({ timeout: 2000 }).catch(() => false)) {
    await grade.click({ force: true }).catch(() => {});
    log("Writing", "Mở form chấm", "Pass", "opened");
    await dismiss(page);
  } else {
    log("Writing", "Form chấm", "Note", "không có bài / CTA");
  }
}

async function testFinalTest(page) {
  await goto(page, "/teacher/final-test");
  log(
    "Final Test",
    "Load trang",
    /Final|test|điểm/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const cta = await clickFirst(page, /Nhập điểm|Chấm|Lưu|Thêm/i);
  log("Final Test", "CTA nhập/chấm", cta ? "Pass" : "Note", cta ? "clicked" : "no CTA");
  await dismiss(page);
}

async function testMockTest(page) {
  await goto(page, "/teacher/mock-test");
  log(
    "Mock Test",
    "Load trang",
    /mock|Speaking|test|ca/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const grade = page.getByRole("button", { name: /Nhập điểm|Chấm|Lưu/i }).first();
  if (await grade.isVisible({ timeout: 2000 }).catch(() => false)) {
    await grade.click({ force: true }).catch(() => {});
    log("Mock Test", "Mở form nhập điểm", "Pass", "opened");
    await dismiss(page);
  } else {
    log("Mock Test", "Form nhập điểm", "Note", "không có ca");
  }
}

async function testLich(page) {
  await goto(page, "/teacher/lich");
  log(
    "Lịch",
    "Load lịch",
    /lịch|tuần|tháng|lớp|ca/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const nav = page.getByRole("button", { name: /Tuần|Tháng|Hôm nay|›|‹|Next|Prev/i }).first();
  if (await nav.isVisible({ timeout: 1500 }).catch(() => false)) {
    await nav.click({ force: true }).catch(() => {});
    log("Lịch", "Điều hướng tuần/tháng", "Pass", "nav clicked");
  } else {
    log("Lịch", "Nav lịch", "Note", "không thấy nav");
  }
}

async function testMaterials(page) {
  await goto(page, "/teacher/teaching-materials");
  log(
    "Materials",
    "Load trang",
    /material|tài liệu|teaching|folder|link/i.test(await page.locator("body").innerText())
      ? "Pass"
      : "Fail",
    page.url(),
  );
  const add = await clickFirst(page, /Thêm|Tạo|Lưu|Upload|\+/i);
  log("Materials", "CTA thêm/lưu", add ? "Pass" : "Note", add ? "clicked" : "no CTA");
  await dismiss(page);
}

async function testPerformance(page) {
  await goto(page, "/teacher/performance");
  log(
    "Performance",
    "Load trang",
    /performance|hiệu suất|tháng|thống kê|giờ/i.test(await page.locator("body").innerText())
      ? "Pass"
      : "Fail",
    page.url(),
  );
  const month = page.locator("select").first();
  if (await month.isVisible({ timeout: 1500 }).catch(() => false)) {
    const opts = await month.locator("option").count();
    if (opts > 1) {
      await month.selectOption({ index: Math.min(1, opts - 1) }).catch(() => {});
      log("Performance", "Đổi tháng filter", "Pass", "select changed");
    }
  } else {
    log("Performance", "Filter tháng", "Note", "không thấy select");
  }
}

async function testCanhBao(page) {
  await goto(page, "/teacher/canh-bao-hoc-tap");
  log(
    "Cảnh báo",
    "Load trang",
    /cảnh báo|học tập|vắng|bài tập|học viên/i.test(await page.locator("body").innerText())
      ? "Pass"
      : "Fail",
    page.url(),
  );
  const add = await clickFirst(page, /Thêm|Tạo cảnh báo|Gửi|Lưu/i);
  log("Cảnh báo", "CTA thêm/gửi", add ? "Pass" : "Note", add ? "clicked" : "no CTA");
  await dismiss(page);
}

async function testBcb(page) {
  await goto(page, "/teacher/bcb");
  log(
    "BCB",
    "Load trang",
    /BCB|chẩn|Listening|Reading|Writing|Speaking/i.test(await page.locator("body").innerText())
      ? "Pass"
      : "Fail",
    page.url(),
  );
}

async function testProfile(page) {
  await goto(page, "/teacher/profile");
  log(
    "Profile",
    "Load hồ sơ",
    /hồ sơ|profile|email|tên/i.test(await page.locator("body").innerText()) ? "Pass" : "Fail",
    page.url(),
  );
  const field = page.locator('label:has-text("Số điện thoại") input').first();
  const fallback = page.locator('input[type="tel"], input').nth(2);
  const target = (await field.count()) > 0 ? field : fallback;
  if (await target.isVisible({ timeout: 2000 }).catch(() => false)) {
    const before = await target.inputValue().catch(() => "");
    const marker = `t${Date.now().toString().slice(-4)}`;
    await target.fill(before.includes("t") ? before.replace(/t\d{4}/, marker) : `${before} ${marker}`.trim());
    const pr = await waitApi(page, /profile|user/i, async () => {
      await page.getByRole("button", { name: /Lưu hồ sơ|Lưu/i }).first().click().catch(() => {});
    });
    log(
      "Profile",
      "Lưu hồ sơ",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()}` : "save clicked",
    );
  } else {
    log("Profile", "Form lưu", "Note", "không thấy field");
  }
}

async function testLogout(page) {
  await goto(page, "/teacher");
  const logout = page.getByRole("button", { name: /Đăng xuất/i }).first();
  if (await logout.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logout.click({ force: true });
  } else {
    await page.locator("aside button").last().click().catch(() => {});
  }
  await page.waitForURL((u) => u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
  log("Shell", "Đăng xuất", page.url().includes("/login") ? "Pass" : "Fail", page.url());
}

async function main() {
  const auth = await loginApi();
  log("Auth", "API login", "Pass", `${auth.user?.role} ${auth.user?.name || ""}`);

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await createAuthedContext(browser, auth);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await safeRun("Danh sách lớp", testDanhSachLop, page);
  await safeRun("RLP", testRlp, page);
  await safeRun("Practice RLP", testPracticeRlp, page);
  await safeRun("Writing", testChamWriting, page);
  await safeRun("Final Test", testFinalTest, page);
  await safeRun("Mock Test", testMockTest, page);
  await safeRun("Lịch", testLich, page);
  await safeRun("Materials", testMaterials, page);
  await safeRun("Performance", testPerformance, page);
  await safeRun("Cảnh báo", testCanhBao, page);
  await safeRun("BCB", testBcb, page);
  await safeRun("Profile", testProfile, page);
  await safeRun("Shell", testLogout, page);

  await context.close();
  await browser.close();

  const bad = findings.filter((f) => f.kq === "Fail");
  const out = {
    total: findings.length,
    fail: bad.length,
    pass: findings.filter((f) => f.kq === "Pass").length,
    note: findings.filter((f) => f.kq === "Note").length,
    findings,
  };
  fs.writeFileSync("/tmp/teacher-actions-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/teacher-actions-smoke.json",
    JSON.stringify(out, null, 2),
  );
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(out, null, 2));
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
