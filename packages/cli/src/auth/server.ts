/**
 * Localhost callback server for OAuth flow
 *
 * Flow:
 * 1. CLI starts local HTTP server on random port
 * 2. Browser redirects to localhost with token
 * 3. Server captures token and shuts down
 */

import http from "http";
import { URL } from "url";

interface CallbackResult {
  token: string;
  error?: string;
}

/**
 * Start a localhost server to receive OAuth callback
 */
export function startCallbackServer(timeout = 120000): Promise<{
  port: number;
  waitForCallback: () => Promise<CallbackResult>;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    let callbackResolve: (result: CallbackResult) => void;
    let callbackReject: (error: Error) => void;

    const callbackPromise = new Promise<CallbackResult>((res, rej) => {
      callbackResolve = res;
      callbackReject = rej;
    });

    const server = http.createServer((req, res) => {
      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
      }

      // Only handle GET /callback
      if (req.method !== "GET" || !req.url?.startsWith("/callback")) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      try {
        const url = new URL(req.url, `http://localhost`);
        const token = url.searchParams.get("token");
        const error = url.searchParams.get("error");

        // Send response page
        res.writeHead(200, {
          "Content-Type": "text/html",
          "Access-Control-Allow-Origin": "*",
        });

        if (error) {
          res.end(getErrorPage(error));
          callbackResolve({ token: "", error });
        } else if (token) {
          res.end(getSuccessPage());
          callbackResolve({ token });
        } else {
          res.end(getErrorPage("No token received"));
          callbackResolve({ token: "", error: "No token received" });
        }

        // Close server after response
        setTimeout(() => server.close(), 500);
      } catch (err) {
        res.writeHead(500);
        res.end("Internal error");
        callbackReject(err as Error);
      }
    });

    // Handle server errors
    server.on("error", (err) => {
      reject(err);
    });

    // Start server on random available port
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }

      const port = address.port;

      // Setup timeout
      const timeoutId = setTimeout(() => {
        server.close();
        callbackReject(new Error("Authentication timed out"));
      }, timeout);

      resolve({
        port,
        waitForCallback: async () => {
          const result = await callbackPromise;
          clearTimeout(timeoutId);
          return result;
        },
        close: () => {
          clearTimeout(timeoutId);
          server.close();
        },
      });
    });
  });
}

/**
 * Generate success HTML page
 */
function getSuccessPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LogVault - Authentication Successful</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e2e8f0;
    }
    .container {
      text-align: center;
      padding: 3rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 400px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #22c55e;
    }
    p {
      color: #94a3b8;
      margin-bottom: 1.5rem;
    }
    .brand {
      color: #208A96;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>Authentication Successful</h1>
    <p>You can close this window and return to your terminal.</p>
    <p class="brand">LogVault</p>
  </div>
  <script>
    // Auto-close after 3 seconds
    setTimeout(() => window.close(), 3000);
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate error HTML page
 */
function getErrorPage(error: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LogVault - Authentication Failed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e2e8f0;
    }
    .container {
      text-align: center;
      padding: 3rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 400px;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #ef4444;
    }
    p {
      color: #94a3b8;
      margin-bottom: 1rem;
    }
    .error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      color: #fca5a5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✗</div>
    <h1>Authentication Failed</h1>
    <p>Please try again in your terminal.</p>
    <div class="error">${escapeHtml(error)}</div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
