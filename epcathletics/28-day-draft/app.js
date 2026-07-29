(() => {
  const program = window.EPC_PROGRAM;
  const drawer = document.getElementById("workout-drawer");
  const videoModal = document.getElementById("video-modal");
  const workoutContent = document.getElementById("workout-content");
  const toast = document.getElementById("toast");
  let activeDay = 1;
  let deferredInstallPrompt = null;

  const defaultState = {
    levels: {},
    exercises: {},
    performance: {},
    completed: {}
  };

  const readState = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(program.storageKey));
      return stored && typeof stored === "object"
        ? {
            ...defaultState,
            ...stored,
            levels: stored.levels || {},
            exercises: stored.exercises || {},
            performance: stored.performance || {},
            completed: stored.completed || {}
          }
        : structuredClone(defaultState);
    } catch {
      return structuredClone(defaultState);
    }
  };

  let state = readState();
  const save = () => localStorage.setItem(program.storageKey, JSON.stringify(state));
  const sessionForDay = dayNumber => program.sessions[program.days[dayNumber - 1].session];
  const levelForDay = dayNumber => state.levels[dayNumber] || "beginner";
  const isComplete = dayNumber => Boolean(state.completed[dayNumber]);
  const nextDay = () => program.days.find(day => !isComplete(day.day))?.day || 28;
  const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
  const escapeAttribute = value => String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);

  const notify = message => {
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  };

  const renderSummary = () => {
    const completed = Object.values(state.completed).filter(Boolean).length;
    document.getElementById("completed-days").textContent = completed;
    document.getElementById("progress-percent").textContent = `${Math.round((completed / 28) * 100)}%`;
    document.getElementById("continue-button").textContent = completed ? `Continue Day ${nextDay()}` : "Start Day 1";
  };

  const renderCalendar = () => {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = Array.from({ length: 4 }, (_, weekIndex) => {
      const days = program.days.filter(day => day.week === weekIndex + 1);
      return `
        <article class="week">
          <h3>Week ${weekIndex + 1} · ${days[0].weekName}</h3>
          <div class="week-grid">
            ${days.map(day => {
              const session = sessionForDay(day.day);
              const done = isComplete(day.day);
              return `
                <button class="day-card ${done ? "done" : ""}" data-day="${day.day}" aria-label="Open day ${day.day}: ${session.title}${done ? ", completed" : ""}">
                  <span class="day-check">${done ? "✓" : ""}</span>
                  <span class="day-number">Day ${String(day.day).padStart(2, "0")}</span>
                  <strong>${session.short}</strong>
                  <span class="day-type">${done ? "Completed" : titleCase(levelForDay(day.day))}</span>
                </button>`;
            }).join("")}
          </div>
        </article>`;
    }).join("");
  };

  const exerciseKey = (dayNumber, sectionIndex, exerciseIndex) => `${dayNumber}-${sectionIndex}-${exerciseIndex}`;

  const renderWorkout = () => {
    const day = program.days[activeDay - 1];
    const session = sessionForDay(activeDay);
    const level = levelForDay(activeDay);
    document.getElementById("workout-day-label").textContent = `Week ${day.week} · Day ${activeDay}`;
    document.getElementById("workout-title").textContent = session.title;

    workoutContent.innerHTML = `
      <div class="level-tabs" role="group" aria-label="Choose today's workout level">
        ${program.levels.map(item => `<button class="level-tab ${item === level ? "active" : ""}" data-level="${item}" aria-pressed="${item === level}">${item}</button>`).join("")}
      </div>
      <div class="workout-note"><strong>${titleCase(level)} today.</strong> You can change this level for this workout without changing any other day.</div>
      <div class="workout-meta">
        <div><span>Time</span><strong>${session.duration}</strong></div>
        <div><span>Focus</span><strong>${session.type}</strong></div>
        <div><span>Equipment</span><strong>${session.equipment}</strong></div>
      </div>
      <p class="training-log-note"><strong>Your training log:</strong> enter the weight and reps you complete. Every entry saves automatically on this device.</p>
      ${session.sections.map((section, sectionIndex) => `
        <section class="workout-section">
          <h3>${section.title}</h3>
          ${section.intro ? `<p class="section-intro">${section.intro}</p>` : ""}
          ${section.exercises.length ? `
            <div class="exercise-list">
              ${section.exercises.map((exercise, exerciseIndex) => {
                const key = exerciseKey(activeDay, sectionIndex, exerciseIndex);
                const checked = Boolean(state.exercises[key]);
                const performance = state.performance[key] || {};
                return `
                  <div class="exercise ${checked ? "checked" : ""}">
                    <input type="checkbox" data-exercise="${key}" aria-label="Mark ${exercise.name} complete" ${checked ? "checked" : ""}>
                    <span class="exercise-details">
                      <span class="exercise-name">${exercise.name}</span>
                      <span class="exercise-prescription">${exercise.reps[level]}</span>
                    </span>
                    ${exercise.video ? `<button type="button" class="video-button" data-video="${exercise.video}" data-video-title="${exercise.name}">Watch form</button>` : ""}
                    <div class="exercise-log" aria-label="${exercise.name} training log">
                      <label>
                        <span>Weight / load</span>
                        <input type="text" inputmode="decimal" autocomplete="off" maxlength="24" placeholder="e.g. 20 lb" data-log-key="${key}" data-log-field="weight" value="${escapeAttribute(performance.weight)}">
                      </label>
                      <label>
                        <span>Reps completed</span>
                        <input type="text" inputmode="text" autocomplete="off" maxlength="40" placeholder="e.g. 10, 10, 8" data-log-key="${key}" data-log-field="reps" value="${escapeAttribute(performance.reps)}">
                      </label>
                    </div>
                  </div>`;
              }).join("")}
            </div>` : ""}
        </section>`).join("")}
      <section class="workout-section home-swaps">
        <h3>At-home options</h3>
        <ul>${session.home.map(item => `<li>${item}</li>`).join("")}</ul>
      </section>
      <button class="complete-button ${isComplete(activeDay) ? "done" : ""}" data-complete-day="${activeDay}">
        ${isComplete(activeDay) ? "✓ Workout complete" : "Mark workout complete"}
      </button>`;
  };

  const render = () => {
    renderSummary();
    renderCalendar();
    if (drawer.classList.contains("open")) renderWorkout();
  };

  const openDay = dayNumber => {
    activeDay = Number(dayNumber);
    renderWorkout();
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.setTimeout(() => drawer.querySelector("[data-close-drawer]").focus(), 250);
  };

  const closeDrawer = () => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (!videoModal.classList.contains("open")) document.body.classList.remove("modal-open");
  };

  const openVideo = (videoId, title) => {
    document.getElementById("video-title").textContent = title;
    document.getElementById("video-frame").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0" title="${title} movement demonstration" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    videoModal.classList.add("open");
    videoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeVideo = () => {
    videoModal.classList.remove("open");
    videoModal.setAttribute("aria-hidden", "true");
    document.getElementById("video-frame").innerHTML = "";
    if (!drawer.classList.contains("open")) document.body.classList.remove("modal-open");
  };

  document.addEventListener("click", event => {
    const dayButton = event.target.closest("[data-day]");
    if (dayButton) openDay(dayButton.dataset.day);

    const levelButton = event.target.closest("[data-level]");
    if (levelButton) {
      state.levels[activeDay] = levelButton.dataset.level;
      save();
      render();
      notify(`${titleCase(levelButton.dataset.level)} selected for Day ${activeDay}`);
    }

    const videoButton = event.target.closest("[data-video]");
    if (videoButton) {
      event.preventDefault();
      openVideo(videoButton.dataset.video, videoButton.dataset.videoTitle);
    }

    const completeButton = event.target.closest("[data-complete-day]");
    if (completeButton) {
      const day = completeButton.dataset.completeDay;
      state.completed[day] = !state.completed[day];
      save();
      render();
      notify(state.completed[day] ? `Day ${day} complete. Strong work.` : `Day ${day} marked incomplete.`);
    }

    if (event.target.closest("[data-close-drawer]")) closeDrawer();
    if (event.target.closest("[data-close-video]")) closeVideo();
  });

  document.addEventListener("change", event => {
    if (!event.target.matches("[data-exercise]")) return;
    state.exercises[event.target.dataset.exercise] = event.target.checked;
    save();
    renderWorkout();
  });

  document.addEventListener("input", event => {
    if (!event.target.matches("[data-log-field]")) return;
    const key = event.target.dataset.logKey;
    const field = event.target.dataset.logField;
    state.performance[key] = { ...(state.performance[key] || {}), [field]: event.target.value };
    save();
  });

  document.getElementById("continue-button").addEventListener("click", () => openDay(nextDay()));
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!window.confirm("Reset all workout completions, level choices and training-log entries?")) return;
    state = structuredClone(defaultState);
    save();
    render();
    notify("Your 28-day progress has been reset.");
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (videoModal.classList.contains("open")) closeVideo();
    else if (drawer.classList.contains("open")) closeDrawer();
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    document.getElementById("install-button").hidden = false;
  });

  document.getElementById("install-button").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    document.getElementById("install-button").hidden = true;
  });

  window.addEventListener("appinstalled", () => notify("28 Day Strong is installed."));
  render();
})();
