import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Restriction on Google login requested by user
            if (account?.provider === "google") {
                const isAllowedEmail = user.email === "ibrahim.nifa01@gmail.com" || user.email === "ibrahim.nifa01gmail.com";
                if (!isAllowedEmail) {
                    return false; // Return false to deny access
                }
            }
            return true;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isDashboard = nextUrl.pathname.startsWith("/dashboard")

            if (isDashboard) {
                if (isLoggedIn) return true
                return false // Redirect to /login
            } else if (isLoggedIn && nextUrl.pathname === "/login") {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }
            return true
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role
            }
            // We don't store the image in the JWT to avoid HTTP 431 (Cookie too large)
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role
                if (token.sub) {
                    session.user.id = token.sub
                    // Dynamic image path to avoid cookie bloat
                    session.user.image = `/api/user/image?id=${token.sub}&t=${Date.now()}`
                }
            }
            return session
        }
    },
    providers: [],
    session: { strategy: "jwt" }
} satisfies NextAuthConfig
