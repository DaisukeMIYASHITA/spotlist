export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
  external_urls: { spotify: string };
}

export interface ArtistWithTracks {
  artist: SpotifyArtist | null;
  tracks: SpotifyTrack[];
  searchQuery: string;
  found: boolean;
}

export interface PlaylistData {
  name: string;
  description: string;
  tracks: SpotifyTrack[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  images: { url: string }[];
}
