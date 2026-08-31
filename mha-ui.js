/* =========================================================================
 * Mental Health Act 2007 (NSW) decision support — rendering and interaction.
 * Content lives in mha.js; verbatim statutory text lives in mha-data.js.
 * ========================================================================= */

(function () {
    "use strict";

    var C = window.MHA_CONTENT;
    if (!C) return;

    var NODES = C.NODES;
    var SECTIONS = C.SECTION_INDEX;
    var META = (C.ACT && C.ACT.meta) || {};

    var CHENG_CITE = "Cheng K, Wand A, Ryan C, Callaghan S. An algorithm for managing adults who refuse medical treatment in New South Wales. Australas Psychiatry 2018; 26(5): 464-468.";

    /* --------------------------------------------------------------- utils */

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined && text !== null) n.textContent = text;
        return n;
    }

    function clear(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function sectionLabel(n) {
        var s = SECTIONS[n];
        return s ? "s " + n + " — " + s.heading : "s " + n;
    }

    /* Renders one section as a collapsible block with its verbatim text. */
    function sectionDetails(n) {
        var s = SECTIONS[n];
        var d = el("details", "mha-section");
        var sum = el("summary");
        sum.appendChild(el("span", "mha-section-no", "s " + n));
        sum.appendChild(el("span", "mha-section-heading", s ? s.heading : "Section " + n));
        d.appendChild(sum);

        var body = el("div", "mha-section-body");
        if (C.GLOSS[n]) {
            body.appendChild(el("p", "mha-gloss", C.GLOSS[n]));
        }
        if (s) {
            var quote = el("div", "mha-quote");
            s.lines.forEach(function (line) {
                var p = el("p", "mha-quote-line mha-indent-" + line[0], line[1]);
                quote.appendChild(p);
            });
            body.appendChild(quote);

            var foot = el("p", "mha-section-foot");
            foot.appendChild(document.createTextNode("Mental Health Act 2007 (NSW), " + (META.currency || "version unknown") + ". "));
            var a = el("a", null, "Open on legislation.nsw.gov.au");
            a.href = s.url;
            a.target = "_blank";
            a.rel = "noopener";
            foot.appendChild(a);
            body.appendChild(foot);
        } else {
            body.appendChild(el("p", "mha-gloss", "Full text not carried in the app — open the Act for this section."));
        }
        d.appendChild(body);
        return d;
    }

    function sectionList(nums) {
        var wrap = el("div", "mha-sections");
        nums.forEach(function (n) { wrap.appendChild(sectionDetails(n)); });
        return wrap;
    }

    function bulletList(items, cls) {
        var ul = el("ul", cls || "mha-list");
        items.forEach(function (t) { ul.appendChild(el("li", null, t)); });
        return ul;
    }

    /* =====================================================================
     * WIZARD
     * ================================================================== */

    var state = {
        role: null,
        current: null,
        trail: [],   // [{ node, title, answer }]
        answers: {}
    };

    function wizardRoot() { return document.getElementById("mha-wizard"); }

    function startWizard(roleId) {
        var role = null;
        C.ROLES.forEach(function (r) { if (r.id === roleId) role = r; });
        state.role = role;
        state.trail = [];
        state.answers = {};
        goTo(role ? role.start : "start");
    }

    function goTo(nodeId) {
        state.current = nodeId;
        renderWizard();
        var root = wizardRoot();
        if (root && root.scrollIntoView) root.scrollIntoView({ block: "nearest" });
    }

    function answer(node, nodeId, option) {
        state.trail.push({ node: nodeId, title: node.title, answer: option.label });
        if (option.set) {
            Object.keys(option.set).forEach(function (k) { state.answers[k] = option.set[k]; });
        }
        goTo(option.next);
    }

    function stepBack() {
        var last = state.trail.pop();
        if (last) goTo(last.node);
    }

    function renderWizard() {
        var root = wizardRoot();
        if (!root) return;
        clear(root);

        if (!state.current) {
            root.appendChild(renderRolePicker());
            return;
        }

        root.appendChild(renderTrail());

        var node = NODES[state.current];
        if (!node) {
            root.appendChild(el("p", "mha-gloss", "That step is not defined."));
            return;
        }
        root.appendChild(node.kind === "question" ? renderQuestion(node) : renderOutcome(node));
    }

    function renderRolePicker() {
        var wrap = el("div", "mha-card");
        wrap.appendChild(el("h4", null, "Where are you starting from?"));
        wrap.appendChild(el("p", "mha-gloss", "This only sets the first question. Every pathway stays reachable."));
        var grid = el("div", "mha-role-grid");
        C.ROLES.forEach(function (r) {
            var b = el("button", "mha-role-btn");
            b.appendChild(el("span", "mha-role-label", r.label));
            b.appendChild(el("span", "mha-role-blurb", r.blurb));
            b.addEventListener("click", function () { startWizard(r.id); });
            grid.appendChild(b);
        });
        wrap.appendChild(grid);
        return wrap;
    }

    function renderTrail() {
        var bar = el("div", "mha-trail");

        var restart = el("button", "mha-trail-btn", "Restart");
        restart.addEventListener("click", function () {
            state.current = null;
            state.trail = [];
            state.answers = {};
            renderWizard();
        });
        bar.appendChild(restart);

        if (state.trail.length) {
            var back = el("button", "mha-trail-btn", "Back");
            back.addEventListener("click", stepBack);
            bar.appendChild(back);
        }

        if (state.role) {
            bar.appendChild(el("span", "mha-trail-role", state.role.label));
        }

        state.trail.forEach(function (step) {
            bar.appendChild(el("span", "mha-trail-step", step.answer));
        });
        return bar;
    }

    function renderQuestion(node) {
        var card = el("div", "mha-card mha-question");
        card.appendChild(el("h4", null, node.title));
        if (node.help) card.appendChild(el("p", "mha-help", node.help));
        if (node.source === "cheng") card.appendChild(chengNote());

        var opts = el("div", "mha-options");
        node.options.forEach(function (o) {
            var b = el("button", "mha-option");
            b.appendChild(el("span", "mha-option-label", o.label));
            if (o.hint) b.appendChild(el("span", "mha-option-hint", o.hint));
            b.addEventListener("click", function () { answer(node, state.current, o); });
            opts.appendChild(b);
        });
        card.appendChild(opts);

        if (node.capacityAid) card.appendChild(capacityAid());
        if (node.sections) {
            card.appendChild(el("h5", "mha-subhead", "The law behind this question"));
            card.appendChild(sectionList(node.sections));
        }
        return card;
    }

    function chengNote() {
        var p = el("p", "mha-provenance");
        p.textContent = "This step follows the published algorithm: " + CHENG_CITE;
        return p;
    }

    function capacityAid() {
        var d = el("details", "mha-aid");
        d.appendChild(el("summary", null, "Capacity assessment aid"));
        var b = el("div", "mha-aid-body");
        b.appendChild(el("p", null, "An adult is presumed to have decision-making capacity. The presumption is rebutted only if the person is unable to:"));
        b.appendChild(bulletList([
            "comprehend the information material to the decision, or",
            "retain that information, or",
            "use and weigh that information to come to a decision."
        ]));
        b.appendChild(el("p", null, "Four things that are often got wrong:"));
        b.appendChild(bulletList([
            "Capacity is specific to this decision and this moment — not a global status, and not a diagnosis.",
            "A person must not be deemed to lack capacity until all reasonable steps have been taken to support them: simple language, enough time, and the help of family or friends if they want it and it is practicable.",
            "An unwise decision, or one the treating team disagrees with, is not evidence of incapacity.",
            "Being subject to the Mental Health Act does not by itself mean the person lacks capacity to decide about medical treatment."
        ]));
        b.appendChild(el("p", "mha-provenance", "Test as stated in Hunter and New England Area Health Service v A [2009] NSWSC 761, and as summarised in " + CHENG_CITE));
        d.appendChild(b);
        return d;
    }

    function renderOutcome(node) {
        var card = el("div", "mha-card mha-outcome mha-tone-" + (node.tone || "go"));

        var head = el("div", "mha-outcome-head");
        head.appendChild(el("span", "mha-tone-badge", node.tone === "stop" ? "STOP" : node.tone === "caution" ? "CAUTION" : "PROCEED"));
        head.appendChild(el("h4", null, node.title));
        card.appendChild(head);

        if (node.summary) card.appendChild(el("p", "mha-summary", node.summary));

        if (node.cautions) {
            node.cautions.forEach(function (c) {
                card.appendChild(el("p", "mha-caution", c));
            });
        }

        if (node.unverified) {
            var w = el("p", "mha-caution mha-unverified");
            w.textContent = "Guardianship Act 1987 (NSW) provisions are summarised from Cheng et al. (2018), not quoted from the Act. Check the current text of that Act before relying on the detail.";
            card.appendChild(w);
        }

        if (node.actions) {
            card.appendChild(el("h5", "mha-subhead", "Do this"));
            card.appendChild(bulletList(node.actions, "mha-list mha-actions"));
        }

        if (node.timeframes) {
            card.appendChild(el("h5", "mha-subhead", "Clocks"));
            card.appendChild(bulletList(node.timeframes, "mha-list mha-clocks"));
        }

        if (node.forms) {
            card.appendChild(el("h5", "mha-subhead", "Paperwork"));
            var fl = el("div", "mha-form-chips");
            node.forms.forEach(function (name) {
                var f = null;
                C.FORMS.forEach(function (x) { if (x.name === name) f = x; });
                var d = el("details", "mha-form-chip");
                d.appendChild(el("summary", null, name));
                var body = el("div", "mha-form-chip-body");
                if (f) {
                    body.appendChild(rowLine("Source", f.source));
                    body.appendChild(rowLine("Who", f.who));
                    body.appendChild(rowLine("When", f.when));
                    body.appendChild(rowLine("Clock", f.clock));
                }
                body.appendChild(formsCaveat());
                d.appendChild(body);
                fl.appendChild(d);
            });
            card.appendChild(fl);
        }

        if (node.authority) {
            card.appendChild(el("p", "mha-provenance", "Authority: " + node.authority));
        }
        if (node.source === "cheng" && !node.authority) {
            card.appendChild(chengNote());
        }

        if (node.contacts) {
            card.appendChild(el("h5", "mha-subhead", "Who to contact"));
            card.appendChild(contactBlock(node.contacts));
        }

        if (node.sections) {
            card.appendChild(el("h5", "mha-subhead", "Legal basis"));
            card.appendChild(sectionList(node.sections));
        }

        if (node.next) {
            var nx = el("div", "mha-next");
            nx.appendChild(el("span", "mha-next-label", "Then:"));
            node.next.forEach(function (n) {
                var b = el("button", "mha-next-btn", n.label);
                b.addEventListener("click", function () {
                    state.trail.push({ node: state.current, title: node.title, answer: n.label });
                    goTo(n.node);
                });
                nx.appendChild(b);
            });
            card.appendChild(nx);
        }

        var tools = el("div", "mha-outcome-tools");
        var copy = el("button", "mha-copy-btn", "Copy pathway to note");
        copy.addEventListener("click", function () { copyPathway(node, copy); });
        tools.appendChild(copy);
        card.appendChild(tools);

        return card;
    }

    function rowLine(label, value) {
        var p = el("p", "mha-kv");
        p.appendChild(el("strong", null, label + ": "));
        p.appendChild(document.createTextNode(value));
        return p;
    }

    function formsCaveat() {
        var p = el("p", "mha-provenance");
        p.appendChild(document.createTextNode("Form numbering is prescribed by regulation and was changed by the Mental Health Regulation 2025. The statutory source above does not change; check the printed form against "));
        var a = el("a", null, "NSW Health mental health legislation");
        a.href = C.URLS.forms;
        a.target = "_blank";
        a.rel = "noopener";
        p.appendChild(a);
        p.appendChild(document.createTextNode("."));
        return p;
    }

    function contactBlock(names) {
        var wrap = el("ul", "mha-list");
        C.CONTACTS.forEach(function (c) {
            if (names && names.indexOf(c.name) === -1) return;
            var li = el("li");
            li.appendChild(el("strong", null, c.name + " — "));
            li.appendChild(document.createTextNode(c.detail));
            if (c.tel) {
                li.appendChild(document.createTextNode(": "));
                var a = el("a", null, c.display);
                a.href = "tel:" + c.tel;
                li.appendChild(a);
            } else if (c.url) {
                li.appendChild(document.createTextNode(" — "));
                var u = el("a", null, "open");
                u.href = c.url;
                u.target = "_blank";
                u.rel = "noopener";
                li.appendChild(u);
            }
            wrap.appendChild(li);
        });
        return wrap;
    }

    /* ------------------------------------------------------- copy to note */

    function copyPathway(node, btn) {
        var lines = [];
        lines.push("MENTAL HEALTH ACT 2007 (NSW) — DECISION PATHWAY (decision-support aid)");
        lines.push("Generated: " + new Date().toLocaleString());
        lines.push("Statutory text current as at: " + META.currency + " (last consolidated amendment " + META.lastConsolidatedAmendment + ")");
        if (state.role) lines.push("Entry point: " + state.role.label);
        lines.push("");
        lines.push("PATH TAKEN");
        state.trail.forEach(function (step, i) {
            lines.push("  " + (i + 1) + ". " + step.title);
            lines.push("     -> " + step.answer);
        });
        lines.push("");
        lines.push("OUTCOME: " + node.title);
        if (node.summary) lines.push(node.summary);
        if (node.cautions) {
            lines.push("");
            lines.push("CAUTION");
            node.cautions.forEach(function (c) { lines.push("  - " + c); });
        }
        if (node.actions) {
            lines.push("");
            lines.push("STEPS INDICATED");
            node.actions.forEach(function (a) { lines.push("  - " + a); });
        }
        if (node.timeframes) {
            lines.push("");
            lines.push("TIMEFRAMES");
            node.timeframes.forEach(function (t) { lines.push("  - " + t); });
        }
        if (node.forms) {
            lines.push("");
            lines.push("FORMS");
            node.forms.forEach(function (f) { lines.push("  - " + f); });
        }
        if (node.sections) {
            lines.push("");
            lines.push("LEGAL BASIS");
            node.sections.forEach(function (n) {
                lines.push("  - Mental Health Act 2007 (NSW), " + sectionLabel(n));
            });
        }
        if (node.authority) {
            lines.push("  - " + node.authority);
        }
        if (node.source === "cheng") {
            lines.push("  - " + CHENG_CITE);
        }
        lines.push("");
        lines.push("This is a decision-support aid, not legal advice and not a legal record. The clinical decision, the statutory criteria and the documentation remain the responsibility of the treating clinician.");

        var text = lines.join("\n");
        var done = function () {
            var original = btn.textContent;
            btn.textContent = "Copied";
            setTimeout(function () { btn.textContent = original; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
            fallbackCopy(text, done);
        }
    }

    function fallbackCopy(text, done) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { /* clipboard unavailable */ }
        document.body.removeChild(ta);
    }

    /* =====================================================================
     * FLOWCHARTS
     * ================================================================== */

    var SVG_NS = "http://www.w3.org/2000/svg";

    function svgEl(tag, attrs) {
        var n = document.createElementNS(SVG_NS, tag);
        Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        return n;
    }

    function wrap(text, maxChars) {
        var words = String(text).split(/\s+/);
        var lines = [];
        var line = "";
        words.forEach(function (w) {
            var candidate = line ? line + " " + w : w;
            if (candidate.length > maxChars && line) {
                lines.push(line);
                line = w;
            } else {
                line = candidate;
            }
        });
        if (line) lines.push(line);
        return lines;
    }

    function anchor(n, side) {
        switch (side) {
            case "t": return [n.x + n.w / 2, n.y];
            case "b": return [n.x + n.w / 2, n.y + n.h];
            case "l": return [n.x, n.y + n.h / 2];
            case "r": return [n.x + n.w, n.y + n.h / 2];
        }
        return [n.x + n.w / 2, n.y + n.h / 2];
    }

    function routePoints(a, b, fs, ts) {
        var ax = a[0], ay = a[1], bx = b[0], by = b[1];
        if (fs === "b" && ts === "t") {
            if (Math.abs(ax - bx) < 2) return [[ax, ay], [bx, by]];
            var my = ay + Math.max(18, (by - ay) / 2);
            return [[ax, ay], [ax, my], [bx, my], [bx, by]];
        }
        if ((fs === "l" || fs === "r") && ts === "t") return [[ax, ay], [bx, ay], [bx, by]];
        if ((fs === "l" || fs === "r") && (ts === "l" || ts === "r")) {
            if (Math.abs(ay - by) < 2) return [[ax, ay], [bx, by]];
            var mx = (ax + bx) / 2;
            return [[ax, ay], [mx, ay], [mx, by], [bx, by]];
        }
        if (fs === "b" && (ts === "l" || ts === "r")) return [[ax, ay], [ax, by], [bx, by]];
        if (fs === "t" && ts === "b") {
            var ty = ay - 20;
            return [[ax, ay], [ax, ty], [bx, ty], [bx, by]];
        }
        return [[ax, ay], [bx, by]];
    }

    function renderFlow(container, spec) {
        clear(container);
        var svg = svgEl("svg", {
            viewBox: "0 0 " + spec.width + " " + spec.height,
            class: "mha-flow-svg",
            role: "img",
            "aria-label": spec.title
        });

        var defs = svgEl("defs");
        var marker = svgEl("marker", {
            id: spec.id + "-arrow", viewBox: "0 0 10 10", refX: "9", refY: "5",
            markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse"
        });
        marker.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", class: "mha-flow-arrowhead" }));
        defs.appendChild(marker);
        svg.appendChild(defs);

        var byId = {};
        spec.nodes.forEach(function (n) { byId[n.id] = n; });

        // Edges first so boxes paint over them.
        (spec.edges || []).forEach(function (e) {
            var from = byId[e.from], to = byId[e.to];
            if (!from || !to) return;
            var fs = e.fromSide || "b";
            var ts = e.toSide || "t";
            var pts = routePoints(anchor(from, fs), anchor(to, ts), fs, ts);
            var poly = svgEl("polyline", {
                points: pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "),
                class: "mha-flow-edge",
                "marker-end": "url(#" + spec.id + "-arrow)"
            });
            svg.appendChild(poly);
            if (e.label) {
                var mid = pts[Math.floor(pts.length / 2)];
                var lx = e.labelDx ? mid[0] + e.labelDx : mid[0];
                var ly = e.labelDy ? mid[1] + e.labelDy : mid[1] - 5;
                var t = svgEl("text", { x: lx, y: ly, class: "mha-flow-edge-label", "text-anchor": "middle" });
                t.textContent = e.label;
                svg.appendChild(t);
            }
        });

        spec.nodes.forEach(function (n) {
            var g = svgEl("g", { class: "mha-flow-node mha-flow-" + (n.kind || "action") + (n.node ? " mha-flow-clickable" : "") });
            g.appendChild(svgEl("rect", {
                x: n.x, y: n.y, width: n.w, height: n.h, rx: 10, ry: 10, class: "mha-flow-box"
            }));

            var titleLines = wrap(n.title, Math.max(12, Math.floor((n.w - 18) / 6.3)));
            var subLines = n.sub ? wrap(n.sub, Math.max(12, Math.floor((n.w - 18) / 5.6))) : [];
            var lineH = 14, subH = 12;
            var total = titleLines.length * lineH + (subLines.length ? subLines.length * subH + 4 : 0);
            var startY = n.y + (n.h - total) / 2 + 11;

            titleLines.forEach(function (line, i) {
                var t = svgEl("text", {
                    x: n.x + n.w / 2, y: startY + i * lineH,
                    class: "mha-flow-title", "text-anchor": "middle"
                });
                t.textContent = line;
                g.appendChild(t);
            });
            subLines.forEach(function (line, i) {
                var t = svgEl("text", {
                    x: n.x + n.w / 2, y: startY + titleLines.length * lineH + 4 + i * subH,
                    class: "mha-flow-sub", "text-anchor": "middle"
                });
                t.textContent = line;
                g.appendChild(t);
            });

            if (n.node) {
                g.addEventListener("click", function () { jumpTo(n.node); });
                var title = svgEl("title");
                title.textContent = "Open this step in the guided pathway";
                g.appendChild(title);
            }
            svg.appendChild(g);
        });

        container.appendChild(svg);
    }

    function jumpTo(nodeId) {
        state.trail = [];
        state.answers = {};
        goTo(nodeId);
        var tabBtn = document.querySelector('#mha-page .tab-button[data-tab="mha-guided"]');
        if (tabBtn) tabBtn.click();
        var w = wizardRoot();
        if (w && w.scrollIntoView) w.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ------------------------------------------------- flowchart layouts */

    var FLOW_INVOLUNTARY = {
        id: "flowA",
        title: "Involuntary admission and detention pathway under the Mental Health Act 2007 (NSW)",
        width: 1200,
        height: 1290,
        nodes: [
            { id: "a1", kind: "start", x: 420, y: 10, w: 360, h: 48, title: "Person may need involuntary care" },
            { id: "a2", kind: "decision", x: 400, y: 96, w: 400, h: 62, title: "Mentally ill person (s 14) or mentally disordered person (s 15)?", node: "d_criteria" },
            { id: "a3", kind: "stop", x: 30, y: 100, w: 290, h: 54, title: "Neither — detention not available", sub: "s 12(1)(a); see also s 16", node: "out_no_detain" },
            { id: "a4", kind: "decision", x: 390, y: 196, w: 420, h: 68, title: "Is less restrictive care appropriate and reasonably available?", sub: "s 12(1)(b)", node: "d_less" },
            { id: "a5", kind: "stop", x: 880, y: 200, w: 290, h: 60, title: "Yes — must not detain", sub: "s 12(2)", node: "out_less_restrictive" },
            { id: "a6", kind: "action", x: 420, y: 302, w: 360, h: 44, title: "Route to a declared mental health facility (s 18)", node: "d_where" },

            { id: "r1", kind: "action", x: 20, y: 386, w: 180, h: 84, title: "Schedule 1", sub: "Certificate by practitioner or accredited person (s 19)", node: "out_sched1" },
            { id: "r2", kind: "action", x: 215, y: 386, w: 180, h: 84, title: "Ambulance", sub: "Officer may take the person (s 20)", node: "out_s20" },
            { id: "r3", kind: "action", x: 410, y: 386, w: 180, h: 84, title: "Police", sub: "Apprehension without warrant (s 22)", node: "out_s22" },
            { id: "r4", kind: "action", x: 605, y: 386, w: 180, h: 84, title: "Court order", sub: "Examination where inaccessible (s 23)", node: "out_s23" },
            { id: "r5", kind: "action", x: 800, y: 386, w: 180, h: 84, title: "Transfer", sub: "From another health facility (s 25)", node: "out_s25" },
            { id: "r6", kind: "action", x: 995, y: 386, w: 185, h: 84, title: "Written request", sub: "Carer, relative or friend (s 26)", node: "out_s26" },

            { id: "a7", kind: "action", x: 410, y: 520, w: 380, h: 44, title: "Detained in a declared mental health facility (s 18)" },
            { id: "a8", kind: "action", x: 385, y: 600, w: 430, h: 62, title: "Step 1: examine as soon as practicable, within 12 hours", sub: "Authorised medical officer, or s 27A alternative — Form 1", node: "e_first" },
            { id: "a9", kind: "decision", x: 400, y: 700, w: 400, h: 56, title: "Mentally ill or mentally disordered?" },
            { id: "a10", kind: "stop", x: 30, y: 700, w: 290, h: 56, title: "No — must release", sub: "ss 12(2), 27(1)(a)", node: "out_must_release" },
            { id: "a11", kind: "action", x: 385, y: 792, w: 430, h: 62, title: "Step 2: second examination", sub: "Psychiatrist unless step 1 examiner was one — s 27(1)(b)", node: "e_second" },
            { id: "a12", kind: "decision", x: 415, y: 890, w: 370, h: 52, title: "Findings at the second examination" },

            { id: "a13", kind: "action", x: 25, y: 990, w: 300, h: 76, title: "Neither — third examination by a psychiatrist", sub: "s 27(1)(c); decides release or detention", node: "e_third" },
            { id: "a14", kind: "caution", x: 355, y: 990, w: 320, h: 76, title: "Both mentally disordered — detain up to 3 days", sub: "Excluding weekends and public holidays; examine every 24 h — s 31", node: "out_md_detention" },
            { id: "a15", kind: "action", x: 705, y: 990, w: 330, h: 76, title: "Mentally ill — notify the Tribunal", sub: "Assessable person; inquiry as soon as practicable — ss 27(1)(d), 34", node: "out_inquiry_required" },

            { id: "a16", kind: "action", x: 25, y: 1120, w: 300, h: 60, title: "Third examination decides", sub: "Release, mentally disordered detention, or inquiry", node: "e_third" },
            { id: "a17", kind: "stop", x: 355, y: 1120, w: 320, h: 60, title: "Release when criteria cease", sub: "s 31(4); max 3 admissions per calendar month", node: "out_md_detention" },
            { id: "a18", kind: "action", x: 705, y: 1120, w: 330, h: 96, title: "Mental health inquiry (s 35)", sub: "Discharge / discharge to carer / community treatment order / involuntary order up to 3 months", node: "out_inquiry_orders" }
        ],
        edges: [
            { from: "a1", to: "a2" },
            { from: "a2", to: "a3", fromSide: "l", toSide: "r", label: "No" },
            { from: "a2", to: "a4", label: "Yes" },
            { from: "a4", to: "a5", fromSide: "r", toSide: "l", label: "Yes" },
            { from: "a4", to: "a6", label: "No" },
            { from: "a6", to: "r1" }, { from: "a6", to: "r2" }, { from: "a6", to: "r3" },
            { from: "a6", to: "r4" }, { from: "a6", to: "r5" }, { from: "a6", to: "r6" },
            { from: "r1", to: "a7" }, { from: "r2", to: "a7" }, { from: "r3", to: "a7" },
            { from: "r4", to: "a7" }, { from: "r5", to: "a7" }, { from: "r6", to: "a7" },
            { from: "a7", to: "a8" },
            { from: "a8", to: "a9" },
            { from: "a9", to: "a10", fromSide: "l", toSide: "r", label: "No" },
            { from: "a9", to: "a11", label: "Yes" },
            { from: "a11", to: "a12" },
            { from: "a12", to: "a13" }, { from: "a12", to: "a14" }, { from: "a12", to: "a15" },
            { from: "a13", to: "a16" }, { from: "a14", to: "a17" }, { from: "a15", to: "a18" }
        ]
    };

    var FLOW_REFUSAL = {
        id: "flowB",
        title: "Managing an adult who refuses medical treatment in New South Wales",
        width: 1400,
        height: 900,
        nodes: [
            { id: "b1", kind: "start", x: 520, y: 10, w: 360, h: 46, title: "Adult (18+) refuses medical or surgical treatment" },
            { id: "b2", kind: "action", x: 500, y: 92, w: 400, h: 52, title: "First: explain clearly, support the decision, try to negotiate", sub: "Excluded categories go to specialist advice", node: "r_negotiate" },
            { id: "b3", kind: "decision", x: 500, y: 180, w: 400, h: 58, title: "Decision-making capacity for THIS decision, at THIS time?", node: "r_capacity" },

            { id: "L1", kind: "decision", x: 190, y: 282, w: 320, h: 52, title: "Has capacity — status under the Act?", node: "r_status_cap" },
            { id: "L2", kind: "stop", x: 20, y: 372, w: 270, h: 78, title: "Not subject to the Act, or voluntary", sub: "Refusal must be respected — Hunter and New England AHS v A", node: "out_competent_refusal" },
            { id: "L3", kind: "stop", x: 310, y: 372, w: 280, h: 78, title: "Assessable / mentally disordered", sub: "ss 84 and 190(2) are not clear authority to override — legal advice", node: "out_competent_assessable" },
            { id: "L4", kind: "decision", x: 190, y: 480, w: 320, h: 52, title: "Involuntary patient — 'surgical operation' (s 98)?", node: "r_cap_surgical" },
            { id: "L5", kind: "stop", x: 20, y: 570, w: 250, h: 74, title: "No — medical treatment", sub: "Same uncertainty; seek legal advice", node: "out_competent_involuntary_medical" },
            { id: "L6", kind: "decision", x: 300, y: 570, w: 250, h: 52, title: "Yes — urgent on the s 99 test?", node: "r_cap_surg_urgency" },
            { id: "L7", kind: "caution", x: 240, y: 664, w: 190, h: 86, title: "s 99 consent", sub: "AMO or Secretary; extraordinary circumstances only", node: "out_s99_competent" },
            { id: "L8", kind: "caution", x: 450, y: 664, w: 190, h: 86, title: "s 101 Tribunal consent", sub: "Covers a capable patient who refuses", node: "out_s101_competent" },

            { id: "R1", kind: "decision", x: 900, y: 282, w: 300, h: 52, title: "Lacks capacity — urgently required?", node: "r_urgency" },
            { id: "R2", kind: "decision", x: 740, y: 372, w: 270, h: 62, title: "Urgent: involuntary patient AND surgical operation?", node: "r_urg_surgical" },
            { id: "R3", kind: "decision", x: 1060, y: 372, w: 300, h: 62, title: "Not urgent: involuntary patient AND surgical operation?", node: "r_nonurg_surgical" },
            { id: "R4", kind: "action", x: 700, y: 480, w: 170, h: 76, title: "Yes — s 99 emergency surgery", node: "out_s99_incapable" },
            { id: "R5", kind: "action", x: 890, y: 480, w: 190, h: 76, title: "No — Guardianship Act s 37", sub: "Emergency treatment without consent", node: "out_ga37" },
            { id: "R6", kind: "decision", x: 1120, y: 480, w: 250, h: 62, title: "Yes — designated carer agrees in writing?", node: "r_carer_agrees" },
            { id: "R7", kind: "action", x: 1100, y: 590, w: 130, h: 76, title: "Yes — Secretary consents (s 100)", node: "out_s100" },
            { id: "R8", kind: "action", x: 1250, y: 590, w: 130, h: 76, title: "No — Tribunal consents (s 101)", node: "out_s101" },
            { id: "R9", kind: "action", x: 880, y: 700, w: 300, h: 76, title: "No — person responsible, or NCAT Guardianship Division", sub: "Guardianship Act ss 44, 45, 46(4), 46A", node: "out_ncat" }
        ],
        edges: [
            { from: "b1", to: "b2" },
            { from: "b2", to: "b3" },
            { from: "b3", to: "L1", fromSide: "l", toSide: "t", label: "Has capacity" },
            { from: "b3", to: "R1", fromSide: "r", toSide: "t", label: "Lacks capacity" },

            { from: "L1", to: "L2" }, { from: "L1", to: "L3" },
            { from: "L1", to: "L4", fromSide: "b", toSide: "t" },
            { from: "L4", to: "L5", label: "No" },
            { from: "L4", to: "L6", label: "Yes" },
            { from: "L6", to: "L7", label: "Urgent" },
            { from: "L6", to: "L8", label: "Not urgent" },

            { from: "R1", to: "R2", label: "Yes" },
            { from: "R1", to: "R3", label: "No" },
            { from: "R2", to: "R4", label: "Yes" },
            { from: "R2", to: "R5", label: "No" },
            { from: "R3", to: "R6", label: "Yes" },
            { from: "R3", to: "R9", fromSide: "b", toSide: "t", label: "No" },
            { from: "R6", to: "R7", label: "Yes" },
            { from: "R6", to: "R8", label: "No" }
        ]
    };

    /* =====================================================================
     * STATIC PANELS
     * ================================================================== */

    function renderLibrary() {
        var listEl = document.getElementById("mha-library-list");
        var search = document.getElementById("mha-library-search");
        if (!listEl) return;

        function draw(filter) {
            clear(listEl);
            var q = (filter || "").trim().toLowerCase();
            var shown = 0;
            C.ACT.sections.forEach(function (s) {
                if (q) {
                    var hay = ("s " + s.n + " " + s.heading + " " + (C.GLOSS[s.n] || "") + " " +
                        s.lines.map(function (l) { return l[1]; }).join(" ")).toLowerCase();
                    if (hay.indexOf(q) === -1) return;
                }
                listEl.appendChild(sectionDetails(s.n));
                shown++;
            });
            if (!shown) listEl.appendChild(el("p", "mha-gloss", "No section matches that search."));
        }

        draw("");
        if (search) {
            search.addEventListener("input", function (e) { draw(e.target.value); });
        }
    }

    function renderForms() {
        var host = document.getElementById("mha-forms-list");
        if (!host) return;
        clear(host);
        C.FORMS.forEach(function (f) {
            var card = el("div", "mha-form-card");
            card.appendChild(el("h4", null, f.name));
            card.appendChild(rowLine("Statutory source", f.source));
            card.appendChild(rowLine("Who completes it", f.who));
            card.appendChild(rowLine("When", f.when));
            card.appendChild(rowLine("Clock", f.clock));
            if (f.sections && f.sections.length) {
                card.appendChild(sectionList(f.sections));
            }
            host.appendChild(card);
        });
        var caveat = el("div", "mha-callout");
        caveat.appendChild(el("strong", null, "About form numbers. "));
        caveat.appendChild(document.createTextNode(
            "Form numbers are prescribed by regulation, and the Mental Health Regulation 2025 replaced the 2019 Regulation. " +
            "Each entry above is anchored to its statutory source, which does not change. Print the current form from NSW Health rather than from any number quoted in older material."
        ));
        host.appendChild(caveat);

        var clocks = document.getElementById("mha-timeframes-list");
        if (!clocks) return;
        clear(clocks);
        var table = el("table", "mha-clock-table");
        var thead = el("thead");
        var hr = el("tr");
        ["Clock", "What it governs", "Provision"].forEach(function (h) { hr.appendChild(el("th", null, h)); });
        thead.appendChild(hr);
        table.appendChild(thead);
        var tbody = el("tbody");
        C.TIMEFRAMES.forEach(function (t) {
            var tr = el("tr");
            tr.appendChild(el("td", "mha-clock-cell", t.clock));
            tr.appendChild(el("td", null, t.what));
            tr.appendChild(el("td", "mha-clock-ref", t.ref));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        var scroller = el("div", "mha-table-scroll");
        scroller.appendChild(table);
        clocks.appendChild(scroller);
    }

    function renderCapacityTab() {
        var host = document.getElementById("mha-capacity-body");
        if (!host) return;
        clear(host);

        var intro = el("div", "mha-card");
        intro.appendChild(el("h4", null, "The test"));
        intro.appendChild(el("p", null, "At common law an adult is presumed to have decision-making capacity for medical decisions. The presumption is rebutted if it can be shown that the person is unable to comprehend or retain the information material to the decision, or unable to use and weigh that information to come to a decision."));
        intro.appendChild(el("p", "mha-provenance", "Hunter and New England Area Health Service v A [2009] NSWSC 761, as summarised in " + CHENG_CITE));
        host.appendChild(intro);

        var steps = el("div", "mha-card");
        steps.appendChild(el("h4", null, "Before deciding someone lacks capacity"));
        steps.appendChild(bulletList([
            "A person should not be deemed to lack capacity unless all reasonable steps have been taken to support them in making the decision.",
            "Give the information in simple language.",
            "Allow sufficient time, and the assistance of friends or family if the person wants it and it is practicable.",
            "Use an interpreter where the person cannot communicate adequately in English (s 70).",
            "Treat and re-assess reversible contributors: delirium, pain, intoxication, sedation, acute distress.",
            "Assess against the specific decision at hand — capacity is decision-specific and time-specific.",
            "Record the assessment and its reasons contemporaneously."
        ]));
        host.appendChild(steps);

        var traps = el("div", "mha-card");
        traps.appendChild(el("h4", null, "Traps"));
        traps.appendChild(bulletList([
            "An unwise decision is not incapacity. A competent adult's refusal must be respected even where refusal is likely to result in physical harm or death.",
            "Being detained under the Mental Health Act does not by itself remove capacity to decide about medical treatment.",
            "A diagnosis is not an answer to the capacity question.",
            "NSW is unusual in that the statutory presumption of capacity for medical decisions is lowered to 14 years — but this tool covers adults only.",
            "Section 84 is a psychiatric treatment power. It is not a general authority to treat non-psychiatric conditions over a competent refusal."
        ]));
        host.appendChild(traps);

        var guardianship = el("div", "mha-card");
        guardianship.appendChild(el("h4", null, "When capacity is absent: the guardianship routes"));
        var warn = el("p", "mha-caution mha-unverified");
        warn.textContent = "The Guardianship Act 1987 (NSW) provisions below are summarised from Cheng et al. (2018). Unlike the Mental Health Act text in this app, they are not quoted from the Act itself — check the current text before relying on the detail.";
        guardianship.appendChild(warn);
        guardianship.appendChild(bulletList([
            "Emergency (s 37): treatment may be given without consent where the person lacks capacity, urgently required treatment is needed to save life or prevent significant pain or serious damage to health, it is not practicable to obtain substitute consent, and there is no reason to believe the person would have refused if competent.",
            "Person responsible: may consent to treatment for a person who lacks capacity in the ordinary case.",
            "Minimal understanding exception (s 46(4)): where the person refuses with minimal or no understanding of what the treatment entails and it will cause no more than reasonably tolerable and transient distress, the person responsible may consent.",
            "Objection by a person lacking capacity: an application must be made to the Guardianship Division of NCAT to authorise a guardian to override the objection (s 46A), or to seek consent directly from the Tribunal (ss 44 and 45)."
        ]));
        guardianship.appendChild(contactBlock(["NCAT Guardianship Division"]));
        host.appendChild(guardianship);

        var mha = el("div", "mha-card");
        mha.appendChild(el("h4", null, "The Mental Health Act provisions that come up in these discussions"));
        mha.appendChild(sectionList(["84", "82", "190", "98", "99", "100", "101", "102", "103", "104", "68"]));
        host.appendChild(mha);
    }

    function renderAbout() {
        var host = document.getElementById("mha-sources-body");
        if (!host) return;
        clear(host);

        var currency = el("div", "mha-card");
        currency.appendChild(el("h4", null, "Currency"));
        currency.appendChild(rowLine("Act", META.act || "Mental Health Act 2007 (NSW)"));
        currency.appendChild(rowLine("Version", (META.currency || "") + " — last consolidated amendment " + (META.lastConsolidatedAmendment || "")));
        currency.appendChild(rowLine("Retrieved", META.retrieved || ""));
        currency.appendChild(rowLine("Source", META.source || ""));
        var p = el("p", "mha-provenance");
        p.appendChild(document.createTextNode("Every quoted section in this tool is extracted from that consolidation, not retyped. "));
        var a = el("a", null, "Open the Act");
        a.href = C.URLS.legislation;
        a.target = "_blank";
        a.rel = "noopener";
        p.appendChild(a);
        currency.appendChild(p);
        host.appendChild(currency);

        var src = el("div", "mha-card");
        src.appendChild(el("h4", null, "Sources"));
        var ul = el("ul", "mha-list");

        var li1 = el("li");
        li1.appendChild(el("strong", null, "Mental Health Act 2007 (NSW) No 8. "));
        li1.appendChild(document.createTextNode("All quoted statutory text. "));
        var a1 = el("a", null, "legislation.nsw.gov.au");
        a1.href = C.URLS.legislation; a1.target = "_blank"; a1.rel = "noopener";
        li1.appendChild(a1);
        ul.appendChild(li1);

        var li2 = el("li");
        li2.appendChild(el("strong", null, "NSW Mental Health Act (2007) Guide Book, 9th edition (HETI, November 2022). "));
        li2.appendChild(document.createTextNode("Practical procedure — Schedule 1 and Form 1 usage, and the examination sequence. "));
        var a2 = el("a", null, "NSW Health");
        a2.href = C.URLS.guidebook; a2.target = "_blank"; a2.rel = "noopener";
        li2.appendChild(a2);
        ul.appendChild(li2);

        var li3 = el("li");
        li3.appendChild(el("strong", null, "Cheng K, Wand A, Ryan C, Callaghan S (2018). "));
        li3.appendChild(document.createTextNode("An algorithm for managing adults who refuse medical treatment in New South Wales. Australas Psychiatry 26(5): 464-468. The treatment-refusal pathway, and the reading of the Guardianship Act provisions cited there."));
        ul.appendChild(li3);

        var li4 = el("li");
        li4.appendChild(el("strong", null, "Hunter and New England Area Health Service v A [2009] NSWSC 761. "));
        li4.appendChild(document.createTextNode("The capacity test and the standing of a competent refusal."));
        ul.appendChild(li4);

        var li5 = el("li");
        li5.appendChild(el("strong", null, "Guardianship Act 1987 (NSW). "));
        li5.appendChild(document.createTextNode("Summarised from Cheng et al., NOT quoted — every place this app relies on it is marked."));
        ul.appendChild(li5);

        src.appendChild(ul);
        host.appendChild(src);

        var scope = el("div", "mha-card");
        scope.appendChild(el("h4", null, "Scope and limits"));
        scope.appendChild(bulletList([
            "Adults only. The treatment-refusal pathway follows a published algorithm that excludes people under 18 years.",
            "Excluded treatments, which have their own legal frameworks: termination of pregnancy, treatments likely to cause infertility, treatment in the context of research, compulsory treatment of some infectious diseases, treatment in forensic settings, and end-of-life treatment that does not contribute to the person's health and well-being.",
            "Forensic and correctional patients are referred to only where the quoted sections mention them; the forensic provisions Act is not covered.",
            "Form numbers change by regulation. Statutory sources are given instead; print current forms from NSW Health.",
            "This is a decision-support and teaching aid. It is not legal advice, and it does not replace your local health district's legal advice, policy directives, or the judgement of the treating clinician."
        ]));
        host.appendChild(scope);

        var contacts = el("div", "mha-card");
        contacts.appendChild(el("h4", null, "Escalation contacts"));
        contacts.appendChild(contactBlock(null));
        host.appendChild(contacts);
    }

    function renderCurrencyBanners() {
        var text = "Statutory text current as at " + (META.currency || "unknown") +
            " (last consolidated amendment " + (META.lastConsolidatedAmendment || "unknown") + ").";
        document.querySelectorAll(".mha-currency-text").forEach(function (n) {
            n.textContent = text;
        });
    }

    /* =====================================================================
     * INIT
     * ================================================================== */

    function init() {
        if (!document.getElementById("mha-page")) return;

        renderCurrencyBanners();
        renderWizard();
        renderLibrary();
        renderForms();
        renderCapacityTab();
        renderAbout();

        var flowA = document.getElementById("mha-flow-involuntary");
        if (flowA) renderFlow(flowA, FLOW_INVOLUNTARY);
        var flowB = document.getElementById("mha-flow-refusal");
        if (flowB) renderFlow(flowB, FLOW_REFUSAL);

        var printBtn = document.getElementById("mha-print-flow");
        if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
