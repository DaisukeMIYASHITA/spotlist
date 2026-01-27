"use client";

import { ArtistWithTracks, SpotifyTrack } from "@/types";
import Image from "next/image";

interface TrackListProps {
  results: ArtistWithTracks[];
  selectedTracks: Set<string>;
  onToggleTrack: (trackUri: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function TrackItem({
  track,
  isSelected,
  onToggle,
}: {
  track: SpotifyTrack;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "bg-green-900/30 border border-green-600"
          : "bg-gray-800/50 border border-transparent hover:bg-gray-800"
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 focus:ring-offset-0 bg-gray-700"
      />
      <div className="relative w-12 h-12 flex-shrink-0">
        {track.album.images[0] && (
          <Image
            src={track.album.images[0].url}
            alt={track.album.name}
            fill
            className="object-cover rounded"
            sizes="48px"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{track.name}</p>
        <p className="text-gray-400 text-sm truncate">
          {track.artists.map((a) => a.name).join(", ")}
        </p>
      </div>
      <span className="text-gray-500 text-sm">{formatDuration(track.duration_ms)}</span>
    </div>
  );
}

export function TrackList({
  results,
  selectedTracks,
  onToggleTrack,
  onSelectAll,
  onDeselectAll,
}: TrackListProps) {
  const totalTracks = results.reduce((acc, r) => acc + r.tracks.length, 0);
  const foundArtists = results.filter((r) => r.found).length;
  const notFoundArtists = results.filter((r) => !r.found);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">検索結果</h2>
          <p className="text-gray-400 text-sm">
            {foundArtists}人のアーティスト / {totalTracks}曲
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            すべて選択
          </button>
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            選択解除
          </button>
        </div>
      </div>

      {notFoundArtists.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-500 text-sm font-medium mb-2">
            以下のアーティストが見つかりませんでした:
          </p>
          <p className="text-yellow-400/80 text-sm">
            {notFoundArtists.map((r) => r.searchQuery).join(", ")}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {results
          .filter((r) => r.found && r.artist)
          .map((result) => (
            <div key={result.artist!.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  {result.artist!.images[0] && (
                    <Image
                      src={result.artist!.images[0].url}
                      alt={result.artist!.name}
                      fill
                      className="object-cover rounded-full"
                      sizes="40px"
                    />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {result.artist!.name}
                </h3>
              </div>
              <div className="space-y-2 pl-13">
                {result.tracks.map((track) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    isSelected={selectedTracks.has(track.uri)}
                    onToggle={() => onToggleTrack(track.uri)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      <div className="sticky bottom-4 bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg p-4 flex items-center justify-between">
        <p className="text-white">
          <span className="font-bold text-green-500">{selectedTracks.size}</span>
          <span className="text-gray-400"> 曲を選択中</span>
        </p>
      </div>
    </div>
  );
}
