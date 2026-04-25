import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const EDIT_PASSWORD = process.env.EDIT_PASSWORD || "your-secret-password";

const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

const THOUGHTS_KEY = "thoughts";
const TIMELINE_KEY = "timeline";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadData(key: string, defaultData: any[] = []): Promise<any[]> {
  try {
    const data = await redis.get(key);
    return (data as any[]) || defaultData;
  } catch {
    return defaultData;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveData(key: string, data: any[]) {
  await redis.set(key, data);
}

function verifyPassword(password: string | null, clientIP: string = "unknown"): boolean {
  if (!password) return false;
  const now = Date.now();
  const attempts = authAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };

  if (now - attempts.lastAttempt > LOCKOUT_TIME) attempts.count = 0;
  if (attempts.count >= MAX_ATTEMPTS) {
    const timeLeft = Math.ceil((LOCKOUT_TIME - (now - attempts.lastAttempt)) / 1000 / 60);
    throw new Error(`Too many failed attempts. Try again in ${timeLeft} minutes.`);
  }

  const isValid = password === EDIT_PASSWORD;
  if (!isValid) {
    attempts.count++;
    attempts.lastAttempt = now;
    authAttempts.set(clientIP, attempts);
  } else {
    authAttempts.delete(clientIP);
  }
  return isValid;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const action = searchParams.get("action");

  try {
    if (type === "thoughts") {
      const thoughts = await loadData(THOUGHTS_KEY);
      return Response.json({ success: true, data: thoughts });
    }
    if (type === "timeline") {
      const timeline = await loadData(TIMELINE_KEY);
      return Response.json({ success: true, data: timeline });
    }
    if (action === "export") {
      const password = request.headers.get("authorization")?.replace("Bearer ", "") || null;
      const clientIP = request.headers.get("x-forwarded-for") || "unknown";
      try {
        if (!verifyPassword(password, clientIP)) return Response.json({ success: false, error: "Invalid password" }, { status: 401 });
      } catch (error) {
        return Response.json({ success: false, error: (error as Error).message }, { status: 429 });
      }
      const thoughts = await loadData(THOUGHTS_KEY);
      const timeline = await loadData(TIMELINE_KEY);
      return Response.json({ success: true, data: { thoughts, timeline }, timestamp: new Date().toISOString() });
    }
    return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleWrite(request, "POST");
}

export async function PUT(request: NextRequest) {
  return handleWrite(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return handleWrite(request, "DELETE");
}

async function handleWrite(request: NextRequest, method: string) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const password = request.headers.get("authorization")?.replace("Bearer ", "") || null;
  const clientIP = request.headers.get("x-forwarded-for") || "unknown";

  try {
    if (!verifyPassword(password, clientIP)) return Response.json({ success: false, error: "Invalid password" }, { status: 401 });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 429 });
  }

  try {
    const body = await request.json();

    if (type === "thoughts") {
      const thoughts = await loadData(THOUGHTS_KEY);
      if (method === "POST") {
        const newThought = { id: Date.now().toString(), date: body.date || new Date().toISOString().split("T")[0], tag: body.tag || "reflection", title: body.title, preview: body.preview, createdAt: new Date().toISOString() };
        thoughts.unshift(newThought);
        await saveData(THOUGHTS_KEY, thoughts);
        return Response.json({ success: true, data: newThought });
      }
      if (method === "PUT") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idx = thoughts.findIndex((t: any) => t.id === body.id);
        if (idx === -1) return Response.json({ success: false, error: "Thought not found" }, { status: 404 });
        thoughts[idx] = { ...thoughts[idx], ...body };
        await saveData(THOUGHTS_KEY, thoughts);
        return Response.json({ success: true, data: thoughts[idx] });
      }
      if (method === "DELETE") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = thoughts.filter((t: any) => t.id !== body.id);
        await saveData(THOUGHTS_KEY, filtered);
        return Response.json({ success: true });
      }
    }

    if (type === "timeline") {
      const timeline = await loadData(TIMELINE_KEY);
      if (method === "POST") {
        const newEntry = { id: Date.now().toString(), period: body.period, title: body.title, description: body.description, tags: body.tags || [], createdAt: new Date().toISOString() };
        timeline.unshift(newEntry);
        await saveData(TIMELINE_KEY, timeline);
        return Response.json({ success: true, data: newEntry });
      }
      if (method === "PUT") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const idx = timeline.findIndex((t: any) => t.id === body.id);
        if (idx === -1) return Response.json({ success: false, error: "Timeline entry not found" }, { status: 404 });
        timeline[idx] = { ...timeline[idx], ...body };
        await saveData(TIMELINE_KEY, timeline);
        return Response.json({ success: true, data: timeline[idx] });
      }
      if (method === "DELETE") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered = timeline.filter((t: any) => t.id !== body.id);
        await saveData(TIMELINE_KEY, filtered);
        return Response.json({ success: true });
      }
    }

    return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
