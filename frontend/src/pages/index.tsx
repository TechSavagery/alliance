import Head from "next/head";
import Link from "next/link";
import styles from "@/styles/Home.module.css";

export default function Home() {
  return (
    <>
      <Head>
        <title>Alliance</title>
        <meta
          name="description"
          content="Multiplayer space shooter mini games"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Alliance</p>
          <h1 className={styles.title}>Multiplayer space shooter</h1>
          <p className={styles.description}>
            Browser-based multiplayer built with Colyseus and Phaser. Fly,
            shoot, and sync with other players in real time.
          </p>
          <div className={styles.actions}>
            <Link href="/game" className={styles.primaryButton}>
              Launch game
            </Link>
            <a
              href="http://localhost:2567/colyseus"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryButton}
            >
              Server monitor
            </a>
          </div>
          <p className={styles.hint}>
            Start the game server on port 2567, then open the game in two tabs
            to test multiplayer.
          </p>
        </div>
      </main>
    </>
  );
}
