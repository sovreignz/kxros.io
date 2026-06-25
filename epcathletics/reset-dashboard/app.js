(() => {
  const data = window.HSE_DATA;
  const storageKey = data.storageKey;
  let deferredInstallPrompt = null;
  let pendingServiceWorker = null;

  const defaultState = {
    version: data.version,
    onboardingCompleted: false,
    onboardingStep: 0,
    currentDay: 1,
    startDate: "",
    reasons: [],
    strongestWhy: "",
    identityStatement: "",
    assessmentScores: {},
    afterAssessmentScores: {},
    priorityAreas: [],
    selectedWaterGoal: "",
    baselineWater: "",
    selectedStepGoal: "",
    baselineSteps: "",
    sleepTarget: "",
    selectedDailyHabits: [],
    agreementAccepted: false,
    agreementAcceptedAt: "",
    dailyCompletion: {},
    dailyHabitScores: {},
    journalEntries: {},
    cravingQuizResults: {},
    momentumQuizResults: {},
    mealBuilderSelections: {},
    workoutSelections: {},
    beforeAndAfterRatings: {},
    nextSevenDayAnchors: [],
    installedPromptDismissed: false,
    installEducationShown: false,
    lastVisitDate: "",
    totalCompletedActions: 0,
    streak: 0,
    completedDays: [],
    recommendedNextStep: "",
    recommendation: null,
    attribution: {},
    analyticsConsent: true,
    shoppingChecked: [],
    favoriteReframes: [],
  };

  const screens = {
    home: document.getElementById("screen-home"),
    plan: document.getElementById("screen-plan"),
    learn: document.getElementById("screen-learn"),
    tools: document.getElementById("screen-tools"),
    progress: document.getElementById("screen-progress"),
    settings: document.getElementById("screen-settings"),
  };

  const safeParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const loadState = () => {
    const stored = safeParse(localStorage.getItem(storageKey));
    if (!stored || typeof stored !== "object") return { ...defaultState };
    return migrateOldState({ ...defaultState, ...stored });
  };

  const saveState = () => {
    state.version = data.version;
    localStorage.setItem(storageKey, JSON.stringify(state));
    render();
  };

  const updateState = (patch) => {
    state = { ...state, ...patch };
    saveState();
  };

  const migrateOldState = (incoming) => {
    if (!incoming.version) incoming.version = data.version;
    data.days.forEach((day) => {
      if (!incoming.dailyHabitScores[day.day]) incoming.dailyHabitScores[day.day] = {};
    });
    return incoming;
  };

  let state = loadState();

  const captureAttribution = () => {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const existing = state.attribution || {};
    if (existing.firstVisitDate) return;
    const attribution = {
      firstVisitDate: new Date().toISOString(),
      firstLandingPage: window.location.href,
      referrer: document.referrer || "direct",
    };
    keys.forEach((key) => {
      if (params.get(key)) attribution[key] = params.get(key);
    });
    state.attribution = attribution;
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const trackEvent = (eventName, properties = {}) => {
    if (!state.analyticsConsent) return;
    const safeProperties = { ...properties };
    delete safeProperties.journal;
    delete safeProperties.note;
    delete safeProperties.freeText;
    console.info("[HSE analytics]", eventName, safeProperties);
  };

  const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;

  const setView = (view, push = true) => {
    Object.entries(screens).forEach(([key, element]) => element.classList.toggle("active", key === view));
    document.querySelectorAll("[data-nav]").forEach((el) => el.classList.toggle("active", el.dataset.nav === view));
    if (push && location.hash !== `#${view}`) history.pushState({ view }, "", `#${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackEvent("view_opened", { view });
  };

  const calculateDailyScore = (dayNumber) => {
    const dayScores = state.dailyHabitScores[dayNumber] || {};
    return data.habits.reduce((sum, habit) => sum + (dayScores[habit] ? 1 : 0), 0);
  };

  const calculateOverallProgress = () => {
    const possible = data.days.length * data.habits.length;
    const completed = data.days.reduce((sum, day) => sum + calculateDailyScore(day.day), 0);
    return possible ? Math.round((completed / possible) * 100) : 0;
  };

  const determineCurrentDay = () => {
    if (!state.startDate) return state.currentDay || 1;
    const start = new Date(`${state.startDate}T00:00:00`);
    const now = new Date(`${todayISO()}T00:00:00`);
    const diff = Math.floor((now - start) / 86400000) + 1;
    return Math.min(7, Math.max(1, diff));
  };

  const determineRecommendations = () => {
    const scores = state.assessmentScores || {};
    const nutrition = scores["Nutrition awareness"] || 5;
    const consistency = scores.Consistency || 5;
    const trust = scores["Trust in yourself"] || 5;
    const stress = scores["Stress management"] ? 11 - scores["Stress management"] : 5;
    const energy = scores.Energy || 5;
    const movement = scores["Daily movement"] || 5;
    const confidence = scores.Confidence || 5;
    const proteinOften = state.proteinFrequency === "Often";
    const context = { nutrition, consistency, trust, stress, energy, movement, confidence, proteinOften };

    const weighted = data.recommendationRules.map((rule) => {
      let score = 0;
      const checks = rule.checks || {};
      if (checks.consistencyMax && context.consistency <= checks.consistencyMax) score += 2;
      if (checks.trustMax && context.trust <= checks.trustMax) score += 2;
      if (checks.stressMin && context.stress >= checks.stressMin) score += 2;
      if (checks.nutritionMin && context.nutrition >= checks.nutritionMin) score += 1;
      if (checks.energyMax && context.energy <= checks.energyMax) score += 2;
      if (checks.proteinOften === false && !context.proteinOften) score += 2;
      if (checks.movementMax && context.movement <= checks.movementMax) score += 1;
      if (checks.confidenceMax && context.confidence <= checks.confidenceMax) score += 1;
      if (!Object.keys(checks).length) score += 1;
      return { ...rule, score };
    });

    return weighted.sort((a, b) => b.score - a.score)[0];
  };

  const completedDays = () => data.days.filter((day) => state.dailyCompletion[day.day]).map((day) => day.day);

  const recalculateMomentum = () => {
    state.currentDay = determineCurrentDay();
    state.completedDays = completedDays();
    state.totalCompletedActions = data.days.reduce((sum, day) => sum + calculateDailyScore(day.day), 0);
    let streak = 0;
    for (let i = state.currentDay; i >= 1; i -= 1) {
      if (calculateDailyScore(i) > 0) streak += 1;
      else break;
    }
    state.streak = streak;
  };

  const showToast = (message) => {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  };

  const renderHome = () => {
    recalculateMomentum();
    const current = data.days.find((day) => day.day === state.currentDay) || data.days[0];
    const progress = calculateOverallProgress();
    const greeting = state.onboardingCompleted
      ? `You are on Day ${state.currentDay}: ${current.theme}`
      : "You do not need another extreme plan.";
    const message = state.completedDays.length >= 7
      ? "You finished the reset. Now choose what you want to carry forward."
      : calculateDailyScore(Math.max(1, state.currentDay - 1)) > 0
        ? "You kept the promise yesterday. Let’s build on the evidence."
        : "One imperfect day does not erase your momentum. Continue from where you are.";

    screens.home.innerHTML = `
      <div class="hero">
        <div class="hero-copy">
          <div class="eyebrow"><span class="dot"></span> Seven-day kickstart dashboard</div>
          <h1 id="home-title" class="display">Your Strongest Era <span class="text-gradient">Kickstart Plan</span></h1>
          <p class="lead">${greeting}</p>
          <p class="muted">${state.onboardingCompleted ? message : "In seven days, establish a stronger baseline, understand your habits, and create enough momentum to believe lasting change is possible again."}</p>
          <div class="button-row">
            ${state.onboardingCompleted
              ? `<button class="btn btn-primary" data-action="continue-day">${icon("arrow-right")} Continue Today</button><button class="btn btn-secondary" data-nav="tools">${icon("wand-2")} Open Tools</button>`
              : `<button class="btn btn-primary" data-action="start-onboarding">${icon("sparkles")} Begin My Strongest Era</button><button class="btn btn-secondary" data-nav="learn">${icon("book-open")} Preview Lessons</button>`}
          </div>
          <p class="small muted" style="margin-top:18px;">Daily commitment: about 10-25 minutes. Progress does not require perfection.</p>
        </div>
        <div class="hero-card">
          <div class="hero-card-inner">
            <span class="badge">${state.onboardingCompleted ? state.recommendation?.label || "Personal plan ready" : "Awareness before restriction"}</span>
            <h2 class="display" style="color:white;margin-top:14px;">${state.onboardingCompleted ? current.focus : "One strong decision followed by another."}</h2>
            <div class="metric-grid">
              <div class="metric"><strong>${progress}%</strong><span>overall</span></div>
              <div class="metric"><strong>${state.streak}</strong><span>streak</span></div>
              <div class="metric"><strong>${state.totalCompletedActions}</strong><span>promises</span></div>
            </div>
          </div>
        </div>
      </div>
      ${state.onboardingCompleted ? renderDashboardPanels(current) : renderWelcomePanels()}
    `;
  };

  const renderWelcomePanels = () => `
    <div class="grid three" style="margin-top:16px;">
      <article class="card"><h3>${icon("heart")} Supportive</h3><p class="muted">No shaming, no punishment, no starting your entire life over.</p></article>
      <article class="card"><h3>${icon("target")} Practical</h3><p class="muted">Daily actions for hydration, protein, steps, movement, and self-trust.</p></article>
      <article class="card"><h3>${icon("shield-check")} Personal</h3><p class="muted">A short assessment creates your first focus and minimum viable habits.</p></article>
    </div>
  `;

  const renderDashboardPanels = (current) => `
    <div class="grid two" style="margin-top:16px;">
      <section class="panel">
        <div class="section-head">
          <div>
            <h2>Today’s Next Action</h2>
            <p class="muted">${current.purpose}</p>
          </div>
          <div class="ring" style="--pct:${Math.round((calculateDailyScore(current.day) / data.habits.length) * 100)}" data-label="${calculateDailyScore(current.day)}/9"></div>
        </div>
        <p><strong>${current.theme}:</strong> ${current.focus}</p>
        <div class="button-row">
          <button class="btn btn-primary" data-nav="plan">${icon("calendar-days")} Open Day ${current.day}</button>
          <button class="btn btn-secondary" data-action="quick-water">${icon("droplets")} Water Done</button>
          <button class="btn btn-secondary" data-action="quick-journal">${icon("pen-line")} Journal</button>
        </div>
      </section>
      <section class="panel">
        <h2>Your Recommendation</h2>
        ${renderRecommendation()}
      </section>
    </div>
  `;

  const renderOnboarding = () => {
    const step = state.onboardingStep || 0;
    const recommendation = state.recommendation || determineRecommendations();
    const steps = [
      renderReasonsStep,
      renderWhyStep,
      renderAssessmentStep,
      renderHabitsStep,
      () => renderRecommendationStep(recommendation),
      renderAgreementStep,
      renderStartDateStep,
    ];
    screens.home.innerHTML = `
      <section class="panel" style="margin-top:28px;">
        <div class="section-head">
          <div>
            <div class="eyebrow"><span class="dot"></span> Onboarding · Step ${step + 1} of ${steps.length}</div>
            <h1 id="home-title" class="display">Build your starting point.</h1>
          </div>
          <button class="btn btn-secondary" data-action="exit-onboarding">${icon("x")} Exit</button>
        </div>
        <div class="progress-bar" aria-label="Onboarding progress"><span style="--value:${((step + 1) / steps.length) * 100}%"></span></div>
        <div style="margin-top:22px;">${steps[step]()}</div>
      </section>
    `;
  };

  const renderReasonsStep = () => `
    <h2>What made you open this today?</h2>
    <p class="muted">Choose every answer that feels true.</p>
    <div class="choice-grid">${data.onboardingOptions.map((option) => `<button class="choice ${state.reasons.includes(option) ? "selected" : ""}" data-toggle-reason="${option}">${option}</button>`).join("")}</div>
    ${renderStepButtons()}
  `;

  const renderWhyStep = () => `
    <h2>What would becoming stronger change for you?</h2>
    <div class="field"><label for="strongestWhy">I want to begin my strongest era because...</label><textarea id="strongestWhy">${state.strongestWhy || ""}</textarea></div>
    <div class="field"><label for="identityStatement">The woman I am becoming is someone who...</label><textarea id="identityStatement">${state.identityStatement || ""}</textarea></div>
    ${renderStepButtons()}
  `;

  const renderAssessmentStep = () => `
    <h2>Starting Point Assessment</h2>
    <p class="muted">Rate each area from 1 to 10. This is information, not a judgment.</p>
    ${data.assessmentMetrics.map((metric) => slider(metric, state.assessmentScores[metric] || 5, "assessment")).join("")}
    ${renderStepButtons("assessment_completed")}
  `;

  const renderHabitsStep = () => `
    <h2>Current Habits</h2>
    <div class="grid two">
      ${field("baselineWater", "How much water do you usually drink?", "Example: 2 bottles, 60 oz, not sure")}
      ${field("baselineSteps", "Current average step count", "Example: 4,000")}
      ${field("workoutsPerWeek", "Intentional exercise per week", "Example: 2 times")}
      ${selectField("proteinFrequency", "Protein in main meals", ["Rarely", "Sometimes", "Often"])}
      ${selectField("trackingFood", "Do you currently track food?", ["No", "Sometimes", "Yes"])}
      ${selectField("topDisruptor", "Which issue disrupts you most?", ["Lack of time", "Low energy", "Cravings", "Stress", "Perfectionism", "Inconsistent schedule", "Not knowing what to do", "Emotional eating", "All-or-nothing thinking"])}
    </div>
    ${renderStepButtons()}
  `;

  const renderRecommendationStep = (recommendation) => `
    <h2>Your strongest first move is consistency, not intensity.</h2>
    <div class="card" style="background:#fff;">
      <span class="badge">${recommendation.label}</span>
      <h3 style="margin-top:14px;">${recommendation.focus}</h3>
      <p class="muted">${recommendation.secondary}</p>
      <p><strong>Recommended workout:</strong> ${recommendation.workout}</p>
      <p><strong>Start with:</strong> ${recommendation.habits.join(", ")}</p>
    </div>
    ${renderStepButtons("archetype_assigned")}
  `;

  const renderAgreementStep = () => {
    const commitments = [
      "I will not punish myself for what happened before today.",
      "I will not compensate for one meal by starving or overtraining.",
      "I will not abandon the week because one day was imperfect.",
      "I will focus on awareness before restriction.",
      "I will choose consistency over intensity.",
      "I will speak to myself like someone I am responsible for helping.",
      "I will measure success by promises kept, not perfection achieved.",
    ];
    return `
      <h2>The No-Extremes Agreement</h2>
      <div class="scorecard">${commitments.map((text) => `<div class="check-row checked"><span class="check-box">${icon("check")}</span><span>${text}</span></div>`).join("")}</div>
      <div class="button-row"><button class="btn btn-primary" data-action="accept-agreement">${icon("shield-check")} I Choose the No-Extremes Approach</button></div>
      <div class="button-row"><button class="btn btn-secondary" data-action="prev-step">${icon("arrow-left")} Back</button></div>
    `;
  };

  const renderStartDateStep = () => `
    <h2>When do you want to start?</h2>
    <div class="choice-grid">
      <button class="choice" data-start-date="${todayISO()}">Start today</button>
      <button class="choice" data-start-date="${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}">Start tomorrow</button>
    </div>
    <div class="field" style="margin-top:14px;"><label for="customStartDate">Choose a date</label><input type="date" id="customStartDate" value="${state.startDate || todayISO()}"></div>
    <div class="button-row"><button class="btn btn-primary" data-action="finish-onboarding">${icon("check-circle-2")} Start My Plan</button><button class="btn btn-secondary" data-action="prev-step">${icon("arrow-left")} Back</button></div>
  `;

  const renderStepButtons = (eventName = "") => `
    <div class="button-row">
      ${state.onboardingStep > 0 ? `<button class="btn btn-secondary" data-action="prev-step">${icon("arrow-left")} Back</button>` : ""}
      <button class="btn btn-primary" data-action="next-step" data-track="${eventName}">Continue ${icon("arrow-right")}</button>
    </div>
  `;

  const field = (id, label, placeholder) => `<div class="field"><label for="${id}">${label}</label><input id="${id}" value="${state[id] || ""}" placeholder="${placeholder}"></div>`;
  const selectField = (id, label, options) => `<div class="field"><label for="${id}">${label}</label><select id="${id}">${options.map((option) => `<option ${state[id] === option ? "selected" : ""}>${option}</option>`).join("")}</select></div>`;
  const slider = (metric, value, group) => `<div class="slider-row"><label for="${group}-${metric}">${metric}</label><input id="${group}-${metric}" type="range" min="1" max="10" value="${value}" data-slider-group="${group}" data-metric="${metric}"><strong>${value}</strong></div>`;

  const renderPlan = () => {
    const selected = Number(sessionStorage.getItem("hse-selected-day") || state.currentDay || 1);
    const day = data.days.find((item) => item.day === selected) || data.days[0];
    screens.plan.innerHTML = `
      <div class="section-head">
        <div><div class="eyebrow"><span class="dot"></span> My Plan</div><h1 id="plan-title" class="display">Day ${day.day}: <span class="text-gradient">${day.theme}</span></h1><p class="lead">${day.purpose}</p></div>
        <div class="ring" style="--pct:${Math.round((calculateDailyScore(day.day) / data.habits.length) * 100)}" data-label="${calculateDailyScore(day.day)}/9"></div>
      </div>
      <div class="grid two">
        <aside class="panel"><h3>Seven Days</h3><div class="day-nav">${data.days.map((item) => `<button class="day-link ${item.day === day.day ? "active" : ""}" data-day="${item.day}"><span>Day ${item.day}: ${item.theme}</span><span>${calculateDailyScore(item.day)}/9</span></button>`).join("")}</div></aside>
        <section class="panel stack">
          <div><h2>${day.focus}</h2><p class="muted">${day.proof}</p></div>
          <div class="grid two">
            <div class="card"><h3>${icon("dumbbell")} Physical Action</h3><p class="muted">${day.physical}</p></div>
            <div class="card"><h3>${icon("utensils")} Nutrition Action</h3><p class="muted">${day.nutrition}</p></div>
          </div>
          <div class="card"><h3>${icon("sparkles")} Reframe</h3><p>${day.reframe}</p></div>
          <div class="field"><label for="journal-${day.day}">Journal Prompt: ${day.journal}</label><textarea id="journal-${day.day}" data-journal="${day.day}">${state.journalEntries[day.day] || ""}</textarea></div>
          <div><h3>Daily Scorecard</h3><p class="muted"><strong>Your goal is not a perfect score.</strong> Your goal is to avoid zero days.</p><div class="scorecard">${data.habits.map((habit) => renderHabitRow(day.day, habit)).join("")}</div></div>
          <div class="button-row"><button class="btn btn-primary" data-complete-day="${day.day}">${icon("check-circle-2")} Complete Day ${day.day}</button><button class="btn btn-secondary" data-nav="learn">${icon("book-open")} Learn: ${day.lesson}</button></div>
        </section>
      </div>
    `;
  };

  const renderHabitRow = (day, habit) => {
    const checked = state.dailyHabitScores[day]?.[habit];
    return `<button class="check-row ${checked ? "checked" : ""}" data-habit-day="${day}" data-habit="${habit}"><span class="check-box">${checked ? icon("check") : ""}</span><span>${habit}</span></button>`;
  };

  const renderLearn = () => {
    const selected = sessionStorage.getItem("hse-selected-lesson") || data.lessons[0].id;
    const lesson = data.lessons.find((item) => item.id === selected) || data.lessons[0];
    screens.learn.innerHTML = `
      <div class="section-head"><div><div class="eyebrow"><span class="dot"></span> Learn</div><h1 id="learn-title" class="display">${lesson.title}</h1><p class="lead">Short lessons that turn awareness into action.</p></div></div>
      <div class="grid two">
        <aside class="panel"><h3>Lesson Library</h3><div class="lesson-nav">${data.lessons.map((item) => `<button class="lesson-link ${item.id === lesson.id ? "active" : ""}" data-lesson="${item.id}"><span>${item.title}</span>${icon("chevron-right")}</button>`).join("")}</div></aside>
        <section class="panel">
          <h2>${lesson.title}</h2>
          <div class="stack">${lesson.points.map((point) => `<div class="check-row checked"><span class="check-box">${icon("check")}</span><span>${point}</span></div>`).join("")}</div>
          <div class="card" style="margin-top:16px;"><h3>Key Takeaway</h3><p>${lesson.takeaway}</p><p class="muted"><strong>Immediate action:</strong> ${lesson.action}</p></div>
          <div class="button-row"><button class="btn btn-primary" data-nav="tools">${icon("wand-2")} Open Relevant Tool</button></div>
        </section>
      </div>
    `;
  };

  const renderTools = () => {
    screens.tools.innerHTML = `
      <div class="section-head"><div><div class="eyebrow"><span class="dot"></span> Tools</div><h1 id="tools-title" class="display">Choose the next strong decision.</h1><p class="lead">Deterministic tools for momentum, cravings, meals, minimum viable days, hydration, and your next seven days.</p></div></div>
      <div class="grid two">
        ${renderMomentumTool()}
        ${renderCravingTool()}
        ${renderPlateTool()}
        ${renderMinimumDayTool()}
        ${renderHydrationTool()}
        ${renderNextSevenTool()}
      </div>
      <section class="panel" style="margin-top:16px;"><h2>Workouts</h2><div class="grid three">${data.workouts.map(renderWorkout).join("")}</div></section>
      <section class="panel" style="margin-top:16px;"><h2>Recipes and Grocery Basics</h2><div class="grid three">${data.recipes.map((recipe) => `<article class="card"><h3>${recipe.title}</h3><p class="muted">${recipe.protein}</p><p>${recipe.prep}</p><p class="small muted">${recipe.note}</p></article>`).join("")}</div><h3>Minimum Viable Grocery Haul</h3><div class="choice-grid">${data.shopping.map((item) => `<button class="choice ${state.shoppingChecked.includes(item) ? "selected" : ""}" data-shopping="${item}">${item}</button>`).join("")}</div></section>
    `;
  };

  const renderMomentumTool = () => `<section class="panel"><h2>Momentum Quiz</h2><p class="muted">What is actually breaking your momentum?</p><div class="field"><label>Biggest pattern today</label><select id="momentum-pattern"><option>Perfectionism Loop</option><option>Environment Friction</option><option>Under-Fueling Cycle</option><option>Emotional Escape Pattern</option><option>Knowledge Without Structure</option><option>Motivation Dependency</option><option>Overloaded Schedule</option></select></div><button class="btn btn-primary" data-tool="momentum">${icon("target")} Get Intervention</button><div id="momentum-result" class="small muted" style="margin-top:12px;"></div></section>`;
  const renderCravingTool = () => `<section class="panel"><h2>Craving Check</h2><p class="muted">A craving is information, not an emergency.</p><div class="grid two">${["Physically hungry?", "Last meal had protein?", "Tired?", "Stressed or emotional?"].map((q, index) => `<label class="choice"><input type="checkbox" data-craving="${index}"> ${q}</label>`).join("")}</div><button class="btn btn-primary" data-tool="craving" style="margin-top:12px;">${icon("heart-pulse")} Check In</button><div id="craving-result" class="small muted" style="margin-top:12px;"></div></section>`;
  const renderPlateTool = () => `<section class="panel"><h2>Stronger Plate Builder</h2><div class="grid two">${["protein", "produce", "carbohydrate", "flavor"].map((id) => field(`plate-${id}`, id[0].toUpperCase() + id.slice(1), `Choose ${id}`)).join("")}</div><button class="btn btn-primary" data-tool="plate">${icon("utensils")} Build Plate</button><div id="plate-result" class="small muted" style="margin-top:12px;"></div></section>`;
  const renderMinimumDayTool = () => `<section class="panel"><h2>Minimum Viable Day</h2><div class="grid two">${selectField("mvdTime", "Time available", ["5 minutes", "10 minutes", "20 minutes"])}${selectField("mvdEnergy", "Current energy", ["Low", "Medium", "High"])}</div><button class="btn btn-primary" data-tool="minimum">${icon("battery")} Generate Day</button><div id="minimum-result" class="small muted" style="margin-top:12px;"></div></section>`;
  const renderHydrationTool = () => `<section class="panel"><h2>Hydration Target Setup</h2><div class="grid two">${field("hydrationCurrent", "Current intake", "Example: 2 bottles")}${selectField("hydrationStructure", "Target style", ["Simple", "Structured"])}</div><button class="btn btn-primary" data-tool="hydration">${icon("droplets")} Set Target</button><div id="hydration-result" class="small muted" style="margin-top:12px;">Hydration needs vary. Medical circumstances may require professional guidance.</div></section>`;
  const renderNextSevenTool = () => `<section class="panel"><h2>Next Seven Days Builder</h2><p class="muted">Choose three anchors to carry forward.</p><div class="choice-grid">${["Water goal", "Protein at primary meals", "Food logging", "Daily steps", "Weekly workouts", "Evening preparation", "Journaling", "Sleep window"].map((item) => `<button class="choice ${state.nextSevenDayAnchors.includes(item) ? "selected" : ""}" data-anchor="${item}">${item}</button>`).join("")}</div><button class="btn btn-primary" data-tool="next-seven" style="margin-top:12px;">${icon("calendar-check")} Save Anchors</button><div id="next-seven-result" class="small muted" style="margin-top:12px;"></div></section>`;
  const renderWorkout = (workout) => `<article class="card"><span class="badge">${workout.level}</span><h3 style="margin-top:12px;">${workout.title}</h3><ul>${workout.details.map((detail) => `<li>${detail}</li>`).join("")}</ul><p class="small muted">${workout.cue}</p><button class="btn btn-secondary" data-workout="${workout.id}">${icon("check")} Mark Complete</button></article>`;

  const renderProgress = () => {
    const progress = calculateOverallProgress();
    const strongest = data.habits.map((habit) => ({ habit, count: data.days.filter((day) => state.dailyHabitScores[day.day]?.[habit]).length })).sort((a, b) => b.count - a.count)[0];
    screens.progress.innerHTML = `
      <div class="section-head"><div><div class="eyebrow"><span class="dot"></span> Progress</div><h1 id="progress-title" class="display">Evidence, not perfection.</h1><p class="lead">${completionSummary()}</p></div><div class="ring" style="--pct:${progress}" data-label="${progress}%"></div></div>
      <div class="grid four">
        <div class="card"><strong style="font-size:32px;">${state.completedDays.length}</strong><p class="muted">days completed</p></div>
        <div class="card"><strong style="font-size:32px;">${state.totalCompletedActions}</strong><p class="muted">promises kept</p></div>
        <div class="card"><strong style="font-size:32px;">${state.streak}</strong><p class="muted">current streak</p></div>
        <div class="card"><strong style="font-size:32px;">${strongest?.habit || "Water goal"}</strong><p class="muted">strongest habit</p></div>
      </div>
      <section class="panel" style="margin-top:16px;"><h2>Daily Scores</h2>${data.days.map((day) => `<div class="slider-row"><strong>Day ${day.day}</strong><div class="progress-bar"><span style="--value:${(calculateDailyScore(day.day) / data.habits.length) * 100}%"></span></div><span>${calculateDailyScore(day.day)}/9</span></div>`).join("")}</section>
      <section class="panel" style="margin-top:16px;"><h2>Before and After Ratings</h2><p class="muted">Repeat this at the end. These are self-reflection scores, not medical outcomes.</p>${data.assessmentMetrics.map((metric) => slider(metric, state.afterAssessmentScores[metric] || state.assessmentScores[metric] || 5, "afterAssessment")).join("")}<div class="button-row"><button class="btn btn-primary" data-action="save-after">${icon("save")} Save Review</button><button class="btn btn-secondary" data-action="export-progress">${icon("download")} Download My Progress</button></div></section>
      <section class="panel" style="margin-top:16px;"><h2>You Did Not Finish a Challenge. You Created Evidence.</h2><p class="muted">You can continue alone with what you have learned. If you want greater structure and support, here is the next step.</p>${renderOffer()}</section>
    `;
  };

  const completionSummary = () => `You completed ${state.totalCompletedActions} promises, reached ${progressWords(calculateOverallProgress())} overall progress, and your strongest next move is to protect ${state.nextSevenDayAnchors[0] || "one small daily anchor"}.`;
  const progressWords = (pct) => (pct >= 80 ? "strong" : pct >= 45 ? "steady" : "early");

  const renderRecommendation = () => {
    const rec = state.recommendation || determineRecommendations();
    return `<span class="badge">${rec.label}</span><h3 style="margin-top:12px;">${rec.focus}</h3><p class="muted">${rec.secondary}</p><p><strong>Recommended habit anchors:</strong> ${rec.habits.join(", ")}</p><p><strong>Workout path:</strong> ${rec.workout}</p>`;
  };

  const renderOffer = () => {
    const offer = state.recommendation?.nextStep === "coaching" ? data.offers.coaching : data.offers.starterSystem;
    return `<div class="card" style="background:#fff;"><span class="badge">Next Step</span><h3>${offer.headline}</h3><p class="muted">The free reset is complete on its own. This is for more structure, support, and follow-through.</p><a class="btn btn-primary" href="${offer.url}" data-offer-click="${offer.label}">${icon("arrow-up-right")} ${offer.label}</a></div>`;
  };

  const renderSettings = () => {
    screens.settings.innerHTML = `
      <div class="section-head"><div><div class="eyebrow"><span class="dot"></span> Settings</div><h1 id="settings-title" class="display">Dashboard settings.</h1><p class="lead">Install guidance, privacy, progress export, and app controls.</p></div></div>
      <div class="grid two">
        <section class="panel"><h2>Install App</h2><p class="muted">${installInstructions()}</p><button class="btn btn-primary" data-action="show-install">${icon("smartphone")} Show Install Guide</button></section>
        <section class="panel"><h2>Privacy and Safety</h2><p class="muted">This dashboard stores your progress on this device. Journal text is not sent to analytics. This is general education, not medical advice. Stop activity that causes pain and consult a qualified professional when appropriate.</p><label class="check-row ${state.analyticsConsent ? "checked" : ""}" data-action="toggle-analytics"><span class="check-box">${state.analyticsConsent ? icon("check") : ""}</span><span>Allow basic analytics events</span></label></section>
        <section class="panel"><h2>Utilities</h2><div class="button-row"><button class="btn btn-secondary" data-action="export-progress">${icon("download")} Export Progress</button><button class="btn btn-secondary" data-action="check-update">${icon("refresh-cw")} Check Update</button><a class="btn btn-secondary" href="../">${icon("external-link")} Open EPC Athletics</a></div></section>
        <section class="panel"><h2>Reset Progress</h2><p class="muted">This clears saved dashboard progress from this device only.</p><button class="btn btn-primary" data-action="reset-progress">${icon("trash-2")} Reset My Progress</button><p class="small muted">App version ${data.version}</p></section>
      </div>
    `;
  };

  const installInstructions = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "On iPhone or iPad, open this page in Safari, tap Share, tap Add to Home Screen, then confirm installation.";
    if (/android/.test(ua)) return "On Android, use the browser install prompt when available. If it does not appear, open the browser menu and choose Install app or Add to Home screen.";
    return "Use your browser install option when available, or keep this page bookmarked.";
  };

  const render = () => {
    recalculateMomentum();
    document.getElementById("top-status").textContent = `Day ${state.currentDay} · ${state.totalCompletedActions} promises kept`;
    if (sessionStorage.getItem("hse-onboarding") === "true" && !state.onboardingCompleted) renderOnboarding();
    else renderHome();
    renderPlan();
    renderLearn();
    renderTools();
    renderProgress();
    renderSettings();
    if (window.lucide) window.lucide.createIcons();
    maybeShowInstallEducation();
  };

  const persistFormValues = () => {
    ["strongestWhy", "identityStatement", "baselineWater", "baselineSteps", "workoutsPerWeek", "proteinFrequency", "trackingFood", "topDisruptor", "customStartDate", "hydrationCurrent", "hydrationStructure", "mvdTime", "mvdEnergy"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) state[id] = el.value;
    });
    document.querySelectorAll("[data-slider-group]").forEach((el) => {
      const group = el.dataset.sliderGroup === "afterAssessment" ? "afterAssessmentScores" : "assessmentScores";
      state[group][el.dataset.metric] = Number(el.value);
    });
    document.querySelectorAll("[data-journal]").forEach((el) => {
      state.journalEntries[el.dataset.journal] = el.value;
    });
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const resetState = () => {
    if (!confirm("Reset your saved Strongest Era progress on this device?")) return;
    localStorage.removeItem(storageKey);
    state = { ...defaultState };
    sessionStorage.removeItem("hse-onboarding");
    trackEvent("progress_reset");
    render();
  };

  const exportProgress = () => {
    recalculateMomentum();
    const payload = {
      app: data.brand.name,
      exportedAt: new Date().toISOString(),
      currentDay: state.currentDay,
      completedDays: state.completedDays,
      totalCompletedActions: state.totalCompletedActions,
      streak: state.streak,
      recommendation: state.recommendation?.label || "",
      nextSevenDayAnchors: state.nextSevenDayAnchors,
      dailyScores: data.days.map((day) => ({ day: day.day, theme: day.theme, score: calculateDailyScore(day.day) })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "strongest-era-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("progress_exported");
  };

  const maybeShowInstallEducation = () => {
    if (state.installedPromptDismissed || state.installEducationShown) return;
    const earnedValue = state.onboardingCompleted || state.totalCompletedActions >= 3 || state.completedDays.length >= 1;
    if (!earnedValue) return;
    window.setTimeout(() => showInstallCard(), 600);
  };

  const showInstallCard = () => {
    document.getElementById("install-instructions").textContent = installInstructions();
    document.getElementById("install-card").classList.add("show");
    state.installEducationShown = true;
    localStorage.setItem(storageKey, JSON.stringify(state));
    trackEvent("install_education_viewed");
  };

  const runTool = (tool) => {
    persistFormValues();
    if (tool === "momentum") {
      const pattern = document.getElementById("momentum-pattern").value;
      document.getElementById("momentum-result").innerHTML = `<strong>${pattern}:</strong> Do not add pressure today. Remove one friction point, choose the smallest complete version, and open the relevant lesson before your next decision.`;
      state.momentumQuizResults[todayISO()] = pattern;
      trackEvent("craving_quiz_completed", { tool: "momentum", result: pattern });
    }
    if (tool === "craving") {
      const checked = [...document.querySelectorAll("[data-craving]:checked")].length;
      const result = checked >= 3 ? "Eat a balanced meal or rest before making the decision. The craving may be connected to under-fueling, tiredness, or emotion." : "Portion the desired food intentionally if you still want it, then continue the day without compensation or guilt.";
      document.getElementById("craving-result").textContent = result;
      state.cravingQuizResults[todayISO()] = result;
      trackEvent("craving_quiz_completed", { checked });
    }
    if (tool === "plate") {
      const parts = ["protein", "produce", "carbohydrate", "flavor"].map((id) => document.getElementById(`plate-${id}`).value || id);
      document.getElementById("plate-result").textContent = `Try this plate: ${parts.join(" + ")}. Emergency mode: chicken, microwave rice, frozen vegetables, and your favorite sauce.`;
      state.mealBuilderSelections[todayISO()] = parts;
      trackEvent("meal_builder_used");
    }
    if (tool === "minimum") {
      const time = state.mvdTime || "10 minutes";
      const plan = time === "5 minutes" ? "Drink one glass of water, breathe for one minute, do two simple movements, and write one sentence." : time === "10 minutes" ? "Take a short walk, choose a protein-centered meal, hydrate, and answer one journal prompt." : "Complete the Low-Energy Reset workout, plan one meal, and update your scorecard.";
      document.getElementById("minimum-result").innerHTML = `<strong>The minimum keeps the identity alive.</strong> ${plan}`;
      trackEvent("minimum_day_generated", { time });
    }
    if (tool === "hydration") {
      const target = state.hydrationStructure === "Structured" ? "Drink after waking, with each meal, and before or after training." : "Maintain your current intake and add one visible bottle.";
      state.selectedWaterGoal = target;
      document.getElementById("hydration-result").textContent = `${target} Hydration needs vary and medical circumstances may require professional guidance.`;
      trackEvent("hydration_target_created");
    }
    if (tool === "next-seven") {
      document.getElementById("next-seven-result").textContent = `Saved anchors: ${state.nextSevenDayAnchors.join(", ") || "Choose up to three anchors."}`;
      trackEvent("next_plan_created", { anchors: state.nextSevenDayAnchors.length });
    }
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  document.addEventListener("click", async (event) => {
    const target = event.target.closest("button, a, label");
    if (!target) return;

    if (target.dataset.nav) {
      event.preventDefault();
      setView(target.dataset.nav);
      return;
    }

    if (target.dataset.toggleReason) {
      const reason = target.dataset.toggleReason;
      state.reasons = state.reasons.includes(reason) ? state.reasons.filter((item) => item !== reason) : [...state.reasons, reason];
      saveState();
    }

    if (target.dataset.action === "start-onboarding") {
      sessionStorage.setItem("hse-onboarding", "true");
      state.onboardingStep = 0;
      trackEvent("onboarding_started");
      saveState();
    }

    if (target.dataset.action === "exit-onboarding") {
      sessionStorage.removeItem("hse-onboarding");
      render();
    }

    if (target.dataset.action === "next-step") {
      persistFormValues();
      if (target.dataset.track) trackEvent(target.dataset.track);
      state.onboardingStep = Math.min(6, state.onboardingStep + 1);
      if (state.onboardingStep === 4) state.recommendation = determineRecommendations();
      saveState();
    }

    if (target.dataset.action === "prev-step") {
      persistFormValues();
      state.onboardingStep = Math.max(0, state.onboardingStep - 1);
      saveState();
    }

    if (target.dataset.action === "accept-agreement") {
      state.agreementAccepted = true;
      state.agreementAcceptedAt = new Date().toISOString();
      trackEvent("agreement_accepted");
      state.onboardingStep = 6;
      saveState();
    }

    if (target.dataset.startDate) {
      state.startDate = target.dataset.startDate;
      saveState();
    }

    if (target.dataset.action === "finish-onboarding") {
      persistFormValues();
      state.startDate = state.customStartDate || state.startDate || todayISO();
      state.recommendation = determineRecommendations();
      state.recommendedNextStep = state.recommendation.nextStep;
      state.onboardingCompleted = true;
      state.currentDay = determineCurrentDay();
      sessionStorage.removeItem("hse-onboarding");
      trackEvent("onboarding_completed", { archetype: state.recommendation.id });
      saveState();
      setView("home");
    }

    if (target.dataset.day) {
      sessionStorage.setItem("hse-selected-day", target.dataset.day);
      renderPlan();
      if (window.lucide) window.lucide.createIcons();
    }

    if (target.dataset.lesson) {
      sessionStorage.setItem("hse-selected-lesson", target.dataset.lesson);
      renderLearn();
      if (window.lucide) window.lucide.createIcons();
    }

    if (target.dataset.habitDay) {
      const day = target.dataset.habitDay;
      const habit = target.dataset.habit;
      state.dailyHabitScores[day] = state.dailyHabitScores[day] || {};
      state.dailyHabitScores[day][habit] = !state.dailyHabitScores[day][habit];
      trackEvent("habit_completed", { day, habit, completed: state.dailyHabitScores[day][habit] });
      saveState();
    }

    if (target.dataset.completeDay) {
      const day = target.dataset.completeDay;
      state.dailyCompletion[day] = true;
      state.completedDays = completedDays();
      trackEvent("day_completed", { day, score: calculateDailyScore(day) });
      saveState();
      showToast(`Day ${day} complete. Promise kept.`);
    }

    if (target.dataset.action === "continue-day") {
      sessionStorage.setItem("hse-selected-day", state.currentDay);
      setView("plan");
    }

    if (target.dataset.action === "quick-water") {
      const day = state.currentDay;
      state.dailyHabitScores[day] = state.dailyHabitScores[day] || {};
      state.dailyHabitScores[day]["Water goal"] = true;
      trackEvent("habit_completed", { day, habit: "Water goal" });
      saveState();
      showToast("Water goal marked.");
    }

    if (target.dataset.action === "quick-journal") {
      sessionStorage.setItem("hse-selected-day", state.currentDay);
      setView("plan");
      window.setTimeout(() => document.querySelector(`[data-journal="${state.currentDay}"]`)?.focus(), 100);
    }

    if (target.dataset.tool) runTool(target.dataset.tool);

    if (target.dataset.workout) {
      state.workoutSelections[todayISO()] = target.dataset.workout;
      trackEvent("workout_completed", { workout: target.dataset.workout });
      saveState();
      showToast("Workout marked complete.");
    }

    if (target.dataset.shopping) {
      const item = target.dataset.shopping;
      state.shoppingChecked = state.shoppingChecked.includes(item) ? state.shoppingChecked.filter((x) => x !== item) : [...state.shoppingChecked, item];
      saveState();
    }

    if (target.dataset.anchor) {
      const item = target.dataset.anchor;
      const selected = state.nextSevenDayAnchors.includes(item);
      state.nextSevenDayAnchors = selected ? state.nextSevenDayAnchors.filter((x) => x !== item) : [...state.nextSevenDayAnchors, item].slice(0, 3);
      saveState();
    }

    if (target.dataset.action === "save-after") {
      persistFormValues();
      trackEvent("progress_review_completed");
      showToast("Progress review saved.");
      render();
    }

    if (target.dataset.action === "export-progress") exportProgress();
    if (target.dataset.action === "reset-progress") resetState();
    if (target.dataset.action === "show-install") showInstallCard();
    if (target.dataset.action === "toggle-analytics") {
      state.analyticsConsent = !state.analyticsConsent;
      saveState();
    }
    if (target.dataset.action === "check-update") {
      navigator.serviceWorker?.getRegistration().then((reg) => reg?.update());
      showToast("Checking for an update.");
    }
    if (target.dataset.offerClick) trackEvent("offer_clicked", { offer: target.dataset.offerClick });
  });

  document.addEventListener("input", (event) => {
    const sliderInput = event.target.closest("[data-slider-group]");
    if (sliderInput) sliderInput.nextElementSibling.textContent = sliderInput.value;
    if (event.target.matches("textarea, input, select")) persistFormValues();
  });

  document.getElementById("install-dismiss").addEventListener("click", () => {
    state.installedPromptDismissed = true;
    localStorage.setItem(storageKey, JSON.stringify(state));
    document.getElementById("install-card").classList.remove("show");
    trackEvent("install_prompt_dismissed");
  });

  document.getElementById("install-action").addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      trackEvent("install_prompt_accepted", { outcome: choice.outcome });
      deferredInstallPrompt = null;
    } else {
      showToast("Use your browser Share or menu button to add this app.");
    }
  });

  document.getElementById("refresh-app").addEventListener("click", () => {
    if (pendingServiceWorker) pendingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  });

  document.getElementById("dismiss-update").addEventListener("click", () => {
    document.getElementById("update-banner").classList.remove("show");
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener("popstate", () => setView(location.hash.replace("#", "") || "home", false));

  const registerServiceWorker = () => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("service-worker.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            pendingServiceWorker = worker;
            document.getElementById("update-banner").classList.add("show");
          }
        });
      });
    }).catch(() => showToast("Offline mode is unavailable in this browser."));
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
  };

  captureAttribution();
  state.lastVisitDate = todayISO();
  localStorage.setItem(storageKey, JSON.stringify(state));
  render();
  setView(location.hash.replace("#", "") || "home", false);
  registerServiceWorker();
  trackEvent("dashboard_opened", { currentDay: state.currentDay });
})();
