const normalizeString = (value, maxLength = 500) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
};

const getSupabaseConfig = (env) => {
  const url = normalizeString(env?.SUPABASE_URL, 300).replace(/\/+$/, "");
  const serviceRoleKey = normalizeString(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SECRET_KEY || env?.SUBABASE_SECRET_KEY, 1200);

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase n'est pas encore configuré.");
  }

  if (!/^https:\/\//.test(url)) {
    throw new Error("SUPABASE_URL doit être l'URL HTTPS du projet Supabase.");
  }

  return { url, serviceRoleKey };
};

export const hasSupabaseServiceKey = (env) =>
  Boolean(normalizeString(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SECRET_KEY || env?.SUBABASE_SECRET_KEY, 1200));

const parseSupabaseResponse = async (response) => {
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = data?.message || data?.hint || text || `Erreur Supabase ${response.status}.`;
    throw new Error(message);
  }

  return data;
};

export const supabaseRequest = async (env, table, options = {}) => {
  const safeTable = normalizeString(table, 80);

  if (!/^[a-zA-Z0-9_]+$/.test(safeTable)) {
    throw new Error("Table Supabase invalide.");
  }

  const { url, serviceRoleKey } = getSupabaseConfig(env);
  const query = normalizeString(options.query || "", 1000);
  const response = await fetch(`${url}/rest/v1/${safeTable}${query}`, {
    method: options.method || "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: options.prefer || "return=representation",
      ...(options.headers || {})
    },
    body: typeof options.body === "undefined" ? undefined : JSON.stringify(options.body)
  });

  return parseSupabaseResponse(response);
};

export const supabaseInsert = (env, table, payload) =>
  supabaseRequest(env, table, {
    method: "POST",
    body: payload,
    prefer: "return=representation"
  });

export const supabaseUpdateByStripeSession = (env, table, stripeSessionId, payload) => {
  const normalizedSessionId = normalizeString(stripeSessionId, 160);

  if (!normalizedSessionId) {
    return null;
  }

  return supabaseRequest(env, table, {
    method: "PATCH",
    query: `?stripe_session_id=eq.${encodeURIComponent(normalizedSessionId)}`,
    body: payload,
    prefer: "return=representation"
  });
};

export const supabaseUpdateById = (env, table, id, payload) => {
  const normalizedId = normalizeString(id, 160);

  if (!normalizedId) {
    return null;
  }

  return supabaseRequest(env, table, {
    method: "PATCH",
    query: `?id=eq.${encodeURIComponent(normalizedId)}`,
    body: payload,
    prefer: "return=representation"
  });
};
