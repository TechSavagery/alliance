import Head from "next/head";
import Link from "next/link";
import { useCallback } from "react";
import PhaserGame from "@/components/PhaserGame";

export default function SkyRaidGamePage() {
  const loader = useCallback(() => import("@/game/skyRaid/SkyRaidScene"), []);

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
            <h1 style={titleStyle}>Sky Raid</h1>
            <p style={subtitleStyle}>
              Vertical co-op scroller — up to 6 shape-planes on one screen
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
