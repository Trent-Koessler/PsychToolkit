// Cloudflare Pages Function: stores the note templates so they sync between
// devices. Served at /api/templates. Templates only: notes never come here.
//
// Needs two settings in the Cloudflare Pages project (see README):
//   TEMPLATES   a KV namespace binding
//   SYNC_TOKEN  a secret; the app sends it as "Authorization: Bearer <token>"

const KEY = "templates";
const MAX_BYTES = 2_000_000;
const LIMITS = { id: 100, name: 200, body: 200000, count: 500 };

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
}

// Compare hashes rather than the strings themselves, so the time taken does not
// reveal how much of a guessed token was right.
async function tokenMatches(request, expected) {
    const header = request.headers.get("Authorization") || "";
    const given = header.startsWith("Bearer ") ? header.slice(7) : "";
    const enc = new TextEncoder();
    const [a, b] = await Promise.all([
        crypto.subtle.digest("SHA-256", enc.encode(given)),
        crypto.subtle.digest("SHA-256", enc.encode(expected))
    ]);
    const x = new Uint8Array(a);
    const y = new Uint8Array(b);
    let diff = 0;
    for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
    return given.length > 0 && diff === 0;
}

// Same rules as cleanRecord in note-templates.js.
function validRecords(records) {
    if (!records || typeof records !== "object" || Array.isArray(records)) return false;
    const ids = Object.keys(records);
    if (ids.length > LIMITS.count) return false;
    return ids.every(id => {
        const r = records[id];
        if (!id || id.length > LIMITS.id || !r || typeof r !== "object") return false;
        if (!Number.isFinite(r.updatedAt)) return false;
        if (r.deleted === true) return true;
        return typeof r.name === "string" && r.name.length > 0 && r.name.length <= LIMITS.name &&
            typeof r.body === "string" && r.body.length <= LIMITS.body;
    });
}

export async function onRequest({ request, env }) {
    if (!env.SYNC_TOKEN || !env.TEMPLATES) {
        return json({ error: "Template sync is not set up on the server." }, 503);
    }
    if (!(await tokenMatches(request, env.SYNC_TOKEN))) {
        return json({ error: "Wrong sync key." }, 401);
    }

    if (request.method === "GET") {
        const stored = await env.TEMPLATES.get(KEY);
        return json(stored ? JSON.parse(stored) : { version: 1, records: {} });
    }

    if (request.method === "PUT") {
        const text = await request.text();
        if (text.length > MAX_BYTES) return json({ error: "Too large." }, 413);
        let body;
        try {
            body = JSON.parse(text);
        } catch (err) {
            return json({ error: "Not valid JSON." }, 400);
        }
        if (!body || !validRecords(body.records)) return json({ error: "Not a templates payload." }, 400);
        await env.TEMPLATES.put(KEY, JSON.stringify({ version: 1, records: body.records, savedAt: Date.now() }));
        return json({ ok: true });
    }

    return json({ error: "Method not allowed." }, 405);
}
