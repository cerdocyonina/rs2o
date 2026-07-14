import { serve } from "bun";
import index from "./index.html";
import { createSearchClient } from "./server/rustore";

const searchClient = createSearchClient();

const server = serve({
  routes: {
    "/*": index,

    "/api/search": async req => {
      const { searchParams } = new URL(req.url);
      const q = (searchParams.get("q") ?? "").trim();
      const page = Number(searchParams.get("page") ?? "0");

      if (!q || q.length > 100) {
        return Response.json({ error: "Параметр q обязателен (до 100 символов)" }, { status: 400 });
      }
      if (!Number.isInteger(page) || page < 0) {
        return Response.json({ error: "Параметр page должен быть целым числом ≥ 0" }, { status: 400 });
      }

      try {
        return Response.json(await searchClient.search(q, page));
      } catch (error) {
        console.error(`search "${q}" p${page} failed:`, error);
        return Response.json({ error: "RuStore не ответил, попробуйте позже" }, { status: 502 });
      }
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
