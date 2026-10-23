// Note templates: the user's own editable copies of the clinic note templates,
// with import/export and optional sync to the Cloudflare Pages function in
// functions/api/templates.js.
//
// Templates are kept in localStorage because, unlike notes, they hold no patient
// details and are meant to outlive the session. Each saved template is a
// "record". A record for a built-in template overrides the built-in text; a
// record marked deleted means "use the built-in again" (or, for the user's own
// templates, "this one was deleted"). Deletions are kept as records so that a
// sync does not bring a deleted template back from another device.
(function (root) {
    "use strict";

    const STORAGE_KEY = "psych_note_templates";
    const SYNC_KEY_STORAGE = "psych_template_sync_key";
    const LIMITS = { id: 100, name: 200, body: 200000, count: 500 };

    // tDose's templates.json is a flat {key: text} object. These are the names
    // tDose shows on its tabs, so imported templates are recognisable.
    const TDOSE_NAMES = {
        addiction_med: "Addiction Med Clinic",
        otp_clinic: "OTP Clinic",
        psych_review: "Psych Review",
        gp_letter: "Letters",
        relapse_plan: "Relapse Prevention Plan",
        safety_plan: "Safety Plan"
    };

    // Anything read from storage, a file or the server goes through here, so a
    // damaged or hostile file cannot put odd values into the app.
    function cleanRecord(id, raw) {
        if (!raw || typeof raw !== "object") return null;
        if (typeof id !== "string" || !id || id.length > LIMITS.id) return null;
        const updatedAt = Number(raw.updatedAt);
        if (!Number.isFinite(updatedAt) || updatedAt < 0) return null;
        if (raw.deleted === true) return { id, name: "", body: "", updatedAt, deleted: true };
        if (typeof raw.name !== "string" || typeof raw.body !== "string") return null;
        const name = raw.name.trim().slice(0, LIMITS.name);
        if (!name || raw.body.length > LIMITS.body) return null;
        return { id, name, body: raw.body, updatedAt, deleted: false };
    }

    function cleanRecords(raw) {
        const out = {};
        if (!raw || typeof raw !== "object") return out;
        Object.keys(raw).slice(0, LIMITS.count).forEach(id => {
            const rec = cleanRecord(id, raw[id]);
            if (rec) out[id] = rec;
        });
        return out;
    }

    // For each template, keep whichever copy was saved most recently.
    function mergeRecords(local, remote) {
        const merged = Object.assign({}, local);
        Object.keys(remote).forEach(id => {
            if (!merged[id] || remote[id].updatedAt > merged[id].updatedAt) merged[id] = remote[id];
        });
        return merged;
    }

    function sameRecords(a, b) {
        const keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;
        return keys.every(id => b[id] && JSON.stringify(a[id]) === JSON.stringify(b[id]));
    }

    function newId() {
        if (root.crypto && typeof root.crypto.randomUUID === "function") return "custom-" + root.crypto.randomUUID();
        return "custom-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }

    function humanise(key) {
        const words = key.replace(/[_-]+/g, " ").trim();
        return words.charAt(0).toUpperCase() + words.slice(1);
    }

    // builtIns: [{ id, name, body }] in the order they should be listed.
    function createStore({ builtIns, storage, now = Date.now }) {
        const defaults = new Map(builtIns.map(t => [t.id, t]));
        const listeners = [];
        let records = load();

        function load() {
            try {
                const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
                return cleanRecords(parsed && parsed.records);
            } catch (err) {
                return {};
            }
        }

        // source is "local" for the user's own edits and "remote" for changes
        // pulled in by a sync, so the sync code does not echo its own changes.
        function persist(source) {
            try {
                storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, records }));
            } catch (err) {
                console.error("Could not save templates", err);
            }
            listeners.forEach(fn => fn(source));
        }

        function get(id) {
            const rec = records[id];
            const def = defaults.get(id);
            if (rec && !rec.deleted) return { id, name: rec.name, body: rec.body, builtIn: !!def, edited: !!def };
            if (def) return { id, name: def.name, body: def.body, builtIn: true, edited: false };
            return null;
        }

        function list() {
            const custom = Object.keys(records)
                .filter(id => !defaults.has(id) && !records[id].deleted)
                .map(get)
                .sort((a, b) => a.name.localeCompare(b.name));
            return builtIns.map(t => get(t.id)).concat(custom);
        }

        function save(id, { name, body }) {
            const rec = cleanRecord(id, { name, body, updatedAt: now() });
            if (!rec) throw new Error("A template needs a name, and must be under " + LIMITS.body + " characters.");
            records[id] = rec;
            persist("local");
            return get(id);
        }

        function create({ name, body }) {
            return save(newId(), { name, body });
        }

        // For a built-in template this resets it to the default text.
        function remove(id) {
            records[id] = { id, name: "", body: "", updatedAt: now(), deleted: true };
            persist("local");
        }

        function exportJson() {
            return JSON.stringify({
                app: "PsychToolkit",
                kind: "note-templates",
                version: 1,
                exportedAt: new Date(now()).toISOString(),
                records
            }, null, 2);
        }

        // Imported templates are stamped with the current time, so that they win
        // over older copies on this and other devices when sync next runs.
        function importJson(text) {
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (err) {
                throw new Error("That file is not a templates file (it is not valid JSON).");
            }
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                throw new Error("That file is not a templates file.");
            }
            const stamp = now();
            const incoming = [];
            if (parsed.kind === "note-templates" && parsed.records) {
                Object.values(cleanRecords(parsed.records))
                    .filter(rec => !rec.deleted)
                    .forEach(rec => incoming.push({ id: rec.id, name: rec.name, body: rec.body }));
            } else {
                // tDose: {key: text}. Its ids are fixed, so importing the same file
                // twice updates those templates rather than adding duplicates.
                Object.keys(parsed).forEach(key => {
                    if (typeof parsed[key] !== "string" || !parsed[key].trim()) return;
                    incoming.push({ id: "tdose-" + key, name: TDOSE_NAMES[key] || humanise(key), body: parsed[key] });
                });
            }
            if (!incoming.length) throw new Error("No templates were found in that file.");

            let added = 0;
            let updated = 0;
            incoming.forEach(t => {
                const rec = cleanRecord(t.id, { name: t.name, body: t.body, updatedAt: stamp });
                if (!rec) return;
                if (get(t.id)) updated++;
                else added++;
                records[t.id] = rec;
            });
            persist("local");
            return { added, updated };
        }

        return {
            get,
            list,
            save,
            create,
            remove,
            exportJson,
            importJson,
            records: () => Object.assign({}, records),
            // Takes records from a sync. Returns true if anything changed here.
            mergeRemote(remote) {
                const merged = mergeRecords(records, remote);
                if (sameRecords(merged, records)) return false;
                records = merged;
                persist("remote");
                return true;
            },
            onChange(fn) {
                listeners.push(fn);
            }
        };
    }

    // Sync talks to the Cloudflare Pages function. It is off until a sync key
    // (the SYNC_TOKEN secret set in Cloudflare) is entered on this device.
    function createSync({ store, endpoint, storage, fetchFn, onStatus }) {
        const doFetch = fetchFn || ((url, opts) => root.fetch(url, opts));
        let running = null;
        let again = false;
        let timer = null;

        function getKey() {
            try {
                return storage.getItem(SYNC_KEY_STORAGE) || "";
            } catch (err) {
                return "";
            }
        }

        function report(state, message) {
            if (onStatus) onStatus({ state, message });
        }

        function describeFailure(err) {
            if (err.status === 401) return "The sync key was not accepted. Check it in Sync settings.";
            if (err.status === 503) return "Sync is not switched on at the server yet.";
            if (err.status === 404 || err.status === 405) return "Sync is not available on this website (it needs the Cloudflare version).";
            if (err.status) return "Sync failed (server error " + err.status + "). Your templates are still saved here.";
            if (root.navigator && root.navigator.onLine === false) return "Offline. Templates will sync when you are back online.";
            return "Could not reach the sync server. Your templates are still saved here.";
        }

        async function request(method, body) {
            const opts = {
                method,
                cache: "no-store",
                headers: { Authorization: "Bearer " + getKey() }
            };
            if (body !== undefined) {
                opts.headers["Content-Type"] = "application/json";
                opts.body = JSON.stringify(body);
            }
            const res = await doFetch(endpoint, opts);
            if (!res.ok) {
                const err = new Error("HTTP " + res.status);
                err.status = res.status;
                throw err;
            }
            return res.json();
        }

        async function runOnce() {
            report("busy", "Syncing…");
            try {
                const remote = cleanRecords((await request("GET")).records);
                store.mergeRemote(remote);
                const local = store.records();
                if (!sameRecords(local, remote)) await request("PUT", { version: 1, records: local });
                const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                report("ok", "Synced at " + time);
                return true;
            } catch (err) {
                report("error", describeFailure(err));
                return false;
            }
        }

        // One sync at a time; a request made while one runs is folded into a
        // single follow-up run.
        async function syncNow() {
            if (!getKey()) {
                report("off", "Sync is off. Templates are saved in this browser only.");
                return false;
            }
            if (running) {
                again = true;
                return running;
            }
            running = runOnce();
            const result = await running;
            running = null;
            if (again) {
                again = false;
                return syncNow();
            }
            return result;
        }

        store.onChange(source => {
            if (source !== "local" || !getKey()) return;
            clearTimeout(timer);
            timer = setTimeout(syncNow, 1500);
        });

        return {
            syncNow,
            enabled: () => !!getKey(),
            setKey(key) {
                try {
                    if (key) storage.setItem(SYNC_KEY_STORAGE, key);
                    else storage.removeItem(SYNC_KEY_STORAGE);
                } catch (err) {
                    console.error("Could not save the sync key", err);
                }
            }
        };
    }

    const api = { createStore, createSync, cleanRecords, mergeRecords };
    root.NoteTemplates = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
