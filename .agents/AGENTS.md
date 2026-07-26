# Deployment Verification Rule

After editing core/critical files (e.g., `authMiddleware.js`, `index.js`, or similar entry/middleware files), and deploying them to production (Droplet):
1. **Always verify the deployment** by pinging a health-check endpoint (e.g., `curl -I https://api.loopwren.com/` or `https://api.loopwren.com/api/auth/login`) immediately after restart.
2. Ensure the endpoint returns a valid response (not a 502 Bad Gateway or 500 Internal Server Error) before declaring the deployment successful.
3. Do not solely rely on the `PM2 status` showing "online", as PM2 may auto-restart crashing applications or get stuck in a restart loop while still appearing online.
