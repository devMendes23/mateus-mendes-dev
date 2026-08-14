const { getSupabaseClient } = require("../lib/supabase");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = { name: 120, email: 160, service: 40, message: 4000 };

const rateLimitHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitHits.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitHits.set(ip, { start: now, count: 1 });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Muitas tentativas. Aguarde um minuto e tente de novo." });
  }

  const body = req.body || {};

  // honeypot: bots preenchem campos escondidos
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(body.name, MAX_LEN.name);
  const email = clean(body.email, MAX_LEN.email);
  const service = clean(body.service, MAX_LEN.service) || "outro";
  const message = clean(body.message, MAX_LEN.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Preencha nome, e-mail e mensagem." });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "E-mail inválido." });
  }

  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.from("leads").insert({
      name,
      email,
      service,
      message,
      source_ip: ip,
    });

    if (error) throw error;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact form error:", err.message);
    return res.status(500).json({ error: "Erro ao salvar sua mensagem. Tente novamente em instantes." });
  }
};
