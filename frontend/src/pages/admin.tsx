import Head from "next/head";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { COLYSEUS_URL } from "@/game/config";

type AdminPlayer = {
  sessionId: string;
  score: number;
  kills: number;
  deaths: number;
  alive: boolean;
  x: number;
  y: number;
};

type AdminRoom = {
  roomId: string;
  name: string;
  clients: number;
  locked?: boolean;
  maxClients?: number;
  matchId?: number | null;
  players: AdminPlayer[];
  bulletCount: number;
};

type StatsSummary = {
  totals: {
    matches: number;
    activeMatches: number;
    playerSessions: number;
    kills: number;
    totalScore: number;
  };
  mostDangerous: Array<{
    sessionId: string;
    kills: number;
    deaths: number;
    score: number;
    matchesPlayed: number;
  }>;
  mostDestroyed: Array<{
    sessionId: string;
    kills: number;
    deaths: number;
    score: number;
    matchesPlayed: number;
  }>;
};

const DEFAULT_TOKEN = "alliance-dev";

export default function AdminPage() {
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Same-origin Next.js proxy avoids browser CORS issues with the game server.
  const apiBase = useMemo(() => "/api/admin", []);

  const withToken = useCallback(
    (path: string) =>
      `${apiBase}${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`,
    [apiBase, token]
  );

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsResponse, summaryResponse] = await Promise.all([
        fetch(withToken("/rooms")),
        fetch(withToken("/stats/summary")),
      ]);

      if (!roomsResponse.ok) {
        const body = await roomsResponse.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${roomsResponse.status}`);
      }

      if (!summaryResponse.ok) {
        const body = await summaryResponse.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${summaryResponse.status}`);
      }

      const data = await roomsResponse.json();
      const summaryData = await summaryResponse.json();
      setRooms(data.rooms ?? []);
      setSummary(summaryData);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [withToken]);

  useEffect(() => {
    void fetchRooms();
    const id = setInterval(() => {
      void fetchRooms();
    }, 2000);
    return () => clearInterval(id);
  }, [fetchRooms]);

  async function runAction(path: string, method: "POST" = "POST") {
    setLoading(true);
    try {
      const response = await fetch(withToken(path), { method });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${response.status}`);
      }
      await fetchRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      setLoading(false);
    }
  }

  function onTokenSubmit(event: FormEvent) {
    event.preventDefault();
    void fetchRooms();
  }

  return (
    <>
      <Head>
        <title>Alliance Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={styles.main}>
        <div style={styles.shell}>
          <header style={styles.header}>
            <div>
              <Link href="/" style={styles.back}>
                ← Back
              </Link>
              <h1 style={styles.title}>Alliance Admin</h1>
              <p style={styles.subtitle}>
                Live rooms, players, and scores — separate from Colyseus monitor
              </p>
            </div>
            <div style={styles.headerActions}>
              <Link href="/game" style={styles.linkButton}>
                Open game
              </Link>
              <a
                href={`${COLYSEUS_URL}/colyseus`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.linkButton}
              >
                Colyseus monitor
              </a>
            </div>
          </header>

          <form onSubmit={onTokenSubmit} style={styles.tokenRow}>
            <label style={styles.label}>
              Admin token
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={styles.input}
                autoComplete="off"
              />
            </label>
            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            {lastUpdated && (
              <span style={styles.meta}>Updated {lastUpdated}</span>
            )}
          </form>

          {error && <p style={styles.error}>{error}</p>}

          {summary && (
            <section style={styles.summaryGrid}>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Matches stored</p>
                <p style={styles.statValue}>{summary.totals.matches}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Kills logged</p>
                <p style={styles.statValue}>{summary.totals.kills}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Player sessions</p>
                <p style={styles.statValue}>{summary.totals.playerSessions}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Total score</p>
                <p style={styles.statValue}>{summary.totals.totalScore}</p>
              </div>
            </section>
          )}

          {summary && (
            <section style={styles.leaderGrid}>
              <div style={styles.roomCard}>
                <h2 style={styles.sectionTitle}>Most dangerous (persisted)</h2>
                {summary.mostDangerous.length === 0 ? (
                  <p style={styles.empty}>No kill data yet.</p>
                ) : (
                  <ul style={styles.list}>
                    {summary.mostDangerous.map((player) => (
                      <li key={`danger-${player.sessionId}`} style={styles.listItem}>
                        <code>{player.sessionId.slice(0, 8)}</code>
                        <span>
                          {player.kills}K / {player.deaths}D · {player.score} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={styles.roomCard}>
                <h2 style={styles.sectionTitle}>Most destroyed (persisted)</h2>
                {summary.mostDestroyed.length === 0 ? (
                  <p style={styles.empty}>No death data yet.</p>
                ) : (
                  <ul style={styles.list}>
                    {summary.mostDestroyed.map((player) => (
                      <li key={`destroyed-${player.sessionId}`} style={styles.listItem}>
                        <code>{player.sessionId.slice(0, 8)}</code>
                        <span>
                          {player.deaths}D / {player.kills}K · {player.score} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {rooms.length === 0 && !error && (
            <p style={styles.empty}>
              No active rooms. Join the game in a browser tab to create one.
            </p>
          )}

          <div style={styles.roomList}>
            {rooms.map((room) => (
              <section key={room.roomId} style={styles.roomCard}>
                <div style={styles.roomHeader}>
                  <div>
                    <h2 style={styles.roomTitle}>{room.roomId}</h2>
                    <p style={styles.meta}>
                      {room.clients} client{room.clients === 1 ? "" : "s"} ·{" "}
                      {room.bulletCount} bullets · {room.name}
                    </p>
                  </div>
                  <button
                    style={styles.secondaryButton}
                    onClick={() =>
                      void runAction(`/rooms/${room.roomId}/reset-scores`)
                    }
                  >
                    Reset all scores
                  </button>
                </div>

                {room.players.length === 0 ? (
                  <p style={styles.empty}>No players in this room.</p>
                ) : (
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>#</th>
                          <th style={styles.th}>Player</th>
                          <th style={styles.th}>Score</th>
                          <th style={styles.th}>K</th>
                          <th style={styles.th}>D</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Pos</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {room.players.map((player, index) => (
                          <tr key={player.sessionId}>
                            <td style={styles.td}>{index + 1}</td>
                            <td style={styles.td}>
                              <code>{player.sessionId.slice(0, 8)}</code>
                            </td>
                            <td style={styles.td}>{player.score}</td>
                            <td style={styles.td}>{player.kills}</td>
                            <td style={styles.td}>{player.deaths}</td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.badge,
                                  background: player.alive
                                    ? "rgba(125, 255, 179, 0.15)"
                                    : "rgba(255, 126, 126, 0.15)",
                                  color: player.alive ? "#7dffb3" : "#ff9e9e",
                                }}
                              >
                                {player.alive ? "alive" : "dead"}
                              </span>
                            </td>
                            <td style={styles.td}>
                              {player.x},{player.y}
                            </td>
                            <td style={styles.td}>
                              <div style={styles.actionRow}>
                                <button
                                  style={styles.tinyButton}
                                  onClick={() =>
                                    void runAction(
                                      `/rooms/${room.roomId}/players/${player.sessionId}/reset-score`
                                    )
                                  }
                                >
                                  Reset
                                </button>
                                <button
                                  style={styles.tinyButton}
                                  onClick={() =>
                                    void runAction(
                                      `/rooms/${room.roomId}/players/${player.sessionId}/respawn`
                                    )
                                  }
                                >
                                  Respawn
                                </button>
                                <button
                                  style={{
                                    ...styles.tinyButton,
                                    borderColor: "#6a3030",
                                    color: "#ff9e9e",
                                  }}
                                  onClick={() =>
                                    void runAction(
                                      `/rooms/${room.roomId}/players/${player.sessionId}/kick`
                                    )
                                  }
                                >
                                  Kick
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #102033 0%, #050814 55%)",
    color: "#e8f7ff",
    padding: "24px 16px",
  },
  shell: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  back: {
    color: "#6f8fa1",
    textDecoration: "none",
    fontSize: 14,
  },
  title: {
    margin: "8px 0 4px",
    fontSize: 28,
  },
  subtitle: {
    margin: 0,
    color: "#8aa6b8",
  },
  headerActions: {
    display: "flex",
    gap: 8,
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #2b4d63",
    color: "#9be7ff",
    textDecoration: "none",
    fontSize: 13,
  },
  tokenRow: {
    display: "flex",
    gap: 12,
    alignItems: "end",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 13,
    color: "#8aa6b8",
  },
  input: {
    minWidth: 220,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2b4d63",
    background: "#081420",
    color: "#e8f7ff",
  },
  primaryButton: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #58f5ff, #7dffb3)",
    color: "#041018",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #2b4d63",
    background: "rgba(8, 20, 32, 0.7)",
    color: "#9be7ff",
    cursor: "pointer",
  },
  tinyButton: {
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #2b4d63",
    background: "transparent",
    color: "#9be7ff",
    cursor: "pointer",
    fontSize: 12,
  },
  meta: {
    color: "#6f8fa1",
    fontSize: 13,
  },
  error: {
    color: "#ff9e9e",
    marginBottom: 12,
  },
  empty: {
    color: "#8aa6b8",
  },
  roomList: {
    display: "grid",
    gap: 16,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  leaderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    border: "1px solid #1f3a4d",
    borderRadius: 12,
    padding: 14,
    background: "rgba(8, 20, 32, 0.55)",
  },
  statLabel: {
    margin: 0,
    color: "#8aa6b8",
    fontSize: 12,
  },
  statValue: {
    margin: "6px 0 0",
    fontSize: 28,
    fontFamily: "monospace",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 16,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 8,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#cfe7f5",
    fontSize: 13,
  },
  roomCard: {
    border: "1px solid #1f3a4d",
    borderRadius: 12,
    padding: 16,
    background: "rgba(8, 20, 32, 0.55)",
  },
  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  roomTitle: {
    margin: 0,
    fontSize: 18,
    fontFamily: "monospace",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "8px 6px",
    borderBottom: "1px solid #1f3a4d",
    color: "#8aa6b8",
    fontWeight: 500,
  },
  td: {
    padding: "10px 6px",
    borderBottom: "1px solid rgba(31, 58, 77, 0.5)",
    verticalAlign: "middle",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
  },
  actionRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
};
