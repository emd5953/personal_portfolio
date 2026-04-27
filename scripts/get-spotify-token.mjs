#!/usr/bin/env node
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = "https://enrinjr.com/callback";
const scopes = "user-read-recently-played user-read-private";

const code = process.argv[2];

if (!code) {
  const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  console.log("\n1. Open this URL in your browser:\n");
  console.log(url);
  console.log("\n2. After authorizing, you'll be redirected to a 404 page. That's fine.");
  console.log("   Copy the 'code' value from the URL bar (everything after ?code=)\n");
  console.log("3. Run this script again with the code:\n");
  console.log(`   node scripts/get-spotify-token.mjs YOUR_CODE_HERE\n`);
  process.exit(0);
}

const res = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }),
});

const data = await res.json();

if (data.error) {
  console.error("\nError:", data.error, "-", data.error_description);
  process.exit(1);
}

console.log("\nSuccess! Add this to your .env.local:\n");
console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`);
