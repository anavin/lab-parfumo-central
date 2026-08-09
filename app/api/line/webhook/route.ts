import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// LINE Messaging API webhook — used to DISCOVER the target id to notify.
//
// One-time setup to grab a group id:
//   1. In the LINE Developers console, set the webhook URL to
//      https://<your-domain>/api/line/webhook  and turn "Use webhook" on.
//   2. Invite the Official Account into your shop's LINE group.
//   3. Type anything in the group — the bot replies with the group id
//      ("LINE target id: Cxxxxxxxx").
//   4. Put that id in the LINE_TARGET_ID env var on Vercel.
//
// For a personal (1:1) target, add the OA as a friend and message it; the bot
// replies with your user id instead.

export const dynamic = "force-dynamic";

const REPLY_URL = "https://api.line.me/v2/bot/message/reply";

// LINE signs every webhook body with the channel secret; verify when we have it.
function verify(body: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET?.trim();
  if (!secret) return true;              // secret not set yet — accept (discovery mode)
  if (!signature) return false;
  const mac = crypto.createHmac("sha256", secret).update(body).digest("base64");
  try { return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(signature)); }
  catch { return false; }
}

async function reply(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) return;
  try {
    await fetch(REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
    });
  } catch (e) { console.error("[line webhook] reply error", e); }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verify(raw, req.headers.get("x-line-signature"))) {
    return new NextResponse("bad signature", { status: 403 });
  }
  let events: any[] = [];
  try { events = JSON.parse(raw).events ?? []; } catch { /* verification handshake sends {} */ }

  for (const ev of events) {
    const src = ev?.source ?? {};
    const id = src.groupId || src.roomId || src.userId || "";
    const kind = src.groupId ? "group" : src.roomId ? "room" : "user";
    console.log(`[line webhook] ${ev.type} from ${kind} id=${id}`);
    // echo the id back so the owner can copy it into LINE_TARGET_ID
    if (ev.type === "message" && ev.replyToken && id) {
      await reply(ev.replyToken, `LINE target id (${kind}):\n${id}\n\nนำ id นี้ไปใส่ในค่า LINE_TARGET_ID`);
    }
  }
  return NextResponse.json({ ok: true });
}

// LINE also does a GET/verify ping; answer OK so the console shows success.
export async function GET() {
  return NextResponse.json({ ok: true });
}
