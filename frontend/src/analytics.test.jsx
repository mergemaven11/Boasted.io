import { beforeEach, describe, expect, it, vi } from "vitest";
import { GA_MEASUREMENT_ID, initializeAnalytics } from "./analytics.js";

describe("initializeAnalytics", () => {
  beforeEach(() => {
    delete window.__bragstackGaInitialized;
    delete window.dataLayer;
    delete window.gtag;
    document.head.querySelectorAll("script[data-bragstack-analytics]").forEach((node) => node.remove());
  });

  it("loads the BragStack GA4 tag and configures the measurement ID once", () => {
    const appendSpy = vi.spyOn(document.head, "appendChild");
    initializeAnalytics();
    initializeAnalytics();
    const script = document.head.querySelector("script[data-bragstack-analytics]");
    expect(script).not.toBeNull();
    expect(script.src).toContain(`googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
    expect(window.dataLayer.some((entry) => entry[0] === "config" && entry[1] === GA_MEASUREMENT_ID)).toBe(true);
    expect(appendSpy).toHaveBeenCalledTimes(1);
    appendSpy.mockRestore();
  });
});
