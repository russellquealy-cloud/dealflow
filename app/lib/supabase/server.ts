import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          console.log(`🍪 Server cookie get: ${name} = ${value ? 'exists' : 'missing'}`);
          return value;
        },
        set(name: string, value: string, options) {
          try {
            console.log(`🍪 Server cookie set: ${name}`);
            cookieStore.set(name, value, options);
          } catch (error) {
            // Handle cookie setting in Server Components
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options) {
          try {
            console.log(`🍪 Server cookie remove: ${name}`);
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // Handle cookie removal in Server Components
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
};
