import { getSpotifyData } from "@/lib/spotify";

export async function GET() {
  try {
    const data = await getSpotifyData();
    return Response.json(data);
  } catch (error) {
    console.error("Spotify API Error:", error);
    return Response.json(
      { error: "Failed to fetch Spotify data", message: (error as Error).message },
      { status: 500 }
    );
  }
}
