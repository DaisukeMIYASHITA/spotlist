import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPlaylist, addTracksToPlaylist, getCurrentUser } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. Please log in with Spotify." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, trackUris } = body;

    if (!name || !trackUris || !Array.isArray(trackUris)) {
      return NextResponse.json(
        { error: "Playlist name and track URIs are required" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentUser(session.accessToken);

    // Create playlist
    const playlist = await createPlaylist(
      user.id,
      name,
      description || "Created with Spotlist",
      session.accessToken
    );

    // Add tracks to playlist
    if (trackUris.length > 0) {
      await addTracksToPlaylist(playlist.id, trackUris, session.accessToken);
    }

    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist.id,
        url: playlist.external_urls.spotify,
      },
    });
  } catch (error) {
    console.error("Playlist creation error:", error);
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
