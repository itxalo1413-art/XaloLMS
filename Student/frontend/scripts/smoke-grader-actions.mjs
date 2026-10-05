/**
 * Smoke action: chức năng mutate chính của Grader
 *
 * Usage:
 *   cd frontend && npm run smoke:grader-actions
 */
import { chromium } from "playwright";
import fs from "fs";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = process.env.GRADER_EMAIL || "aca_1@gmail.com";
const PASS = process.env.GRADER_PASS || "test@123!";

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

async function testWriting(page) {
  await goto(page, "/grader/cham-writing");
  const text = await page.locator("body").innerText();
  log(
    "Writing",
    "Load danh sách (scoped)",
    /Writing|chấm|bài|không có|empty|pending|graded/i.test(text) ? "Pass" : "Fail",
    page.url(),
  );

  // Open grade / detail if any row action
  const gradeBtn = page
    .getByRole("button", { name: /Chấm|Lưu điểm|Grade|Nhập điểm|Chi tiết|Sửa/i })
    .first();
  if (await gradeBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await gradeBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    const panel = await page.getByText(/điểm|band|criteria|Task|feedback|link/i).count();
    log("Writing", "Mở form chấm", panel > 0 ? "Pass" : "Note", "grade UI");

    const scoreInput = page
      .locator('input[type="number"], input[placeholder*="điểm" i], input[placeholder*="band" i]')
      .first();
    if (await scoreInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await scoreInput.fill("6.5").catch(() => {});
      const pr = await waitApi(page, /writing/i, async () => {
        await page.getByRole("button", { name: /Lưu|Xác nhận|Graded|Hoàn thành/i }).first().click().catch(() => {});
      });
      log(
        "Writing",
        "Lưu điểm (nếu có bài)",
        pr?.ok() ? "Pass" : "Note",
        pr ? `HTTP ${pr.status()}` : "save clicked / no mutate API",
      );
    } else {
      log("Writing", "Nhập điểm", "Note", "không thấy input điểm (có thể empty queue)");
    }
    await dismiss(page);
  } else {
    log("Writing", "Form chấm", "Note", "không có bài assigned / CTA");
  }

  // Ensure grader cannot assign/reassign
  const assign = page.getByRole("button", { name: /Phân grader|Gán grader|Assign/i }).first();
  if (await assign.isVisible({ timeout: 1000 }).catch(() => false)) {
    log("Writing", "Phân grader (ACA-only)", "Note", "CTA vẫn hiện — kiểm tra quyền khi click");
  } else {
    log("Writing", "Không hiện phân grader", "Pass", "scoped grader UI");
  }
}

async function testSpeaking(page) {
  await goto(page, "/grader/test-speaking");
  const text = await page.locator("body").innerText();
  log(
    "Speaking",
    "Load danh sách",
    /Speaking|đăng ký|ca|mock/i.test(text) ? "Pass" : "Fail",
    page.url(),
  );

  const add = await clickFirst(page, /Thêm đăng ký|Tạo ca|Thêm ca|\+/i);
  if (add) {
    await page.waitForTimeout(500);
    const modal = await page.getByText(/học viên|ngày|giờ|Speaking|xác nhận/i).count();
    log("Speaking", "Mở form thêm ca", modal > 0 ? "Pass" : "Note", "modal");
    await dismiss(page);
  } else {
    log("Speaking", "Form thêm ca", "Note", "không thấy CTA");
  }

  const grade = page.getByRole("button", { name: /Chấm|Nhập điểm|Lưu điểm/i }).first();
  if (await grade.isVisible({ timeout: 2000 }).catch(() => false)) {
    await grade.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    log("Speaking", "Mở form chấm Speaking", "Pass", "opened");
    await dismiss(page);
  } else {
    log("Speaking", "Form chấm Speaking", "Note", "không có ca để chấm");
  }

  const cancel = page.getByRole("button", { name: /Hủy ca|Hủy/i }).first();
  if (await cancel.isVisible({ timeout: 1500 }).catch(() => false)) {
    log("Speaking", "CTA hủy ca hiện", "Pass", "visible (không click destructive)");
  } else {
    log("Speaking", "CTA hủy ca", "Note", "không có ca pending");
  }
}

async function testLichRanh(page) {
  await goto(page, "/grader/lich-ranh");
  const text = await page.locator("body").innerText();
  log(
    "Lịch rảnh",
    "Load lịch tuần",
    /lịch rảnh|tuần|ca|rảnh|Meet/i.test(text) ? "Pass" : "Fail",
    page.url(),
  );

  // Try Meet link save
  const meetInput = page
    .locator('input[placeholder*="meet" i], input[placeholder*="http" i], input[type="url"]')
    .first();
  if (await meetInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    const val = await meetInput.inputValue().catch(() => "");
    if (!val) {
      await meetInput.fill(`https://meet.google.com/aca-smoke-${Date.now().toString().slice(-6)}`);
      await meetInput.blur().catch(() => {});
      await page.getByRole("button", { name: /Lưu/i }).first().click().catch(() => {});
      log("Lịch rảnh", "Điền Meet link", "Pass", "filled");
    } else {
      log("Lịch rảnh", "Meet link đã có", "Pass", "skip overwrite");
    }
  } else {
    log("Lịch rảnh", "Meet input", "Note", "không thấy");
  }

  // Toggle free slot cell if available
  const cell = page
    .locator("button, td")
    .filter({ hasText: /^\+$|^Rảnh$|^Trống$|^$/ })
    .first();
  if (await cell.isVisible({ timeout: 2000 }).catch(() => false)) {
    const pr = await waitApi(page, /free-slot|lich-ranh|aca/i, async () => {
      await cell.click({ force: true }).catch(() => {});
    });
    log(
      "Lịch rảnh",
      "Toggle/tạo ca rảnh",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()}` : "clicked cell",
    );
  } else {
    // try any available-looking slot button in grid
    const slotBtn = page.locator('[class*="grid"] button, table button').nth(3);
    if (await slotBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await slotBtn.click({ force: true }).catch(() => {});
      log("Lịch rảnh", "Click ô lịch", "Note", "clicked generic cell");
    } else {
      log("Lịch rảnh", "Toggle ca", "Note", "không click được ô");
    }
  }
}

async function testProfile(page) {
  await goto(page, "/grader/profile");
  const text = await page.locator("body").innerText();
  log(
    "Profile",
    "Load hồ sơ",
    /hồ sơ|profile|email|grader|tên/i.test(text) ? "Pass" : "Fail",
    page.url(),
  );

  const phone = page.locator('input[type="tel"], label:has-text("Số điện thoại") input, input').nth(2);
  const field = page.locator('label:has-text("Số điện thoại") input').first();
  const target = (await field.count()) > 0 ? field : phone;
  if (await target.isVisible({ timeout: 2000 }).catch(() => false)) {
    const before = await target.inputValue().catch(() => "");
    const marker = `g${Date.now().toString().slice(-4)}`;
    await target.fill(before.includes("g") ? before.replace(/g\d{4}/, marker) : `${before} ${marker}`.trim());
    const pr = await waitApi(page, /profile|user/i, async () => {
      await page.getByRole("button", { name: /Lưu hồ sơ|Lưu/i }).first().click().catch(() => {});
    });
    log(
      "Profile",
      "Lưu hồ sơ",
      pr?.ok() ? "Pass" : "Note",
      pr ? `HTTP ${pr.status()}` : "save clicked (local ok)",
    );
  } else {
    log("Profile", "Form lưu", "Note", "không thấy field");
  }
}

async function testScopeIsolation(page) {
  // Writing list should not show "Phân grader" for all students like ACA
  await goto(page, "/grader/cham-writing");
  const text = await page.locator("body").innerText();
  const seesAllStudentsHint = /tất cả học viên|toàn hệ thống|ACA Full/i.test(text);
  log(
    "Scope",
    "Writing không UI ACA-full",
    seesAllStudentsHint ? "Note" : "Pass",
    seesAllStudentsHint ? "có hint full-system" : "grader-scoped labels",
  );
}

async function testLogout(page) {
  await goto(page, "/grader/cham-writing");
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

  await safeRun("Writing", testWriting, page);
  await safeRun("Speaking", testSpeaking, page);
  await safeRun("Lịch rảnh", testLichRanh, page);
  await safeRun("Profile", testProfile, page);
  await safeRun("Scope", testScopeIsolation, page);
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
  fs.writeFileSync("/tmp/grader-actions-smoke.json", JSON.stringify(out, null, 2));
  fs.writeFileSync(
    "/Users/nguyen/Documents/Xalo_LMS/Student/frontend/scripts/grader-actions-smoke.json",
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
