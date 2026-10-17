import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webPush from "web-push";
import { PushSubscription } from "../models/PushSubscription.js";

const STORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/vapid.json");

function loadOrCreateKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }

  if (fs.existsSync(STORE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(STORE, "utf8"));
      if (saved.publicKey && saved.privateKey) {
        return saved;
      }
    } catch {
      // fall through and make a new pair
    }
  }

  const keys = webPush.generateVAPIDKeys();
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(keys), { encoding: "utf8", mode: 0o600 });
  return keys;
}

const keys = loadOrCreateKeys();
const subject = process.env.VAPID_SUBJECT || "mailto:admin@pjs94dev.com";
webPush.setVapidDetails(subject, keys.publicKey, keys.privateKey);

export function vapidPublicKey() {
  return keys.publicKey;
}

function dateLabel(event) {
  const key = event.eventDate || "";
  const [year, month, day] = key.split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${Number(month)}월 ${Number(day)}일`;
}

export async function notifyAttendees({ event, userIds, actorName }) {
  const targets = [...new Set((userIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  if (!event?.id || !targets.length) {
    return;
  }

  const subscriptions = PushSubscription.findByUserIds(targets);
  if (!subscriptions.length) {
    return;
  }

  const payload = JSON.stringify({
    title: event.title,
    body: `${actorName || "가족"}님이 ${dateLabel(event)} 일정에 넣었습니다.`,
    url: `/calendar?date=${event.eventDate}`,
    tag: `event-${event.id}`,
  });

  await Promise.all(
    subscriptions.map(async (item) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: item.endpoint,
            keys: { p256dh: item.p256dh, auth: item.auth },
          },
          payload
        );
      } catch (error) {
        console.error("web push failed", error.statusCode || error.message);
        if (error.statusCode === 404 || error.statusCode === 410) {
          PushSubscription.removeByEndpoint(item.endpoint);
        }
      }
    })
  );
}
