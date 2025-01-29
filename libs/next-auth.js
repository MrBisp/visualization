import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from './supabase';
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const { data: user } = await supabase
          .from('users')
          .select()
          .eq('email', credentials.email)
          .single();

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google') {
          console.log('Attempting to save user:', {
            email: user.email,
            name: user.name
          });

          const now = new Date().toISOString();

          const { data, error } = await supabase
            .from('users')
            .upsert({
              google_id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              created_at: now,
              updated_at: now,
            }, {
              onConflict: 'email',
              returning: 'minimal'
            });

          if (error) {
            console.error('Supabase error:', error);
            return false;
          }

          console.log('User saved successfully');
          return true;
        }
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        // Get fresh user data from Supabase
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('email', session.user.email)
          .single();

        if (!error && userData) {
          session.user.id = userData.id;
          session.user.name = userData.name;
          // Keep the email and image from the OAuth provider if they exist
          session.user.email = session.user.email || userData.email;
          session.user.image = session.user.image || null;
        }
      }
      return session;
    },
  },
  pages: {
    error: '/',
    signIn: '/',
  },
  session: {
    strategy: "jwt",
  },
};
