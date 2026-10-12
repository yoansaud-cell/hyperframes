import { spawnSync } from "node:child_process";
import type { Plugin } from "vite";

/** Capabilities of the workspace dev host, rather than the CLI preview host. */
export function devEnvironmentApi(): Plugin {
  return {
    name: "studio-dev-environment",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET") return next();
        const path = req.url?.split("?")[0];
        let payload: object;
        if (path === "/api/open-in-desktop") {
          // A workspace dev server has no single-project desktop handoff.
          payload = { available: false };
        } else if (path === "/api/environment/ffmpeg") {
          const missing = ["ffmpeg", "ffprobe"].find(
            (binary) => spawnSync(binary, ["-version"], { timeout: 5000 }).status !== 0,
          );
          payload = missing
            ? {
                ok: false,
                title: `${missing} not found`,
                detail: "The dev host cannot run the required encoder tools.",
                hint: "Install FFmpeg and ffprobe on the dev host before exporting.",
              }
            : { ok: true };
        } else return next();
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(payload));
      });
    },
  };
}
