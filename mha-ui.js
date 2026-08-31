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
    var HUBER_CITE = "Huber J, Aguirrebarrena G, Ryan CJ. Algorithm for the use of the Guardianship Act, the Mental Health Act and the Public Health Act in emergency departments in New South Wales. Emerg Med Australas 2022; 34(1): 34-38.";

    var SOURCE_CITE = { cheng: CHENG_CITE, huber: HUBER_CITE };

    /* The warning shown wherever this tool relies on an Act whose text was not
       available to quote from. Kept in one place so it cannot drift. */
    var UNVERIFIED_WARNING = "Guardianship Act 1987 (NSW) and Public Health Act 2010 (NSW) provisions are summarised from the published algorithms, not quoted from those Acts. Unlike the Mental Health Act text in this app, they have not been checked against the legislation itself — verify before relying on the detail.";

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

    /* Pulls one defined term out of a definitions section (s 4, s 98, ...) so a
       single definition can be quoted without the whole dictionary around it. */
    function definitionLines(sectionNo, term) {
        var s = SECTIONS[sectionNo];
        if (!s) return [];
        var out = [];
        var startDepth = null;
        for (var i = 0; i < s.lines.length; i++) {
            var depth = s.lines[i][0];
            var text = s.lines[i][1];
            if (startDepth === null) {
                if (text.indexOf(term + " means") === 0 || text.indexOf(term + "—") === 0) {
                    startDepth = depth;
                    out.push(s.lines[i]);
                }
            } else if (depth > startDepth) {
                out.push(s.lines[i]);
            } else {
                break;
            }
        }
        return out;
    }

    function quoteBlock(lines, cite) {
        var wrap = el("div", "mha-quote");
        lines.forEach(function (line) {
            wrap.appendChild(el("p", "mha-quote-line mha-indent-" + line[0], line[1]));
        });
        if (cite) wrap.appendChild(el("p", "mha-section-foot", cite));
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
        if (node.unverified) card.appendChild(unverifiedNote());
        if (node.source) card.appendChild(sourceNote(node.source));

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

    function sourceNote(source) {
        var p = el("p", "mha-provenance");
        p.textContent = "This step follows the published algorithm: " + (SOURCE_CITE[source] || source);
        return p;
    }

    function unverifiedNote() {
        return el("p", "mha-caution mha-unverified", UNVERIFIED_WARNING);
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

        if (node.unverified) card.appendChild(unverifiedNote());

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
        if (node.source && !node.authority) {
            card.appendChild(sourceNote(node.source));
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
        if (node.source && SOURCE_CITE[node.source]) {
            lines.push("  - " + SOURCE_CITE[node.source]);
        }
        if (node.unverified) {
            lines.push("");
            lines.push("NOTE: " + UNVERIFIED_WARNING);
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
            // `via` gives an explicit orthogonal corridor where the automatic
            // route would run through an unrelated box.
            var pts = e.via
                ? [anchor(from, fs)].concat(e.via).concat([anchor(to, ts)])
                : routePoints(anchor(from, fs), anchor(to, ts), fs, ts);
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
            { id: "L3", kind: "stop", x: 430, y: 372, w: 280, h: 78, title: "Assessable / mentally disordered", sub: "ss 84 and 190(2) are not clear authority to override — legal advice", node: "out_competent_assessable" },
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
            { from: "R3", to: "R9", fromSide: "b", toSide: "t", label: "No", via: [[1210, 470], [1100, 470], [1100, 660], [1030, 660]] },
            { from: "R6", to: "R7", label: "Yes" },
            { from: "R6", to: "R8", label: "No" }
        ]
    };

    /* The ED algorithm: three lanes, one per Act, after Huber et al. (2021). */
    var FLOW_ED = {
        id: "flowC",
        title: "Use of the Guardianship Act, the Mental Health Act and the Public Health Act in the emergency department in NSW",
        width: 1760,
        height: 960,
        nodes: [
            { id: "e1", kind: "decision", x: 560, y: 14, w: 420, h: 46, title: "Is the patient declining testing or treatment?", node: "ed_start" },

            /* ---- Mental Health Act lane ---- */
            { id: "m0", kind: "lane", x: 30, y: 14, w: 300, h: 28, title: "MENTAL HEALTH ACT" },
            { id: "m1", kind: "decision", x: 30, y: 52, w: 300, h: 76, title: "Does the patient have symptoms needing mental health assessment or treatment?", node: "ed_mha_q1" },
            { id: "m2", kind: "decision", x: 30, y: 160, w: 300, h: 54, title: "Currently detained under the MHA?", node: "ed_mha_detained" },
            { id: "m3", kind: "decision", x: 20, y: 246, w: 470, h: 84, title: "Hallucinations, delusions, serious disorder of thought form, severe mood disturbance, or sustained irrational behaviour indicating any of these?", sub: "s 4 definition of mental illness", node: "ed_mha_symptoms" },
            { id: "m4", kind: "decision", x: 20, y: 364, w: 225, h: 104, title: "Reasonable grounds that care, treatment or control is necessary to protect the patient or others from serious harm?", sub: "s 14", node: "ed_mi_risk" },
            { id: "m5", kind: "decision", x: 265, y: 364, w: 225, h: 104, title: "Behaviour so irrational as to justify care, treatment or control for protection from serious PHYSICAL harm?", sub: "s 15", node: "ed_md_risk" },
            { id: "m6", kind: "decision", x: 20, y: 504, w: 470, h: 68, title: "Other than the MHA, is there a less restrictive avenue, consistent with safe and effective care, appropriate and reasonably available?", sub: "s 12(1)(b)", node: "ed_less_restrictive" },
            { id: "m7", kind: "action", x: 20, y: 610, w: 225, h: 54, title: "Write a Schedule 1 (s 19)", node: "out_ed_schedule1" },
            { id: "m8", kind: "stop", x: 265, y: 610, w: 225, h: 54, title: "Do not utilise the MHA", node: "out_ed_no_mha" },
            { id: "m9", kind: "action", x: 20, y: 700, w: 470, h: 86, title: "Refer for review by an AMO — detained until this occurs, which must be within 12 hours", sub: "Psychiatric treatment may be given, including sedation if necessary, despite refusal. Does NOT authorise other medical treatment.", node: "out_ed_amo_review" },

            /* ---- Guardianship Act lane ---- */
            { id: "g0", kind: "lane", x: 520, y: 150, w: 240, h: 28, title: "GUARDIANSHIP ACT" },
            { id: "g1", kind: "decision", x: 520, y: 186, w: 340, h: 54, title: "Does the patient have decision-making capacity for this treatment?", node: "ed_ga_q1" },
            { id: "g2", kind: "stop", x: 900, y: 96, w: 250, h: 68, title: "A patient with capacity can refuse — even lifesaving treatment", node: "out_ed_dmc_refusal" },
            { id: "g3", kind: "decision", x: 520, y: 272, w: 340, h: 78, title: "Is there an ACD made when the patient had capacity, clear and unambiguous, extending to the situation at hand?", node: "ed_acd" },
            { id: "g4", kind: "stop", x: 900, y: 280, w: 220, h: 54, title: "Respect the ACD", node: "out_ed_acd" },
            { id: "g5", kind: "decision", x: 520, y: 382, w: 340, h: 82, title: "Is the procedure urgent and necessary to save life, prevent serious damage to health, or prevent significant pain or distress?", node: "ed_urgent" },
            { id: "g6", kind: "action", x: 900, y: 384, w: 280, h: 76, title: "Treat the urgent issue under GA s 37, and apply to NCAT ASAP about ongoing treatment", node: "out_ed_ga37" },
            { id: "g7", kind: "decision", x: 520, y: 496, w: 340, h: 60, title: "Is the mental state likely to improve very soon (e.g. intoxication)?", node: "ed_improve" },
            { id: "g8", kind: "caution", x: 900, y: 498, w: 240, h: 54, title: "Wait and reassess capacity", node: "out_ed_wait" },
            { id: "g9", kind: "decision", x: 520, y: 596, w: 300, h: 54, title: "Is there a guardian appointed by NCAT?", node: "ed_guardian" },
            { id: "g10", kind: "decision", x: 870, y: 596, w: 270, h: 60, title: "Does the guardian have power to override decisions?", node: "ed_guardian_powers" },
            { id: "g11", kind: "action", x: 1190, y: 596, w: 190, h: 60, title: "Guardian can consent", node: "out_ed_guardian_consent" },
            { id: "g12", kind: "decision", x: 520, y: 696, w: 400, h: 76, title: "No or minimal understanding of what the treatment entails, AND no lasting distress?", node: "ed_minimal" },
            { id: "g13", kind: "action", x: 520, y: 816, w: 190, h: 76, title: "Application to NCAT must be made", node: "out_ed_ncat" },
            { id: "g14", kind: "action", x: 730, y: 816, w: 420, h: 76, title: "Objection may be disregarded (GA s 46(4)); person responsible can consent (GA s 36)", sub: "If no person responsible, some 'minor' treatments may still be given", node: "out_ed_person_responsible" },

            /* ---- Public Health Act lane, and the negotiate step ---- */
            { id: "p4", kind: "action", x: 1250, y: 96, w: 170, h: 84, title: "Attempt to negotiate a mutually agreed decision", sub: "If still objecting, go to the Guardianship Act", node: "ed_negotiate" },
            { id: "cg", kind: "connector", x: 1250, y: 196, w: 170, h: 40, title: "Go to Guardianship Act", node: "ed_ga_q1" },
            { id: "p0", kind: "lane", x: 1470, y: 14, w: 250, h: 28, title: "PUBLIC HEALTH ACT" },
            { id: "p1", kind: "decision", x: 1470, y: 52, w: 250, h: 64, title: "Category 4 or 5 illness under the PHA?", node: "ed_pha_q1" },
            { id: "p2", kind: "decision", x: 1470, y: 148, w: 250, h: 90, title: "Behaving in a way that may, as a consequence of their decision, be a risk to public health?", node: "ed_pha_q2" },
            { id: "p3", kind: "caution", x: 1460, y: 274, w: 270, h: 120, title: "Notify the AMP under the PHA and discuss a collaborative clinical approach", sub: "You have no power to detain or treat until an order is enacted by the AMP and served in writing", node: "out_pha_amp" },

            /* Minor treatments legend */
            { id: "leg", kind: "note", x: 1190, y: 700, w: 300, h: 192, title: "'Minor treatments' include:", sub: "Sedation for fracture/dislocation management; sedation for endoscopy NOT through skin or mucous membrane; catheterisation; analgesia; antipyretics; anti-Parkinsonian medication; anticonvulsants; antiemetics; antihistamines; blood tests EXCEPT HIV" }
        ],
        edges: [
            { from: "e1", to: "m1", fromSide: "l", toSide: "r", label: "No" },
            { from: "e1", to: "p1", fromSide: "r", toSide: "l", label: "Yes" },

            { from: "m1", to: "m2", label: "Yes" },
            { from: "m2", to: "m3", label: "No" },
            { from: "m3", to: "m4", label: "Yes" },
            { from: "m3", to: "m5", label: "No" },
            { from: "m4", to: "m6", label: "Yes" },
            { from: "m5", to: "m6", label: "Yes" },
            { from: "m6", to: "m7", label: "No" },
            { from: "m6", to: "m8", label: "Yes" },
            { from: "m7", to: "m9" },

            { from: "p1", to: "p2", label: "Yes" },
            { from: "p1", to: "p4", fromSide: "l", toSide: "r", label: "No" },
            { from: "p2", to: "p3", label: "Yes" },
            { from: "p2", to: "cg", fromSide: "l", toSide: "r", label: "No" },
            { from: "p4", to: "cg", label: "Still objecting" },
            { from: "cg", to: "g1", fromSide: "l", toSide: "r" },

            { from: "g1", to: "g2", fromSide: "r", toSide: "l", label: "Yes" },
            { from: "g1", to: "g3", label: "No" },
            { from: "g3", to: "g4", fromSide: "r", toSide: "l", label: "Yes" },
            { from: "g3", to: "g5", label: "No / unsure" },
            { from: "g5", to: "g6", fromSide: "r", toSide: "l", label: "Yes" },
            { from: "g5", to: "g7", label: "No" },
            { from: "g7", to: "g8", fromSide: "r", toSide: "l", label: "Yes" },
            { from: "g7", to: "g9", label: "No" },
            { from: "g9", to: "g10", fromSide: "r", toSide: "l", label: "Yes" },
            { from: "g10", to: "g11", fromSide: "r", toSide: "l", label: "Yes" },
            { from: "g9", to: "g12", label: "No" },
            { from: "g10", to: "g12", fromSide: "b", toSide: "r", label: "No" },
            { from: "g12", to: "g13", label: "No" },
            { from: "g12", to: "g14", label: "Yes" }
        ]
    };

    /* Exposed so the layouts can be checked for overlapping boxes offline. */
    window.MHA_FLOWS = { involuntary: FLOW_INVOLUNTARY, refusal: FLOW_REFUSAL, ed: FLOW_ED };

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

    /* The criteria, up front. These are the definitions every other decision on
       this page turns on, so they sit above the wizard rather than inside it. */
    function renderDefinitions() {
        var host = document.getElementById("mha-definitions");
        if (!host) return;
        clear(host);

        var card = el("details", "mha-card mha-definitions-card");
        card.open = true;
        var sum = el("summary", "mha-definitions-summary");
        sum.appendChild(el("span", null, "The criteria — mental illness, mentally ill person, mentally disordered person"));
        card.appendChild(sum);

        var body = el("div", "mha-definitions-body");

        /* --- mental illness: the symptom criteria --- */
        body.appendChild(el("h5", "mha-subhead", "Mental illness — the symptom criteria (s 4)"));
        body.appendChild(el("p", "mha-gloss", "A condition that seriously impairs mental functioning, temporarily or permanently, AND is characterised by at least one of these five symptoms. Both halves are required."));
        var symptomLines = definitionLines("4", "mental illness");
        if (symptomLines.length) {
            body.appendChild(quoteBlock(symptomLines, "Mental Health Act 2007 (NSW) s 4(1), " + (META.currency || "")));
        }

        /* --- the two limbs, side by side --- */
        body.appendChild(el("h5", "mha-subhead", "The two limbs compared"));
        var rows = [
            ["", "Mentally ill person (s 14)", "Mentally disordered person (s 15)"],
            ["Mental illness required?", "Yes — the s 4 definition must be met", "No — applies whether or not the person is mentally ill"],
            ["The trigger", "Owing to that illness, reasonable grounds for believing care, treatment or control is necessary", "Behaviour for the time being so irrational as to justify a conclusion on reasonable grounds that TEMPORARY care, treatment or control is necessary"],
            ["Harm threshold", "Protection from serious harm (the person's own, or others')", "Protection from serious PHYSICAL harm (the person's own, or others') — narrower"],
            ["Continuing condition", "Likely deterioration and its effects are taken into account (s 14(2))", "Not part of the test — it is about behaviour for the time being"],
            ["Mental health inquiry", "Yes — the person is an assessable person and goes before the Tribunal", "No inquiry for a person detained only on this limb"],
            ["Detention limit", "Up to the inquiry, then up to 3 months on a Tribunal order (s 35(5)(c))", "3 days NOT including weekends and public holidays, examined at least every 24 hours (s 31)"],
            ["Schedule 1 validity", "5 days after it is given (s 19(4)(a))", "1 day after it is given (s 19(4)(b))"],
            ["Frequency cap", "None", "No more than 3 such admissions in any 1 calendar month (s 31(5))"]
        ];
        var table = el("table", "mha-def-table");
        var thead = el("thead");
        var hr = el("tr");
        rows[0].forEach(function (h) { hr.appendChild(el("th", null, h)); });
        thead.appendChild(hr);
        table.appendChild(thead);
        var tbody = el("tbody");
        rows.slice(1).forEach(function (r) {
            var tr = el("tr");
            tr.appendChild(el("th", "mha-def-rowhead", r[0]));
            tr.appendChild(el("td", null, r[1]));
            tr.appendChild(el("td", null, r[2]));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        var scroll = el("div", "mha-table-scroll");
        scroll.appendChild(table);
        body.appendChild(scroll);

        /* --- what cannot establish either limb --- */
        body.appendChild(el("h5", "mha-subhead", "What cannot, by itself, make a person mentally ill or mentally disordered (s 16)"));
        body.appendChild(el("p", "mha-gloss", "Section 16 rules these out on their own. They may still be relevant as part of a wider picture, but none of them is a criterion."));
        var s16 = SECTIONS["16"];
        if (s16) {
            var excl = el("div", "mha-quote");
            s16.lines.forEach(function (line) {
                excl.appendChild(el("p", "mha-quote-line mha-indent-" + line[0], line[1]));
            });
            body.appendChild(excl);
        }

        body.appendChild(el("h5", "mha-subhead", "The sections in full"));
        body.appendChild(sectionList(["4", "13", "14", "15", "16", "12"]));

        card.appendChild(body);
        host.appendChild(card);
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

        var duty = el("div", "mha-card");
        duty.appendChild(el("h4", null, "'Duty of care' is not a power to treat"));
        duty.appendChild(el("p", null, "'Duty of care' refers to the expectation that a clinician will provide reasonable care and treatment to the standard widely accepted as competent professional practice. It is not a legal authority to do anything to anyone."));
        duty.appendChild(el("p", null, "When clinicians say they are treating a patient 'under duty of care', what they are actually reaching for is the power to treat a patient who lacks decision-making capacity — and that power is codified in s 37 of the Guardianship Act. Document the real basis: that the patient is detained and treated under s 37 of the Guardianship Act, not 'under duty of care'."));
        duty.appendChild(el("p", "mha-provenance", "Huber et al. (2021), drawing on Lamont S, Stewart C, Chiarella M. The misuse of 'duty of care' as justification for non-consensual coercive treatment. Int J Law Psychiatry 2020; 71: 101598."));
        host.appendChild(duty);

        var guardianship = el("div", "mha-card");
        guardianship.appendChild(el("h4", null, "When capacity is absent: the guardianship routes"));
        guardianship.appendChild(unverifiedNote());
        guardianship.appendChild(bulletList([
            "Emergency (s 37): treatment may be given without consent where the person lacks capacity, urgently required treatment is needed to save life or prevent significant pain or serious damage to health, it is not practicable to obtain substitute consent, and there is no reason to believe the person would have refused if competent. Huber et al. state this pathway applies to patients aged 16 and over.",
            "Person responsible (s 36): may consent to treatment for a person who lacks capacity and is NOT objecting.",
            "A person responsible cannot override a patient's refusal, even one made without capacity — except through the narrow exception below.",
            "Minimal understanding exception (s 46(4)): where the person refuses with minimal or no understanding of what the treatment entails, and the treatment will cause no distress or only distress that is reasonably tolerable and transitory, the person responsible may consent.",
            "Guardian appointed by NCAT: may consent over the patient's objection only where they hold the healthcare function AND are explicitly authorised to override objections. Read the order before relying on it.",
            "Otherwise, objection by a person lacking capacity means an application must be made to the Guardianship Division of NCAT — to authorise a guardian to override the objection (s 46A), or to seek consent directly from the Tribunal (ss 44 and 45).",
            "Detention under the Guardianship Act has no form, unlike a Schedule 1. Security staff may be unfamiliar with it, so state the legal basis explicitly in the notes and at handover.",
            "Where incapacity is suspected but not confirmed and the patient needs protection, there is a basis at common law to restrain — only for as long as the necessity prevails, or until consent can be otherwise obtained, weighing the harm of restraint against the harm of an incapacitous decision."
        ]));
        guardianship.appendChild(contactBlock(["NCAT Guardianship Division"]));
        host.appendChild(guardianship);

        var minor = el("div", "mha-card");
        minor.appendChild(el("h4", null, "'Minor treatments' that may be given where there is no person responsible"));
        minor.appendChild(el("p", "mha-gloss", "The list given in the published ED algorithm:"));
        minor.appendChild(bulletList([
            "Sedation for management of a fracture or dislocation",
            "Sedation for endoscopy NOT through skin or mucous membrane",
            "Catheterisation",
            "Analgesia",
            "Antipyretics",
            "Anti-Parkinsonian medication",
            "Anticonvulsants",
            "Antiemetics",
            "Antihistamines",
            "Blood tests, EXCEPT HIV"
        ]));
        minor.appendChild(el("p", "mha-provenance", HUBER_CITE));
        host.appendChild(minor);

        var pha = el("div", "mha-card");
        pha.appendChild(el("h4", null, "Public Health Act 2010 (NSW): what it can and cannot do for you"));
        pha.appendChild(unverifiedNote());
        pha.appendChild(bulletList([
            "The Public Health Act is concerned with risk to public health, not with the individual patient's best interests. It divides illnesses into categories in Schedule 1, with different rules for each. COVID-19 was classified across Categories 2-4.",
            "A notifiable diagnosis should be recorded in the notes; the laboratory notifies the Public Health Unit (s 54).",
            "Where a person has been exposed and behaves in a way that presents a possible risk to the public, a medical practitioner or hospital may inform an Authorised Medical Practitioner (AMP) through the local Public Health Unit, who may make a public health order.",
            "A public health order must be served in writing on the person before it comes into effect.",
            "An order may require the person to refrain from specified conduct, undergo a specified medical examination, be detained at a specified place for the duration of the order, or undergo treatment (s 62).",
            "Until the order is made and served you have NO power under this Act to detain or treat. In practice, drafting takes time, and the patient may lawfully leave before the order exists unless they independently meet the Mental Health Act or Guardianship Act criteria.",
            "An order usually works only where there is a clinical structure to scaffold it — plan the supports at the same time as the order."
        ]));
        pha.appendChild(contactBlock(["Local Public Health Unit"]));
        pha.appendChild(el("p", "mha-provenance", HUBER_CITE));
        host.appendChild(pha);

        var choosing = el("div", "mha-card");
        choosing.appendChild(el("h4", null, "Which Act, in one line each"));
        choosing.appendChild(bulletList([
            "Mental Health Act — the patient needs psychiatric assessment or treatment and meets the mentally ill or mentally disordered criteria. Authorises psychiatric treatment without consent. Does NOT authorise other medical treatment.",
            "Guardianship Act — the patient lacks decision-making capacity and is refusing medical treatment. This is the Act for treating the body, whether or not a schedule exists.",
            "Public Health Act — the risk is to the public, not primarily to the patient. Nothing happens until an AMP makes and serves a written order.",
            "A patient with decision-making capacity can refuse treatment, even lifesaving treatment, and none of these Acts changes that except in extremely limited circumstances."
        ]));
        choosing.appendChild(el("p", "mha-provenance", HUBER_CITE));
        host.appendChild(choosing);

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

        var li3b = el("li");
        li3b.appendChild(el("strong", null, "Huber J, Aguirrebarrena G, Ryan CJ (2022). "));
        li3b.appendChild(document.createTextNode("Algorithm for the use of the Guardianship Act, the Mental Health Act and the Public Health Act in emergency departments in New South Wales. Emerg Med Australas 34(1): 34-38. The ED pathway across all three Acts, the 'duty of care' correction, the minor-treatments list, and the Public Health Act material."));
        ul.appendChild(li3b);

        var li4 = el("li");
        li4.appendChild(el("strong", null, "Hunter and New England Area Health Service v A [2009] NSWSC 761. "));
        li4.appendChild(document.createTextNode("The capacity test and the standing of a competent refusal."));
        ul.appendChild(li4);

        var li5 = el("li");
        li5.appendChild(el("strong", null, "Guardianship Act 1987 (NSW) and Public Health Act 2010 (NSW). "));
        li5.appendChild(document.createTextNode("Summarised from Cheng et al. and Huber et al., NOT quoted — every place this app relies on them is marked with a warning."));
        ul.appendChild(li5);

        src.appendChild(ul);
        host.appendChild(src);

        var scope = el("div", "mha-card");
        scope.appendChild(el("h4", null, "Scope and limits"));
        scope.appendChild(bulletList([
            "Adults only. The treatment-refusal pathway follows a published algorithm that excludes people under 18 years. Note the ED algorithm's Guardianship Act s 37 pathway is described as applying from age 16 — the two papers draw their age lines differently.",
            "Only the Mental Health Act is quoted. The Guardianship Act and Public Health Act material is paraphrased from the published algorithms and is flagged wherever it appears.",
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
        renderDefinitions();
        renderWizard();
        renderLibrary();
        renderForms();
        renderCapacityTab();
        renderAbout();

        var flowA = document.getElementById("mha-flow-involuntary");
        if (flowA) renderFlow(flowA, FLOW_INVOLUNTARY);
        var flowB = document.getElementById("mha-flow-refusal");
        if (flowB) renderFlow(flowB, FLOW_REFUSAL);
        var flowC = document.getElementById("mha-flow-ed");
        if (flowC) renderFlow(flowC, FLOW_ED);

        var printBtn = document.getElementById("mha-print-flow");
        if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
