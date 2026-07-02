(function () {
  const urlParams   = new URLSearchParams(location.search);
  const apiKey      = urlParams.get("api");
  const endpointId  = urlParams.get("endpoint");
  const inputParams = JSON.parse(urlParams.get("params") || "{}");
  const isChain     = urlParams.get("chain") === "1";

  const api      = window.API_REGISTRY[apiKey];
  const endpoint = api && api.endpoints.find((e) => e.id === endpointId);

  const titleEl    = document.getElementById("result-title");
  const metaEl     = document.getElementById("result-meta");
  const loadingEl  = document.getElementById("loading");
  const errorEl    = document.getElementById("error");
  const outputEl   = document.getElementById("json-output");
  const badge      = document.getElementById("status-badge");
  const backLink   = document.getElementById("back-link");
  const copyBtn    = document.getElementById("copy-btn");
  const downloadBtn = document.getElementById("download-btn");
  const chainBtnEl  = document.getElementById("chain-action");

  backLink.href = `./details.html?api=${encodeURIComponent(apiKey || "")}&endpoint=${encodeURIComponent(endpointId || "")}`;

  if (!api || !endpoint) {
    loadingEl.classList.add("hidden");
    errorEl.textContent = "API ou endpoint inválido. Volte e tente novamente.";
    errorEl.classList.remove("hidden");
    return;
  }

  titleEl.textContent = `${api.title} — ${endpoint.label}`;

  // Build request
  const { url, options } = endpoint.build(inputParams);
  const method = (options && options.method) || "GET";
  metaEl.textContent = `${method} ${url}`;

  let currentJson = null;

  fetch(url, options || {})
    .then(async (res) => {
      badge.textContent = `${res.status} ${res.statusText}`;
      badge.classList.add(res.ok ? "ok" : "err");

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); }
      catch (_) { json = { raw: text }; }
      currentJson = json;

      loadingEl.classList.add("hidden");
      outputEl.innerHTML = APIUtils.syntaxHighlight(json);
      outputEl.classList.remove("hidden");

      // ── Chain flow (Correios auth → price) ──────────────────
      if (isChain && endpoint.chainTo && endpoint.chainExtract && res.ok) {
        const { api: nextApi, endpoint: nextEp } = endpoint.chainTo;
        const prefill = {};

        for (const [fieldName, jsonPath] of Object.entries(endpoint.chainExtract)) {
          const val = APIUtils.getNestedValue(json, jsonPath);
          if (val != null) prefill[fieldName] = val;
        }

        if (chainBtnEl) {
          chainBtnEl.classList.remove("hidden");
          chainBtnEl.textContent = "Prosseguir para consulta de preço →";
          chainBtnEl.addEventListener("click", () => {
            const q = new URLSearchParams({
              api:      nextApi,
              endpoint: nextEp,
              prefill:  JSON.stringify(prefill),
            });
            location.href = `./details.html?${q.toString()}`;
          });
        }
      }
    })
    .catch((err) => {
      loadingEl.classList.add("hidden");
      badge.textContent = "Falha";
      badge.classList.add("err");
      errorEl.textContent = `Erro ao consultar API: ${err.message}. Pode ser um erro de rede ou CORS.`;
      errorEl.classList.remove("hidden");
    });

  // ── Copy / Download ─────────────────────────────────────────
  copyBtn.addEventListener("click", async () => {
    if (!currentJson) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentJson, null, 2));
      copyBtn.textContent = "Copiado!";
      setTimeout(() => (copyBtn.textContent = "Copiar JSON"), 1500);
    } catch (_) {
      copyBtn.textContent = "Falha ao copiar";
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (!currentJson) return;
    const blob = new Blob([JSON.stringify(currentJson, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href     = URL.createObjectURL(blob);
    link.download = `${apiKey}-${endpointId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
})();
