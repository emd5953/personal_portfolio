import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const EDIT_PASSWORD = process.env.EDIT_PASSWORD || "enrin2025";

function verifyPassword(request: NextRequest): boolean {
  const password = request.headers.get("authorization")?.replace("Bearer ", "") || null;
  return password === EDIT_PASSWORD;
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
      if (!verifyPassword(request)) return Response.json({ success: false, error: "Invalid password" }, { status: 401 });
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
  if (!verifyPassword(request)) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
  if (!verifyPassword(request)) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
  if (!verifyPassword(request)) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
