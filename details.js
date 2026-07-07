(function () {
  const apiKey = APIUtils.getApiFromQuery();
  const api = window.API_REGISTRY[apiKey];
  const titleEl  = document.getElementById("api-title");
  const descEl   = document.getElementById("api-desc");
  const pickerEl = document.getElementById("endpoint-picker");
  const fieldsEl = document.getElementById("fields");
  const form     = document.getElementById("query-form");
  const submitBtn = form.querySelector("button[type=submit]");

  if (!api) {
    titleEl.textContent = "API não encontrada";
    descEl.textContent  = "Volte à home e escolha uma API disponível.";
    form.classList.add("hidden");
    return;
  }

  titleEl.textContent = api.title;
  descEl.textContent  = api.description;

  // Endpoint selection
  let currentEndpointId = api.endpoints[0].id;
  const preselect = APIUtils.getEndpointFromQuery();
  if (preselect && api.endpoints.some((e) => e.id === preselect)) {
    currentEndpointId = preselect;
  }

  // Prefill values passed via URL (used by the chain flow)
  let prefill = {};
  try {
    const raw = new URLSearchParams(location.search).get("prefill");
    if (raw) prefill = JSON.parse(raw);
  } catch (_) {}

  // ── Picker ──────────────────────────────────────────────────
  function renderPicker() {
    pickerEl.innerHTML = "";

    // Verifica se o usuário veio da autenticação (tem token no prefill)
    const isAuthenticated = prefill.token != null && String(prefill.token).trim() !== "";

    api.endpoints.forEach((ep) => {
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.id        = `tab-${ep.id}`;

      // Bloqueia a aba se o endpoint exige autenticação e o usuário não autenticou
      const isLocked = ep.requiresAuth && !isAuthenticated;

      if (isLocked) {
        btn.className = "endpoint-tab locked";
        btn.textContent = `${ep.label}`;
        btn.title = "Complete a etapa 1 (Autenticação) primeiro para desbloquear.";
        btn.disabled = true;
      } else {
        btn.className = "endpoint-tab" + (ep.id === currentEndpointId ? " active" : "");
        btn.textContent = ep.label;
        btn.addEventListener("click", () => {
          currentEndpointId = ep.id;
          if (!ep.requiresAuth) prefill = {};  // limpa prefill apenas ao trocar para aba que não exige auth
          renderPicker();
          renderFields();
        });
      }

      pickerEl.appendChild(btn);
    });

    // Se o endpoint atual está bloqueado, força voltar para o primeiro
    const currentEp = api.endpoints.find((e) => e.id === currentEndpointId);
    if (currentEp && currentEp.requiresAuth && !isAuthenticated) {
      currentEndpointId = api.endpoints[0].id;
      renderFields();
    }
  }

  // ── Mapa de máscaras por nome de campo ─────────────────────
  const MASK_MAP = {
    cepOrigem:  { mask: "00000-000" },
    cepDestino: { mask: "00000-000" },
    cepori:     { mask: "00000-000" },
    cepdes:     { mask: "00000-000" },
    cnpj:       { mask: "00.000.000/0000-00" },
    numero:     { mask: "0000000000" },
  };

  // ── Fields ──────────────────────────────────────────────────
  function renderFields() {
    const ep = api.endpoints.find((e) => e.id === currentEndpointId);
    fieldsEl.innerHTML = "";

    // Chain-flow banner
    if (Object.keys(prefill).length > 0) {
      const banner = document.createElement("div");
      banner.className = "chain-banner";
      banner.innerHTML =
        "✅ Dados da autenticação transferidos automaticamente. " +
        "Preencha os campos restantes e clique em <strong>Consultar</strong>.";
      fieldsEl.appendChild(banner);
    }

    if (!ep.fields.length) {
      const p = document.createElement("p");
      p.className   = "muted";
      p.textContent = "Este endpoint não requer parâmetros. Clique em Consultar.";
      fieldsEl.appendChild(p);
      return;
    }

    ep.fields.forEach((f) => {
      const wrap  = document.createElement("div");
      wrap.className = "field";

      const label = document.createElement("label");
      label.setAttribute("for", `f_${f.name}`);
      label.innerHTML = f.label.replace(" *", "") + (f.required ? ' <span class="req-star">*</span>' : "");
      wrap.appendChild(label);

      let input;
      if (f.type === "select") {
        input = document.createElement("select");
        (f.options || []).forEach((opt) => {
          const o = document.createElement("option");
          o.value       = opt.value;
          o.textContent = opt.label;
          if (f.default && f.default === opt.value) o.selected = true;
          input.appendChild(o);
        });
      } else if (f.type === "textarea") {
        input = document.createElement("textarea");
        input.rows = 4;
      } else {
        input = document.createElement("input");
        input.type = f.type || "text";
        if (f.min != null) input.min = f.min;
        if (f.max != null) input.max = f.max;
      }

      input.id   = `f_${f.name}`;
      input.name = f.name;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.required)    input.required    = true;

      // Value priority: prefill → default
      if (prefill[f.name] != null) {
        input.value = prefill[f.name];
        if (f.name === "token" || f.name === "nuContrato" || f.name === "nuDR") {
          input.readOnly = true;
          input.classList.add("prefilled");
        }
      } else if (f.default != null && f.type !== "select") {
        input.value = f.default;
      }

      wrap.appendChild(input);

      if (f.hint) {
        const hint = document.createElement("span");
        hint.className   = "hint";
        hint.textContent = f.hint;
        wrap.appendChild(hint);
      }

      // ── Alerta dinâmico para vlDeclarado ────────────────────
      if (f.name === "vlDeclarado") {
        const alertBox = document.createElement("div");
        alertBox.className = "field-alert warning hidden";
        alertBox.id = "vlDeclarado-alert";
        alertBox.textContent =
          "⚠️ Atenção: Os serviços adicionais 019 (Valor Declarado) e 001 (Aviso de Recebimento) serão incluídos automaticamente nesta requisição.";
        wrap.appendChild(alertBox);

        input.addEventListener("input", () => {
          const val = input.value.trim();
          if (val !== "" && parseFloat(val) > 0) {
            alertBox.classList.remove("hidden");
          } else {
            alertBox.classList.add("hidden");
          }
        });
      }

      fieldsEl.appendChild(wrap);

      // ── Aplicar máscara IMask (se disponível) ────────────────
      if (typeof IMask !== "undefined" && MASK_MAP[f.name] && input.tagName === "INPUT") {
        IMask(input, MASK_MAP[f.name]);
      }
    });

    // Update submit button label for chain step 1
    if (ep.chainTo) {
      submitBtn.textContent = "Autenticar e continuar →";
    } else {
      submitBtn.textContent = "Consultar";
    }
  }

  // ── Submit ───────────────────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Feedback visual: desabilita o botão e mostra loading
    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Consultando...";

    const data   = new FormData(form);
    const params = {};
    for (const [k, v] of data.entries()) params[k] = v;

    // Also include any readOnly prefilled fields not captured by FormData
    const ep = api.endpoints.find((x) => x.id === currentEndpointId);
    if (ep && ep.chainTo) {
      // Pass params to result page, which will handle the chain redirect
      const q = new URLSearchParams({
        api:      apiKey,
        endpoint: currentEndpointId,
        params:   JSON.stringify(params),
        chain:    "1",
      });
      location.href = `./result.html?${q.toString()}`;
    } else {
      const q = new URLSearchParams({
        api:      apiKey,
        endpoint: currentEndpointId,
        params:   JSON.stringify(params),
      });
      location.href = `./result.html?${q.toString()}`;
    }
  });

  // ── Histórico de Requisições ────────────────────────────────
  function renderHistory() {
    const panel   = document.getElementById("history-panel");
    const listEl  = document.getElementById("history-list");
    const toggle  = document.getElementById("history-toggle");
    const chevron = document.getElementById("history-chevron");
    if (!panel || !listEl) return;

    let history = [];
    try { history = JSON.parse(localStorage.getItem("historico_console") || "[]"); }
    catch (_) {}

    if (history.length === 0) {
      panel.classList.add("hidden");
      return;
    }

    panel.classList.remove("hidden");
    listEl.innerHTML = "";

    // Toggle expand/collapse
    toggle.onclick = () => {
      listEl.classList.toggle("open");
      chevron.classList.toggle("open");
    };

    history.forEach((entry, idx) => {
      const item = document.createElement("div");
      item.className = "history-item";
      item.title = "Clique para repetir esta consulta";

      const time = new Date(entry.time);
      const timeStr = time.toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });

      item.innerHTML = `
        <div class="history-item-info">
          <span class="history-item-title">${entry.apiTitle || entry.api} → ${entry.endpointLabel || entry.endpoint}</span>
          <span class="history-item-time">${timeStr}</span>
        </div>
        <span class="history-item-badge ${entry.ok ? "ok" : "err"}">${entry.status}</span>
      `;

      item.addEventListener("click", () => {
        // Replay: navigate to the same details page with prefilled params
        const q = new URLSearchParams({
          api:      entry.api,
          endpoint: entry.endpoint,
          prefill:  JSON.stringify(entry.params || {}),
        });
        location.href = `./details.html?${q.toString()}`;
      });

      listEl.appendChild(item);
    });

    // Botão de limpar histórico
    const clearBtn = document.createElement("button");
    clearBtn.className = "history-clear";
    clearBtn.textContent = "🗑 Limpar histórico";
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      localStorage.removeItem("historico_console");
      renderHistory();
    });
    listEl.appendChild(clearBtn);
  }

  renderPicker();
  renderFields();
  renderHistory();
})();
