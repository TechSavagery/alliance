import Head from "next/head";
import dynamic from "next/dynamic";
import Link from "next/link";

const PhaserGame = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        maxWidth: 840,
        aspectRatio: "4 / 3",
        margin: "0 auto",
        display: "grid",
        placeItems: "center",
        border: "1px solid #1f3a4d",
        borderRadius: 12,
        color: "#9be7ff",
        fontFamily: "monospace",
      }}
    >
      Loading game...
    </div>
  ),
});

export default function GamePage() {
  return (
    <>
      <Head>
        <title>Alliance — Space Shooter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #102033 0%, #050814 55%)",
          color: "#e8f7ff",
          padding: "24px 16px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <header style={{ marginBottom: 20 }}>
            <Link
              href="/"
              style={{ color: "#6f8fa1", textDecoration: "none", fontSize: 14 }}
            >
              ← Back
            </Link>
            <h1 style={{ margin: "8px 0 4px", fontSize: 28 }}>Alliance Space Shooter</h1>
            <p style={{ margin: 0, color: "#8aa6b8" }}>
              Multiplayer prototype — Colyseus 0.17 + Phaser 3
            </p>
          </header>
          <PhaserGame />
        </div>
      </main>
    </>
  );
}
