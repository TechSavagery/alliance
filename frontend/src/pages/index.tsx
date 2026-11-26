import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { GAME_TITLES } from "@alliance/shared";
import {
  getDisplayName,
  getOrCreatePlayerId,
  setDisplayName,
} from "@/lib/playerIdentity";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [name, setName] = useState("Pilot");
  const [playerId, setPlayerId] = useState("");

  useEffect(() => {
    setName(getDisplayName());
    setPlayerId(getOrCreatePlayerId());
  }, []);

  function onSaveName(event: FormEvent) {
    event.preventDefault();
    setDisplayName(name);
    setName(getDisplayName());
  }

  return (
    <>
      <Head>
        <title>Alliance</title>
        <meta
          name="description"
          content="Alliance multiplayer mini-game platform"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div className={styles.hero} style={{ maxWidth: 760 }}>
          <p className={styles.eyebrow}>Alliance</p>
          <h1 className={styles.title}>Multiplayer game platform</h1>
          <p className={styles.description}>
            Multiple titles on one account identity. Your pilot stats persist
            across Arena Drift, Sky Raid, and future games.
          </p>

          <form
            onSubmit={onSaveName}
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pilot name"
              style={{
                minWidth: 180,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #2b4d63",
                background: "#081420",
                color: "#e8f7ff",
              }}
            />
            <button type="submit" className={styles.secondaryButton}>
              Save name
            </button>
          </form>
          {playerId && (
            <p className={styles.hint} style={{ marginBottom: 24 }}>
              Player ID: <code>{playerId.slice(0, 8)}…</code> (kept in this
              browser for cross-game history)
            </p>
          )}

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              textAlign: "left",
              marginBottom: 24,
            }}
          >
            {GAME_TITLES.map((game) => (
              <Link
                key={game.id}
                href={game.route}
                style={{
                  display: "block",
                  padding: 18,
                  borderRadius: 14,
                  border: "1px solid #1f3a4d",
                  background: "rgba(8, 20, 32, 0.72)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#58f5ff",
                    fontFamily: "monospace",
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {game.tagline}
                </p>
                <h2 style={{ margin: "8px 0 6px", fontSize: 22 }}>{game.name}</h2>
                <p style={{ margin: 0, color: "#8aa6b8", lineHeight: 1.5 }}>
                  {game.description}
                </p>
                <p style={{ margin: "12px 0 0", color: "#7dffb3", fontSize: 13 }}>
                  Up to {game.maxPlayers} players
                </p>
              </Link>
            ))}
          </div>

          <div className={styles.actions}>
            <Link href="/profile" className={styles.secondaryButton}>
              My stats
            </Link>
            <Link href="/admin" className={styles.secondaryButton}>
              Admin panel
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
