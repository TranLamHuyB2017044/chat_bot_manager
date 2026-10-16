import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

function terminalLogger(): Plugin {
  return {
    name: "vite-plugin-terminal-logger",
    configureServer(server) {
      function printLog(data: any) {
        if (!data) return;
        const reset = "\x1b[0m";
        const bold = "\x1b[1m";
        const green = "\x1b[32m";
        const yellow = "\x1b[33m";
        const blue = "\x1b[34m";
        const magenta = "\x1b[35m";
        const cyan = "\x1b[36m";
        const red = "\x1b[31m";
        const gray = "\x1b[90m";

        const method = (data.method || "GET").toUpperCase();
        const methodColor =
          method === "GET"
            ? green
            : method === "POST"
            ? cyan
            : method === "PUT" || method === "PATCH"
            ? yellow
            : method === "DELETE"
            ? red
            : blue;

        const status = data.status;
        const statusColor =
          status !== undefined
            ? status >= 200 && status < 300
              ? green
              : status >= 300 && status < 400
              ? cyan
              : status >= 400 && status < 500
              ? yellow
              : red
            : red;

        const timestamp = new Date().toLocaleTimeString();

        console.log("");
        console.log(`${gray}┌─────────────────────────────────────────────────────────────${reset}`);
        console.log(
          `${gray}│${reset} ${bold}${methodColor}[${method}]${reset} ${bold}${data.path || data.url}${reset} ${gray}(${timestamp})${reset}`
        );
        console.log(`${gray}│${reset} ${gray}Endpoint:${reset} ${cyan}${data.url}${reset}`);

        if (status !== undefined) {
          console.log(
            `${gray}│${reset} ${gray}Status:  ${reset} ${bold}${statusColor}${status} ${data.statusText || ""}${reset} ${gray}(${data.duration || 0}ms)${reset}`
          );
        }

        if (data.error) {
          console.log(`${gray}│${reset} ${bold}${red}Error:   ${data.error}${reset}`);
        }

        // Request Body
        if (data.requestBody !== undefined && data.requestBody !== null) {
          console.log(`${gray}│${reset} ${bold}${magenta}── Request Body ──${reset}`);
          const bodyStr =
            typeof data.requestBody === "string"
              ? data.requestBody
              : JSON.stringify(data.requestBody, null, 2);
          for (const line of bodyStr.split("\n")) {
            console.log(`${gray}│${reset}   ${line}`);
          }
        }

        // Response Body
        if (data.responseBody !== undefined && data.responseBody !== null) {
          console.log(`${gray}│${reset} ${bold}${blue}── Response Body ──${reset}`);
          const resStr =
            typeof data.responseBody === "string"
              ? data.responseBody
              : JSON.stringify(data.responseBody, null, 2);
          const lines = resStr.split("\n");
          if (lines.length > 150) {
            for (const line of lines.slice(0, 150)) {
              console.log(`${gray}│${reset}   ${line}`);
            }
            console.log(
              `${gray}│${reset}   ${gray}... (${lines.length - 150} more lines truncated in terminal)${reset}`
            );
          } else {
            for (const line of lines) {
              console.log(`${gray}│${reset}   ${line}`);
            }
          }
        }

        console.log(`${gray}└─────────────────────────────────────────────────────────────${reset}`);
        console.log("");
      }

      // Listen on Vite WebSocket HMR
      server.ws.on("terminal:api-log", (data: any) => {
        printLog(data);
      });

      // Also listen on HTTP middleware endpoint as fallback
      server.middlewares.use((req, res, next) => {
        if (req.url === "/__api_log" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              printLog(data);
            } catch {}
            res.statusCode = 200;
            res.end();
          });
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_URL?.trim();

  if (!backendUrl) {
    throw new Error(
      "[Vite Config Error] Biến môi trường VITE_API_URL chưa được thiết lập hoặc bị rỗng. Vui lòng cấu hình VITE_API_URL trong file .env hoặc .env.local!"
    );
  }

  return {
    plugins: [react(), terminalLogger()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-vendor": ["lucide-react", "sonner", "clsx", "tailwind-merge"],
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

