import { NextRequest, NextResponse } from "next/server";
import { searchArtistsAndGetTracks } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artists, tracksPerArtist = 3 } = body;

    if (!artists || !Array.isArray(artists)) {
      return NextResponse.json(
        { error: "Artists array is required" },
        { status: 400 }
      );
    }

    const results = await searchArtistsAndGetTracks(artists, tracksPerArtist);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search artists" },
      { status: 500 }
    );
  }
}
