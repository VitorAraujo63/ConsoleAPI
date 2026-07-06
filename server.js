/**
 * Servidor proxy local — API Console
 * Resolve o bloqueio de CORS ao chamar APIs externas direto do browser.
 * Rota: /proxy/* → repassa a requisição para a API externa correspondente.
 */

const express    = require("express");
const fetch      = require("node-fetch");
const path       = require("path");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Segurança ──────────────────────────────────────────────
// Domínios permitidos pelo proxy (previne ataques SSRF)
const ALLOWED_DOMAINS = [
  "api.correios.com.br",
  "www.jadlog.com.br",
];

// Timeout para requisições do proxy (em milissegundos)
const PROXY_TIMEOUT_MS = 15000;

// ── Middleware ──────────────────────────────────────────────
// Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // desabilitado para não bloquear scripts inline e CDNs
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting: máximo de 60 requisições por minuto por IP
const proxyLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minuto
  max: 60,                 // limite por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Aguarde um momento e tente novamente." },
});

app.use(express.json({ limit: "2mb" }));  // Limita payload para prevenir sobrecarga de memória
app.use(express.static(path.join(__dirname)));   // Serve os arquivos HTML/CSS/JS

// ── Health Check ────────────────────────────────────────────
// Endpoint usado pelo Render (e outros hosts) para verificar se o app está vivo
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// ── Rota genérica de proxy ──────────────────────────────────
// Front-end chama: POST/GET /proxy?url=<url_destino>
// Servidor repassa para <url_destino> com os mesmos headers e body.
app.all("/proxy", proxyLimiter, async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Parâmetro 'url' ausente na query." });
  }

  // ── Validação SSRF: só permite domínios da whitelist ──────
  try {
    const parsedUrl = new URL(targetUrl);
    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      console.warn(`[proxy] Domínio bloqueado: ${parsedUrl.hostname}`);
      return res.status(403).json({
        error: `Domínio '${parsedUrl.hostname}' não permitido pelo proxy.`,
        allowed: ALLOWED_DOMAINS,
      });
    }
  } catch (urlErr) {
    return res.status(400).json({ error: "URL inválida fornecida ao proxy." });
  }

  try {
    // Monta os headers para repassar (remove headers do host local)
    const forwardHeaders = {};
    const SKIP = ["host", "origin", "referer", "content-length"];

    for (const [key, value] of Object.entries(req.headers)) {
      if (!SKIP.includes(key.toLowerCase())) {
        forwardHeaders[key] = value;
      }
    }

    const fetchOptions = {
      method:  req.method,
      headers: forwardHeaders,
      timeout: PROXY_TIMEOUT_MS,
    };

    // Repassa o body somente para métodos que o suportam
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const apiRes  = await fetch(targetUrl, fetchOptions);
    const text    = await apiRes.text();

    // Repassa status e body ao cliente
    res.status(apiRes.status);
    res.setHeader("Content-Type", apiRes.headers.get("content-type") || "application/json");
    res.send(text);

  } catch (err) {
    console.error("[proxy] Erro:", err.message);

    if (err.type === "request-timeout" || err.name === "AbortError") {
      return res.status(504).json({ error: "A API externa demorou demais para responder (timeout de 15s)." });
    }

    res.status(502).json({ error: `Erro ao chamar API externa: ${err.message}` });
  }
});

// ── Página 404 ──────────────────────────────────────────────
// Captura qualquer rota não encontrada e retorna a página 404
app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

// ── Start ───────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n✅ API Console rodando em http://localhost:${PORT}\n`);
  console.log(`   Abra http://localhost:${PORT} no navegador.\n`);
});

// ── Graceful Shutdown ───────────────────────────────────────
// Quando o Render (ou outro host) envia SIGTERM para reiniciar/deploy,
// fecha as conexões abertas de forma limpa antes de encerrar.
function gracefulShutdown(signal) {
  console.log(`\n⚠️  Sinal ${signal} recebido. Encerrando servidor...`);
  server.close(() => {
    console.log("✅ Servidor encerrado com sucesso.");
    process.exit(0);
  });

  // Se demorar mais de 10s, força o encerramento
  setTimeout(() => {
    console.error("⛔ Forçando encerramento após timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
