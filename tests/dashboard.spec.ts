import { expect, test } from "@playwright/test";

test("renders the 3D reconstruction and switchable interactive map", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("cinematic-scene")).toBeVisible();
  await expect(page.getByTestId("cinematic-scene").locator("canvas")).toBeVisible();
  await expect(page.locator(".real-terrain-map")).toHaveAttribute("data-river-vertices", "164");
  await page.getByRole("button", { name: "Map", exact: true }).click();
  const map = page.locator(".maplibregl-map");
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute("data-map-ready", "true");
  await expect(map).toHaveCSS("position", "absolute");
  const stageHeight = await page.locator(".map-stage").evaluate((element) => element.clientHeight);
  const mapHeight = await map.evaluate((element) => element.clientHeight);
  expect(mapHeight).toBe(stageHeight);
  expect(mapHeight).toBeGreaterThan(600);
  await expect(page.locator(".maplibregl-ctrl-attrib")).toBeVisible();
  await expect(page.locator(".route-base")).toBeVisible();
  await expect(page.locator(".evidence-marker")).toHaveCount(7);
});

test("timeline selection updates the evidence card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Go to Betrawati" }).click();
  await expect(page.getByRole("heading", { name: "Betrawati" })).toBeVisible();
  await expect(page.locator(".event-card").getByText("11:10 NPT")).toBeVisible();
  await expect(page.locator(".water-marker")).toHaveCount(24);
});

test("health endpoint exposes the approved dataset", async ({ request }) => {
  const response = await request.get("/api/v1/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ status: "ok", datasetVersion: "2026.08.27-1" });
});
