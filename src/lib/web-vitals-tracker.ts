"use client";

import { onCLS, onFID, onLCP, onINP, onTTFB, Metric } from "web-vitals";

/**
 * Web Vitals Tracker
 * Tracks Core Web Vitals and sends them to the API
 * This should be initialized in the root layout
 */

export function trackWebVitals() {
  if (typeof window === "undefined") return;

  function sendToAnalytics(metric: Metric) {
    // Send to API endpoint
    fetch("/api/apm/web-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        page: window.location.pathname,
        // Include navigation timing if available
        delta: metric.delta,
        id: metric.id,
      }),
    }).catch((err) => {
      // Silently fail - don't break the app if analytics fails
      console.error("Failed to send web vital", err);
    });
  }

  // Track all Core Web Vitals
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

