import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isRoot = nextUrl.pathname === "/"
            const isLogin = nextUrl.pathname === "/login"

            if (isDashboard || isRoot) {
                if (isLoggedIn) {
                    if (isRoot) return Response.redirect(new URL("/dashboard", nextUrl))
                    return true
                }
                return false // Redirect to /login
            } else if (isLoggedIn && isLogin) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }
            return true
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.roles = (user as any).roles
                token.isRegulateur = (user as any).isRegulateur
            }

            // Handle update signal from SessionSync
            if (trigger === "update" && session?.user) {
                if (session.user.roles) token.roles = session.user.roles
                if (session.user.isRegulateur !== undefined) token.isRegulateur = session.user.isRegulateur
            }

            // We don't store the image in the JWT to avoid HTTP 431 (Cookie too large)
            return token
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                session.user.roles = token.roles
                session.user.isRegulateur = token.isRegulateur
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
