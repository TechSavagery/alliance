import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { GAME_TITLES } from "@alliance/shared";
import { getOrCreatePlayerId } from "@/lib/playerIdentity";

type PlayerHistory = {
  player: {
    playerId: string;
    displayName: string;
  };
  lifetime: {
    score: number;
    kills: number;
    deaths: number;
    matchesPlayed: number;
  };
  byGame: Array<{
    gameId: string;
    score: number;
    kills: number;
    deaths: number;
    matchesPlayed: number;
  }>;
  recentMatches: Array<{
    matchId: number;
    gameId: string;
    score: number;
    kills: number;
    deaths: number;
    startedAt: string;
  }>;
};

export default function ProfilePage() {
  const [history, setHistory] = useState<PlayerHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");

  const load = useCallback(async (id: string) => {
    try {
      const response = await fetch(
        `/api/admin/players/${encodeURIComponent(id)}?token=alliance-dev`
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      setHistory(await response.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    }
  }, []);

  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);
    void load(id);
  }, [load]);

  const gameName = (gameId: string) =>
    GAME_TITLES.find((game) => game.id === gameId)?.name ?? gameId;

  return (
    <>
      <Head>
        <title>Alliance — My Stats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={styles.main}>
        <div style={styles.shell}>
          <Link href="/" style={styles.back}>
            ← All games
          </Link>
          <h1 style={styles.title}>Pilot history</h1>
          <p style={styles.subtitle}>
            Lifetime stats across every Alliance title on this browser identity
          </p>
          {playerId && (
            <p style={styles.meta}>
              Player ID: <code>{playerId}</code>
            </p>
          )}
          {error && <p style={styles.error}>{error}</p>}

          {history && (
            <>
              <section style={styles.grid}>
                <Stat label="Lifetime score" value={history.lifetime.score} />
                <Stat label="Lifetime kills" value={history.lifetime.kills} />
                <Stat label="Lifetime deaths" value={history.lifetime.deaths} />
                <Stat
                  label="Matches played"
                  value={history.lifetime.matchesPlayed}
                />
              </section>

              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>Per-game breakdown</h2>
                {history.byGame.length === 0 ? (
                  <p style={styles.meta}>Play a match to start building history.</p>
                ) : (
                  <ul style={styles.list}>
                    {history.byGame.map((entry) => (
                      <li key={entry.gameId} style={styles.listItem}>
                        <strong>{gameName(entry.gameId)}</strong>
                        <span>
                          {entry.score} pts · {entry.kills}K / {entry.deaths}D ·{" "}
                          {entry.matchesPlayed} matches
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>Recent matches</h2>
                {history.recentMatches.length === 0 ? (
                  <p style={styles.meta}>No matches yet.</p>
                ) : (
                  <ul style={styles.list}>
                    {history.recentMatches.map((match) => (
                      <li key={match.matchId} style={styles.listItem}>
                        <span>
                          {gameName(match.gameId)} · #{match.matchId}
                        </span>
                        <span>
                          {match.score} pts · {match.kills}K / {match.deaths}D
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.stat}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #102033 0%, #050814 55%)",
    color: "#e8f7ff",
    padding: "24px 16px",
  },
  shell: { maxWidth: 860, margin: "0 auto" },
  back: { color: "#6f8fa1", textDecoration: "none", fontSize: 14 },
  title: { margin: "8px 0 4px", fontSize: 28 },
  subtitle: { margin: "0 0 8px", color: "#8aa6b8" },
  meta: { color: "#6f8fa1", fontSize: 13 },
  error: { color: "#ff9e9e" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    margin: "18px 0",
  },
  stat: {
    border: "1px solid #1f3a4d",
    borderRadius: 12,
    padding: 14,
    background: "rgba(8, 20, 32, 0.55)",
  },
  statLabel: { margin: 0, color: "#8aa6b8", fontSize: 12 },
  statValue: { margin: "6px 0 0", fontSize: 26, fontFamily: "monospace" },
  card: {
    border: "1px solid #1f3a4d",
    borderRadius: 12,
    padding: 16,
    background: "rgba(8, 20, 32, 0.55)",
    marginBottom: 14,
  },
  sectionTitle: { margin: "0 0 10px", fontSize: 16 },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 13,
    color: "#cfe7f5",
  },
};
