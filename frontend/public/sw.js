self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "가족 일정", {
      body: data.body || "",
      tag: data.tag || "family-calendar",
      data: { url: data.url || "/calendar" },
      vibrate: [180, 80, 180],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/calendar";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.focus();
        existing.postMessage({ type: "open-event", url: target });
        return existing.navigate(target).catch(() => existing);
      }
      return self.clients.openWindow(target);
    })
  );
});
