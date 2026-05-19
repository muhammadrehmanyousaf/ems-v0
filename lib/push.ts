/**
 * Phase 2 #8.9 — Browser Web Push client helpers.
 *
 * Three calls:
 *   getPushState()     — { supported, permission, subscribed }
 *   enablePush()       — subscribe (asks permission if needed)
 *   disablePush()      — unsubscribe locally + tell the backend
 *
 * All silently no-op when the runtime can't push:
 *   - SSR (no `window`)
 *   - Insecure context (Web Push requires HTTPS)
 *   - No Service Worker registered yet
 *   - Backend hasn't been configured with VAPID keys
 */

import axiosInstance from "@/lib/axiosConfig";

export interface PushState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  configured: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

async function _readyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

let vapidKeyCache: { value: string | null; fetchedAt: number } | null = null;

async function _vapidKey(): Promise<string | null> {
  if (
    vapidKeyCache &&
    Date.now() - vapidKeyCache.fetchedAt < 60 * 60 * 1000
  ) {
    return vapidKeyCache.value;
  }
  try {
    const res = await axiosInstance.get("/api/v1/push/vapid-public-key");
    const key = res.data?.data?.key || null;
    vapidKeyCache = { value: key, fetchedAt: Date.now() };
    return key;
  } catch {
    return null;
  }
}

export async function getPushState(): Promise<PushState> {
  if (typeof window === "undefined") {
    return {
      supported: false,
      permission: "unsupported",
      subscribed: false,
      configured: false,
    };
  }
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const permission: NotificationPermission | "unsupported" = supported
    ? (Notification.permission as NotificationPermission)
    : "unsupported";

  let subscribed = false;
  if (supported) {
    const reg = await _readyRegistration();
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      subscribed = !!sub;
    }
  }
  const vapid = await _vapidKey();
  return {
    supported,
    permission,
    subscribed,
    configured: !!vapid,
  };
}

export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === "undefined") return { ok: false, reason: "ssr" };
  if (!("serviceWorker" in navigator)) {
    return { ok: false, reason: "sw_unsupported" };
  }
  if (!("PushManager" in window)) {
    return { ok: false, reason: "push_unsupported" };
  }
  const vapid = await _vapidKey();
  if (!vapid) return { ok: false, reason: "no_vapid_key" };

  const reg = await _readyRegistration();
  if (!reg) return { ok: false, reason: "no_sw_registration" };

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "permission_denied" };

  // If already subscribed, reuse the existing subscription.
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    } catch (e: any) {
      return { ok: false, reason: e?.message || "subscribe_failed" };
    }
  }

  const raw = sub.toJSON();
  try {
    await axiosInstance.post("/api/v1/push/subscribe", {
      endpoint: raw.endpoint,
      keys: raw.keys,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    return { ok: true };
  } catch (e: any) {
    return {
      ok: false,
      reason: e?.response?.data?.message || "backend_subscribe_failed",
    };
  }
}

export async function disablePush(): Promise<{ ok: boolean }> {
  if (typeof window === "undefined") return { ok: false };
  const reg = await _readyRegistration();
  if (!reg) return { ok: false };
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    // ignore
  }
  try {
    await axiosInstance.delete("/api/v1/push/unsubscribe", {
      data: { endpoint },
    });
  } catch {
    // ignore — server cleanup happens lazily on next 410 anyway
  }
  return { ok: true };
}
