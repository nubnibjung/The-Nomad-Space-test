import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyUser } from "@/lib/userStore";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;
        const user = await verifyUser(email, password);
        if (!user) return null;

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = (user as any).image ? `/api/profile/image?id=${user.id}` : null;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) {
          token.picture = session.image ? `/api/profile/image?id=${token.sub}&t=${Date.now()}` : null;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      if (token.picture) session.user.image = token.picture;
      return session;
    },
  },
});
