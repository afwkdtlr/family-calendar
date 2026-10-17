import { apiRequest } from "../api/client.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

function canUsePush() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    window.isSecureContext
  );
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js");
}

export async function enablePush(token) {
  if (!canUsePush()) {
    throw new Error("이 브라우저에서는 알림을 쓸 수 없습니다. 주소창이 https인지 확인해 주세요.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("알림을 허용해야 참석 소식을 받을 수 있습니다.");
  }

  const worker = await registration();
  await navigator.serviceWorker.ready;
  const { publicKey } = await apiRequest("/push/vapid", { token });
  const existing = await worker.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe().catch(() => {});
  }
  const subscription = await worker.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await apiRequest("/push/subscribe", {
    method: "POST",
    token,
    body: subscription.toJSON(),
  });
}

export async function disablePush(token) {
  if (!canUsePush()) {
    return;
  }

  const worker = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await worker?.pushManager.getSubscription();
  if (subscription) {
    await apiRequest("/push/unsubscribe", {
      method: "POST",
      token,
      body: { endpoint: subscription.endpoint },
    }).catch(() => {});
    await subscription.unsubscribe().catch(() => {});
  }
}

export function pushSupported() {
  return canUsePush();
}

export async function pushEnabled() {
  if (!canUsePush() || Notification.permission !== "granted") {
    return false;
  }
  const worker = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await worker?.pushManager.getSubscription();
  return Boolean(subscription);
}
