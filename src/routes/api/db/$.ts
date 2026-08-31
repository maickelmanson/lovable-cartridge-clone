// Proxy PostgREST: o app usa login próprio (JWT), então as leituras/escritas
// no banco passam por aqui. Validamos o token do sistema e encaminhamos a
// requisição para a Data API usando a chave de serviço (server-only).
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest, unauthorized } from "@/auth.server";

const ALLOWED_TABLES = new Set([
  "clientes",
  "pedidos",
  "pedido_cartuchos",
  "cartuchos_cadastro",
  "empresa_dados",
  "reman_orders",
  "reman_order_items",
  "reman_order_units",
  "notifications",
  "error_logs",
  "profiles",
  "whatsapp_templates",
]);

const PREFIX = "/api/db/rest/v1/";

async function proxy({ request }: { request: Request }): Promise<Response> {
  const auth = await authenticateRequest(request);
  if (!auth) return unauthorized();

  const url = new URL(request.url);
  if (!url.pathname.startsWith(PREFIX)) {
    return Response.json({ error: "Rota inválida" }, { status: 404 });
  }
  const table = url.pathname.slice(PREFIX.length).split("/")[0] ?? "";
  if (!ALLOWED_TABLES.has(table)) {
    return Response.json({ error: "Recurso não permitido" }, { status: 403 });
  }

  const base = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!base || !key) {
    return Response.json({ error: "Backend não configurado" }, { status: 500 });
  }

  const target = `${base}/rest/v1/${table}${url.search}`;
  const headers = new Headers();
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  for (const h of ["content-type", "prefer", "accept", "range", "accept-profile", "content-profile"]) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();

  const res = await fetch(target, { method, headers, body });
  const text = await res.text();
  const outHeaders = new Headers();
  for (const h of ["content-type", "content-range", "range-unit"]) {
    const v = res.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  outHeaders.set("Cache-Control", "no-store");
  return new Response(text, { status: res.status, headers: outHeaders });
}

export const Route = createFileRoute("/api/db/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PATCH: proxy,
      PUT: proxy,
      DELETE: proxy,
      HEAD: proxy,
    },
  },
});
