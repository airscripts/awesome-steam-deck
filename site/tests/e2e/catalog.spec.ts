import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("catalog is searchable and preserves accessible card links", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find your next Deck upgrade." }),
  ).toBeVisible();
  await expect(
    page.locator(".stat").filter({ hasText: "158 resources" }),
  ).toBeVisible();
  await expect(
    page.locator('#sort-select option[value="relevance"]'),
  ).toHaveJSProperty("hidden", true);
  await page.getByRole("searchbox").fill("proton");
  await expect(page.locator("#sort-select")).toHaveValue("relevance");
  await expect(
    page.locator('#sort-select option[value="relevance"]'),
  ).toHaveJSProperty("hidden", false);
  await expect(page.getByRole("status")).toContainText("resource");
  await expect(
    page.locator("[data-resource-id]").filter({ hasText: "ProtonUp-Qt" }),
  ).toBeVisible();
  await expect(
    page.locator("[data-resource-id]").filter({ hasText: "SSD Replacement" }),
  ).toBeHidden();
  await expect(
    page.locator("[data-resource-id]:not([hidden])").first().getByRole("link"),
  ).toHaveAttribute("target", "_blank");
});

test("mobile filter dialog restores focus after Escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /^filter(?:\b|,)/i });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.classList.contains("dialog-open") &&
          getComputedStyle(document.body).overflow === "hidden",
      ),
    )
    .toBe(true);
  const dialogAxe = await new AxeBuilder({ page })
    .include("#filter-dialog")
    .analyze();
  expect(
    dialogAxe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    ),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() =>
      page.evaluate(() =>
        document.documentElement.classList.contains("dialog-open"),
      ),
    )
    .toBe(false);
});

test("catalog has no serious or critical accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(seriousOrCritical, JSON.stringify(seriousOrCritical, null, 2)).toEqual(
    [],
  );
});

test("URL state restores combined category filters and sorting", async ({
  page,
}) => {
  await page.goto("/?category=guide&category=emulation&sort=az");
  await expect(
    page.locator("[data-resource-id]").filter({ hasText: "SSD Replacement" }),
  ).toBeVisible();
  await expect(
    page.locator('[data-category-id="emulation"][data-name="EmuDeck"]'),
  ).toBeVisible();
  await expect(page.locator('[data-name="Distrobox"]')).toBeHidden();
  await expect(page.locator("#sort-select")).toHaveValue("az");
  await expect(page.locator("#active-filters .chip")).toHaveCount(2);
});

test("theme choice persists and static HTML remains available without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await page.locator("#theme-trigger").click();
  await expect(page.getByRole("radio")).toHaveCount(3);
  const themeAxe = await new AxeBuilder({ page })
    .include(".theme-menu")
    .analyze();
  expect(
    themeAxe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    ),
  ).toEqual([]);
  await page.getByRole("radio", { name: "Light" }).check();
  await expect(page.locator('[data-theme-choice="light"]')).toBeChecked();
  await expect(page.locator(".theme-menu")).not.toHaveAttribute("open", "");
  await expect(page.locator("#theme-trigger")).toBeFocused();
  await page.locator("#theme-trigger").click();
  await page.getByRole("radio", { name: "Light" }).press("Escape");
  await expect(page.locator(".theme-menu")).not.toHaveAttribute("open", "");
  await expect(page.locator("#theme-trigger")).toBeFocused();
  await page.locator("#theme-trigger").click();
  await expect(page.locator(".theme-menu")).toHaveAttribute("open", "");
  await page.locator("#page-title").click();
  await expect(page.locator(".theme-menu")).not.toHaveAttribute("open", "");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await context.close();

  const noScriptContext = await browser.newContext({
    javaScriptEnabled: false,
  });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto("/");
  await expect(noScriptPage.locator("[data-resource-id]")).toHaveCount(158);
  await expect(noScriptPage.locator("#resource-search")).toBeDisabled();
  await expect(noScriptPage.locator("#filter-trigger")).toBeDisabled();
  await expect(noScriptPage.locator(".interactive-error")).toBeVisible();
  await noScriptContext.close();
});

test("persistent shell and scroll-to-top control follow document scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator(".github-button svg")).toBeVisible();
  await expect(page.locator(".resource-icon svg").first()).toBeVisible();
  const initialFooterTop = await page
    .locator(".site-footer")
    .evaluate((footer) => footer.getBoundingClientRect().top);
  expect(initialFooterTop).toBeGreaterThan(800);
  const resultStatus = page.locator("#result-status");
  const sortControl = page.locator(".sort-control");
  const aligned = await Promise.all([
    resultStatus.boundingBox(),
    sortControl.boundingBox(),
  ]);
  expect(
    Math.abs(
      (aligned[0]?.y || 0) +
        (aligned[0]?.height || 0) / 2 -
        ((aligned[1]?.y || 0) + (aligned[1]?.height || 0) / 2),
    ),
  ).toBeLessThan(2);
  await page.evaluate(() => {
    window.scrollTo(0, 800);
  });
  await expect(page.locator("#scroll-top")).toBeVisible();
  await expect(page.locator(".site-header")).toBeVisible();
  const [controlsBox, sidebarBox, scrollTopBox] = await Promise.all([
    page.locator(".controls").boundingBox(),
    page.locator(".category-sidebar").boundingBox(),
    page.locator("#scroll-top").boundingBox(),
  ]);
  expect(sidebarBox?.y || 0).toBeGreaterThanOrEqual(
    (controlsBox?.y || 0) + (controlsBox?.height || 0),
  );
  const categorySidebar = page.locator(".category-sidebar");
  await categorySidebar.evaluate((sidebar) => {
    sidebar.scrollTop = sidebar.scrollHeight;
  });
  const [lastCategoryBox, scrolledSidebarBox] = await Promise.all([
    page.locator(".category-sidebar .category-option").last().boundingBox(),
    categorySidebar.boundingBox(),
  ]);
  expect(lastCategoryBox?.y || 0).toBeGreaterThanOrEqual(
    scrolledSidebarBox?.y || 0,
  );
  expect(
    (lastCategoryBox?.y || 0) + (lastCategoryBox?.height || 0),
  ).toBeLessThanOrEqual(
    (scrolledSidebarBox?.y || 0) + (scrolledSidebarBox?.height || 0),
  );
  const focusedResource = page
    .locator("[data-resource-id]")
    .nth(80)
    .getByRole("link");
  await focusedResource.focus();
  const [focusedResourceBox, focusedControlsBox] = await Promise.all([
    focusedResource.boundingBox(),
    page.locator(".controls").boundingBox(),
  ]);
  expect(focusedResourceBox?.y || 0).toBeGreaterThanOrEqual(
    (focusedControlsBox?.y || 0) + (focusedControlsBox?.height || 0),
  );

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const [footerBox, lastCardBox] = await Promise.all([
    page.locator(".site-footer").boundingBox(),
    page.locator(".resource-card").last().boundingBox(),
  ]);
  expect(
    (footerBox?.y || 0) - (lastCardBox?.y || 0) - (lastCardBox?.height || 0),
  ).toBeGreaterThan(24);
  expect((scrollTopBox?.y || 0) + (scrollTopBox?.height || 0)).toBeLessThan(
    footerBox?.y || 0,
  );
  await page.locator("#scroll-top").click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("category removal restores focus and mobile controls remain reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/?category=guide&category=emulation");
  const removeButtons = page.locator("#active-filters .chip button");
  await expect(removeButtons).toHaveCount(2);
  await removeButtons.first().focus();
  await removeButtons.first().click();
  await expect(removeButtons).toHaveCount(1);
  await expect(removeButtons.first()).toBeFocused();
  await removeButtons.first().click();
  await expect(removeButtons).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toBeFocused();

  await page.getByRole("button", { name: /^filter(?:\b|,)/i }).click();
  const drawerChecks = page.locator("#filter-dialog [data-category-checkbox]");
  await expect(drawerChecks).toHaveCount(20);
  for (const checkbox of await drawerChecks.all()) await checkbox.check();
  await expect(
    page.getByRole("button", { name: /show 158 resources/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /show 158 resources/i }).click();
  await page.locator("[data-resource-id]").last().scrollIntoViewIfNeeded();
  await expect(page.locator("[data-resource-id]").last()).toBeVisible();
});

test("responsive viewports keep the catalog and footer reachable", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 375, height: 800 },
    { width: 667, height: 375 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const metrics = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }));
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.innerHeight);
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(page.locator(".site-footer")).toBeVisible();
    await expect(page.locator("[data-resource-id]").last()).toBeVisible();
  }
});

test("interactive controls meet touch target and typography minimums", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/?category=guide");
  await page.locator("#theme-trigger").click();
  const themeChoice = page.locator(".theme-choice").first();
  const removeButton = page.locator("#active-filters .chip button");
  const targets = [
    themeChoice,
    page.locator("#theme-trigger"),
    page.locator(".github-button"),
    page.locator(".header-link"),
    page.locator("#filter-trigger"),
    page.locator("#sort-select"),
    page.locator("#clear-all"),
    removeButton,
  ];
  for (const target of targets) {
    if (!(await target.isVisible())) continue;
    const box = await target.boundingBox();
    expect(box?.width || 0).toBeGreaterThanOrEqual(44);
    expect(box?.height || 0).toBeGreaterThanOrEqual(44);
  }
  expect(
    await page
      .locator("#sort-select")
      .evaluate((select) => getComputedStyle(select).fontSize),
  ).toBe("16px");
});

test("touch emulation, reduced motion, and 200 percent zoom remain usable", async ({
  browser,
  page,
}) => {
  const touchContext = await browser.newContext({
    viewport: { width: 375, height: 800 },
    hasTouch: true,
    isMobile: true,
  });
  const touchPage = await touchContext.newPage();
  await touchPage.emulateMedia({ reducedMotion: "reduce" });
  await touchPage.goto("/");
  await touchPage.getByRole("button", { name: /^filter(?:\b|,)/i }).tap();
  await expect(touchPage.getByRole("dialog")).toBeVisible();
  await touchPage.keyboard.press("Escape");
  await expect(touchPage.getByRole("dialog")).toBeHidden();
  await touchContext.close();

  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await page.locator("[data-resource-id]").last().scrollIntoViewIfNeeded();
  await expect(page.locator("[data-resource-id]").last()).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await expect(page.locator(".site-footer")).toBeVisible();
});
