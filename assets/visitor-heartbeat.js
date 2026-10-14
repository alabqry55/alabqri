/**
 * ALABQRI visitor presence heartbeat.
 * Refreshes last_seen while the homepage remains visible.
 * The API keeps the five-minute active window and existing visitor totals.
 */
(() => {
  "use strict";

  const endpoint = "/api/visitors";
  let requestInProgress = false;

  async function refreshPresence() {
    if (requestInProgress || document.visibilityState !== "visible") return;

    requestInProgress = true;
    try {
      await fetch(endpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
    } catch (_) {
      // A temporary network failure is harmless; the next heartbeat retries.
    } finally {
      requestInProgress = false;
    }
  }

  // Keep presence fresh every minute while the homepage is visible.
  window.setInterval(refreshPresence, 60_000);

  // Resume presence promptly when the visitor returns to this tab.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshPresence();
  });
})();
