"use strict";

const REFRESH_INTERVAL_MS = 2000;
const BOARD_DISCLAIMER = "This page shows recorded updates. It cannot tell whether someone is working right now.";
const VIEW_COPY = {
  now: { title: "Now", kicker: "What this board currently shows" },
  queue: { title: "Queue", kicker: "Work waiting to be picked up" },
  results: { title: "Finished work", kicker: "Finished work and review decisions" },
  defects: { title: "Problems", kicker: "Problems and their status" },
  snapshots: { title: "Saved comparisons", kicker: "What changed between two recorded board captures" },
};

function initialView() {
  const requested = new URLSearchParams(window.location.search).get("view");
  return Object.hasOwn(VIEW_COPY, requested) ? requested : "now";
}

const PLAIN_LABELS = {
  accepted: "Reviewed",
  available: "Available",
  claimed: "In progress",
  defect_recorded: "Problem recorded",
  dismissed: "Closed",
  fixed: "Fixed",
  fresh: "Updated recently",
  never_reported: "No update yet",
  needs_attention: "Needs attention",
  needs_review: "Needs review",
  open: "Open",
  progress_reported: "Update recorded",
  queued: "Waiting to start",
  repair_requested: "Needs changes",
  stale: "Update may be out of date",
  submitted: "Waiting for review",
  unavailable: "Could not be checked",
};

const EMPTY_SNAPSHOT = {
  now: null,
  service_state: "unknown",
  tasks: [],
  defects: [],
  events: [],
};

const EMPTY_JOURNAL = {
  service_state: "unknown",
  snapshots: [],
  unreadable_snapshot_names: [],
};

// A contract-shaped development fixture. It is intentionally never rendered as
// live data; the board only renders data returned by /api/snapshot.
const MOCK_SNAPSHOT = {
  now: "2026-09-19T15:00:00Z",
  service_state: "available",
  tasks: [],
  defects: [],
  events: [],
};
void MOCK_SNAPSHOT;

const elements = {
  content: document.getElementById("view-content"),
  disclaimer: document.getElementById("view-disclaimer"),
  eventCount: document.getElementById("event-count"),
  eventList: document.getElementById("event-list"),
  history: document.getElementById("history"),
  lastRefreshed: document.getElementById("last-refreshed"),
  refreshError: document.getElementById("refresh-error"),
  serviceState: document.getElementById("service-state"),
  viewKicker: document.getElementById("view-kicker"),
  viewTitle: document.getElementById("view-title"),
};

let activeView = initialView();
let snapshot = EMPTY_SNAPSHOT;
let journal = EMPTY_JOURNAL;
let journalComparison = null;
let selectedBefore = "";
let selectedAfter = "";
let lastRefreshAt = null;
let refreshError = "";
// Progressive-disclosure state survives the 2-second refresh.
const openDetails = new Set();
let showAllEvents = false;
let lastRenderKey = "";
const EVENTS_SHOWN = 8;

function element(tagName, className) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  return node;
}

function text(node, value) {
  node.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
  return node;
}

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(date);
}

function label(value) {
  const normalized = String(value || "unknown");
  return PLAIN_LABELS[normalized] || normalized.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stateClass(value) {
  return `state-${String(value || "unknown").replace(/[^a-z0-9_-]/gi, "")}`;
}

function statusBadge(value) {
  const badge = element("span", `badge ${stateClass(value)}`);
  return text(badge, label(value));
}

function field(labelText, value) {
  const wrapper = element("div", "field");
  const labelNode = element("dt");
  const valueNode = element("dd");
  text(labelNode, labelText);
  if (value instanceof Node) valueNode.append(value);
  else text(valueNode, value);
  wrapper.append(labelNode, valueNode);
  return wrapper;
}

function artifactValue(task) {
  if (task.artifact_state !== "available") {
    if (task.artifact_state === "missing" || task.artifact_path) return "Artifact missing or unavailable.";
    return "No artifact recorded.";
  }
  const link = element("a", "artifact-link");
  link.href = `/artifacts/tasks/${encodeURIComponent(task.id)}`;
  link.target = "_blank";
  link.rel = "noopener";
  link.dataset.focusKey = `artifact:${task.id}`;
  text(link, `Open ${task.id} artifact`);
  return link;
}

function reportingValue(task) {
  const state = task.reporting_state || "never_reported";
  const detail = task.last_reported_at ? formatDate(task.last_reported_at) : "Never reported";
  const wrap = element("span", "reporting");
  wrap.append(statusBadge(state), document.createTextNode(` ${detail}`));
  return wrap;
}

function shortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function relativeTime(value) {
  if (!value) return "never";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return String(value);
  const reference = snapshot.now ? new Date(snapshot.now).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((reference - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function timeNode(value, prefix) {
  const node = element("time");
  if (value) {
    node.dateTime = value;
    node.title = formatDate(value);
  }
  return text(node, [prefix, relativeTime(value)].filter(Boolean).join(" "));
}

function eventsFor(taskId) {
  const events = Array.isArray(snapshot.events) ? snapshot.events : [];
  return events.filter((event) => event.task_id === taskId);
}

function openDefectsFor(taskId) {
  const defects = Array.isArray(snapshot.defects) ? snapshot.defects : [];
  return defects.filter((defect) => defect.task_id === taskId && defect.state === "open");
}

// A disclosure whose open state is remembered by key across refreshes.
function disclosure(key, summaryText, className) {
  const details = element("details", className);
  details.open = openDetails.has(key);
  details.addEventListener("toggle", () => {
    if (details.open) openDetails.add(key);
    else openDetails.delete(key);
  });
  const summary = element("summary");
  summary.dataset.focusKey = `summary:${key}`;
  text(summary, summaryText);
  details.append(summary);
  return details;
}

function eventItem(event, withTask) {
  const item = element("li", "event");
  const detail = element("p");
  const prefix = [label(event.kind), withTask && event.task_id ? `· ${event.task_id}` : "", event.actor ? `· ${event.actor}` : ""].filter(Boolean).join(" ");
  text(detail, `${prefix}${event.detail ? ` — ${event.detail}` : ""}`);
  const time = element("time");
  time.dateTime = event.at || "";
  time.title = relativeTime(event.at);
  text(time, shortDate(event.at));
  item.append(time, detail);
  return item;
}

// One task as a compact card: the essentials stay visible, and the full record
// and its update trail open on demand.
function taskCard(task, noteSource) {
  const card = element("article", `task-card card-${stateClass(task.state).slice(6)}`);
  const head = element("header", "card-head");
  head.append(text(element("span", "task-id"), task.id), statusBadge(task.state));
  const question = text(element("p", "card-question"), task.diagnostic_question);
  question.title = task.diagnostic_question || "";

  const meta = element("p", "card-meta");
  meta.append(text(element("span", "card-assignee"), task.assignee || "Unassigned"));
  const [verb, stamp] = currentActivity(task);
  if (stamp) meta.append(timeNode(stamp, verb));
  if (task.state === "claimed" && ["stale", "never_reported"].includes(task.reporting_state)) {
    meta.append(statusBadge(task.reporting_state));
  }
  const problems = openDefectsFor(task.id).length;
  if (problems) meta.append(text(element("span", "badge state-open"), `${problems} open ${problems === 1 ? "problem" : "problems"}`));
  card.append(head, question, meta);

  const trail = eventsFor(task.id);
  const noteText = noteSource === "review" || (task.state === "repair_requested" && task.review_note)
    ? task.review_note
    : (trail.find((event) => event.kind === "progress_reported") || {}).detail;
  if (noteText) {
    const note = text(element("p", "card-note"), noteText);
    note.title = noteText;
    card.append(note);
  }

  const more = disclosure(`task:${task.id}`, "Details", "card-more");
  const facts = element("dl", "facts");
  facts.append(
    field("Scope", task.scope),
    field("Acceptance", task.acceptance),
    field("Stop condition", task.stop_condition || "Not recorded"),
    field("Reviewer", task.reviewer || "Not recorded"),
    field("Specialty", task.specialty),
    field("Last update", reportingValue(task)),
    field("Started", formatDate(task.claimed_at)),
    field("Sent for review", formatDate(task.submitted_at)),
    field("Reviewed", formatDate(task.reviewed_at)),
    field("Artifact", artifactValue(task)),
  );
  if (task.review_note && noteSource !== "review") facts.append(field("Review note", task.review_note));
  more.append(facts);
  if (trail.length) {
    const list = element("ol", "event-list card-trail");
    trail.forEach((event) => list.append(eventItem(event, false)));
    more.append(text(element("h3", "card-trail-title"), `Updates for this task (${trail.length})`), list);
  }
  card.append(more);
  return card;
}

function cardGrid(tasks, noteSource) {
  const grid = element("div", "card-grid");
  tasks.forEach((task) => grid.append(taskCard(task, noteSource)));
  return grid;
}

// What the task's current state last did, as [verb, timestamp, sequence].
// Fields from earlier cycles persist across repair loops and timestamps are
// whole seconds, so read the newest matching event (events arrive newest
// first) and fall back to the task fields only when no event is present.
const ACTIVITY = {
  accepted: [["accepted", "reviewed"]],
  repair_requested: [["repair_requested", "changes requested"]],
  submitted: [["submitted", "sent for review"]],
  claimed: [["claimed", "started"], ["progress_reported", "updated"]],
};

function currentActivity(task) {
  const kinds = ACTIVITY[task.state];
  if (!kinds) return ["waiting", null, -1];
  const verbs = Object.fromEntries(kinds);
  const latest = eventsFor(task.id).find((event) => Object.hasOwn(verbs, event.kind));
  if (latest) return [verbs[latest.kind], latest.at, Number(latest.sequence) || 0];
  const fallback = task.state === "claimed"
    ? (task.last_reported_at > (task.claimed_at || "") ? ["updated", task.last_reported_at] : ["started", task.claimed_at])
    : [kinds[0][1], task.state === "submitted" ? task.submitted_at : task.reviewed_at];
  return [...fallback, -1];
}

function byRecentUpdate(a, b) {
  const [, stampA, sequenceA] = currentActivity(a);
  const [, stampB, sequenceB] = currentActivity(b);
  if (sequenceA >= 0 && sequenceB >= 0) return sequenceB - sequenceA;
  return (stampB || "").localeCompare(stampA || "");
}

// A collapsible group of cards, open the first time it appears.
function cardGroup(key, title, tasks, noteSource) {
  if (!tasks.length) return document.createDocumentFragment();
  const groupKey = `group:${key}`;
  if (!openDetails.has(`${groupKey}:seen`)) openDetails.add(`${groupKey}:seen`).add(groupKey);
  const group = disclosure(groupKey, `${title} (${tasks.length})`, "card-group");
  group.append(cardGrid(tasks, noteSource));
  return group;
}

function summaryStrip(tasks, defects) {
  const count = (state) => tasks.filter((task) => task.state === state).length;
  const items = [
    ["In progress", count("claimed"), "now", "state-claimed"],
    ["Needs changes", count("repair_requested"), "now", "state-repair_requested"],
    ["Waiting for review", count("submitted"), "results", "state-submitted"],
    ["Waiting to start", count("queued"), "queue", "state-queued"],
    ["Open problems", defects.filter((defect) => defect.state === "open").length, "defects", "state-open"],
  ];
  const strip = element("nav", "summary-strip");
  strip.setAttribute("aria-label", "Board totals");
  items.forEach(([name, value, view, cls]) => {
    const here = view === activeView;
    const item = element(here ? "div" : "button", `summary-item ${cls}${value ? "" : " is-zero"}${here ? " is-here" : ""}`);
    item.append(text(element("strong"), value), text(element("span"), name));
    if (!here) {
      item.type = "button";
      item.dataset.focusKey = `strip:${name}`;
      item.addEventListener("click", () => selectView(view));
    }
    strip.append(item);
  });
  return strip;
}

function emptyState(message) {
  const node = element("p", "empty-state");
  return text(node, message);
}

function selectView(view) {
  activeView = view;
  lastRenderKey = "";
  render();
}

function restingState(tasks) {
  const awaitingReview = tasks.filter((task) => task.state === "submitted");
  const fragment = document.createDocumentFragment();
  fragment.append(emptyState("No task is marked as in progress."));
  if (!awaitingReview.length) return fragment;

  const cue = element("aside", "resting-cue");
  cue.setAttribute("aria-label", "Finished work waiting for review");
  const summary = element("p");
  const count = awaitingReview.length;
  text(summary, `${count} finished ${count === 1 ? "item is" : "items are"} waiting for review.`);
  const resultsButton = element("button", "results-affordance");
  resultsButton.type = "button";
  text(resultsButton, `See finished work (${count})`);
  resultsButton.addEventListener("click", () => selectView("results"));
  cue.append(summary, resultsButton);
  fragment.append(cue);
  return fragment;
}

function renderNow(tasks, defects) {
  const fragment = document.createDocumentFragment();
  fragment.append(summaryStrip(tasks, defects));
  const current = tasks.filter((task) => ["claimed", "repair_requested"].includes(task.state));
  if (!current.length) {
    fragment.append(restingState(tasks));
    return fragment;
  }
  const needsChanges = current.filter((task) => task.state === "repair_requested").sort(byRecentUpdate);
  const inProgress = current.filter((task) => task.state === "claimed").sort(byRecentUpdate);
  fragment.append(cardGrid([...needsChanges, ...inProgress], "progress"));
  return fragment;
}

function renderResults(tasks) {
  const results = tasks.filter((task) => ["submitted", "accepted", "repair_requested"].includes(task.state));
  if (!results.length) return emptyState("No finished work has been recorded.");
  const fragment = document.createDocumentFragment();
  fragment.append(
    cardGroup("waiting", "Waiting for review", results.filter((task) => task.state === "submitted").sort(byRecentUpdate), "review"),
    cardGroup("repair", "Needs changes", results.filter((task) => task.state === "repair_requested").sort(byRecentUpdate), "review"),
    cardGroup("reviewed", "Reviewed", results.filter((task) => task.state === "accepted").sort(byRecentUpdate), "review"),
  );
  return fragment;
}

function renderDefects(defects) {
  if (!defects.length) return emptyState("No problems have been recorded.");
  const list = element("ul", "defect-list");
  defects.forEach((defect) => {
    const item = element("li", "defect");
    const title = element("div", "defect-title");
    text(title, defect.summary);
    const metadata = element("div", "defect-meta");
    metadata.append(statusBadge(defect.state), document.createTextNode(` Task: ${defect.task_id || "—"} · Reported: ${formatDate(defect.reported_at)}`));
    const disposition = element("p", "disposition");
    text(disposition, defect.disposition || "No disposition recorded.");
    item.append(title, metadata, disposition);
    list.append(item);
  });
  return list;
}

function summaryLine(summary) {
  const tasks = Number(summary?.task_count || 0);
  const defects = Number(summary?.defect_count || 0);
  const updates = Number(summary?.event_count || 0);
  return `${tasks} ${tasks === 1 ? "task" : "tasks"} · ${defects} ${defects === 1 ? "problem" : "problems"} · ${updates} ${updates === 1 ? "update" : "updates"}`;
}

function journalSelect(labelText, id, value) {
  const wrap = element("label", "journal-choice");
  wrap.htmlFor = id;
  text(wrap, labelText);
  const select = element("select");
  select.id = id;
  select.setAttribute("aria-label", labelText);
  select.append(new Option("Choose a saved capture", ""));
  journal.snapshots.forEach((entry) => {
    select.append(new Option(`${entry.name} — ${formatDate(entry.captured_at)}`, entry.name));
  });
  select.value = value;
  wrap.append(select);
  return { wrap, select };
}

function listOfIds(title, ids) {
  const section = element("section", "journal-change-group");
  const heading = element("h3");
  text(heading, title);
  section.append(heading);
  if (!ids.length) {
    section.append(emptyState("None recorded."));
    return section;
  }
  const list = element("ul", "journal-id-list");
  ids.forEach((id) => list.append(text(element("li"), id)));
  section.append(list);
  return section;
}

function changeList(title, records) {
  const section = element("section", "journal-change-group");
  const heading = element("h3");
  text(heading, title);
  section.append(heading);
  if (!records.length) {
    section.append(emptyState("None recorded."));
    return section;
  }
  const list = element("ul", "journal-id-list");
  records.forEach((record) => list.append(text(element("li"), `${record.id}: ${record.changed_fields.map(label).join(", ")}`)));
  section.append(list);
  return section;
}

function comparisonCard(comparison) {
  const card = element("article", "journal-comparison");
  card.append(text(element("p", "journal-boundary"), "Recorded changes, not an explanation. This view compares stored board metadata; it does not establish research evidence, a connection, a money flow, an identity, or live activity."));
  const facts = element("dl", "facts");
  facts.append(
    field("Earlier capture", formatDate(comparison.before_captured_at)),
    field("Later capture", formatDate(comparison.after_captured_at)),
    field("Earlier totals", summaryLine(comparison.before_summary)),
    field("Later totals", summaryLine(comparison.after_summary)),
    field("First recorded new update", comparison.event_sequence.first_new ?? "None recorded"),
    field("Last recorded new update", comparison.event_sequence.last_new ?? "None recorded"),
  );
  card.append(facts);
  const changes = element("div", "journal-changes");
  changes.append(
    listOfIds("Tasks added", comparison.added_task_ids),
    listOfIds("Tasks removed", comparison.removed_task_ids),
    changeList("Tasks with recorded field changes", comparison.changed_tasks),
    listOfIds("Problems added", comparison.added_defect_ids),
    listOfIds("Problems removed", comparison.removed_defect_ids),
    changeList("Problems with recorded field changes", comparison.changed_defects),
  );
  card.append(changes);
  return card;
}

function renderSnapshots() {
  if (journal.service_state !== "available") return emptyState("Saved captures cannot be read because the board records are not available.");
  const fragment = document.createDocumentFragment();
  fragment.append(text(element("p", "journal-intro"), "A saved capture is a small, metadata-only record of the board at one moment. Choose two captures to see recorded differences. The board does not create captures from this page."));
  if (journal.unreadable_snapshot_names?.length) {
    fragment.append(text(element("p", "notice notice-error"), `Some saved captures could not be read: ${journal.unreadable_snapshot_names.join(", ")}.`));
  }
  if (!journal.snapshots.length) {
    fragment.append(emptyState("No saved captures yet. Use the local snapshot command to make a capture; this page remains read-only."));
    return fragment;
  }
  if (journal.snapshots.length === 1) {
    const firstCapture = journal.snapshots[0];
    fragment.append(emptyState(`First saved capture: ${firstCapture.name} — ${formatDate(firstCapture.captured_at)}. A later real capture is needed before this board can show recorded changes.`));
    return fragment;
  }
  const controls = element("form", "journal-controls");
  controls.noValidate = true;
  const before = journalSelect("Earlier capture", "journal-before", selectedBefore);
  const after = journalSelect("Later capture", "journal-after", selectedAfter);
  before.select.addEventListener("change", () => {
    selectedBefore = before.select.value;
    journalComparison = null;
  });
  after.select.addEventListener("change", () => {
    selectedAfter = after.select.value;
    journalComparison = null;
  });
  const compare = element("button", "journal-compare");
  compare.type = "submit";
  text(compare, "Show recorded changes");
  controls.append(before.wrap, after.wrap, compare);
  controls.addEventListener("submit", async (event) => {
    event.preventDefault();
    selectedBefore = before.select.value;
    selectedAfter = after.select.value;
    journalComparison = null;
    if (!selectedBefore || !selectedAfter) {
      render();
      return;
    }
    try {
      const response = await fetch(`/api/journal/compare?before=${encodeURIComponent(selectedBefore)}&after=${encodeURIComponent(selectedAfter)}`, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Comparison request failed (${response.status}).`);
      const payload = await response.json();
      journalComparison = payload.comparison || null;
    } catch (error) {
      refreshError = `Could not compare the saved captures: ${error instanceof Error ? error.message : "Unable to read the comparison."}`;
    }
    render();
  });
  fragment.append(controls);
  if (!selectedBefore || !selectedAfter) fragment.append(emptyState("Choose an earlier and a later capture to compare them."));
  else if (journalComparison) fragment.append(comparisonCard(journalComparison));
  else fragment.append(emptyState("Choose two captures, then select “Show recorded changes.”"));
  return fragment;
}

function renderContent() {
  const tasks = Array.isArray(snapshot.tasks) ? snapshot.tasks : [];
  const defects = Array.isArray(snapshot.defects) ? snapshot.defects : [];
  const queued = tasks.filter((task) => task.state === "queued");
  const content = activeView === "now" ? renderNow(tasks, defects)
    : activeView === "queue" ? (queued.length ? cardGrid(queued, "progress") : emptyState("No work is waiting to be picked up."))
    : activeView === "results" ? renderResults(tasks)
    : activeView === "defects" ? renderDefects(defects)
    : activeView === "snapshots" ? renderSnapshots()
    : renderNow(tasks, defects);
  elements.content.replaceChildren(content);
}

function renderEvents() {
  const events = Array.isArray(snapshot.events) ? snapshot.events : [];
  elements.eventCount.textContent = `${events.length} updates`;
  const shown = showAllEvents ? events : events.slice(0, EVENTS_SHOWN);
  const items = shown.map((event) => eventItem(event, true));
  if (!items.length) items.push(emptyState("No updates have been recorded."));
  if (events.length > EVENTS_SHOWN) {
    const more = element("li", "event-more");
    const button = element("button", "results-affordance");
    button.type = "button";
    button.dataset.focusKey = "events:toggle";
    text(button, showAllEvents ? "Show fewer updates" : `Show all ${events.length} updates`);
    button.addEventListener("click", () => {
      showAllEvents = !showAllEvents;
      lastRenderKey = "";
      render();
    });
    more.append(button);
    items.push(more);
  }
  elements.eventList.replaceChildren(...items);
}

function renderStatus() {
  elements.lastRefreshed.textContent = lastRefreshAt ? formatDate(lastRefreshAt) : "Never";
  const state = snapshot.service_state || "unknown";
  elements.serviceState.className = stateClass(state);
  elements.serviceState.dataset.state = state;
  elements.serviceState.textContent = label(state);
  elements.refreshError.hidden = !refreshError;
  elements.refreshError.textContent = refreshError;
}

function render() {
  const copy = VIEW_COPY[activeView];
  elements.viewTitle.textContent = copy.title;
  elements.viewKicker.textContent = copy.kicker;
  elements.disclaimer.textContent = copy.disclaimer || BOARD_DISCLAIMER;
  document.querySelectorAll(".nav-item").forEach((button) => {
    const selected = button.dataset.view === activeView;
    button.classList.toggle("is-active", selected);
    button.toggleAttribute("aria-current", selected);
  });
  renderStatus();
  elements.history.hidden = activeView === "snapshots";
  // Rebuilding the lists on every refresh would drop text selection and
  // focus, so rebuild only when the recorded data changes, or once a minute
  // so relative times advance.
  const key = renderKey();
  if (key === lastRenderKey) return;
  lastRenderKey = key;
  const focusKey = document.activeElement?.dataset?.focusKey;
  renderContent();
  renderEvents();
  if (focusKey) document.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
}

function renderKey() {
  const tasks = (snapshot.tasks || []).map(({ reported_age_seconds, ...task }) => task);
  const minute = snapshot.now ? String(snapshot.now).slice(0, 16) : "";
  return JSON.stringify([activeView, minute, tasks, snapshot.defects, snapshot.events, journal, journalComparison, selectedBefore, selectedAfter]);
}

async function refresh() {
  try {
    const response = await fetch("/api/snapshot", { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Snapshot request failed (${response.status}).`);
    const nextSnapshot = await response.json();
    if (!nextSnapshot || typeof nextSnapshot !== "object") throw new Error("Snapshot response was not an object.");
    snapshot = nextSnapshot;
    lastRefreshAt = new Date();
    refreshError = "";
  } catch (error) {
    snapshot = { ...snapshot, service_state: "disconnected" };
    refreshError = `Could not refresh this page: ${error instanceof Error ? error.message : "Unable to reach the service."}`;
  }
  if (activeView === "snapshots") {
    try {
      const response = await fetch("/api/journal/snapshots", { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Saved capture request failed (${response.status}).`);
      const nextJournal = await response.json();
      journal = nextJournal && typeof nextJournal === "object" ? nextJournal : EMPTY_JOURNAL;
    } catch (error) {
      journal = { ...EMPTY_JOURNAL, service_state: "unavailable" };
      refreshError = `Could not read saved captures: ${error instanceof Error ? error.message : "Unable to reach the service."}`;
    }
  }
  render();
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    selectView(button.dataset.view);
    if (button.dataset.view === "snapshots") refresh();
  });
});

render();
refresh();
window.setInterval(refresh, REFRESH_INTERVAL_MS);
