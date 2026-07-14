import { useEffect, useRef, useState } from "react";
import { makeObtainiumLink } from "./shared/obtainium";
import type { AppResult, SearchResponse } from "./shared/types";
import "./index.css";

type UiState = "idle" | "loading" | "ready" | "error";

export function App() {
  const [query, setQuery] = useState("");
  const [apps, setApps] = useState<AppResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [state, setState] = useState<UiState>("idle");
  const [loadingMore, setLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function runSearch(q: string, pageNum: number, append: boolean) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (append) setLoadingMore(true);
    else setState("loading");

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${pageNum}`, {
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SearchResponse;
      setApps(prev => (append ? [...prev, ...data.apps] : data.apps));
      setHasMore(data.hasMore);
      setPage(pageNum);
      setState("ready");
    } catch {
      if (!ctrl.signal.aborted) setState("error");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      abortRef.current?.abort();
      setApps([]);
      setState("idle");
      return;
    }
    const timer = setTimeout(() => runSearch(q, 0, false), 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="page">
      <div className="container">
        <h1>RuStore-2-Obtainium</h1>
        <p className="muted">
          Поиск по каталогу RuStore - добавление в <a href="https://github.com/ImranR98/Obtainium">Obtainium</a> (&ge; 1.1.41).
        </p>

        <input
          type="search"
          className="search-input"
          placeholder="название приложения…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />

        {state === "idle" && <p className="muted">Введите запрос - например, "2gis".</p>}
        {state === "loading" && <p className="muted">поиск…</p>}
        {state === "error" && <p className="error">Ошибка запроса. Попробуйте ещё раз позже.</p>}
        {state === "ready" && apps.length === 0 && <p className="muted">Ничего не найдено.</p>}

        {apps.length > 0 && state !== "loading" && (
          <ul className="results">
            {apps.map(app => (
              <li key={app.packageName}>
                <a className="app-card" href={makeObtainiumLink(app.packageName)}>
                  <img className="app-icon" src={app.iconUrl} alt="" loading="lazy" width={48} height={48} />
                  <span className="app-info">
                    <span className="app-title">{app.appName}</span>
                    <span className="app-meta">
                      <span className="app-rating">★ {app.rating.toFixed(1)}</span>
                      <span className="muted">{app.downloadsText}</span>
                    </span>
                    <span className="app-pkg muted">{app.packageName}</span>
                    {app.shortDescription && (
                      <span className="app-desc">{app.shortDescription}</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {state === "ready" && hasMore && (
          <button
            className="more-btn"
            disabled={loadingMore}
            onClick={() => runSearch(query.trim(), page + 1, true)}
          >
            {loadingMore ? "загрузка…" : "показать ещё"}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
