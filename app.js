// Shared API registry and utilities.
// Each API defines one or more endpoints. Each endpoint has fields (form inputs)
// and a build(params) function that returns { url, options } for fetch().
//
// Special endpoint flag: `chainTo` — after a successful response the result page
// will extract values using `chainExtract` and redirect to another details page
// pre-filling those values (used by Correios auth → freight price flow).

/**
 * Wraps a target URL through the local Express proxy (/proxy?url=...)
 * so the browser never makes a cross-origin request directly.
 * The proxy lives on the same origin as the page (localhost:3000).
 */
function proxyUrl(targetUrl) {
  return `/proxy?url=${encodeURIComponent(targetUrl)}`;
}

window.API_REGISTRY = {

  // ─────────────────────────────────────────────────────────────
  // MERCADO LIVRE
  // ─────────────────────────────────────────────────────────────
  mercadolivre: {
    title: "Mercado Livre",
    description: "Consultas à API do Mercado Livre. Informe o Access Token obtido externamente.",
    color: "#fff159",
    textColor: "#2d3277",
    abbr: "ML",
    endpoints: [
      {
        id: "order",
        label: "Pedido (Order)",
        fields: [
          {
            name: "accessToken",
            label: "Access Token",
            type: "text",
            required: true,
            placeholder: "APP_USR-...",
            hint: "Bearer token obtido externamente no painel do Mercado Livre.",
          },
          {
            name: "orderId",
            label: "Order ID",
            type: "text",
            required: true,
            placeholder: "ex: 2000007654321",
          },
        ],
        build: (p) => ({
          url: `https://api.mercadolibre.com/orders/${encodeURIComponent(p.orderId)}?access_token=${encodeURIComponent(p.accessToken)}`,
          options: {
            method: "GET",
          },
        }),
      },
      {
        id: "shipment",
        label: "Envio (Shipment)",
        fields: [
          {
            name: "accessToken",
            label: "Access Token",
            type: "text",
            required: true,
            placeholder: "APP_USR-...",
            hint: "Bearer token obtido externamente no painel do Mercado Livre.",
          },
          {
            name: "shipmentId",
            label: "Shipment ID",
            type: "text",
            required: true,
            placeholder: "ex: 40000001234567",
          },
        ],
        build: (p) => ({
          url: `https://api.mercadolibre.com/shipments/${encodeURIComponent(p.shipmentId)}?access_token=${encodeURIComponent(p.accessToken)}`,
          options: {
            method: "GET",
          },
        }),
      },
      {
        id: "catalog_quality",
        label: "Qualidade de Catálogo",
        fields: [
          {
            name: "accessToken",
            label: "Access Token",
            type: "text",
            required: true,
            placeholder: "APP_USR-...",
            hint: "Bearer token obtido externamente no painel do Mercado Livre.",
          },
          {
            name: "itemId",
            label: "Item ID (MLB...)",
            type: "text",
            required: true,
            placeholder: "ex: MLB1234567890",
          },
        ],
        build: (p) => ({
          url: `https://api.mercadolibre.com/catalog_quality/status?item_id=${encodeURIComponent(p.itemId)}&access_token=${encodeURIComponent(p.accessToken)}`,
          options: {
            method: "GET",
          },
        }),
      },
      {
        id: "users",
        label: "Usuário (User Info)",
        fields: [
          {
            name: "accessToken",
            label: "Access Token",
            type: "text",
            required: true,
            placeholder: "APP_USR-...",
          },
          {
            name: "userId",
            label: "User ID",
            type: "text",
            required: true,
            placeholder: "ex: 123456789",
          },
        ],
        build: (p) => ({
          url: `https://api.mercadolibre.com/users/${encodeURIComponent(p.userId)}?access_token=${encodeURIComponent(p.accessToken)}`,
          options: {
            method: "GET",
          },
        }),
      },
      {
        id: "billing_info",
        label: "Faturamento (Billing Info)",
        fields: [
          {
            name: "accessToken",
            label: "Access Token",
            type: "text",
            required: true,
            placeholder: "APP_USR-...",
          },
          {
            name: "orderId",
            label: "Order ID",
            type: "text",
            required: true,
            placeholder: "ex: 2000007654321",
          },
        ],
        build: (p) => ({
          url: `https://api.mercadolibre.com/orders/${encodeURIComponent(p.orderId)}/billing_info?access_token=${encodeURIComponent(p.accessToken)}`,
          options: {
            method: "GET",
          },
        }),
      },
      {
        id: "category",
        label: "Categoria (Category)",
        fields: [
          {
            name: "accessToken",
            label: "Access Token",
            type: "text",
            required: true,
            placeholder: "APP_USR-...",
          },
          {
            name: "categoryId",
            label: "Category ID (MLB...)",
            type: "text",
            required: true,
            placeholder: "ex: MLB1234",
          },
        ],
        build: (p) => ({
          url: `https://api.mercadolibre.com/categories/${encodeURIComponent(p.categoryId)}?access_token=${encodeURIComponent(p.accessToken)}`,
          options: {
            method: "GET",
          },
        }),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // CORREIOS
  // ─────────────────────────────────────────────────────────────
  correios: {
    title: "Correios",
    description: "Autenticação com cartão de postagem e consulta de preço de frete nacional.",
    color: "#00457c",
    textColor: "#ffffff",
    abbr: "COR",
    endpoints: [
      {
        id: "auth",
        label: "1. Autenticar Cartão",
        fields: [
          {
            name: "username",
            label: "Usuário (Username)",
            type: "text",
            required: true,
            placeholder: "seu usuário Correios",
            hint: "Credencial de acesso à API dos Correios.",
          },
          {
            name: "password",
            label: "Senha (Password)",
            type: "password",
            required: true,
            placeholder: "••••••••",
          },
          {
            name: "numero",
            label: "Número do Cartão de Postagem",
            type: "text",
            required: true,
            placeholder: "ex: 0076050149",
            hint: "Número do cartão de postagem associado ao contrato.",
          },
        ],
        // Após autenticar com sucesso, encadeia para a próxima etapa
        chainTo: { api: "correios", endpoint: "preco" },
        // Extrai do JSON de resposta os campos necessários para a próxima etapa
        chainExtract: {
          token: "token",
          nuContrato: "cartaoPostagem.contrato",
          nuDR: "cartaoPostagem.dr",
        },
        build: (p) => ({
          url: proxyUrl("https://api.correios.com.br/token/v1/autentica/cartaopostagem"),
          options: {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${p.username}:${p.password}`)}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ numero: p.numero }),
          },
        }),
      },
      {
        id: "preco",
        label: "2. Consultar Preço",
        fields: [
          {
            name: "token",
            label: "Bearer Token",
            type: "text",
            required: true,
            placeholder: "eyJhbGciOi...",
            hint: "Token retornado na etapa de autenticação (preenchido automaticamente).",
          },
          {
            name: "nuContrato",
            label: "Número do Contrato",
            type: "text",
            required: true,
            placeholder: "ex: 9912515475",
            hint: "Retornado pela autenticação (preenchido automaticamente).",
          },
          {
            name: "nuDR",
            label: "DR",
            type: "text",
            required: true,
            placeholder: "ex: 36",
            hint: "Retornado pela autenticação (preenchido automaticamente).",
          },
          {
            name: "coProduto",
            label: "Código do Produto (Serviço)",
            type: "text",
            required: true,
            placeholder: "ex: 03298",
            hint: "Código do serviço de envio (SEDEX, PAC, etc.).",
          },
          {
            name: "cepOrigem",
            label: "CEP Origem *",
            type: "text",
            required: true,
            placeholder: "ex: 82600000",
          },
          {
            name: "cepDestino",
            label: "CEP Destino *",
            type: "text",
            required: true,
            placeholder: "ex: 09185670",
          },
          {
            name: "psObjeto",
            label: "Peso (gramas) *",
            type: "number",
            required: true,
            placeholder: "ex: 19600",
            hint: "Peso do objeto em gramas.",
          },
          {
            name: "largura",
            label: "Largura (cm) *",
            type: "number",
            required: true,
            placeholder: "ex: 40",
          },
          {
            name: "altura",
            label: "Altura (cm) *",
            type: "number",
            required: true,
            placeholder: "ex: 40",
          },
          {
            name: "comprimento",
            label: "Comprimento (cm) *",
            type: "number",
            required: true,
            placeholder: "ex: 40",
          },
          {
            name: "tpObjeto",
            label: "Tipo de Objeto *",
            type: "select",
            required: true,
            default: "1",
            options: [
              { value: "1", label: "1 — Envelope/Caixa" },
              { value: "2", label: "2 — Rolo/Tubo" },
            ],
          },
          {
            name: "vlDeclarado",
            label: "Valor Declarado (R$)",
            type: "number",
            required: false,
            placeholder: "ex: 150.00",
            hint: "Opcional. Ao preencher, os serviços adicionais 019 (Valor Declarado) e 001 são incluídos automaticamente na requisição.",
          },
        ],
        build: (p) => {
          const qs = new URLSearchParams();
          qs.set("cepOrigem", String(p.cepOrigem || "").replace(/\D/g, ""));
          qs.set("cepDestino", String(p.cepDestino || "").replace(/\D/g, ""));
          qs.set("psObjeto", p.psObjeto);
          qs.set("largura", p.largura);
          qs.set("altura", p.altura);
          qs.set("comprimento", p.comprimento);
          qs.set("tpObjeto", p.tpObjeto || "1");
          qs.set("nuContrato", p.nuContrato);
          qs.set("nuDR", p.nuDR);
          if (p.vlDeclarado && String(p.vlDeclarado).trim() !== "") {
            qs.set("vlDeclarado", p.vlDeclarado);
            // servicosAdicionais são obrigatórios quando há valor declarado:
            // 019 = Valor Declarado | 001 = Aviso de Recebimento
            qs.append("servicosAdicionais", "019");
            qs.append("servicosAdicionais", "001");
          }
          return {
            url: proxyUrl(`https://api.correios.com.br/preco/v1/nacional/${encodeURIComponent(p.coProduto)}?${qs.toString()}`),
            options: {
              method: "GET",
              headers: { Authorization: `Bearer ${p.token}` },
            },
          };
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // JADLOG
  // ─────────────────────────────────────────────────────────────
  jadlog: {
    title: "JadLog",
    description: "Cotação de frete via API do embarcador JadLog.",
    color: "#e8281b",
    textColor: "#ffffff",
    abbr: "JAD",
    endpoints: [
      {
        id: "frete",
        label: "Cotação de Frete",
        fields: [
          {
            name: "bearerToken",
            label: "Bearer Token (Autorização)",
            type: "text",
            required: false,
            placeholder: "Token JWT da JadLog (se necessário)",
            hint: "Caso a conta exija autenticação, informe o token aqui.",
          },
          {
            name: "cepori",
            label: "CEP Origem *",
            type: "text",
            required: true,
            placeholder: "ex: 86055620",
            hint: "8 dígitos, sem hífen.",
          },
          {
            name: "cepdes",
            label: "CEP Destino *",
            type: "text",
            required: true,
            placeholder: "ex: 69098432",
            hint: "8 dígitos, sem hífen.",
          },
          {
            name: "cnpj",
            label: "CNPJ do Embarcador *",
            type: "text",
            required: true,
            placeholder: "ex: 19700881000181",
            hint: "14 dígitos, sem pontuação.",
          },
          {
            name: "peso",
            label: "Peso (kg) *",
            type: "number",
            required: true,
            placeholder: "ex: 0.150",
            hint: "Peso em quilogramas (ex: 0.150 para 150 g).",
          },
          {
            name: "modalidade",
            label: "Modalidade *",
            type: "select",
            required: true,
            default: "9",
            options: [
              { value: "9",  label: "9 — .com (econômico)" },
              { value: "3",  label: "3 — Rodoviário" },
              { value: "4",  label: "4 — Aéreo" },
              { value: "5",  label: "5 — Cargo" },
              { value: "6",  label: "6 — Doc" },
              { value: "7",  label: "7 — Corporate" },
              { value: "12", label: "12 — Expresso" },
              { value: "14", label: "14 — Pickup" },
              { value: "40", label: "40 — .com Internacional" },
            ],
          },
          {
            name: "vldeclarado",
            label: "Valor Declarado (R$) *",
            type: "number",
            required: true,
            placeholder: "ex: 139.00",
            hint: "Valor da mercadoria para fins de seguro.",
          },
          {
            name: "conta",
            label: "Conta",
            type: "text",
            required: false,
            placeholder: "(opcional)",
            hint: "Número de conta JadLog, se houver.",
          },
          {
            name: "contrato",
            label: "Contrato",
            type: "text",
            required: false,
            placeholder: "(opcional)",
            hint: "Número de contrato JadLog, se houver.",
          },
          {
            name: "frap",
            label: "Frete a Pagar (FRAP)",
            type: "select",
            required: false,
            default: "N",
            options: [
              { value: "N", label: "N — Não (pago pelo remetente)" },
              { value: "S", label: "S — Sim (pago pelo destinatário)" },
            ],
          },
          {
            name: "tpentrega",
            label: "Tipo de Entrega",
            type: "select",
            required: false,
            default: "D",
            options: [
              { value: "D", label: "D — Domiciliar" },
              { value: "R", label: "R — Retirada no CD" },
            ],
          },
          {
            name: "tpseguro",
            label: "Tipo de Seguro",
            type: "select",
            required: false,
            default: "N",
            options: [
              { value: "N", label: "N — Automático" },
              { value: "S", label: "S — Declarado" },
            ],
          },
        ],
        build: (p) => {
          const cleanCepOri = String(p.cepori || "").replace(/\D/g, "");
          const cleanCepDes = String(p.cepdes || "").replace(/\D/g, "");
          const cleanCnpj   = String(p.cnpj   || "").replace(/\D/g, "");

          const payload = {
            frete: [
              {
                cepori:      cleanCepOri,
                cepdes:      cleanCepDes,
                frap:        p.frap      || "N",
                peso:        parseFloat(p.peso),
                cnpj:        cleanCnpj,
                conta:       p.conta     || null,
                contrato:    p.contrato  || null,
                modalidade:  parseInt(p.modalidade, 10),
                tpentrega:   p.tpentrega || "D",
                tpseguro:    p.tpseguro  || "N",
                vldeclarado: parseFloat(p.vldeclarado),
                vlcoleta:    null,
              },
            ],
          };

          const headers = { "Content-Type": "application/json" };
          if (p.bearerToken && p.bearerToken.trim()) {
            headers["Authorization"] = `Bearer ${p.bearerToken.trim()}`;
          }

          return {
            url: proxyUrl("https://www.jadlog.com.br/embarcador/api/frete/valor"),
            options: {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
            },
          };
        },
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
window.APIUtils = {
  getApiFromQuery() {
    return new URLSearchParams(location.search).get("api");
  },
  getEndpointFromQuery() {
    return new URLSearchParams(location.search).get("endpoint");
  },

  /**
   * Resolve a dotted path inside an object.
   * e.g. getNestedValue(obj, "cartaoPostagem.contrato")
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
  },

  syntaxHighlight(json) {
    const str = JSON.stringify(json, null, 2)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return str.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "tok-num";
        if (/^"/.test(match)) cls = /:$/.test(match) ? "tok-key" : "tok-str";
        else if (/true|false/.test(match)) cls = "tok-bool";
        else if (/null/.test(match)) cls = "tok-null";
        return `<span class="${cls}">${match}</span>`;
      }
    );
  },
};
