# Spotlist

アーティスト名からSpotifyプレイリストを簡単に作成できるWebアプリケーション。

フェスの出演者リストや好きなアーティストを入力して、それぞれの人気曲を集めたプレイリストをワンクリックで作成できます。

## 機能

- アーティスト名の一括入力（テキストエリアまたはファイルアップロード）
- 各アーティストの人気曲を自動取得
- 曲の選択/解除機能
- Spotifyアカウントへのプレイリスト作成

## 技術スタック

- [Next.js](https://nextjs.org) 16 (App Router)
- [NextAuth.js](https://next-auth.js.org) v5 (Spotify OAuth)
- [Tailwind CSS](https://tailwindcss.com) v4
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- TypeScript

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Spotify APIの設定

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)でアプリを作成
2. アプリ設定で以下のRedirect URIを追加:
   - `http://localhost:3000/api/auth/callback/spotify`
3. Client IDとClient Secretを取得

### 3. 環境変数の設定

`.env.example`を`.env.local`にコピーし、以下の値を設定:

```bash
cp .env.example .env.local
```

```env
# Spotify API credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# NextAuth.js
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_auth_secret

# App URL
NEXTAUTH_URL=http://localhost:3000
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)でアプリにアクセスできます。

## 使い方

1. アーティスト名を入力（改行またはカンマ区切り）またはファイルをアップロード
2. 「アーティストを検索」をクリック
3. 検索結果からプレイリストに追加する曲を選択
4. プレイリスト名を入力し、「Spotifyにログインして作成」をクリック
5. Spotifyで認証後、プレイリストが自動作成されます

## ビルド

```bash
npm run build
```

## ライセンス

MIT
