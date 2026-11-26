import { useEffect } from "react";
import { useRouter } from "next/router";

/** Legacy route — redirects to the Arena title. */
export default function LegacyGameRedirect() {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/games/arena");
  }, [router]);

  return null;
}
