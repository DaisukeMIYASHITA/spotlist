"use client";

import { useState } from "react";
import {
  Header,
  ArtistInput,
  TrackList,
  PlaylistCreator,
  SuccessModal,
} from "@/components";
import { ArtistWithTracks, SpotifyTrack } from "@/types";

type Step = "input" | "preview";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ArtistWithTracks[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const handleSearch = async (artists: string[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/spotify/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artists, tracksPerArtist: 3 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "検索に失敗しました");
      }

      setResults(data.results);

      // Select all tracks by default
      const allTrackUris = new Set<string>();
      data.results.forEach((result: ArtistWithTracks) => {
        result.tracks.forEach((track: SpotifyTrack) => {
          allTrackUris.add(track.uri);
        });
      });
      setSelectedTracks(allTrackUris);

      setStep("preview");
    } catch (error) {
      console.error("Search error:", error);
      alert(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrack = (trackUri: string) => {
    setSelectedTracks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trackUri)) {
        newSet.delete(trackUri);
      } else {
        newSet.add(trackUri);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allTrackUris = new Set<string>();
    results.forEach((result) => {
      result.tracks.forEach((track) => {
        allTrackUris.add(track.uri);
      });
    });
    setSelectedTracks(allTrackUris);
  };

  const deselectAll = () => {
    setSelectedTracks(new Set());
  };

  const handleSuccess = (playlistUrl: string) => {
    setSuccessUrl(playlistUrl);
  };

  const handleReset = () => {
    setStep("input");
    setResults([]);
    setSelectedTracks(new Set());
    setSuccessUrl(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        {step === "input" && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">
                アーティストからプレイリストを作成
              </h2>
              <p className="text-gray-400">
                フェスの出演者リストや好きなアーティストを入力して、
                <br />
                Spotifyプレイリストを簡単に作成できます
              </p>
            </div>

            <ArtistInput onSubmit={handleSearch} isLoading={isLoading} />

            <div className="border-t border-gray-800 pt-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                使い方
              </h3>
              <ol className="space-y-3 text-gray-400">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  <span>
                    アーティスト名を入力（改行またはカンマ区切り）またはファイルをアップロード
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </span>
                  <span>
                    検索結果からプレイリストに追加する曲を選択
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </span>
                  <span>
                    Spotifyにログインしてプレイリストを作成
                  </span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="max-w-6xl mx-auto space-y-8">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              最初からやり直す
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TrackList
                  results={results}
                  selectedTracks={selectedTracks}
                  onToggleTrack={toggleTrack}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                />
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <PlaylistCreator
                    selectedTrackUris={Array.from(selectedTracks)}
                    onSuccess={handleSuccess}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        <p>Spotlist - Powered by Spotify Web API</p>
      </footer>

      {successUrl && (
        <SuccessModal playlistUrl={successUrl} onClose={handleReset} />
      )}
    </div>
  );
}
