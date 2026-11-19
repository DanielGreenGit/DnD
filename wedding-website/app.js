/* =========================================================
   SETTINGS: edit these
   ========================================================= */
const CONFIG = {
  // Paste the Web App URL from Google Apps Script here (see README.md).
  // While it is empty the form runs in preview mode and nothing is saved.
  RSVP_ENDPOINT: "",

  RSVP_DEADLINE: "30 June 2027",
  DEFAULT_SEATS: 2,                 // party size allowed when the link has no personal invite
  WEDDING_START: "2027-08-04T16:00:00+10:00",
  WEDDING_END:   "2027-08-04T22:00:00+10:00",   // used only for calendar entries
  EVENT_TITLE: "Cathy & Daniel's Wedding",
  EVENT_PLACE: "Surf Suites, URBNSURF Sydney, Sydney Olympic Park NSW",
};

/* ---------------------------------------------------------
   Personal invites: ?i=<code> made by links.html
   (also accepts ?to=Name&seats=2)
   --------------------------------------------------------- */
function readInvite() {
  const q = new URLSearchParams(location.search);
  try {
    if (q.get("i")) {
      const b64 = q.get("i").replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(escape(atob(b64)));
      const d = JSON.parse(json);
      return { name: String(d.n || "").slice(0, 80), seats: clampSeats(d.s), code: q.get("i") };
    }
  } catch (e) { /* bad code, fall through to a generic invite */ }
  if (q.get("to")) return { name: q.get("to").slice(0, 80), seats: clampSeats(q.get("seats")), code: "" };
  return null;
}
function clampSeats(s) { const n = parseInt(s, 10); return n >= 1 && n <= 12 ? n : CONFIG.DEFAULT_SEATS; }

const invite = readInvite();
const seats = invite ? invite.seats : CONFIG.DEFAULT_SEATS;
const $ = (id) => document.getElementById(id);

/* ---------- envelope ---------- */
if (invite && invite.name) $("greeting").textContent = "Dear " + invite.name;

const intro = $("intro");
function openEnvelope() {
  if (intro.classList.contains("opening")) return;
  intro.classList.add("opening");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(() => {
    intro.classList.add("gone");
    document.body.classList.remove("locked");
    revealHero();
  }, reduce ? 50 : 1900);
}
$("envelope").addEventListener("click", openEnvelope);

/* ---------- scroll reveal ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

function revealHero() {
  document.querySelectorAll(".hero .reveal").forEach((el, i) => {
    setTimeout(() => el.classList.add("in"), 120 * i);
  });
  document.querySelectorAll(".reveal:not(.hero .reveal)").forEach((el) => io.observe(el));
}

/* ---------- nav shows after the hero ---------- */
const nav = $("nav");
const hero = document.querySelector(".hero");
new IntersectionObserver(([e]) => nav.classList.toggle("show", !e.isIntersecting), { threshold: 0.08 }).observe(hero);

/* ---------- countdown ---------- */
const target = new Date(CONFIG.WEDDING_START).getTime();
function tick() {
  let d = Math.max(0, target - Date.now());
  const days = Math.floor(d / 864e5); d -= days * 864e5;
  const h = Math.floor(d / 36e5); d -= h * 36e5;
  const m = Math.floor(d / 6e4); d -= m * 6e4;
  const s = Math.floor(d / 1e3);
  $("cd-days").textContent = days;
  $("cd-hours").textContent = String(h).padStart(2, "0");
  $("cd-mins").textContent = String(m).padStart(2, "0");
  $("cd-secs").textContent = String(s).padStart(2, "0");
}
tick(); setInterval(tick, 1000);

/* ---------- calendar links ---------- */
const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const start = utc(CONFIG.WEDDING_START), end = utc(CONFIG.WEDDING_END);
$("gcal").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent(CONFIG.EVENT_TITLE) +
  "&dates=" + start + "/" + end +
  "&location=" + encodeURIComponent(CONFIG.EVENT_PLACE) +
  "&details=" + encodeURIComponent("Ceremony begins at 4:00 pm. " + location.origin + location.pathname);
const ics = [
  "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cathy and Daniel//Wedding//EN",
  "BEGIN:VEVENT", "UID:cathy-daniel-20270804@wedding", "DTSTAMP:" + start,
  "DTSTART:" + start, "DTEND:" + end,
  "SUMMARY:" + CONFIG.EVENT_TITLE, "LOCATION:" + CONFIG.EVENT_PLACE.replace(/,/g, "\\,"),
  "DESCRIPTION:Ceremony begins at 4:00 pm.", "END:VEVENT", "END:VCALENDAR",
].join("\r\n");
$("ics").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

/* ---------- RSVP ---------- */
const form = $("rsvp-form");
$("rsvp-deadline").textContent = "Please respond by " + CONFIG.RSVP_DEADLINE;

if (invite) {
  if (invite.name) {
    $("rsvp-hello").textContent = "We've reserved " + (seats === 1 ? "a seat" : seats + " seats") + " for " + invite.name + ".";
    $("rsvp-hello").hidden = false;
    $("f-name").value = invite.name;
  }
  $("f-invite").value = invite.name || "";
}

const guestSel = $("f-guests");
for (let i = 1; i <= seats; i++) guestSel.add(new Option(i === 1 ? "Just me" : i + " guests", i));
guestSel.value = seats;
$("seats-hint").textContent = seats > 1 ? "We have reserved up to " + seats + " seats for you." : "";
$("seats-hint").hidden = seats <= 1;
if (seats === 1) guestSel.closest(".field").hidden = true;

function syncNames() { $("names-field").hidden = parseInt(guestSel.value, 10) < 2; }
guestSel.addEventListener("change", syncNames); syncNames();

form.addEventListener("change", (e) => {
  if (e.target.name === "attending") $("if-yes").hidden = e.target.value !== "Yes";
});

function showError(msg) { $("form-error").textContent = msg; $("form-error").hidden = !msg; }

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  const data = new FormData(form);
  if (data.get("website")) return;                       // a bot filled the hidden field
  if (!String(data.get("name") || "").trim()) { showError("Please tell us your name."); $("f-name").focus(); return; }
  if (!data.get("attending")) { showError("Please let us know whether you can join us."); return; }

  const yes = data.get("attending") === "Yes";
  if (!yes) { data.set("guests", "0"); data.delete("guestNames"); data.delete("dietary"); }
  data.delete("website");

  const btn = $("submit");
  btn.disabled = true; btn.textContent = "Sending…";
  try {
    if (CONFIG.RSVP_ENDPOINT) {
      await fetch(CONFIG.RSVP_ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
    } else {
      console.info("[RSVP preview] Not saved, because RSVP_ENDPOINT is empty:", Object.fromEntries(data));
      await new Promise((r) => setTimeout(r, 600));
    }
    const who = String(data.get("name")).trim();
    $("thanks-title").textContent = yes ? "Thank you" : "We'll miss you";
    $("thanks-text").textContent = yes
      ? who + ", your RSVP is in. We can't wait to celebrate with you on 4 August 2027."
      : who + ", thank you for letting us know. You'll be in our hearts on the day.";
    form.hidden = true; $("thanks").hidden = false;
    $("thanks").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    showError("Something went wrong sending your RSVP. Please check your connection and try again.");
  } finally {
    btn.disabled = false; btn.textContent = "Send RSVP";
  }
});

$("again").addEventListener("click", () => { $("thanks").hidden = true; form.hidden = false; });
