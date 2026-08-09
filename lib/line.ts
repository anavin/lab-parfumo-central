// LINE Official Account (Messaging API) push notifications.
//
// Setup (owner, once): create a Messaging API channel at developers.line.biz,
// then set these env vars on Vercel:
//   LINE_CHANNEL_ACCESS_TOKEN   — long-lived channel access token (required)
//   LINE_TARGET_ID              — group/room/user id to push to (required)
//   LINE_CHANNEL_SECRET         — channel secret, for /api/line/webhook (optional)
//   NEXT_PUBLIC_SITE_URL        — e.g. https://lab-parfumo-central.vercel.app
//                                 (so notifications can link to the receipt)
//
// Everything here fails soft: if the token/target isn't configured or LINE is
// down, we log and return — a sale must never break because of a notification.

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/** Stable public base URL for building links (receipt, etc.). */
export function siteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "";
}

/** Push one or more text lines to the configured LINE target. Never throws. */
export async function pushLine(text: string, to = process.env.LINE_TARGET_ID): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token || !to?.trim()) return false;   // not configured yet — silently skip
  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: to.trim(), messages: [{ type: "text", text: text.slice(0, 4900) }] }),
      // don't let a slow LINE API hold up the sale response for long
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) { console.error("[line] push failed", res.status, await res.text().catch(() => "")); return false; }
    return true;
  } catch (e) {
    console.error("[line] push error", e);
    return false;
  }
}
