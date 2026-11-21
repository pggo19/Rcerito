// Rcerito · Webhook de RevenueCat → user_entitlements
//
// RevenueCat avisa cada compra, renovación, cancelación o vencimiento.
// Esta función es la ÚNICA que puede marcar a alguien como Pro.
//
// Secretos (Supabase → Edge Functions → Secrets):
//   REVENUECAT_WEBHOOK_SECRET  obligatorio. El mismo texto que pongas en
//                              RevenueCat → Integrations → Webhooks → Authorization header.
//   REVENUECAT_API_KEY         opcional (clave secreta v1 "sk_..."). Si existe, la función
//                              consulta a RevenueCat el estado real del usuario en vez de
//                              confiar solo en el evento (más robusto si llegan desordenados).
//   RC_ENTITLEMENT_ID          opcional, por defecto "pro".
//
// En la app: Purchases.logIn({ appUserID: <id del usuario de Supabase> }) antes de comprar.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";
const RC_API_KEY = Deno.env.get("REVENUECAT_API_KEY") ?? "";
const ENTITLEMENT = Deno.env.get("RC_ENTITLEMENT_ID") ?? "pro";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Eventos que dan o mantienen acceso hasta expiration_at_ms
const ACTIVA = new Set([
  "INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION",
  "NON_RENEWING_PURCHASE", "SUBSCRIPTION_EXTENDED", "TEMPORARY_ENTITLEMENT_GRANT",
  "CANCELLATION",   // canceló la renovación: sigue Pro hasta que venza
  "BILLING_ISSUE",  // periodo de gracia de Google Play
]);
const TERMINA = new Set(["EXPIRATION", "SUBSCRIPTION_PAUSED"]);

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

type Estado = { activo: boolean; expires_at: string | null; product_id: string | null; store: string | null };

// Estado real según la API de RevenueCat
async function estadoDesdeApi(appUserId: string): Promise<Estado | null> {
  if (!RC_API_KEY) return null;
  const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${RC_API_KEY}` },
  });
  if (!r.ok) throw new Error(`RevenueCat API ${r.status}`);
  const data = await r.json();
  const ent = data?.subscriber?.entitlements?.[ENTITLEMENT];
  if (!ent) return { activo: false, expires_at: null, product_id: null, store: null };
  const exp: string | null = ent.expires_date ?? null; // null = de por vida
  const prod = ent.product_identifier ?? null;
  const store = prod ? data?.subscriber?.subscriptions?.[prod]?.store ?? null : null;
  return { activo: exp === null || new Date(exp) > new Date(), expires_at: exp, product_id: prod, store };
}

async function guardar(userId: string, e: Estado, evento: string, ms: number) {
  // Ignorar eventos más viejos que el último aplicado
  const { data: actual } = await supabase
    .from("user_entitlements").select("ultimo_evento_ms").eq("user_id", userId).maybeSingle();
  if (actual?.ultimo_evento_ms && actual.ultimo_evento_ms > ms && !RC_API_KEY) return "ignorado_por_antiguo";

  const { error } = await supabase.from("user_entitlements").upsert({
    user_id: userId,
    activo: e.activo,
    expires_at: e.expires_at,
    product_id: e.product_id,
    store: e.store,
    origen: "revenuecat",
    ultimo_evento: evento,
    ultimo_evento_ms: ms,
    updated_at: new Date().toISOString(),
  });
  if (error?.code === "23503") return "usuario_no_existe"; // id que no es de esta base: no reintentar
  if (error) throw error;
  return "ok";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "metodo" });
  if (!WEBHOOK_SECRET) return json(503, { error: "webhook_sin_configurar" });

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!iguales(token, WEBHOOK_SECRET)) return json(401, { error: "no_autorizado" });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "json_invalido" }); }
  const ev = body?.event;
  if (!ev?.type) return json(400, { error: "sin_evento" });
  if (ev.type === "TEST") return json(200, { ok: true, test: true });

  // Solo nos importa nuestro entitlement
  const ents: string[] = ev.entitlement_ids ?? (ev.entitlement_id ? [ev.entitlement_id] : []);
  if (ents.length && !ents.includes(ENTITLEMENT) && ev.type !== "TRANSFER") {
    return json(200, { ok: true, ignorado: "otro_entitlement" });
  }

  const ms: number = Number(ev.event_timestamp_ms ?? Date.now());

  try {
    // Transferencia de compras entre cuentas
    if (ev.type === "TRANSFER") {
      const resultados: Record<string, string> = {};
      for (const id of [...(ev.transferred_from ?? []), ...(ev.transferred_to ?? [])]) {
        if (!UUID.test(id)) continue;
        const e = (await estadoDesdeApi(id)) ??
          { activo: (ev.transferred_to ?? []).includes(id), expires_at: null, product_id: null, store: ev.store ?? null };
        resultados[id] = await guardar(id, e, ev.type, ms);
      }
      return json(200, { ok: true, resultados });
    }

    // El usuario de Supabase puede venir como app_user_id o entre los alias
    const candidatos: string[] = [ev.app_user_id, ev.original_app_user_id, ...(ev.aliases ?? [])].filter(Boolean);
    const userId = candidatos.find((c) => UUID.test(c));
    if (!userId) return json(200, { ok: true, ignorado: "usuario_anonimo" }); // aún no hizo logIn

    let estado = await estadoDesdeApi(userId);
    if (!estado) {
      const exp = ev.expiration_at_ms ? new Date(Number(ev.expiration_at_ms)).toISOString() : null;
      const activo = TERMINA.has(ev.type)
        ? false
        : ACTIVA.has(ev.type)
        ? (exp === null || new Date(exp) > new Date())
        : false;
      if (!ACTIVA.has(ev.type) && !TERMINA.has(ev.type)) {
        return json(200, { ok: true, ignorado: ev.type });
      }
      estado = { activo, expires_at: exp, product_id: ev.product_id ?? null, store: ev.store ?? null };
    }

    const r = await guardar(userId, estado, ev.type, ms);
    return json(200, { ok: true, resultado: r, activo: estado.activo });
  } catch (err) {
    console.error("revenuecat-webhook", ev?.type, err);
    // 500 hace que RevenueCat reintente
    return json(500, { error: "fallo_interno" });
  }
});
