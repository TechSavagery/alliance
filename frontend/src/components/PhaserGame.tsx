import { useEffect, useRef } from "react";
import type Phaser from "phaser";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    let cancelled = false;

    import("@/game/GameScene").then(({ createPhaserGame }) => {
      if (cancelled || !containerRef.current) return;
      gameRef.current = createPhaserGame(containerRef.current);
    });

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: 840,
        aspectRatio: "4 / 3",
        margin: "0 auto",
        border: "1px solid #1f3a4d",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 0 40px rgba(88, 245, 255, 0.08)",
      }}
    />
  );
}
