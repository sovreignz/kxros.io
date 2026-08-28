(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const progress = document.querySelector('.progress-track i');
  const counterCurrent = document.querySelector('.counter b');
  const sectionLabel = document.querySelector('.section-label');
  const modeTag = document.querySelector('.mode-tag');
  const presenter = document.querySelector('.presenter');
  const overview = document.querySelector('.overview');
  const menuButton = document.querySelector('[data-menu]');
  let index = Math.max(0, Math.min(slides.length - 1, Number(location.hash.slice(1)) - 1 || 0));
  let revealIndex = 0;

  const sections = [];
  slides.forEach((slide, i) => {
    const label = slide.dataset.section;
    if (!sections.some(section => section.label === label)) sections.push({ label, index: i });
  });

  const nav = document.querySelector('.section-nav');
  sections.forEach(({ label, index: slideIndex }) => {
    const [number, name] = label.split(' / ');
    const button = document.createElement('button');
    button.innerHTML = `<b>${number}</b><span>${name}</span><i>${String(slideIndex + 1).padStart(2, '0')}</i>`;
    button.addEventListener('click', () => { go(slideIndex); toggleOverview(false); });
    nav.append(button);
  });

  function setNotes(slide) {
    const fields = { objective: 'objective', ask: 'ask', listen: 'listen', capture: 'capture' };
    Object.entries(fields).forEach(([target, source]) => {
      document.querySelector(`[data-note="${target}"]`).textContent = slide.dataset[source] || '—';
    });
    document.querySelector('.presenter-head b').textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;
  }

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', i !== index);
      slide.querySelectorAll('.reveal').forEach((item, r) => item.classList.toggle('shown', i === index && r < revealIndex));
    });
    const slide = slides[index];
    sectionLabel.textContent = slide.dataset.section;
    modeTag.textContent = slide.dataset.mode || 'TEACH';
    counterCurrent.textContent = String(index + 1).padStart(2, '0');
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    setNotes(slide);
    history.replaceState(null, '', `#${index + 1}`);
    document.title = `${String(index + 1).padStart(2, '0')} — Content OS Diagnostic`;
  }

  function go(next) {
    index = Math.max(0, Math.min(slides.length - 1, next));
    revealIndex = 0;
    render();
  }

  function advance() {
    const total = slides[index].querySelectorAll('.reveal').length;
    if (revealIndex < total) { revealIndex += 1; render(); }
    else if (index < slides.length - 1) go(index + 1);
  }

  function back() {
    if (revealIndex > 0) { revealIndex -= 1; render(); }
    else go(index - 1);
  }

  function togglePresenter(force) {
    const open = force ?? !presenter.classList.contains('open');
    presenter.classList.toggle('open', open);
    presenter.setAttribute('aria-hidden', !open);
  }

  function toggleOverview(force) {
    const open = force ?? !overview.classList.contains('open');
    overview.classList.toggle('open', open);
    overview.setAttribute('aria-hidden', !open);
    menuButton.setAttribute('aria-expanded', open);
  }

  addEventListener('keydown', event => {
    if (['ArrowRight', ' ', 'PageDown'].includes(event.key)) { event.preventDefault(); advance(); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); back(); }
    if (event.key.toLowerCase() === 'p') togglePresenter();
    if (event.key.toLowerCase() === 'h' || event.key === 'Home') toggleOverview(true);
    if (event.key === 'Escape') { togglePresenter(false); toggleOverview(false); }
  });
  document.querySelector('.edge-right').addEventListener('click', advance);
  document.querySelector('.edge-left').addEventListener('click', back);
  document.querySelector('[data-home]').addEventListener('click', () => toggleOverview(true));
  menuButton.addEventListener('click', () => toggleOverview());
  document.querySelector('[data-menu-close]').addEventListener('click', () => toggleOverview(false));
  document.querySelector('.presenter-close').addEventListener('click', () => togglePresenter(false));
  let touchStart = 0;
  addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  addEventListener('touchend', event => { const dx = event.changedTouches[0].clientX - touchStart; if (Math.abs(dx) > 50) dx < 0 ? advance() : back(); }, { passive: true });
  render();
})();
