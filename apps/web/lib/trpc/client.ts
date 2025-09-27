import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink, wsLink, splitLink } from '@trpc/client';
// import { type AppRouter } from '@/../../backend/src/trpc/router';
import superjson from 'superjson';

// Temporary type for AppRouter
type AppRouter = any;

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Helper function to get auth token
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Create WebSocket client for subscriptions
function createWSClient() {
  if (typeof window === 'undefined') return null;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3003';

  return httpBatchLink({
    url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/trpc`,
    transformer: superjson,
    headers() {
      const token = getAuthToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  });
}

// Create HTTP link for queries and mutations
function createHTTPLink() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return httpBatchLink({
    url: `${apiUrl}/trpc`,
    transformer: superjson,
    headers() {
      const token = getAuthToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  });
}

// Create split link that routes subscriptions to WebSocket
export function createTRPCClient() {
  const wsClient = createWSClient();
  const httpLink = createHTTPLink();

  // Use split link to route based on operation type
  const link = wsClient
    ? splitLink({
        condition(op) {
          return op.type === 'subscription';
        },
        true: wsClient,
        false: httpLink,
      })
    : httpLink;

  return {
    links: [link],
  };
}

// Create vanilla tRPC client for non-React usage
export const vanillaTRPCClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/trpc`,
      transformer: superjson,
      headers() {
        if (typeof window === 'undefined') return {};
        const token = localStorage.getItem('token');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});