import type { NextApiRequest, NextApiResponse } from "next";

const COLYSEUS_URL =
  process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "http://localhost:2567";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const parts = req.query.path;
  const path = Array.isArray(parts) ? parts.join("/") : parts ?? "";
  const url = new URL(`${COLYSEUS_URL}/admin/api/${path}`);

  Object.entries(req.query).forEach(([key, value]) => {
    if (key === "path") return;
    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(key, entry));
    } else if (typeof value === "string") {
      url.searchParams.set(key, value);
    }
  });

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        "x-admin-token":
          (req.headers["x-admin-token"] as string | undefined) ??
          (typeof req.query.token === "string" ? req.query.token : "") ??
          "",
      },
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader(
      "content-type",
      upstream.headers.get("content-type") ?? "application/json"
    );
    res.send(text);
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error
          ? `Admin proxy failed: ${error.message}`
          : "Admin proxy failed",
    });
  }
}
