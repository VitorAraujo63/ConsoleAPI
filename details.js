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
    api.endpoints.forEach((ep) => {
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.id        = `tab-${ep.id}`;
      btn.className = "endpoint-tab" + (ep.id === currentEndpointId ? " active" : "");
      btn.textContent = ep.label;
      btn.addEventListener("click", () => {
        currentEndpointId = ep.id;
        prefill = {};           // clear prefill when manually switching
        renderPicker();
        renderFields();
      });
      pickerEl.appendChild(btn);
    });
  }

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

      fieldsEl.appendChild(wrap);
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

  renderPicker();
  renderFields();
})();
