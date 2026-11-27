import Head from "next/head";
import Link from "next/link";
import { useCallback, useState } from "react";
import PhaserGame from "@/components/PhaserGame";
import { setSkyRaidGameMode } from "@/lib/playerIdentity";

export default function SkyRaidGamePage() {
  const [gameMode, setGameMode] = useState<"coop" | "ffa">("coop");
  const [started, setStarted] = useState(false);
  const loader = useCallback(() => import("@/game/skyRaid/SkyRaidScene"), []);

  const handleStart = () => {
    setSkyRaidGameMode(gameMode);
    setStarted(true);
  };

  if (!started) {
    return (
      <>
        <Head>
          <title>Alliance — Sky Raid</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <main style={pageStyle}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <header style={{ marginBottom: 40 }}>
              <Link href="/" style={backStyle}>
                ← All games
              </Link>
              <h1 style={titleStyle}>Sky Raid</h1>
              <p style={subtitleStyle}>
                Vertical shooter — up to 6 planes on one screen
              </p>
            </header>
            
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, marginBottom: 20, color: "#9be7ff" }}>Select Game Mode</h2>
              <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
                <button
                  onClick={() => setGameMode("coop")}
                  style={{
                    ...modeButtonStyle,
                    ...(gameMode === "coop" ? modeButtonActiveStyle : {}),
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🤝</div>
                  <div style={{ fontWeight: "bold", marginBottom: 4 }}>CO-OP</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Work together</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Revive teammates</div>
                </button>
                <button
                  onClick={() => setGameMode("ffa")}
                  style={{
                    ...modeButtonStyle,
                    ...(gameMode === "ffa" ? modeButtonActiveStyle : {}),
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⚔️</div>
                  <div style={{ fontWeight: "bold", marginBottom: 4 }}>FREE-FOR-ALL</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Highest score wins</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Compete for pickups</div>
                </button>
              </div>
            </div>

            <button onClick={handleStart} style={startButtonStyle}>
              START GAME
            </button>

            <div style={{ marginTop: 30, fontSize: 14, color: "#6f8fa1" }}>
              <p>🎮 WASD/Arrows: Move | Space: Shoot</p>
              <p>⏱️ 30-minute sessions | 🎯 Survive and upgrade</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Alliance — Sky Raid</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={pageStyle}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <header style={{ marginBottom: 20 }}>
            <Link href="/" style={backStyle}>
              ← All games
            </Link>
            <h1 style={titleStyle}>Sky Raid ({gameMode === "coop" ? "Co-op" : "FFA"})</h1>
            <p style={subtitleStyle}>
              {gameMode === "coop" ? "Work together to survive" : "Compete for the highest score"}
            </p>
          </header>
          <PhaserGame loader={loader} exportName="createSkyRaidGame" />
        </div>
      </main>
    </>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #152238 0%, #07111f 55%)",
  color: "#e8f7ff",
  padding: "24px 16px",
} as const;

const backStyle = {
  color: "#6f8fa1",
  textDecoration: "none",
  fontSize: 14,
} as const;

const titleStyle = { margin: "8px 0 4px", fontSize: 28 } as const;
const subtitleStyle = { margin: 0, color: "#8aa6b8" } as const;

const modeButtonStyle = {
  padding: "24px",
  background: "#1a2a3f",
  border: "2px solid #2a3f5a",
  borderRadius: "12px",
  color: "#e8f7ff",
  cursor: "pointer",
  transition: "all 0.2s",
  minWidth: "180px",
  fontSize: 14,
} as const;

const modeButtonActiveStyle = {
  background: "#2a4a6f",
  borderColor: "#58f5ff",
  boxShadow: "0 0 20px rgba(88, 245, 255, 0.3)",
} as const;

const startButtonStyle = {
  padding: "16px 48px",
  background: "linear-gradient(135deg, #58f5ff 0%, #7dffb3 100%)",
  border: "none",
  borderRadius: "8px",
  color: "#07111f",
  fontWeight: "bold",
  fontSize: 18,
  cursor: "pointer",
  transition: "all 0.2s",
} as const;
