import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

const scopes = [
  "user-read-email",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
].join(" ");

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(scopes)}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}
