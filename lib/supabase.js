const { createClient } = require("@supabase/supabase-js");

let client = null;

function getSupabaseClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas.");
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  return client;
}

module.exports = { getSupabaseClient };
