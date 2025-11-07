import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('Using API base URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  console.warn('EXPO_PUBLIC_RORK_API_BASE_URL is not set. Backend features will not work.');
  console.log('Available EXPO_PUBLIC env vars:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')));
  
  return '';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: async (input, init) => {
        console.log('tRPC fetch request:', input);
        try {
          const response = await fetch(input, {
            ...init,
            headers: {
              ...init?.headers,
              'Content-Type': 'application/json',
            },
          });
          console.log('tRPC fetch response status:', response.status);
          return response;
        } catch (error) {
          console.error('tRPC fetch error:', error);
          throw error;
        }
      },
    }),
  ],
});
