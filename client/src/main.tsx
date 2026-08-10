import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

// Development mode: skip API calls and use dummy data
const DEV_MODE = true;
const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    if (!DEV_MODE) {
      redirectToLoginIfUnauthorized(error);
    }
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    if (!DEV_MODE) {
      redirectToLoginIfUnauthorized(error);
    }
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        if (DEV_MODE) {
          // Mock TRPC response for DEV_MODE
          return Promise.resolve(
            new Response(
              JSON.stringify({
                result: {
                  data: [
                    {
                      id: "mock-1",
                      content: "あなたが前職を離職した理由を教えてください。",
                    },
                    {
                      id: "mock-2",
                      content: "ブランク期間をどのように過ごしていましたか？",
                    },
                    {
                      id: "mock-3",
                      content: "50代での転職を決めた動機は何ですか？",
                    },
                    {
                      id: "mock-4",
                      content: "新しい職場で心がけたいことは何ですか？",
                    },
                    {
                      id: "mock-5",
                      content: "営業職での実績について具体的に教えてください。",
                    },
                  ],
                },
              }),
              {
                status: 200,
                headers: { "content-type": "application/json" },
              }
            )
          );
        }
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

