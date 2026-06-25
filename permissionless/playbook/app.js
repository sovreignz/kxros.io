const STORAGE_KEY = "permissionless-playbook-v1";

const diagnostic = [
  {
    id: "thesis",
    label: "Thesis Clarity",
    short: "Message",
    questions: [
      "I can explain my business in one clear sentence.",
      "My audience understands the core problem I solve.",
      "My content repeatedly reinforces a recognizable point of view.",
      "My offers feel connected to the same central thesis.",
      "People can easily refer the right customer to me.",
      "My positioning is meaningfully different from generic competitors.",
    ],
  },
  {
    id: "ownership",
    label: "Audience Ownership",
    short: "Ownership",
    questions: [
      "I consistently move social followers onto an email list or owned channel.",
      "I can contact my audience without depending on a social algorithm.",
      "I know where new subscribers came from.",
      "I segment subscribers based on interests or needs.",
      "My owned audience grows as a result of my content.",
      "I have a repeatable lead capture system.",
    ],
  },
  {
    id: "offers",
    label: "Offer Architecture",
    short: "Offers",
    questions: [
      "My offers solve different stages of the same customer journey.",
      "Each offer has a clear buyer and outcome.",
      "Customers understand what they should buy first.",
      "Customers understand what they should buy next.",
      "My lower-priced offers support rather than undermine premium offers.",
      "I can explain my offer ecosystem visually.",
    ],
  },
  {
    id: "conversion",
    label: "Conversion Infrastructure",
    short: "Conversion",
    questions: [
      "My content has clear calls to action.",
      "I use dedicated landing pages.",
      "I track opt-ins and purchases.",
      "Leads receive a follow-up sequence.",
      "Qualified prospects have a clear booking or buying path.",
      "My customer journey works without manual explanation from me.",
    ],
  },
  {
    id: "founder",
    label: "Founder Leverage",
    short: "Leverage",
    questions: [
      "My revenue does not depend entirely on live delivery.",
      "Important business processes are documented.",
      "My expertise exists in reusable formats.",
      "I am not the bottleneck in every customer interaction.",
      "My business can generate value while I am offline.",
      "Growth does not automatically create equal growth in workload.",
    ],
  },
  {
    id: "measurement",
    label: "Measurement",
    short: "Measurement",
    questions: [
      "I know my landing-page conversion rate.",
      "I know which content generates leads.",
      "I know which lead magnets generate buyers.",
      "I know the conversion rate of my main offers.",
      "I know where prospects leave the journey.",
      "I make decisions based on constraints rather than intuition alone.",
    ],
  },
  {
    id: "coherence",
    label: "Ecosystem Coherence",
    short: "Coherence",
    questions: [
      "My brand, message, products, services, and content support one another.",
      "My audience can move through my ecosystem without confusion.",
      "My tools and platforms are intentionally selected.",
      "My business feels like one system rather than disconnected projects.",
      "Each asset creates leverage for another asset.",
      "I know the next system my business needs.",
    ],
  },
];

const stages = [
  {
    id: "stage-1",
    number: "01",
    title: "See the Cage",
    outcome: "Diagnose where attention, buyers, platforms, offers, revenue, and founder energy are leaking leverage.",
    modules: [
      "The Permissionless Diagnostic",
      "Platform Dependency",
      "Message Fragmentation",
      "Offer Fragmentation",
      "Founder Dependency",
      "Revenue Leak Map",
      "Constraint Finder",
    ],
  },
  {
    id: "stage-2",
    number: "02",
    title: "Understand the Game",
    outcome: "Understand how attention becomes trust, how trust becomes movement, and how a connected ecosystem compounds.",
    modules: [
      "Attention Is Not Ownership",
      "The Translation Problem",
      "The Customer Journey",
      "Business Leverage",
      "The Value Ladder",
      "The Economics of Clarity",
      "The Permissionless Business Model",
    ],
  },
  {
    id: "stage-3",
    number: "03",
    title: "Build Leverage",
    outcome: "Turn expertise into a thesis, offers into an ecosystem, and attention into a measurable customer journey.",
    modules: [
      "Thesis Builder",
      "Audience Map",
      "Transformation Map",
      "Offer Architecture",
      "Owned Audience System",
      "Content-to-Conversion Map",
      "Funnel Blueprint",
      "Infrastructure Stack",
      "Metrics Command Center",
    ],
  },
  {
    id: "stage-4",
    number: "04",
    title: "Exit the Cage",
    outcome: "Create the blueprint, execution plan, elimination list, build order, operator rhythm, and next strategic move.",
    modules: [
      "Permissionless Blueprint",
      "30-Day Execution Plan",
      "Elimination List",
      "Build Order",
      "Weekly Operator Rhythm",
      "Expansion Map",
      "Final Score",
      "Next Strategic Move",
    ],
  },
];

const defaultState = {
  diagnostic: {},
  modules: {},
  notes: {
    thesis: "",
    audience: "",
    transformation: "",
    entryPoint: "",
    offerLadder: "",
    funnel: "",
    stack: "",
    metrics: "",
    dependency: "",
    leak: "",
    stopBuilding: "",
    nextMove: "",
  },
  manualConstraint: "",
};

let state = loadState();

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const save = document.getElementById("save-state");
  save.textContent = "Saved locally";
  save.classList.add("flash");
  window.setTimeout(() => save.classList.remove("flash"), 700);
  renderShell();
}

function categoryScore(category) {
  const answers = category.questions.map((_, index) => Number(state.diagnostic[`${category.id}-${index}`] || 3));
  const avg = answers.reduce((sum, value) => sum + value, 0) / answers.length;
  return Math.round(((avg - 1) / 4) * 100);
}

function allScores() {
  return diagnostic.map((category) => ({ ...category, score: categoryScore(category) }));
}

function overallScore() {
  const scores = allScores();
  return Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
}

function scoreStatus(score) {
  if (score <= 25) return "Captured";
  if (score <= 45) return "Visible but Fragile";
  if (score <= 65) return "Emerging Infrastructure";
  if (score <= 80) return "Owned and Expanding";
  return "Permissionless Architecture";
}

function weakestDimension() {
  return [...allScores()].sort((a, b) => a.score - b.score)[0];
}

function strongestDimension() {
  return [...allScores()].sort((a, b) => b.score - a.score)[0];
}

function currentConstraint() {
  if (state.manualConstraint) return state.manualConstraint;
  const weak = weakestDimension();
  const map = {
    thesis: "Message",
    ownership: "Lead Capture",
    offers: "Offer",
    conversion: "Conversion Path",
    founder: "Founder Capacity",
    measurement: "Measurement",
    coherence: "Tool Complexity",
  };
  return map[weak.id] || "Conversion Path";
}

function completedModules() {
  return Object.values(state.modules).filter(Boolean).length;
}

function totalModules() {
  return stages.reduce((sum, stage) => sum + stage.modules.length, 0);
}

function stageCompletion(stage) {
  const done = stage.modules.filter((module) => state.modules[`${stage.id}:${module}`]).length;
  return Math.round((done / stage.modules.length) * 100);
}

function icon(name) {
  return `<i data-lucide="${name}" aria-hidden="true"></i>`;
}

function renderShell() {
  const score = overallScore();
  document.getElementById("sidebar-score").textContent = `${score}%`;
  document.getElementById("sidebar-progress").style.width = `${score}%`;
}

function renderOverview() {
  const score = overallScore();
  const weak = weakestDimension();
  const strong = strongestDimension();
  document.getElementById("view-overview").innerHTML = `
    <div class="hero-grid">
      <section class="card">
        <p class="eyebrow">Dashboard Home</p>
        <h2>You do not need more disconnected tactics.</h2>
        <p class="lead">You need to identify the constraint limiting your business, clarify the path your customer should follow, and build infrastructure that allows your value to compound.</p>
        <div class="button-row">
          <button class="btn btn-primary" data-view="diagnostic">${icon("scan-line")} Continue Diagnostic</button>
          <button class="btn btn-secondary" data-view="blueprint">${icon("file-text")} View Blueprint</button>
        </div>
      </section>
      <section class="card dark-card">
        <p class="eyebrow">Permissionless Score</p>
        <div class="score-number">${score}</div>
        <h3>${scoreStatus(score)}</h3>
        <p class="muted">${score <= 45 ? "High expertise. Weak infrastructure. The fastest gains will come from closing ownership, conversion, and coherence gaps." : "Useful infrastructure is emerging. The next gains come from connecting assets and measuring constraints."}</p>
      </section>
    </div>

    <div class="grid four" style="margin-top:16px;">
      <article class="panel"><p class="eyebrow">Primary Constraint</p><h3>${currentConstraint()}</h3><p class="muted">The system currently limits movement here first.</p></article>
      <article class="panel"><p class="eyebrow">Strongest Dimension</p><h3>${strong.label}</h3><p class="muted">${strong.score}/100</p></article>
      <article class="panel"><p class="eyebrow">Weakest Dimension</p><h3>${weak.label}</h3><p class="muted">${weak.score}/100</p></article>
      <article class="panel"><p class="eyebrow">Blueprint</p><h3>${Math.round((completedModules() / totalModules()) * 100)}% Complete</h3><p class="muted">${completedModules()} of ${totalModules()} modules marked complete.</p></article>
    </div>

    <section class="panel" style="margin-top:16px;">
      <div class="two-col">
        <div>
          <p class="eyebrow">The Seven Permissionless Dimensions</p>
          <h2>Find the system gap.</h2>
          <p class="muted">The score is not a personality quiz. It is a business architecture readout: message, market, offers, ownership, conversion, delivery, leverage, measurement, and coherence.</p>
        </div>
        <div class="score-grid">${renderScoreRows()}</div>
      </div>
    </section>

    <section class="panel brass-card" style="margin-top:16px;">
      <p class="eyebrow">Today’s Strategic Move</p>
      <h2>${recommendedMove().title}</h2>
      <p class="lead">${recommendedMove().copy}</p>
      <button class="btn btn-primary" data-view="${recommendedMove().view}">${recommendedMove().button}</button>
    </section>

    <section class="panel" style="margin-top:16px;">
      <p class="eyebrow">Progress Pathway</p>
      <div class="grid four">${stages.map(renderStageCard).join("")}</div>
    </section>
  `;
}

function renderScoreRows() {
  return allScores().map((item) => `
    <div class="score-row">
      <strong>${item.short}</strong>
      <div class="bar"><span style="width:${item.score}%"></span></div>
      <span>${item.score}</span>
    </div>
  `).join("");
}

function recommendedMove() {
  const constraint = currentConstraint();
  const moves = {
    "Message": ["Clarify the thesis before adding more assets.", "Your first move is reducing explanation cost. Write the one-sentence thesis and the customer transformation it points toward.", "stage-3", "Open Thesis Builder"],
    "Lead Capture": ["Stop publishing without a destination.", "For the next seven days, every piece of content should point toward one owned entry point.", "stage-3", "Choose My Entry Point"],
    "Offer": ["Turn products into a path.", "Map your offers by customer stage so the buyer knows what to buy first and what comes next.", "stage-3", "Map Offer Ladder"],
    "Conversion Path": ["Build the bridge from attention to action.", "Your audience can discover you, but the next step is not clear enough or consistent enough.", "stage-3", "Build Funnel Blueprint"],
    "Founder Capacity": ["Systematize the repeated explanation.", "The founder should keep original judgment close and move repeated delivery into reusable assets.", "stage-4", "Open Build Order"],
    "Measurement": ["Track constraints, not vanity data.", "Choose the smallest metric set that reveals where people stop moving through the journey.", "stage-3", "Define Metrics"],
    "Tool Complexity": ["Simplify the operating stack.", "Too many disconnected tools create invisible drag. Name the core stack and remove the rest.", "stage-3", "Map Infrastructure Stack"],
  };
  const selected = moves[constraint] || moves["Conversion Path"];
  return { title: selected[0], copy: selected[1], view: selected[2], button: selected[3] };
}

function renderStageCard(stage) {
  const pct = stageCompletion(stage);
  return `
    <article class="path-step">
      <strong>Stage ${stage.number}</strong>
      <h3>${stage.title}</h3>
      <p class="muted">${stage.outcome}</p>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <p class="muted" style="margin-top:8px;">${pct}% complete</p>
    </article>
  `;
}

function renderDiagnostic() {
  document.getElementById("view-diagnostic").innerHTML = `
    <section class="panel">
      <p class="eyebrow">Permissionless Diagnostic</p>
      <h2>A business can appear successful while remaining structurally fragile.</h2>
      <p class="lead">Rate each statement from 1 to 5. The diagnostic measures the architecture underneath the visible result.</p>
      <div class="grid two">
        <div class="card dark-card">
          <p class="eyebrow">Overall Score</p>
          <div class="score-number">${overallScore()}</div>
          <h3>${scoreStatus(overallScore())}</h3>
        </div>
        <div class="card">
          <p class="eyebrow">Output</p>
          <p><strong>Strongest:</strong> ${strongestDimension().label}</p>
          <p><strong>Weakest:</strong> ${weakestDimension().label}</p>
          <p><strong>Primary constraint:</strong> ${currentConstraint()}</p>
        </div>
      </div>
    </section>
    <form class="diagnostic-form">${diagnostic.map(renderDiagnosticCategory).join("")}</form>
  `;
}

function renderDiagnosticCategory(category) {
  return `
    <section class="diagnostic-category">
      <div class="score-row">
        <h3>${category.label}</h3>
        <div class="bar"><span style="width:${categoryScore(category)}%"></span></div>
        <strong>${categoryScore(category)}</strong>
      </div>
      ${category.questions.map((question, index) => {
        const key = `${category.id}-${index}`;
        const value = state.diagnostic[key] || 3;
        return `
          <label class="question">
            <span>${question}</span>
            <span class="range-wrap">
              <input type="range" min="1" max="5" value="${value}" data-diagnostic="${key}">
              <strong>${value}</strong>
            </span>
          </label>
        `;
      }).join("")}
    </section>
  `;
}

function renderConstraint() {
  const constraints = ["Attention", "Relevance", "Message", "Lead Capture", "Trust", "Offer", "Conversion Path", "Delivery", "Retention", "Founder Capacity", "Measurement", "Tool Complexity"];
  document.getElementById("view-constraint").innerHTML = `
    <section class="panel">
      <p class="eyebrow">Current Constraint</p>
      <h2>Do not improve everything simultaneously.</h2>
      <p class="lead">The business is usually limited by one dominant constraint. The diagnostic currently points to <strong>${currentConstraint()}</strong>.</p>
      <div class="grid three">${constraints.map((item) => `<button class="card ${currentConstraint() === item ? "brass-card" : ""}" data-constraint="${item}"><h3>${item}</h3><p class="muted">${constraintCopy(item)}</p></button>`).join("")}</div>
    </section>
  `;
}

function constraintCopy(item) {
  const copy = {
    "Attention": "Not enough qualified awareness entering the system.",
    "Relevance": "The right people see you but do not recognize themselves.",
    "Message": "The thesis costs too much effort to understand.",
    "Lead Capture": "Rented attention is not becoming owned audience.",
    "Trust": "People understand the idea but do not yet believe the mechanism.",
    "Offer": "The next paid step is unclear or misaligned.",
    "Conversion Path": "Interest does not have a reliable path to action.",
    "Delivery": "The promise is too dependent on manual execution.",
    "Retention": "Results are not leading to continuation.",
    "Founder Capacity": "Growth adds equal or greater founder workload.",
    "Measurement": "Decisions are being made without constraint data.",
    "Tool Complexity": "The stack creates drag instead of leverage.",
  };
  return copy[item] || "";
}

function renderStage(stage) {
  const view = document.getElementById(`view-${stage.id}`);
  view.innerHTML = `
    <section class="panel ${stage.id === "stage-4" ? "dark-card" : ""}">
      <p class="eyebrow">Stage ${stage.number}</p>
      <h2>${stage.title}.</h2>
      <p class="lead">${stage.outcome}</p>
      <div class="bar"><span style="width:${stageCompletion(stage)}%"></span></div>
    </section>
    <section class="panel" style="margin-top:16px;">
      <h2>Modules</h2>
      <div class="module-list">${stage.modules.map((module) => renderModule(stage, module)).join("")}</div>
    </section>
    ${renderStageWorkspace(stage)}
  `;
}

function renderModule(stage, module) {
  const key = `${stage.id}:${module}`;
  return `
    <button class="module ${state.modules[key] ? "done" : ""}" data-module="${key}">
      <span class="check">${state.modules[key] ? icon("check") : ""}</span>
      <span><strong>${module}</strong><br><small class="muted">${moduleHelp(module)}</small></span>
      <span class="pill">${state.modules[key] ? "Complete" : "Mark"}</span>
    </button>
  `;
}

function moduleHelp(module) {
  if (module.includes("Diagnostic")) return "Measures the architecture underneath the visible result.";
  if (module.includes("Dependency")) return "Names what would break if rented platforms disappeared.";
  if (module.includes("Thesis")) return "Compresses the business into a clear strategic argument.";
  if (module.includes("Offer")) return "Turns products into a logical customer journey.";
  if (module.includes("Funnel")) return "Designs the sequence of decisions from content to action.";
  if (module.includes("Blueprint")) return "Generates the operating summary.";
  if (module.includes("30-Day")) return "Converts strategy into an execution sprint.";
  return "Capture the decision, output, or strategic asset for this module.";
}

function renderStageWorkspace(stage) {
  if (stage.id === "stage-1") {
    return workspace("Cage Map Inputs", [
      ["dependency", "Largest platform dependency", "If your largest platform disappeared tomorrow, what would stop functioning?"],
      ["leak", "Largest revenue leak", "Where do people most often stop moving through the customer journey?"],
      ["stopBuilding", "One system to stop building", "What are you building that is not connected to the main constraint?"],
    ]);
  }
  if (stage.id === "stage-2") {
    return workspace("Game Map Inputs", [
      ["entryPoint", "Intended owned channel", "Email list, diagnostic, scorecard, playbook, webinar, application, etc."],
      ["transformation", "Translation statement", "I help [person] move from [condition] to [desired condition] by [mechanism]."],
    ]);
  }
  if (stage.id === "stage-3") {
    return workspace("Leverage Builders", [
      ["thesis", "Business thesis", "[Desired result] does not require [common assumption]. It requires [new mechanism]."],
      ["audience", "Buyer reality map", "Who is the best-fit buyer, what already happened, and what proof do they need?"],
      ["offerLadder", "Offer ladder", "Signal → Entry → Activation → Transformation → Implementation → Expansion"],
      ["funnel", "Funnel blueprint", "Traffic → CTA → Landing page → Delivery → Follow-up → Offer → Ascension"],
      ["stack", "Infrastructure stack", "Domain, site, forms, email, checkout, booking, analytics, docs."],
      ["metrics", "Metrics command center", "Which numbers reveal where buyers stop moving?"],
    ]);
  }
  return workspace("Exit Plan", [
    ["nextMove", "Next strategic move", "What is the first system to build in the next 30 days?"],
  ]) + renderExecutionPlan();
}

function workspace(title, fields) {
  return `
    <section class="panel" style="margin-top:16px;">
      <p class="eyebrow">${title}</p>
      <div class="grid two">${fields.map(([id, label, placeholder]) => `
        <div class="field">
          <label for="${id}">${label}</label>
          <textarea id="${id}" data-note="${id}" placeholder="${placeholder}">${state.notes[id] || ""}</textarea>
        </div>
      `).join("")}</div>
    </section>
  `;
}

function renderExecutionPlan() {
  return `
    <section class="panel brass-card" style="margin-top:16px;">
      <p class="eyebrow">30-Day Build Order</p>
      <div class="grid three">
        <article><h3>Days 1-7</h3><p class="muted">Resolve the primary constraint: ${currentConstraint()}.</p></article>
        <article><h3>Days 8-21</h3><p class="muted">Build the smallest useful owned entry point and follow-up path.</p></article>
        <article><h3>Days 22-30</h3><p class="muted">Measure movement, remove friction, and prepare the next offer bridge.</p></article>
      </div>
    </section>
  `;
}

function renderVault() {
  document.getElementById("view-vault").innerHTML = `
    <section class="panel">
      <p class="eyebrow">Resource Vault</p>
      <h2>Reusable strategic assets.</h2>
      <p class="lead">These are the major resources this dashboard is structured to produce or support.</p>
      <div class="grid three">
        ${["Templates", "Worksheets", "Prompt Library", "Funnel Diagrams", "Checklists", "Definitions", "PDF Export", "Audit Prep", "Build Order"].map((item) => `
          <article class="card"><h3>${item}</h3><p class="muted">${vaultCopy(item)}</p></article>
        `).join("")}
      </div>
    </section>
  `;
}

function vaultCopy(item) {
  const copy = {
    "Templates": "Lead magnet, OTO, application, product page, and dashboard templates.",
    "Worksheets": "Business inventory, offer ladder, customer journey, and stack mapping.",
    "Prompt Library": "Prompts for thesis, translation, offer clarity, and email sequencing.",
    "Funnel Diagrams": "Lead magnet, OTO, application, and product ascension paths.",
    "Checklists": "Launch, tracking, owned audience, and infrastructure setup.",
    "Definitions": "Permissionless language and decision rules.",
    "PDF Export": "Blueprint export can be added as the next utility layer.",
    "Audit Prep": "What to gather before a Permissionless Audit.",
    "Build Order": "The 30-day path from diagnosis to infrastructure.",
  };
  return copy[item] || "";
}

function renderBlueprint() {
  document.getElementById("view-blueprint").innerHTML = `
    <section class="panel">
      <p class="eyebrow">Permissionless Blueprint</p>
      <h2>Your owned ecosystem summary.</h2>
      <p class="lead">This blueprint is generated from the diagnostic, stage progress, and saved answers in this dashboard.</p>
      <div class="button-row">
        <button class="btn btn-primary" id="copy-blueprint">${icon("copy")} Copy Blueprint</button>
        <button class="btn btn-secondary" id="reset-dashboard">${icon("rotate-ccw")} Reset Dashboard</button>
      </div>
    </section>
    <section class="panel" style="margin-top:16px;">
      <div class="blueprint-output" id="blueprint-output">${generateBlueprint()}</div>
    </section>
  `;
}

function generateBlueprint() {
  const scores = allScores().map((item) => `- ${item.label}: ${item.score}/100`).join("\n");
  return `THE PERMISSIONLESS PLAYBOOK BLUEPRINT

Permissionless Score: ${overallScore()}/100
Status: ${scoreStatus(overallScore())}
Primary Constraint: ${currentConstraint()}
Strongest Dimension: ${strongestDimension().label}
Weakest Dimension: ${weakestDimension().label}

Seven Dimensions:
${scores}

Cage Map:
- Largest dependency: ${state.notes.dependency || "Not defined yet"}
- Largest revenue leak: ${state.notes.leak || "Not defined yet"}
- One system to stop building: ${state.notes.stopBuilding || "Not defined yet"}

Game Map:
- Owned entry point: ${state.notes.entryPoint || "Not defined yet"}
- Translation statement: ${state.notes.transformation || "Not defined yet"}

Leverage Map:
- Thesis: ${state.notes.thesis || "Not defined yet"}
- Audience: ${state.notes.audience || "Not defined yet"}
- Offer ladder: ${state.notes.offerLadder || "Not defined yet"}
- Funnel blueprint: ${state.notes.funnel || "Not defined yet"}
- Infrastructure stack: ${state.notes.stack || "Not defined yet"}
- Metrics: ${state.notes.metrics || "Not defined yet"}

30-Day Execution Plan:
1. Days 1-7: Resolve the primary constraint: ${currentConstraint()}.
2. Days 8-21: Build the smallest useful owned entry point and follow-up path.
3. Days 22-30: Measure movement, remove friction, and prepare the next offer bridge.

Next Strategic Move:
${state.notes.nextMove || recommendedMove().title}`;
}

function setView(view) {
  document.querySelectorAll(".view").forEach((el) => el.classList.toggle("active", el.id === `view-${view}`));
  document.querySelectorAll(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.view === view));
  const titles = {
    overview: "Build the business architecture behind your freedom.",
    diagnostic: "Measure the architecture underneath the visible result.",
    constraint: "Find the constraint limiting the system.",
    "stage-1": "See the cage.",
    "stage-2": "Understand the game.",
    "stage-3": "Build leverage.",
    "stage-4": "Exit the cage.",
    vault: "Open the resource vault.",
    blueprint: "Generate the Permissionless Blueprint.",
  };
  document.getElementById("page-title").textContent = titles[view] || titles.overview;
  updateContext(view);
  history.replaceState(null, "", `#${view}`);
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateContext(view) {
  const map = {
    overview: ["Close the gaps.", "The business is losing value between attention, understanding, trust, action, transformation, and the next logical offer.", recommendedMove().title],
    diagnostic: ["Architecture before tactics.", "Revenue alone does not reveal whether a business is permissionless. The diagnostic measures the system underneath.", "Finish all seven diagnostic categories."],
    constraint: ["One constraint first.", "Do not improve everything simultaneously. Find the dominant constraint and build around it.", `Confirm whether ${currentConstraint()} is the real limiter.`],
    "stage-1": ["Visibility creates leverage.", "You cannot build freedom around constraints you have not named.", "Complete the Cage Map inputs."],
    "stage-2": ["Attention is not ownership.", "Attention is temporary access. Ownership is the ability to continue the relationship.", "Define the owned entry point."],
    "stage-3": ["Strategy becomes infrastructure.", "Turn thesis, audience, offers, funnels, stack, and metrics into a connected system.", "Draft the offer ladder and funnel blueprint."],
    "stage-4": ["Build order matters.", "The final output is a focused execution path, not a giant list of tactics.", "Name the next strategic move."],
    vault: ["Reusable assets compound.", "Templates, worksheets, diagrams, and prompts reduce future decision load.", "Choose the first asset to create."],
    blueprint: ["Export the operating summary.", "The blueprint is the strategic bridge into an audit, sprint, or internal build cycle.", "Copy the blueprint and use it as the next work order."],
  };
  const selected = map[view] || map.overview;
  document.getElementById("context-title").textContent = selected[0];
  document.getElementById("context-copy").textContent = selected[1];
  document.getElementById("context-action").textContent = selected[2];
}

function renderAll() {
  renderShell();
  renderOverview();
  renderDiagnostic();
  renderConstraint();
  stages.forEach(renderStage);
  renderVault();
  renderBlueprint();
  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener("click", async (event) => {
  const viewTrigger = event.target.closest("[data-view]");
  if (viewTrigger) {
    event.preventDefault();
    setView(viewTrigger.dataset.view);
    return;
  }

  const moduleTrigger = event.target.closest("[data-module]");
  if (moduleTrigger) {
    const key = moduleTrigger.dataset.module;
    state.modules[key] = !state.modules[key];
    saveState();
    renderAll();
    return;
  }

  const constraintTrigger = event.target.closest("[data-constraint]");
  if (constraintTrigger) {
    state.manualConstraint = constraintTrigger.dataset.constraint;
    saveState();
    renderAll();
    setView("constraint");
    return;
  }

  if (event.target.closest("#copy-blueprint")) {
    await navigator.clipboard.writeText(generateBlueprint());
    document.getElementById("save-state").textContent = "Blueprint copied";
  }

  if (event.target.closest("#reset-dashboard")) {
    if (confirm("Reset the saved Permissionless Playbook dashboard on this device?")) {
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      renderAll();
      setView("overview");
    }
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-diagnostic]")) {
    state.diagnostic[event.target.dataset.diagnostic] = Number(event.target.value);
    event.target.nextElementSibling.textContent = event.target.value;
    saveState();
    renderAll();
  }

  if (event.target.matches("[data-note]")) {
    state.notes[event.target.dataset.note] = event.target.value;
    saveState();
  }
});

document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

renderAll();
setView(location.hash.replace("#", "") || "overview");
