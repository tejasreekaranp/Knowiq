// src/api-handlers/health.ts
function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    ok: true,
    service: "knowiq-api"
  });
}
export {
  handler as default
};
