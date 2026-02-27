import NextAuth, { User } from "next-auth"
import { authConfig } from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("Authorize called with:", credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password")
                }

                const emailStr = (credentials.email as string).trim();

                const user = await prisma.user.findUnique({
                    where: { email: emailStr }
                })

                console.log("DB User found:", !!user);

                if (!user || !user.password) {
                    throw new Error("No user found with this email, or signed up via Google")
                }

                if (user.isActive === false) {
                    throw new Error("This account has been deactivated.")
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                console.log("Password match:", passwordMatch);

                if (!passwordMatch) {
                    throw new Error("Invalid password")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                } as any;
            }
        })
    ],
})
