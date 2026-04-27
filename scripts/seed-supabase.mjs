import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const thoughts = JSON.parse(readFileSync("public/data/thoughts.json", "utf-8"));
const timeline = JSON.parse(readFileSync("public/data/timeline.json", "utf-8"));

async function seed() {
  console.log("Seeding thoughts...");
  for (const t of thoughts) {
    const { error } = await supabase.from("thoughts").insert({
      date: t.date,
      tag: t.tag,
      title: t.title,
      preview: t.preview,
    });
    if (error) console.error("  Error:", t.title, error.message);
    else console.log("  ✓", t.title);
  }

  console.log("\nSeeding timeline...");
  for (let i = 0; i < timeline.length; i++) {
    const t = timeline[i];
    const { error } = await supabase.from("timeline").insert({
      period: t.period,
      title: t.title,
      description: t.description,
      tags: t.tags,
      sort_order: i,
    });
    if (error) console.error("  Error:", t.title, error.message);
    else console.log("  ✓", t.title);
  }

  console.log("\nDone!");
}

seed();
