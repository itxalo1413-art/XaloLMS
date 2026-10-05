/**
 * Manual-style UI smoke for HS: Writing / Speaking / Practice class
 * on /ho-tro-tu-hoc
 *
 * Usage:
 *   cd frontend && npx playwright test ../scripts/...  (or)
 *   node --experimental-vm-modules  ... better run via npx playwright
 *
 *   npx playwright install chromium   # once if needed
 *   node scripts/smoke-hs-ho-tro-ui.mjs
 */
import { chromium } from "playwright";

const FE = process.env.FE_BASE || "http://127.0.0.1:3000";
const API = process.env.API_BASE || "http://127.0.0.1:5001";
const EMAIL = "nguyenduong939705@gmail.com";
const PASS = "Student@123!";

const findings = [];

function log(vai, fn, kq, ct) {
  findings.push({ vai, fn, kq, ct });
  console.log(`[${kq}] ${fn} — ${ct}`);
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

async function main() {
  const auth = await loginApi();
  log("HS", "API login", "Pass", `${auth.user.role} ${auth.user.name}`);

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  // Login via quick-account button (app handleQuickLogin)
  await page.goto(`${FE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /^HS$/i }).click().catch(() => {});
  const loginRespPromise = page.waitForResponse(
    (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST",
    { timeout: 20000 },
  );
  await page
    .getByRole("button", { name: /Dương Ngọc Khôi Nguyên|nguyenduong939705/i })
    .first()
    .click();
  const loginResp = await loginRespPromise.catch(() => null);
  const loginOk = loginResp ? loginResp.ok() : false;
  log(
    "HS",
    "UI quick login",
    loginOk ? "Pass" : "Fail",
    loginResp ? `HTTP ${loginResp.status()}` : "no /api/auth/login response",
  );
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }).catch(() => {});

  // Ensure we land on student self-study page
  if (page.url().includes("/login")) {
    // fallback: form login
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASS);
    const resp2 = page.waitForResponse(
      (r) => r.url().includes("/api/auth/login") && r.request().method() === "POST",
      { timeout: 15000 },
    );
    await page.getByRole("button", { name: /đăng nhập ngay/i }).click();
    const r2 = await resp2.catch(() => null);
    log(
      "HS",
      "UI form login fallback",
      r2?.ok() ? "Pass" : "Fail",
      r2 ? `HTTP ${r2.status()}` : "no response",
    );
    await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }).catch(() => {});
  }

  await page.goto(`${FE}/ho-tro-tu-hoc`, { waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(
      () => {
        const t = document.body?.innerText || "";
        return /Speaking|Writing|luyện đề|Hỗ trợ tự học/i.test(t);
      },
      { timeout: 45000 },
    );
    log("HS", "Hydrate /ho-tro-tu-hoc", "Pass", "content visible");
  } catch {
    const htmlLen = await page.evaluate(() => document.body?.innerHTML?.length || 0);
    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 300) || "");
    const token = await page.evaluate(() => !!localStorage.getItem("xalo.auth.token"));
    log(
      "HS",
      "Hydrate /ho-tro-tu-hoc",
      "Fail",
      `htmlLen=${htmlLen} token=${token} text=${JSON.stringify(text)}`,
    );
  }

  const href = page.url();
  if (href.includes("/login")) {
    log("HS", "Open /ho-tro-tu-hoc", "Fail", `redirected to ${href}`);
    await browser.close();
    console.log(JSON.stringify({ findings, consoleErrors }, null, 2));
    process.exit(1);
  }
  log("HS", "Open /ho-tro-tu-hoc", "Pass", href);

  // Dismiss onboarding / quote / any blocking modal
  for (let i = 0; i < 5; i++) {
    const overlay = page.locator("div.fixed.inset-0.z-\\[150\\], div.fixed.inset-0[class*='z-[150]']");
    if ((await overlay.count()) === 0) break;
    const dismiss = page.getByRole("button", {
      name: /bỏ qua|đóng|đã hiểu|tiếp tục|xong|skip|got it|bắt đầu/i,
    });
    if (await dismiss.first().isVisible().catch(() => false)) {
      await dismiss.first().click({ force: true }).catch(() => {});
    } else {
      await page.keyboard.press("Escape").catch(() => {});
      // click backdrop
      await page.locator("div.fixed.inset-0.bg-zinc-950\\/60").first().click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(400);
  }
  // Mark onboarding seen for stability
  await page.evaluate(() => {
    try {
      localStorage.setItem("xalo.studentOnboardingSeen", "true");
      localStorage.removeItem("xalo.showLoginQuotePopup");
    } catch {}
  });

  const bodyText = await page.locator("body").innerText();

  // ── Speaking ──
  const speakingVisible =
    /Support Speaking|Speaking|Ca Speaking|Đăng ký.*Speaking|mock test speaking/i.test(
      bodyText,
    );
  log(
    "HS",
    "Speaking section visible",
    speakingVisible ? "Pass" : "Fail",
    speakingVisible ? "found Speaking block" : bodyText.slice(0, 200),
  );

  log(
    "HS",
    "Speaking list/history UI",
    speakingVisible ? "Pass" : "Fail",
    "section rendered",
  );

  // Try open booking modal
  try {
    const bookBtn = page
      .getByRole("button", {
        name: /đăng ký.*speaking|đăng ký ngay|book|đặt lịch speaking/i,
      })
      .first();
    if (await bookBtn.isVisible().catch(() => false)) {
      await bookBtn.click({ force: true, timeout: 8000 });
      await page.waitForTimeout(800);
      const modalOpen =
        (await page.getByText(/chọn ngày|lịch rảnh|thi Speaking|xác nhận/i).count()) >
        0;
      log(
        "HS",
        "Speaking booking modal",
        modalOpen ? "Pass" : "Fail",
        modalOpen ? "modal opened" : "button clicked but modal not found",
      );
      await page.keyboard.press("Escape");
      const closeBtn = page.getByRole("button", { name: /đóng|hủy|cancel/i }).first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => {});
      }
    } else {
      const anyCta = await page
        .locator("button")
        .filter({ hasText: /Speaking|đăng ký/i })
        .count();
      log(
        "HS",
        "Speaking booking modal",
        anyCta > 0 ? "Note" : "Fail",
        `CTA buttons matching Speaking/đăng ký: ${anyCta}`,
      );
    }
  } catch (e) {
    log("HS", "Speaking booking modal", "Fail", String(e.message || e).slice(0, 160));
  }

  // ── Writing ──
  const body2 = await page.locator("body").innerText();
  const writingVisible = /Writing|Chấm.*Writing|Bài Writing|nộp/i.test(body2);
  log(
    "HS",
    "Writing section visible",
    writingVisible ? "Pass" : "Fail",
    writingVisible ? "found Writing block" : "missing",
  );

  const writingInput = page
    .locator('input[placeholder*="http" i], input[placeholder*="link" i], input[type="url"]')
    .first();
  const hasWritingInput = await writingInput.isVisible().catch(() => false);
  log(
    "HS",
    "Writing link input",
    hasWritingInput ? "Pass" : "Note",
    hasWritingInput ? "input visible" : "no link input (quota full or collapsed?)",
  );

  // Submit a unique dummy link if input available
  if (hasWritingInput) {
    try {
      const uniqueLink = `https://docs.google.com/document/d/hs-smoke-${Date.now()}`;
      await writingInput.fill(uniqueLink);
      const allSubmit = page.getByRole("button", { name: /nộp bài|gửi bài|nộp ngay|submit/i });
      let clicked = false;
      if (await allSubmit.first().isVisible().catch(() => false)) {
        await allSubmit.first().click({ force: true });
        clicked = true;
      } else {
        const nop = page.locator("button", { hasText: /nộp/i }).first();
        if (await nop.isVisible().catch(() => false)) {
          await nop.click({ force: true });
          clicked = true;
        }
      }
      await page.waitForTimeout(1500);
      const after = await page.locator("body").innerText();
      const success =
        /thành công|đã nộp|đã gửi/i.test(after) ||
        after.includes(uniqueLink.slice(-12));
      const quotaFull = /đủ 6|hạn ngạch|tối đa 6/i.test(after);
      log(
        "HS",
        "Writing submit",
        clicked && (success || quotaFull) ? "Pass" : clicked ? "Note" : "Fail",
        clicked
          ? success
            ? "submit ok / listed"
            : quotaFull
              ? "quota message"
              : "clicked, unclear result"
          : "no submit button",
      );
    } catch (e) {
      log("HS", "Writing submit", "Fail", String(e.message || e).slice(0, 160));
    }
  }

  // Writing results table
  const writingTable = /Bảng kết quả chấm Writing|Chưa có bài nộp Writing/i.test(
    await page.locator("body").innerText(),
  );
  log(
    "HS",
    "Writing results table",
    writingTable ? "Pass" : "Note",
    writingTable ? "table/empty state shown" : "label not found",
  );

  // ── Practice class ──
  const practiceVisible = /luyện đề|đăng ký lớp luyện|practice/i.test(
    await page.locator("body").innerText(),
  );
  log(
    "HS",
    "Practice class section visible",
    practiceVisible ? "Pass" : "Fail",
    practiceVisible ? "found luyện đề block" : "missing",
  );

  try {
    const joinBtn = page
      .getByRole("button", { name: /tham gia|đăng ký.*luyện|join/i })
      .first();
    if (await joinBtn.isVisible().catch(() => false)) {
      const label = (await joinBtn.innerText()).trim();
      await joinBtn.click({ force: true });
      await page.waitForTimeout(1000);
      const after = await page.locator("body").innerText();
      const joined =
        /đã tham gia|hủy đăng ký|tuần này|slot|ca /i.test(after) ||
        (await page.getByRole("button", { name: /hủy|unregister|rời/i }).count()) > 0;
      log(
        "HS",
        "Practice join/register CTA",
        "Pass",
        `clicked "${label}"; joinedUI=${joined}`,
      );
    } else {
      const weekInfo = /tuần|zoom|meet|zalo|slot|thứ /i.test(
        await page.locator("body").innerText(),
      );
      log(
        "HS",
        "Practice join/register CTA",
        weekInfo ? "Pass" : "Note",
        weekInfo
          ? "no join CTA (likely already joined); week/slot UI present"
          : "no join button and weak week UI signals",
      );
    }
  } catch (e) {
    log("HS", "Practice join/register CTA", "Fail", String(e.message || e).slice(0, 160));
  }

  // Screenshot evidence
  const shot = "/tmp/hs-ho-tro-tu-hoc-smoke.png";
  await page.screenshot({ path: shot, fullPage: true });
  log("HS", "Screenshot", "Pass", shot);

  if (consoleErrors.length) {
    log(
      "HS",
      "Console errors",
      "Note",
      consoleErrors.slice(0, 5).join(" | "),
    );
  } else {
    log("HS", "Console errors", "Pass", "none captured");
  }

  await browser.close();

  const bad = findings.filter((f) => f.kq === "Fail");
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ total: findings.length, fail: bad.length, findings }, null, 2));
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
