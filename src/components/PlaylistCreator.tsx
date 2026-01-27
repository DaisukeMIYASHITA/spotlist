"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

interface PlaylistCreatorProps {
  selectedTrackUris: string[];
  onSuccess: (playlistUrl: string) => void;
}

export function PlaylistCreator({
  selectedTrackUris,
  onSuccess,
}: PlaylistCreatorProps) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!session) {
      signIn("spotify");
      return;
    }

    if (!name.trim()) {
      setError("プレイリスト名を入力してください");
      return;
    }

    if (selectedTrackUris.length === 0) {
      setError("曲を選択してください");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/spotify/playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          trackUris: selectedTrackUris,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "プレイリストの作成に失敗しました");
      }

      onSuccess(data.playlist.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">プレイリストを作成</h3>

      {!session && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            プレイリストを作成するにはSpotifyにログインしてください
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          プレイリスト名 *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: Summer Fes 2024"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          説明（任意）
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例: フェスの予習用プレイリスト"
          rows={2}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={isCreating || (!session && false)}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isCreating ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            作成中...
          </>
        ) : !session ? (
          <>
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Spotifyにログインして作成
          </>
        ) : (
          <>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            プレイリストを作成（{selectedTrackUris.length}曲）
          </>
        )}
      </button>
    </div>
  );
}
