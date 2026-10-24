// Steward bot: a short conversation that offers early access and collects the visitor's details.
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var bot = $("bot"), log = $("botLog"), act = $("botAct"), btn = $("botBtn"), tease = $("botTease");
  if (!bot) return;
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var DONE_KEY = "ll-early-access-done";
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var data = { name: "", email: "", phone: "", invests: [] };
  var started = false;

  // ---------- open / close ----------
  function open() {
    bot.hidden = false; btn.setAttribute("aria-expanded", "true");
    tease.classList.remove("show");
    if (!started) { started = true; start(); }
    setTimeout(function () { var i = act.querySelector("input, button"); if (i) i.focus({ preventScroll: true }); }, 350);
  }
  function close() { bot.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus({ preventScroll: true }); }
  btn.addEventListener("click", function () { bot.hidden ? open() : close(); });
  tease.addEventListener("click", open);
  $("botClose").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !bot.hidden) close(); });
  // Every early-access button on the page opens the Steward instead of jumping down.
  document.querySelectorAll('a[href="#early-access"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); open(); });
  });
  if (!store.get(DONE_KEY)) setTimeout(function () { if (bot.hidden) tease.classList.add("show"); }, 5000);

  // ---------- conversation helpers ----------
  function scroll() { log.scrollTop = log.scrollHeight; }
  function say(text, note) {
    return new Promise(function (resolve) {
      var dots = document.createElement("div"); dots.className = "typing"; dots.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(dots); scroll();
      setTimeout(function () {
        dots.remove();
        var m = document.createElement("div"); m.className = "msg bot-m"; m.textContent = text;
        if (note) { var s = document.createElement("small"); s.textContent = note; m.appendChild(s); }
        log.appendChild(m); scroll(); resolve();
      }, reduce ? 80 : 450 + Math.min(700, text.length * 9));
    });
  }
  function me(text) { var m = document.createElement("div"); m.className = "msg me"; m.textContent = text; log.appendChild(m); scroll(); }
  function clearAct() { act.replaceChildren(); }
  function choices(list) {
    clearAct();
    var box = document.createElement("div"); box.className = "choices";
    list.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = c.label;
      if (c.primary) b.className = "primary";
      b.addEventListener("click", function () { clearAct(); me(c.label); c.go(); });
      box.appendChild(b);
    });
    act.appendChild(box);
    var first = box.querySelector("button"); if (first && !bot.hidden) first.focus({ preventScroll: true });
  }
  function ask(opts) {
    clearAct();
    var form = document.createElement("form"); form.className = "ask"; form.noValidate = true;
    var input = document.createElement("input");
    input.type = opts.type || "text"; input.placeholder = opts.placeholder; input.autocomplete = opts.autocomplete || "off";
    input.setAttribute("aria-label", opts.label); input.maxLength = opts.max || 80;
    if (opts.inputmode) input.inputMode = opts.inputmode;
    var go = document.createElement("button"); go.type = "submit"; go.setAttribute("aria-label", "Send"); go.textContent = "→";
    form.append(input, go);
    var err = document.createElement("div"); err.className = "err"; err.setAttribute("role", "alert");
    act.append(form, err);
    if (opts.skip) {
      var sk = document.createElement("div"); sk.className = "choices";
      var sb = document.createElement("button"); sb.type = "button"; sb.textContent = opts.skip;
      sb.addEventListener("click", function () { clearAct(); me(opts.skip); opts.done(""); });
      sk.appendChild(sb); act.appendChild(sk);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim(), problem = opts.check ? opts.check(v) : (v ? "" : "Type something first.");
      if (problem) { err.textContent = problem; input.focus(); return; }
      clearAct(); me(opts.echo ? opts.echo(v) : v); opts.done(v);
    });
    if (!bot.hidden) input.focus({ preventScroll: true });
  }

  // ---------- the conversation ----------
  function start() {
    if (store.get(DONE_KEY)) {
      say("Welcome back! You're already on the early-access list.").then(function () {
        return say("We'll email you as soon as your kingdom is ready.");
      }).then(function () { choices([{ label: "Back to the kingdom", go: close }]); });
      return;
    }
    say("Hi, I'm the Steward of Ledgerlands.").then(function () {
      return say("We turn your investments into a living kingdom, so money finally feels easy. Curious?");
    }).then(function () {
      choices([
        { label: "Yes, tell me more", primary: true, go: pitch },
        { label: "Just looking around", go: browsing }
      ]);
    });
  }
  function browsing() {
    say("No problem. Scroll to fly over the kingdom. I'll be right here if you want in.").then(function () {
      choices([{ label: "Actually, I'm interested", primary: true, go: pitch }]);
    });
  }
  function pitch() {
    say("Every holding becomes a building. Stocks raise towers, funds open halls, gold digs a mine.").then(function () {
      return say("When something moves, I explain why, in plain words.");
    }).then(function () {
      return say("We're letting a small group in first. Want a spot?");
    }).then(function () {
      choices([
        { label: "Yes, I want early access", primary: true, go: askName },
        { label: "Not right now", go: later }
      ]);
    });
  }
  function later() {
    say("Fair enough. Tap me any time if you change your mind.").then(function () {
      choices([{ label: "I changed my mind", primary: true, go: askName }]);
    });
  }
  function askName() {
    say("Wonderful. What should I call you?").then(function () {
      ask({ label: "Your name", placeholder: "Your first name", autocomplete: "given-name", max: 60,
        check: function (v) { return v.length < 1 ? "Tell me your name first." : ""; },
        done: function (v) { data.name = v; askEmail(); } });
    });
  }
  function askEmail() {
    say("Nice to meet you, " + data.name + ". What's your email? That's where your invite will go.").then(function () {
      ask({ label: "Your email", type: "email", placeholder: "you@example.com", autocomplete: "email", inputmode: "email", max: 120,
        check: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "That email doesn't look right. Check it and try again."; },
        done: function (v) { data.email = v.toLowerCase(); askPhone(); } });
    });
  }
  function askPhone() {
    say("Want a text when your spot opens? Add your phone number with the country code, or skip.").then(function () {
      ask({ label: "Your phone number", type: "tel", placeholder: "+1 555 123 4567", autocomplete: "tel", inputmode: "tel", max: 24, skip: "Skip",
        check: function (v) { var d = v.replace(/[^\d]/g, ""); return /^\+?[\d\s().-]+$/.test(v) && d.length >= 7 && d.length <= 15 ? "" : "Use digits, spaces or dashes, with 7 to 15 numbers."; },
        done: function (v) { data.phone = v; askInvests(); } });
    });
  }
  function askInvests() {
    say("Last one: what do you invest in today? Pick any.").then(function () {
      clearAct();
      var box = document.createElement("div"); box.className = "choices"; box.setAttribute("role", "group"); box.setAttribute("aria-label", "What you invest in");
      ["Stocks", "Funds and ETFs", "Crypto", "Gold", "Bonds", "Just getting started"].forEach(function (k) {
        var b = document.createElement("button"); b.type = "button"; b.textContent = k; b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); });
        box.appendChild(b);
      });
      var next = document.createElement("div"); next.className = "choices";
      var nb = document.createElement("button"); nb.type = "button"; nb.className = "primary"; nb.textContent = "Continue";
      nb.addEventListener("click", function () {
        data.invests = Array.prototype.slice.call(box.querySelectorAll('[aria-pressed="true"]')).map(function (b) { return b.textContent; });
        clearAct(); me(data.invests.length ? data.invests.join(", ") : "Rather not say"); confirmStep();
      });
      next.appendChild(nb);
      act.append(box, next);
    });
  }
  function confirmStep() {
    var summary = data.name + " · " + data.email + (data.phone ? " · " + data.phone : "");
    say("Here's what I'll save for your invite:", summary).then(function () {
      clearAct();
      var lab = document.createElement("label"); lab.className = "consent";
      var cb = document.createElement("input"); cb.type = "checkbox";
      lab.append(cb, document.createTextNode("Ledgerlands may contact me about early access. My details won't be shared or sold."));
      var err = document.createElement("div"); err.className = "err"; err.setAttribute("role", "alert");
      var row = document.createElement("div"); row.className = "choices";
      var go = document.createElement("button"); go.type = "button"; go.className = "primary"; go.textContent = "Join the early-access list";
      var edit = document.createElement("button"); edit.type = "button"; edit.textContent = "Start over";
      row.append(go, edit);
      act.append(lab, row, err);
      edit.addEventListener("click", function () { clearAct(); me("Start over"); data = { name: "", email: "", phone: "", invests: [] }; askName(); });
      go.addEventListener("click", function () {
        if (!cb.checked) { err.textContent = "Tick the box so we're allowed to email you."; cb.focus(); return; }
        clearAct(); me("Join the early-access list"); submit();
      });
    });
  }
  function submit() {
    var dots = document.createElement("div"); dots.className = "typing"; dots.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(dots); scroll();
    fetch("/api/early-access", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone, invests: data.invests, consent: true, website: "" })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        dots.remove();
        if (!res.ok) throw new Error(res.j && res.j.error || "save failed");
        store.set(DONE_KEY, "1");
        return say("You're on the list, " + data.name + "!").then(function () {
          return say("Watch your inbox at " + data.email + ". Your kingdom is waiting.");
        }).then(function () { choices([{ label: "Back to the kingdom", primary: true, go: close }]); });
      })
      .catch(function () {
        dots.remove();
        say("Hmm, I couldn't save that just now. Check your connection and try again.").then(function () {
          choices([{ label: "Try again", primary: true, go: submit }]);
        });
      });
  }
})();
