/**
 * Servidor proxy local — API Console
 * Resolve o bloqueio de CORS ao chamar APIs externas direto do browser.
 * Rota: /proxy/* → repassa a requisição para a API externa correspondente.
 */

const express = require("express");
const fetch   = require("node-fetch");
const path    = require("path");

const app  = express();
const PORT = 3000;

// ── Segurança ──────────────────────────────────────────────
// Domínios permitidos pelo proxy (previne ataques SSRF)
const ALLOWED_DOMAINS = [
  "api.correios.com.br",
  "www.jadlog.com.br",
];

// ── Middleware ──────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));  // Limita payload para prevenir sobrecarga de memória
app.use(express.static(path.join(__dirname)));   // Serve os arquivos HTML/CSS/JS

// ── Rota genérica de proxy ──────────────────────────────────
// Front-end chama: POST/GET /proxy?url=<url_destino>
// Servidor repassa para <url_destino> com os mesmos headers e body.
app.all("/proxy", async (req, res) => {
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

    // Reconstrói a URL com os query params da API destino (tudo após &, passado no body ou header)
    const fetchOptions = {
      method:  req.method,
      headers: forwardHeaders,
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
    res.status(502).json({ error: `Erro ao chamar API externa: ${err.message}` });
  }
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ API Console rodando em http://localhost:${PORT}\n`);
  console.log("   Abra http://localhost:3000 no navegador.\n");
});
