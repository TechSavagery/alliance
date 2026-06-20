import { useEffect, useRef, useState, type CSSProperties } from "react";
import type Phaser from "phaser";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || gameRef.current) return;

    let cancelled = false;

    import("@/game/GameScene")
      .then(({ createPhaserGame }) => {
        if (cancelled || !containerRef.current) return;
        gameRef.current = createPhaserGame(containerRef.current);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load game";
        setError(message);
      });

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [mounted]);

  if (!mounted) {
    return (
      <div style={containerStyle}>
        <p style={statusStyle}>Loading game...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={{ ...statusStyle, color: "#ff7b7b" }}>{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} style={containerStyle} />;
}

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 840,
  aspectRatio: "4 / 3",
  margin: "0 auto",
  border: "1px solid #1f3a4d",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 0 40px rgba(88, 245, 255, 0.08)",
  display: "grid",
  placeItems: "center",
  background: "#050814",
};

const statusStyle: CSSProperties = {
  margin: 0,
  color: "#9be7ff",
  fontFamily: "monospace",
  fontSize: 14,
};
