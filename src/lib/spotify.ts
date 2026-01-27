import { SpotifyArtist, SpotifyTrack, ArtistWithTracks } from "@/types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export async function getClientCredentialsToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function searchArtist(
  query: string,
  accessToken: string
): Promise<SpotifyArtist | null> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to search artist:", query);
    return null;
  }

  const data = await response.json();
  return data.artists.items[0] || null;
}

export async function getArtistTopTracks(
  artistId: string,
  accessToken: string,
  market: string = "JP"
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `${SPOTIFY_API_BASE}/artists/${artistId}/top-tracks?market=${market}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to get top tracks for artist:", artistId);
    return [];
  }

  const data = await response.json();
  return data.tracks || [];
}

export async function searchArtistsAndGetTracks(
  artistNames: string[],
  tracksPerArtist: number = 3
): Promise<ArtistWithTracks[]> {
  const accessToken = await getClientCredentialsToken();
  const results: ArtistWithTracks[] = [];

  for (const name of artistNames) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;

    const artist = await searchArtist(trimmedName, accessToken);

    if (artist) {
      const tracks = await getArtistTopTracks(artist.id, accessToken);
      results.push({
        artist,
        tracks: tracks.slice(0, tracksPerArtist),
        searchQuery: trimmedName,
        found: true,
      });
    } else {
      results.push({
        artist: null,
        tracks: [],
        searchQuery: trimmedName,
        found: false,
      });
    }
  }

  return results;
}

export async function createPlaylist(
  userId: string,
  name: string,
  description: string,
  accessToken: string
): Promise<{ id: string; external_urls: { spotify: string } }> {
  const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create playlist: ${error}`);
  }

  return response.json();
}

export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
  accessToken: string
): Promise<void> {
  // Spotify API allows max 100 tracks per request
  const chunks = [];
  for (let i = 0; i < trackUris.length; i += 100) {
    chunks.push(trackUris.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: chunk,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add tracks to playlist: ${error}`);
    }
  }
}

export async function getCurrentUser(
  accessToken: string
): Promise<{ id: string; display_name: string }> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get current user");
  }

  return response.json();
}
