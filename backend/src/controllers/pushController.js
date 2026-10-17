import { PushSubscription } from "../models/PushSubscription.js";
import { vapidPublicKey } from "../lib/webPush.js";

function parseSubscription(body) {
  const endpoint = String(body?.endpoint || "").trim();
  const p256dh = String(body?.keys?.p256dh || "").trim();
  const auth = String(body?.keys?.auth || "").trim();
  if (!endpoint || !p256dh || !auth) {
    return null;
  }
  return { endpoint, p256dh, auth };
}

export function getVapidKey(_req, res) {
  return res.json({ publicKey: vapidPublicKey() });
}

export function saveSubscription(req, res) {
  const parsed = parseSubscription(req.body);
  if (!parsed) {
    return res.status(400).json({ message: "알림 정보가 올바르지 않습니다." });
  }
  PushSubscription.save(req.user.id, parsed);
  return res.json({ ok: true });
}

export function removeSubscription(req, res) {
  const endpoint = String(req.body?.endpoint || "").trim();
  PushSubscription.removeByUser(req.user.id, endpoint || undefined);
  return res.json({ ok: true });
}
