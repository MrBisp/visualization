import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials');
                }

                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (error || !user) {
                    throw new Error('Invalid credentials');
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    throw new Error('Invalid credentials');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    credits: user.credits
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                // Initial sign in
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.credits = user.credits;
            }

            // Handle credit updates
            if (trigger === 'update' && session?.credits !== undefined) {
                token.credits = session.credits;
            }

            return token;
        },
        async session({ session, token, trigger }) {
            // Send properties to the client
            session.user.id = token.id;
            session.user.email = token.email;
            session.user.name = token.name;

            // Always fetch latest credit count from database
            const { data: userData, error } = await supabase
                .from('users')
                .select('credits')
                .eq('id', token.id)
                .single();
            
            if (!error && userData) {
                session.user.credits = userData.credits;
            } else {
                session.user.credits = token.credits; // Fallback to token if fetch fails
            }
            
            console.log('Session in callback:', session); // Debug log
            return session;
        }
    },
    events: {
        async signIn({ user }) {
            // Fetch latest user data on sign in
            const { data: userData } = await supabase
                .from('users')
                .select('credits')
                .eq('id', user.id)
                .single();
            
            if (userData) {
                user.credits = userData.credits;
            }
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/login',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
