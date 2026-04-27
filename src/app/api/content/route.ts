import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const EDIT_PASSWORD = process.env.EDIT_PASSWORD || "enrin2025";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;
const attempts = new Map<string, { count: number; lockedUntil: number }>();

function getIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(ip: string): string | null {
  const record = attempts.get(ip);
  if (!record) return null;
  if (record.lockedUntil > Date.now()) {
    const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Try again in ${mins} min.`;
  }
  if (record.lockedUntil <= Date.now() && record.count >= MAX_ATTEMPTS) {
    attempts.delete(ip);
  }
  return null;
}

function recordFailure(ip: string) {
  const record = attempts.get(ip) || { count: 0, lockedUntil: 0 };
  record.count++;
  if (record.count >= MAX_ATTEMPTS) record.lockedUntil = Date.now() + LOCKOUT_MS;
  attempts.set(ip, record);
}

function clearFailures(ip: string) {
  attempts.delete(ip);
}

function verifyPassword(request: NextRequest): { ok: boolean; error?: string; status?: number } {
  const ip = getIP(request);
  const blocked = checkRateLimit(ip);
  if (blocked) return { ok: false, error: blocked, status: 429 };

  const password = request.headers.get("authorization")?.replace("Bearer ", "") || null;
  if (password !== EDIT_PASSWORD) {
    recordFailure(ip);
    const record = attempts.get(ip);
    const remaining = MAX_ATTEMPTS - (record?.count || 0);
    return { ok: false, error: remaining > 0 ? `Wrong password. ${remaining} attempts left.` : `Locked out for ${LOCKOUT_MINUTES} minutes.`, status: 401 };
  }
  clearFailures(ip);
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const action = searchParams.get("action");

  try {
    if (type === "thoughts") {
      const { data, error } = await supabase.from("thoughts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return Response.json({ success: true, data });
    }
    if (type === "timeline") {
      const { data, error } = await supabase.from("timeline").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return Response.json({ success: true, data });
    }
    if (action === "export") {
      const auth = verifyPassword(request); if (!auth.ok) return Response.json({ success: false, error: auth.error }, { status: auth.status });
      const { data: thoughts } = await supabase.from("thoughts").select("*").order("created_at", { ascending: false });
      const { data: timeline } = await supabase.from("timeline").select("*").order("sort_order", { ascending: true });
      return Response.json({ success: true, data: { thoughts, timeline } });
    }
    return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = verifyPassword(request); if (!auth.ok) return Response.json({ success: false, error: auth.error }, { status: auth.status });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const body = await request.json();

  try {
    if (type === "thoughts") {
      const { data, error } = await supabase.from("thoughts").insert({
        date: body.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toLowerCase(),
        tag: body.tag || "reflection",
        title: body.title,
        preview: body.preview,
      }).select().single();
      if (error) throw error;
      return Response.json({ success: true, data });
    }
    if (type === "timeline") {
      const { data, error } = await supabase.from("timeline").insert({
        period: body.period,
        title: body.title,
        description: body.description,
        tags: body.tags || [],
        sort_order: body.sort_order || 0,
      }).select().single();
      if (error) throw error;
      return Response.json({ success: true, data });
    }
    return Response.json({ success: false, error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = verifyPassword(request); if (!auth.ok) return Response.json({ success: false, error: auth.error }, { status: auth.status });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const body = await request.json();
  const table = type === "thoughts" ? "thoughts" : type === "timeline" ? "timeline" : null;
  if (!table) return Response.json({ success: false, error: "Invalid type" }, { status: 400 });

  try {
    const { id, ...updates } = body;
    const { data, error } = await supabase.from(table).update(updates).eq("id", id).select().single();
    if (error) throw error;
    return Response.json({ success: true, data });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = verifyPassword(request); if (!auth.ok) return Response.json({ success: false, error: auth.error }, { status: auth.status });
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const body = await request.json();
  const table = type === "thoughts" ? "thoughts" : type === "timeline" ? "timeline" : null;
  if (!table) return Response.json({ success: false, error: "Invalid type" }, { status: 400 });

  try {
    const { error } = await supabase.from(table).delete().eq("id", body.id);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
