/* ═══════════════════════════════════════════════════════
   Wenni Skin Care Academy — script.js (data-driven)
   All content loaded from data.json.
   ═══════════════════════════════════════════════════════ */

let D = null;
let isAcademyEnabled = false;

function updateAcademyFlag() {
  isAcademyEnabled = D && D.academic && D.academic.enabled !== false;
}

/* ── HELPERS ──────────────────────────────────────────── */
function esc(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

/* Sparkle / leaf SVG for brand logo */
const BRAND_SVG = `<svg width="SIZE" height="SIZE" viewBox="0 0 32 32" fill="none">
  <circle cx="16" cy="16" r="14" fill="url(#brandGrad)"/>
  <path d="M16 8c0 0-6 4-6 9a6 6 0 0 0 12 0c0-5-6-9-6-9z" fill="white" opacity="0.9"/>
  <path d="M16 10v10M13 14l3-4 3 4" stroke="url(#brandGrad)" stroke-width="1.5" stroke-linecap="round"/>
  <defs>
    <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
</svg>`;

const WA_SVG = `<svg width="SIZE" height="SIZE" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;

function brandSvg(size) { return BRAND_SVG.replace(/SIZE/g, size); }
function waSvg(size)    { return WA_SVG.replace(/SIZE/g, size); }

function waHref() {
  return `https://wa.me/${D.whatsapp.number}?text=${encodeURIComponent(D.whatsapp.message)}`;
}

function headerHTML(eyebrow, title, titleAccent, subtitle) {
  return `
    <p class="section-eyebrow">${esc(eyebrow)}</p>
    <h2 class="section-title">${esc(title)}${titleAccent ? ` <span class="accent">${esc(titleAccent)}</span>` : ""}</h2>
    ${subtitle ? `<p class="section-subtitle">${esc(subtitle)}</p>` : ""}
  `;
}

/* ── RENDER: META + HEADER ────────────────────────────── */
function applyMeta() {
  document.title = D.site.pageTitle;
  document.getElementById("pageDesc").setAttribute("content", D.site.pageDescription);
}

function renderHeader() {
  document.getElementById("logo").innerHTML = `
    <div class="logo-icon">${brandSvg(34)}</div>
    <div class="logo-text">
      <span class="logo-name">${esc(D.site.name)}</span>
      <span class="logo-sub">${esc(D.site.branch)}</span>
    </div>
  `;
  updateAcademyFlag();
  const filteredNav = D.nav.filter(n => isAcademyEnabled || n.href !== "#academic");
  document.getElementById("navList").innerHTML = filteredNav.map(n =>
    n.cta
      ? `<li><a href="${esc(n.href)}" class="nav-cta-btn">${esc(n.label)}</a></li>`
      : `<li><a href="${esc(n.href)}" class="nav-link">${esc(n.label)}<span class="nav-link-bar"></span></a></li>`
  ).join("");
}

/* ── RENDER: HERO ─────────────────────────────────────── */
function renderHero() {
  const h = D.hero;
  
  // Detect if slideshow is configured
  const hasSlides = h.slides && Array.isArray(h.slides) && h.slides.length > 0;
  
  if (hasSlides) {
    // Render slideshow container background
    document.getElementById("heroBg").innerHTML = h.slides.map((slide, idx) => `
      <div class="hero-slide${idx === 0 ? ' active' : ''}" style="background-image: url('${esc(slide.image)}');" aria-label="${esc(slide.imageAlt)}"></div>
    `).join("") + '<div class="hero-bg-overlay"></div>';
    
    const firstSlide = h.slides[0];
    document.getElementById("heroContent").innerHTML = `
      <div class="hero-badge">
        <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#0284C7"/></svg>
        ${esc(h.badge)}
      </div>
      <h1 class="hero-title" id="heroTitleEl" style="transition: opacity 0.6s ease, transform 0.6s ease;">
        <span id="heroTitleText">${esc(firstSlide.title)}</span><br/>
        <span class="hero-title-accent" id="heroTitleAccent">${esc(firstSlide.titleAccent)}</span>
      </h1>
      <p class="hero-subtitle">${esc(h.subtitle)}</p>
      <div class="hero-actions">
        <a href="${esc(h.btnPrimary.href)}" class="btn btn-primary btn-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${esc(h.btnPrimary.label)}
        </a>
        <a href="${esc(h.btnSecondary.href)}" class="btn btn-outline btn-lg">${esc(h.btnSecondary.label)}</a>
      </div>
      <div class="hero-controls" aria-label="Hero slider controls">
        <button id="heroPrev" class="hero-control-btn" aria-label="Previous slide"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <button id="heroPause" class="hero-control-btn" aria-label="Pause slider"><svg id="heroPauseIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>
        <button id="heroNext" class="hero-control-btn" aria-label="Next slide"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      <div class="hero-trust">
        ${h.trust.map((t, i) => `
          ${i > 0 ? '<div class="trust-divider"></div>' : ''}
          <div class="trust-item"><strong>${esc(t.value)}</strong><span>${esc(t.label)}</span></div>
        `).join("")}
      </div>
    `;
    
    // Start slides loop rotation
    startHeroSlider(h.slides);
  } else {
    // Fallback to original single layout
    const titleHTML = h.titleLines.map(l =>
      l.accent ? `<span class="hero-title-accent" id="heroTypewriter">${esc(l.text)}</span>` : esc(l.text)
    ).join("<br/>");

    document.getElementById("heroContent").innerHTML = `
      <div class="hero-badge">
        <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#F59E0B"/></svg>
        ${esc(h.badge)}
      </div>
      <h1 class="hero-title">${titleHTML}</h1>
      <p class="hero-subtitle">${esc(h.subtitle)}</p>
      <div class="hero-actions">
        <a href="${esc(h.btnPrimary.href)}" class="btn btn-primary btn-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${esc(h.btnPrimary.label)}
        </a>
        <a href="${esc(h.btnSecondary.href)}" class="btn btn-outline btn-lg">${esc(h.btnSecondary.label)}</a>
      </div>
      <div class="hero-trust">
        ${h.trust
          .filter(t => isAcademyEnabled || !t.label.toLowerCase().includes("student"))
          .map((t, index) => `
            ${index > 0 ? '<div class="trust-divider"></div>' : ''}
            <div class="trust-item"><strong>${esc(t.value)}</strong><span>${esc(t.label)}</span></div>
          `).join("")}
      </div>
    `;
    
    document.getElementById("heroBg").innerHTML = `
      <img src="${esc(h.image)}" alt="${esc(h.imageAlt)}" />
      <div class="hero-bg-overlay"></div>
    `;
  }
  
  // Render consultations card visual overlay
  const cc = h.consultCard;
  document.getElementById("heroVisual").innerHTML = `
    <div class="hero-card-main">
      <div class="hero-consult-card">
        <div class="consult-icon">${esc(cc.icon)}</div>
        <p class="consult-label">${esc(cc.label)}</p>
        <h3>${esc(cc.title)}</h3>
        <p>${esc(cc.desc)}</p>
        <div class="consult-mini-grid">
          ${cc.tags.map(t => `<span>${esc(t)}</span>`).join("")}
        </div>
      </div>
    </div>
    ${h.badges.map(b => `<div class="hero-float-badge badge-${esc(b.position)}">${b.icon}<span>${esc(b.text)}</span></div>`).join("")}
  `;
}

/* ── HERO BACKGROUND SLIDESHOW ─────────────────── */
let heroSliderTimer = null;
let heroSliderPaused = false;

function startHeroSlider(slides) {
  if (heroSliderTimer) { clearInterval(heroSliderTimer); heroSliderTimer = null; }
  if (!Array.isArray(slides) || slides.length < 2) return;

  const slideEls = document.querySelectorAll("#heroBg .hero-slide");
  const titleEl = document.getElementById("heroTitleEl");
  const titleText = document.getElementById("heroTitleText");
  const titleAccent = document.getElementById("heroTitleAccent");
  const heroSection = document.getElementById("home");
  const pauseBtn = document.getElementById("heroPause");
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  const pauseIcon = document.getElementById("heroPauseIcon");

  if (slideEls.length < 2) return;

  const delay = Number(D.hero.slideInterval) > 0 ? Number(D.hero.slideInterval) : 6000;
  let current = 0;

  // Reduced motion check
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    heroSliderPaused = true;
    updatePauseIcon();
  }

  function goToSlide(next) {
    if (next === current) return;
    slideEls[current].classList.remove("active");
    slideEls[next].classList.add("active");

    if (titleEl && titleText && titleAccent) {
      titleEl.style.opacity = "0";
      titleEl.style.transform = "translateY(12px)";
      setTimeout(() => {
        titleText.textContent = slides[next].title ?? "";
        titleAccent.textContent = slides[next].titleAccent ?? "";
        titleEl.style.opacity = "1";
        titleEl.style.transform = "";
      }, 300);
    }
    current = next;
  }

  function nextSlide() {
    goToSlide((current + 1) % slideEls.length);
  }

  function prevSlide() {
    goToSlide((current - 1 + slideEls.length) % slideEls.length);
  }

  function updatePauseIcon() {
    if (pauseIcon) {
      if (heroSliderPaused) {
        pauseIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>'; // Play icon
        pauseBtn.setAttribute("aria-label", "Play slider");
      } else {
        pauseIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'; // Pause icon
        pauseBtn.setAttribute("aria-label", "Pause slider");
      }
    }
  }

  function startTimer() {
    if (heroSliderTimer) clearInterval(heroSliderTimer);
    if (!heroSliderPaused) {
      heroSliderTimer = setInterval(nextSlide, delay);
    }
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      heroSliderPaused = !heroSliderPaused;
      updatePauseIcon();
      startTimer();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startTimer(); // Reset timer on manual navigation
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startTimer(); // Reset timer on manual navigation
    });
  }

  // Pause on hover/focus
  if (heroSection) {
    heroSection.addEventListener("mouseenter", () => {
      if (heroSliderTimer) clearInterval(heroSliderTimer);
    });
    heroSection.addEventListener("mouseleave", () => {
      startTimer();
    });
    heroSection.addEventListener("focusin", () => {
      if (heroSliderTimer) clearInterval(heroSliderTimer);
    });
    heroSection.addEventListener("focusout", () => {
      startTimer();
    });
  }

  startTimer();
}

/* ── RENDER: ABOUT ────────────────────────────────────── */
function renderAbout() {
  const a = D.about;
  document.getElementById("aboutInner").innerHTML = `
    <div class="about-image-col">
      <div class="about-img-wrap">
        <div class="care-process-card">
          <div class="process-head">
            <span>${esc(a.process.headLabel)}</span>
            <strong>${esc(a.process.headTitle)}</strong>
          </div>
          ${a.process.steps.map(s => `
            <div class="process-step"><b>${esc(s.num)}</b><div><h4>${esc(s.title)}</h4><p>${esc(s.desc)}</p></div></div>
          `).join("")}
        </div>
        <div class="about-img-accent"></div>
        <div class="about-exp-badge">
          <strong>${esc(a.expBadge.value)}</strong>
          <span>${a.expBadge.label}</span>
        </div>
      </div>
    </div>
    <div class="about-text-col">
      <p class="section-eyebrow">${esc(a.eyebrow)}</p>
      <h2 class="section-title">${esc(a.title)} <span class="accent">${esc(a.titleAccent)}</span></h2>
      ${a.desc.map(d => `<p class="about-desc">${esc(d)}</p>`).join("")}
      <div class="about-features">
        ${a.features
          .filter(f => isAcademyEnabled || (!f.toLowerCase().includes("cosmetology") && !f.toLowerCase().includes("training") && !f.toLowerCase().includes("academy")))
          .map(f => `
            <div class="about-feat">
              <div class="feat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span>${esc(f)}</span>
            </div>
          `).join("")}
      </div>
      <a href="#appointment" class="btn btn-primary">${esc(a.btnLabel)}</a>
    </div>
  `;
}

/* ── RENDER: SERVICES ─────────────────────────────────── */
function renderServices() {
  const s = D.sections.services;
  document.getElementById("servicesHeader").innerHTML = headerHTML(s.eyebrow, s.title, s.titleAccent, s.subtitle);
  document.getElementById("servicesGrid").innerHTML = D.services.map((service, i) => `
    <div class="service-card" data-tilt>
      <div class="service-img"><img src="${esc(service.image)}" alt="${esc(service.name)}" loading="lazy" /></div>
      <div class="service-icon" style="--icon-color:${esc(service.color)}">${service.icon}</div>
      <h3 class="service-name">${esc(service.name)}</h3>
      ${service.price ? `<div class="service-price">${esc(service.price)}</div>` : ''}
      <p class="service-desc">${esc(service.desc)}</p>
      <a href="#appointment" class="service-link" onclick="selectServiceForAppointment('${esc(service.name)}')">Book Now →</a>
    </div>
  `).join("");
}

/* ── RENDER: PRICING ──────────────────────────────────── */
function renderPricing() {
  const header = document.getElementById("pricingHeader");
  const grid = document.getElementById("pricingGrid");
  if (!header || !grid) return;
  
  const p = D.sections.pricing || {
    eyebrow: "Clear & Transparent",
    title: "Our",
    titleAccent: "Pricing",
    subtitle: "No hidden charges, just premium care for your clothes."
  };
  
  header.innerHTML = headerHTML(p.eyebrow, p.title, p.titleAccent, p.subtitle);
  grid.innerHTML = D.services.map((service, i) => `
    <div class="service-card" data-tilt>
      <div class="service-img"><img src="${esc(service.image)}" alt="${esc(service.name)}" loading="lazy" /></div>
      <div class="service-icon" style="--icon-color:${esc(service.color)}">${service.icon}</div>
      <h3 class="service-name">${esc(service.name)}</h3>
      ${service.price ? `<div class="service-price">${esc(service.price)}</div>` : ''}
      <p class="service-desc">${esc(service.desc)}</p>
      <a href="#appointment" class="service-link" onclick="selectServiceForAppointment('${esc(service.name)}')">Book Now →</a>
    </div>
  `).join("");
}

/* ── RENDER: WHY US ───────────────────────────────────── */
function renderWhy() {
  const s = D.sections.whyUs;
  document.getElementById("whyHeader").innerHTML = headerHTML(s.eyebrow, s.title, s.titleAccent, s.subtitle);
  document.getElementById("whyGrid").innerHTML = D.whyUs.map(item => `
    <div class="why-card">
      <div class="why-num">${esc(item.num)}</div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.desc)}</p>
    </div>
  `).join("");
}

/* ── RENDER: ACADEMY (unique to skincare branch) ──────── */
function renderAcademy() {
  const ac = D.academic;
  const secEl = document.getElementById("academic");
  if (!ac || ac.enabled === false) {
    if (secEl) secEl.style.display = "none";
    return;
  } else {
    if (secEl) secEl.style.display = "";
  }
  document.getElementById("academicInner").innerHTML = `
    <div class="academy-header">
      <p class="section-eyebrow eyebrow-light">${esc(ac.eyebrow)}</p>
      <h2 class="section-title title-light">${esc(ac.title)} <span class="accent">${esc(ac.titleAccent)}</span></h2>
      <p class="section-subtitle" style="color:rgba(255,255,255,0.6);max-width:600px;margin:0 auto 60px">${esc(ac.subtitle)}</p>
    </div>

    <div class="academy-inner">
      <div class="academy-text-col">
        ${ac.desc.map(d => `<p class="academy-desc">${esc(d)}</p>`).join("")}

        <div class="academy-stats">
          ${ac.stats.map(s => `
            <div class="academy-stat">
              <strong>${esc(s.value)}</strong>
              <span>${esc(s.label)}</span>
            </div>
          `).join("")}
        </div>

        <div class="academy-features">
          ${ac.features.map(f => `
            <div class="academy-feat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              ${esc(f)}
            </div>
          `).join("")}
        </div>
        <a href="#appointment" class="btn btn-gold">${esc(ac.btnLabel)}</a>
      </div>

      <div class="courses-grid">
        ${ac.courses.map(c => `
          <div class="course-card">
            ${c.image ? `<div class="course-img"><img src="${esc(c.image)}" alt="${esc(c.title)}" loading="lazy" /></div>` : ''}
            <div class="course-content">
              <div class="course-num">${esc(c.num)}</div>
              <h4>${esc(c.title)}</h4>
              <p>${esc(c.desc)}</p>
              <div class="course-meta">
                <span class="course-duration">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${esc(c.duration)}
                </span>
                <span class="course-level level-${esc((c.level || 'beginner').toLowerCase())}">${esc(c.level)}</span>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

/* ── RENDER: FOUNDER / DOCTOR ─────────────────────────── */
function renderDoctor() {
  const doc = D.doctor;
  document.getElementById("doctorInner").innerHTML = `
    <div class="doctor-img-col">
      <div class="doctor-expertise-card">
        <div class="expertise-icon">✦</div>
        <h3>${esc(doc.expertise.title)}</h3>
        <ul>
          ${doc.expertise.points.map(p => `<li>${esc(p)}</li>`).join("")}
        </ul>
        <div class="expertise-note">${esc(doc.expertise.note)}</div>
      </div>
    </div>
    <div class="doctor-text-col">
      <p class="section-eyebrow">${esc(doc.eyebrow)}</p>
      <h2 class="section-title">${esc(doc.name)}</h2>
      <p class="doctor-degree">${esc(doc.degree)}</p>
      ${doc.bio.map(b => {
        let text = b;
        if (!isAcademyEnabled) {
          text = text.replace(/(\s*-\s*)?and trained (hundreds|thousands) of students to do the same\.?/i, ".");
          text = text.replace(/\s\./g, ".");
        }
        return `<p class="doctor-bio">${esc(text)}</p>`;
      }).join("")}
      <div class="doctor-credentials">
        ${doc.credentials
          .filter(c => isAcademyEnabled || !c.label.toLowerCase().includes("student"))
          .map(c => `
            <div class="cred-item"><strong>${esc(c.value)}</strong><span>${esc(c.label)}</span></div>
          `).join("")}
      </div>
      <a href="#appointment" class="btn btn-primary">${esc(doc.btnLabel)}</a>
    </div>
  `;
}

/* ── RENDER: GALLERY / SHOWCASE ───────────────────────── */
function renderGallery() {
  const g = D.gallery;
  const secEl = document.getElementById("gallery");
  if (!g || g.enabled === false) {
    if (secEl) secEl.style.display = "none";
    return;
  } else {
    if (secEl) secEl.style.display = "";
  }

  
  // Render filters
  const cats = g.categories || ["All"];
  if (!cats.includes("All")) {
    cats.unshift("All");
  }
  document.getElementById("galleryFilters").innerHTML = cats.map((cat, i) => `
    <button class="gallery-filter-btn${i === 0 ? " active" : ""}" data-filter="${esc(cat)}">${esc(cat)}</button>
  `).join("");
  
  // Render grid items
  const items = g.items || [];
  document.getElementById("galleryGrid").innerHTML = items.map((item, i) => `
    <div class="gallery-item" data-cat="${esc(item.category)}" onclick="openLightbox(${i})">
      <img src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy" />
      <div class="gallery-item-overlay">
        <span>${esc(item.category)}</span>
        <h4>${esc(item.title)}</h4>
      </div>
    </div>
  `).join("");
  
  // Wire up filters
  const filterBtns = document.querySelectorAll(".gallery-filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");
  
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const filterValue = btn.getAttribute("data-filter");
      
      galleryItems.forEach(item => {
        const itemCat = item.getAttribute("data-cat");
        if (filterValue === "All" || itemCat === filterValue) {
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
        }
      });
    });
  });
}

// Lightbox controller
window.openLightbox = function(index) {
  const g = D.gallery;
  if (!g || !g.items || !g.items[index]) return;
  const item = g.items[index];
  
  const modal = document.getElementById("lightboxModal");
  const img = document.getElementById("lightboxImg");
  const caption = document.getElementById("lightboxCaption");
  
  if (!modal || !img || !caption) return;
  
  img.src = item.image;
  caption.innerHTML = `<span style="color:#38BDF8; font-weight:700">${esc(item.category)}</span> — <strong>${esc(item.title)}</strong>`;
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
};

/* ── RENDER: TESTIMONIALS ─────────────────────────────── */
function renderTestimonials() {
  const s = D.sections.testimonials || {};
  let title = s.title || "";
  let subtitle = s.subtitle || "";
  if (!isAcademyEnabled) {
    title = title.replace(/\s*&\s*Students/i, "");
    subtitle = subtitle.replace(/\s*and\s*students/i, "");
  }
  document.getElementById("testiHeader").innerHTML = headerHTML(s.eyebrow, title, s.titleAccent, subtitle);
  
  const filteredTestimonials = D.testimonials.filter(ti => isAcademyEnabled || (!ti.role.toLowerCase().includes("student") && !ti.text.toLowerCase().includes("course")));
  
  document.getElementById("testiGrid").innerHTML = filteredTestimonials.map(ti => `
    <div class="testi-card${ti.featured ? " testi-featured" : ""}">
      <div class="testi-stars">${"★".repeat(ti.stars)}${"☆".repeat(Math.max(0, 5 - ti.stars))}</div>
      <p class="testi-text">"${esc(ti.text)}"</p>
      <div class="testi-author">
        <div class="testi-avatar" style="background:${esc(ti.avatar)}">${esc((ti.name || "?").charAt(0))}</div>
        <div>
          <strong>${esc(ti.name)}</strong>
          <span>${esc(ti.role)}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function getServiceCategoryOptionsHTML() {
  const options = [];
  
  // 1. Live Services from server/database
  if (Array.isArray(D.services) && D.services.length > 0) {
    const serviceOpts = D.services
      .map(s => typeof s === "string" ? s : (s?.name || s?.title))
      .filter(Boolean);
    if (serviceOpts.length > 0) {
      options.push({ group: "Our Services", items: serviceOpts });
    }
  }

  // 2. Live Pricing Packages if configured
  if (Array.isArray(D.pricing) && D.pricing.length > 0) {
    const pricingOpts = D.pricing
      .map(p => typeof p === "string" ? p : (p?.name || p?.title))
      .filter(p => p && !options.some(g => g.items.includes(p)));
    if (pricingOpts.length > 0) {
      options.push({ group: "Pricing Packages", items: pricingOpts });
    }
  }

  // 3. Live Academy Courses if enabled
  if (isAcademyEnabled && Array.isArray(D.academic?.courses) && D.academic.courses.length > 0) {
    const courseOpts = D.academic.courses
      .map(c => typeof c === "string" ? c : (c?.name || c?.title))
      .filter(Boolean);
    if (courseOpts.length > 0) {
      options.push({ group: "Academy & Courses", items: courseOpts });
    }
  }

  // Fallback if no services are defined yet
  if (options.length === 0) {
    if (Array.isArray(D.appointment?.treatmentOptions) && D.appointment.treatmentOptions.length > 0) {
      return D.appointment.treatmentOptions.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
    }
    return `<option value="General Laundry Service">General Laundry Service</option>`;
  }

  if (options.length === 1) {
    return options[0].items.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join("");
  }

  return options.map(grp => `
    <optgroup label="${esc(grp.group)}">
      ${grp.items.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join("")}
    </optgroup>
  `).join("");
}

window.selectServiceForAppointment = function (serviceName) {
  const selectEl = document.getElementById("treatment");
  if (selectEl && serviceName) {
    let found = false;
    for (let i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].value.toLowerCase() === serviceName.toLowerCase() || selectEl.options[i].text.toLowerCase() === serviceName.toLowerCase()) {
        selectEl.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      const newOpt = document.createElement("option");
      newOpt.value = serviceName;
      newOpt.text = serviceName;
      newOpt.selected = true;
      selectEl.appendChild(newOpt);
    }
  }
};

/* ── RENDER: APPOINTMENT ──────────────────────────────── */
function renderAppointment() {
  const a = D.appointment;
  const labelName = a.labels?.name && !a.labels.name.toLowerCase().includes("patient") ? a.labels.name : "Full Name *";
  const labelPhone = a.labels?.phone || "Mobile Number *";
  const labelDate = a.labels?.date || "Preferred Pickup Date *";
  const labelTime = a.labels?.time || "Preferred Time Slot *";
  const labelTreatment = a.labels?.treatment || "Service / Category Required *";
  const labelMessage = a.labels?.message && !a.labels.message.toLowerCase().includes("concern") ? a.labels.message : "Special Instructions / Garment Notes (Optional)";

  const phName = a.placeholders?.name || "Your full name";
  const phPhone = a.placeholders?.phone || "+91 XXXXXXXXXX";
  const phTime = a.placeholders?.time || "Select time slot";
  const phTreatment = a.placeholders?.treatment || "Select service category";
  const phMessage = a.placeholders?.message && !a.placeholders.message.toLowerCase().includes("skin") ? a.placeholders.message : "Any specific stains, delicate fabrics, pickup instructions, or special requests...";

  document.getElementById("apptInner").innerHTML = `
    <div class="appt-info">
      <p class="section-eyebrow">${esc(a.eyebrow || "Book Pickup")}</p>
      <h2 class="section-title">${esc(a.title || "Ready for")} <span class="accent">${esc(a.titleAccent || "Fresh Clothes?")}</span></h2>
      <p class="appt-desc">${esc(a.desc || "Fill out the form below and your details will be sent directly to us on WhatsApp.")}</p>
      <div class="appt-features">
        ${(a.features || []).map(f => `
          <div class="appt-feat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${esc(f)}
          </div>
        `).join("")}
      </div>
      <div class="clinic-hours">
        <h4>${esc(a.hoursTitle || "Store & Pickup Hours")}</h4>
        ${D.hours.map(h => `
          <div class="hours-row"><span>${esc(h.days)}</span><span>${esc(h.time)}</span></div>
        `).join("")}
      </div>
    </div>
    <div class="appt-form-wrap">
      <div class="appt-form-card">
        <div class="form-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#25D366"/></svg>
          <span>${esc(a.formTitle || "Book Pickup via WhatsApp")}</span>
        </div>
        <div id="formErrorSummary" class="form-error-summary hidden" role="alert" tabindex="-1" aria-labelledby="errorSummaryTitle">
          <h4 id="errorSummaryTitle">There is a problem</h4>
          <ul id="errorSummaryList"></ul>
        </div>
        <div class="appt-form" id="appointmentForm">
          <div class="form-group">
            <label for="patientName">${esc(labelName)}</label>
            <input type="text" id="patientName" placeholder="${esc(phName)}" required />
          </div>
          <div class="form-group">
            <label for="patientPhone">${esc(labelPhone)}</label>
            <input type="tel" id="patientPhone" placeholder="${esc(phPhone)}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="preferredDate">${esc(labelDate)}</label>
              <input type="date" id="preferredDate" required />
            </div>
            <div class="form-group">
              <label for="preferredTime">${esc(labelTime)}</label>
              <select id="preferredTime" required>
                <option value="">${esc(phTime)}</option>
                ${(a.timeOptions || []).map(t => `<option>${esc(t)}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="treatment">${esc(labelTreatment)}</label>
            <select id="treatment" required>
              <option value="">${esc(phTreatment)}</option>
              ${getServiceCategoryOptionsHTML()}
            </select>
          </div>
          <div class="form-group">
            <label for="message">${esc(labelMessage)}</label>
            <textarea id="message" rows="3" placeholder="${esc(phMessage)}"></textarea>
          </div>
          <button type="button" class="btn btn-whatsapp btn-full" id="submitBtn" onclick="bookOnWhatsApp()">${waSvg(20)} ${esc(a.submitLabel || "Book Pickup on WhatsApp")}</button>
          <p class="form-note">${esc(a.formNote || "By submitting, you agree to be contacted on WhatsApp for pickup confirmation.")}</p>
        </div>
      </div>
    </div>
  `;
}

/* ── RENDER: CONTACT ──────────────────────────────────── */
function renderContact() {
  const c = D.contactSection;
  const w = D.whatsapp;
  const contactHours = D.hours.map(h => `${esc(h.days)}: ${esc(h.time)}`).join("<br/>");

  document.getElementById("contactHeader").innerHTML = `
    <p class="section-eyebrow">${esc(c.eyebrow)}</p>
    <h2 class="section-title">${esc(c.title)} <span class="accent">— ${esc(c.titleBranch)}</span></h2>
  `;

  document.getElementById("contactInner").innerHTML = `
    <div class="contact-details">
      <div class="contact-card">
        <div class="contact-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div>
          <h4>Address</h4>
          <p>${esc(D.contact.address)}</p>
        </div>
      </div>
      <div class="contact-card">
        <div class="contact-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>
        <div>
          <h4>Phone / WhatsApp</h4>
          <p><a href="tel:${esc(w.display)}">${esc(w.display)}</a></p>
        </div>
      </div>
      <div class="contact-card">
        <div class="contact-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <div>
          <h4>Email</h4>
          <p><a href="mailto:${esc(D.contact.email)}">${esc(D.contact.email)}</a></p>
        </div>
      </div>
      <div class="contact-card">
        <div class="contact-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <h4>Studio Hours</h4>
          <p>${contactHours}</p>
        </div>
      </div>
      <a href="${waHref()}" target="_blank" class="btn btn-whatsapp contact-wa">${waSvg(18)} ${esc(c.waButton)}</a>
    </div>
    <div class="map-wrap">
      ${D.contact.mapEmbed && D.contact.mapEmbed.includes("/embed") ? `
        <iframe src="${esc(D.contact.mapEmbed)}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      ` : `
        <div class="simple-map-card">
          <div class="map-card-icon">📍</div>
          <h4>Our Clinic Location</h4>
          <p class="map-card-address">${esc(D.contact.address)}</p>
          <p class="map-card-desc">Click the button below to view the interactive map and get directions on Google Maps.</p>
          <a href="${esc(D.contact.mapEmbed || '#')}" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; margin-top: 10px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Open in Google Maps
          </a>
        </div>
      `}
    </div>
  `;
}

/* ── RENDER: FOOTER ───────────────────────────────────── */
function renderFooter() {
  const s = D.site;
  const f = D.footer;
  const w = D.whatsapp;
  const wa = waHref();

  updateAcademyFlag();
  const filteredQuickLinks = f.quickLinks.filter(l => isAcademyEnabled || l.href !== "#academic");

  document.getElementById("footerInner").innerHTML = `
    <div class="footer-brand">
      <a href="#" class="logo logo-light">
        <div class="logo-icon">${brandSvg(28)}</div>
        <div class="logo-text">
          <span class="logo-name">${esc(s.name)}</span>
          <span class="logo-sub">${esc(s.tagline)}</span>
        </div>
      </a>
      <p class="footer-tagline">${esc(s.footerTagline)}</p>
      <div class="footer-social">
        ${f.social.filter(soc => soc.enabled !== false).map(soc => {
          const href = soc.href === "whatsapp" ? wa : soc.href;
          if (soc.href === "#") {
            return `<a href="javascript:void(0)" aria-label="${esc(soc.label)} (coming soon)" title="${esc(soc.label)} — link coming soon" class="social-link social-placeholder" role="button">${soc.icon}</a>`;
          }
          return `<a href="${esc(href)}" aria-label="${esc(soc.label)}" class="social-link"${soc.href === "whatsapp" || soc.href.startsWith("http") ? ' target="_blank"' : ""}>${soc.icon}</a>`;
        }).join("")}
      </div>
    </div>
    <div class="footer-links">
      <h4>Services</h4>
      <ul>
        ${f.servicesLinks.map(l => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}
      </ul>
    </div>
    <div class="footer-links">
      <h4>Quick Links</h4>
      <ul>
        ${filteredQuickLinks.map(l => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}
      </ul>
    </div>
    <div class="footer-contact">
      <h4>Contact</h4>
      <p>${esc(D.contact.address)}</p>
      <p class="phone-link"><a href="tel:${esc(w.display)}">${esc(w.display)}</a></p>
      <p><a href="mailto:${esc(D.contact.email)}">${esc(D.contact.email)}</a></p>
      <a href="${wa}" target="_blank" class="btn btn-whatsapp footer-wa">${waSvg(16)} WhatsApp Us</a>
    </div>
  `;

  document.getElementById("footerBottom").innerHTML = `
    <p>${esc(s.copyright)}</p>
    <p>${esc(s.credit)}</p>
  `;
}

/* ── RENDER: FLOATING WHATSAPP ────────────────────────── */
function renderFloat() {
  const el = document.getElementById("whatsappFloat");
  el.href = waHref();
  el.innerHTML = `${waSvg(28)}<span class="whatsapp-float-label">Book Now</span>`;
}

/* ── RENDER ALL ───────────────────────────────────────── */
function renderAll() {
  applyMeta();
  renderHeader();
  renderHero();
  renderAbout();
  renderServices();
  renderPricing();
  renderWhy();
  renderAcademy();
  renderDoctor();
  renderGallery();
  renderTestimonials();
  renderAppointment();
  renderContact();
  renderFooter();
  renderFloat();
}

/* ═══════════════════════════════════════════════════════
   BEHAVIOURS
   ═══════════════════════════════════════════════════════ */
function initBehaviours() {
  const header = document.getElementById("header");

  /* ── SCROLL PROGRESS BAR ── */
  const progressBar = document.getElementById("scrollProgress");
  window.addEventListener("scroll", () => {
    if (!progressBar) return;
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = `${Math.min(100, (scrollTop / docHeight) * 100)}%`;
  }, { passive: true });

  /* ── HEADER SCROLL EFFECT ── */
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
  }, { passive: true });

  /* ── HAMBURGER ── */
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("nav");
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    nav.classList.toggle("open");
    document.body.style.overflow = nav.classList.contains("open") ? "hidden" : "";
  });
  document.querySelectorAll(".nav-link, .nav-cta-btn").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      nav.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
  document.addEventListener("click", e => {
    if (nav.classList.contains("open") && !nav.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.classList.remove("active");
      nav.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  /* ── ACTIVE NAV LINK ── */
  const sections = Array.from(document.querySelectorAll("section[id]")).filter(s => s.style.display !== "none");
  const navLinks = document.querySelectorAll(".nav-link");
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(l => l.classList.toggle("active-link", l.getAttribute("href") === `#${id}`));
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach(s => secObs.observe(s));

  /* ── SCROLL REVEAL ── */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reveals = Array.from(document.querySelectorAll(
    ".service-card, .why-card, .testi-card, .about-feat, .contact-card, .experience-card, .appt-feat, .cred-item, .course-card, .academy-feat, .academy-stat"
  )).filter(el => {
    const parentSec = el.closest("section");
    return !parentSec || parentSec.style.display !== "none";
  });

  if (reducedMotion.matches) {
    reveals.forEach(el => el.classList.add("visible"));
  } else {
    reveals.forEach((el, idx) => {
      // Map elements to custom reveal styles
      if (el.classList.contains("service-card") || el.classList.contains("course-card")) {
        el.classList.add("reveal-scale");
      } else if (el.classList.contains("about-feat") || el.classList.contains("appt-feat") || el.classList.contains("cred-item")) {
        el.classList.add("reveal-left");
      } else if (el.classList.contains("contact-card") || el.classList.contains("experience-card")) {
        el.classList.add("reveal-right");
      } else {
        el.classList.add("reveal-up");
      }
      el.dataset.revealIndex = idx % 4; // Max stagger delay is 300ms
    });
    const ro = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.revealIndex || 0) * 100;
          setTimeout(() => { entry.target.classList.add("visible"); ro.unobserve(entry.target); }, delay);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => ro.observe(el));
  }

  /* ── SECTION HEADER REVEAL ── */
  const headers = document.querySelectorAll(".section-header, .about-text-col, .appt-info, #contactHeader, .academy-header");
  if (reducedMotion.matches) {
    headers.forEach(el => el.classList.add("header-visible"));
  } else {
    headers.forEach(el => {
      const parentSec = el.closest("section");
      if (parentSec && parentSec.style.display === "none") return;
      el.classList.add("reveal-header");
      new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("header-visible"); } });
      }, { threshold: 0.15 }).observe(el);
    });
  }

  /* ── SET MIN DATE ── */
  const dateInput = document.getElementById("preferredDate");
  if (dateInput) {
    const t = new Date();
    dateInput.min = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  }

  /* ── SMOOTH SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", e => {
      const id = anchor.getAttribute("href");
      if (id === "#") return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 72), behavior: "smooth" });
      }
    });
  });

  /* ── FLOATING WA HIDE/SHOW ── */
  const waFloat = document.getElementById("whatsappFloat");
  let lastY = 0;
  window.addEventListener("scroll", () => {
    if (!waFloat) return;
    const y = window.scrollY;
    waFloat.style.transform = y > lastY + 60 ? "translateY(120%)" : "";
    waFloat.style.opacity   = y > lastY + 60 ? "0" : "";
    lastY = y;
  }, { passive: true });

  /* ── HERO SCROLL PARALLAX ── */
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const img = document.querySelector(".hero-bg-img img");
    if (y < window.innerHeight && img && !reducedMotion.matches) {
      img.style.transform = `translate3d(0, ${y * 0.32}px, 0) scale(${1 + y * 0.00012})`;
    }
  }, { passive: true });

  /* ── MOUSE GLOW FOLLOWER ── */
  const glow1 = document.querySelector(".glow-blob-1");
  if (glow1 && !reducedMotion.matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 3;
    let posX = mouseX;
    let posY = mouseY;

    window.addEventListener("mousemove", e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function animGlow() {
      posX += (mouseX - posX) * 0.05;
      posY += (mouseY - posY) * 0.05;
      // Offset by 225px to center the 450px glow-blob under the cursor
      glow1.style.transform = `translate3d(${posX - 225}px, ${posY - 225}px, 0)`;
      requestAnimationFrame(animGlow);
    }
    animGlow();
  }

  /* ── COUNTER ANIMATION ── */
  function animateCounter(el, target, suffix = "") {
    let v = 0;
    const step = target / (1800 / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { v = target; clearInterval(t); }
      el.textContent = Math.floor(v) + suffix;
    }, 16);
  }
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.counted) {
        e.target.dataset.counted = "true";
        const raw = e.target.textContent;
        const num = parseInt(raw.replace(/\D/g,""), 10);
        if (!isNaN(num)) animateCounter(e.target, num, raw.replace(/[\d]/g,""));
      }
    });
  }, { threshold: 0.5 }).observe && (() => {
    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !e.target.dataset.counted) {
          e.target.dataset.counted = "true";
          const raw = e.target.textContent;
          const num = parseInt(raw.replace(/\D/g,""), 10);
          if (!isNaN(num)) animateCounter(e.target, num, raw.replace(/[\d]/g,""));
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll(".trust-item strong, .cred-item strong, .academy-stat strong").forEach(el => co.observe(el));
  })();

  /* ── CARD TILT EFFECT ── */
  if (!reducedMotion.matches) {
    document.querySelectorAll("[data-tilt]").forEach(card => {
      card.style.transition = "transform 0.1s ease, box-shadow 0.1s ease";
      card.addEventListener("mousemove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-10px)`;
        card.style.boxShadow = "var(--shadow-lg), 0 20px 50px rgba(139, 92, 246, 0.15)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
        card.style.transform = "";
        card.style.boxShadow = "";
      });
    });
  }

  /* ── TYPEWRITER ON HERO ACCENT ── */
  const tw = document.getElementById("heroTypewriter");
  if (tw) {
    const full = tw.textContent;
    tw.textContent = "";
    tw.style.borderRight = "3px solid var(--rose)";
    let i = 0;
    const type = () => {
      if (i <= full.length) { tw.textContent = full.slice(0, i++); setTimeout(type, 80); }
      else { setTimeout(() => { tw.style.borderRight = "none"; }, 1200); }
    };
    setTimeout(type, 700);
  }

  /* ── PROCESS STEP STAGGER ── */
  const processSteps = document.querySelectorAll(".process-step");
  processSteps.forEach((el, i) => {
    el.style.cssText = `opacity:0;transform:translateX(-20px);transition:opacity 0.5s ease ${i*120}ms,transform 0.5s ease ${i*120}ms`;
  });
  const processCard = document.querySelector(".care-process-card");
  if (processCard) {
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          processSteps.forEach(s => { s.style.opacity = "1"; s.style.transform = "translateX(0)"; });
        }
      });
    }, { threshold: 0.3 }).observe(processCard);
  }

  /* ── FORM FOCUS & VALIDATION ── */
  document.querySelectorAll(".form-group input,.form-group select,.form-group textarea").forEach(inp => {
    inp.addEventListener("focus", () => inp.parentElement.classList.add("field-focused"));
    inp.addEventListener("blur",  () => {
      inp.parentElement.classList.remove("field-focused");
      if (inp.hasAttribute('required') && !inp.value.trim()) {
        showFormError(inp.id, "This field is required.");
      } else if (inp.id === "patientPhone" && inp.value.trim() && !isValidPhone(inp.value.trim())) {
        showFormError(inp.id, "Please enter a valid phone number.");
      } else {
        clearFormError(inp);
      }
    });
  });

  /* ── LIGHTBOX MODAL EVENTS ── */
  const lbModal = document.getElementById("lightboxModal");
  const lbClose = document.getElementById("lightboxClose");
  if (lbModal && lbClose) {
    lbClose.addEventListener("click", () => {
      lbModal.style.display = "none";
      lbModal.setAttribute("aria-hidden", "true");
    });
    lbModal.addEventListener("click", (e) => {
      if (e.target === lbModal) {
        lbModal.style.display = "none";
        lbModal.setAttribute("aria-hidden", "true");
      }
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lbModal.style.display === "block") {
        lbModal.style.display = "none";
        lbModal.setAttribute("aria-hidden", "true");
      }
    });
  }

  console.log(`%c✨ ${D.site.name} Loaded`, "color:#38BDF8;font-size:14px;font-weight:bold");
}

/* ── WHATSAPP BOOKING ─────────────────────────────────── */
function bookOnWhatsApp() {
  const name      = document.getElementById("patientName").value.trim();
  const phone     = document.getElementById("patientPhone").value.trim();
  const date      = document.getElementById("preferredDate").value;
  const time      = document.getElementById("preferredTime").value;
  const treatment = document.getElementById("treatment").value;
  const message   = document.getElementById("message").value.trim();

  const summaryContainer = document.getElementById("formErrorSummary");
  const summaryList = document.getElementById("errorSummaryList");
  
  if (summaryContainer && summaryList) {
    summaryList.innerHTML = "";
    summaryContainer.classList.add("hidden");
  }

  let errors = [];
  if (!name)                        errors.push({ id: "patientName", msg: "Please enter your full name." });
  if (!phone)                       errors.push({ id: "patientPhone", msg: "Please enter your mobile number." });
  else if (!isValidPhone(phone))    errors.push({ id: "patientPhone", msg: "Please enter a valid phone number." });
  if (!date)                        errors.push({ id: "preferredDate", msg: "Please select a preferred date." });
  if (!time)                        errors.push({ id: "preferredTime", msg: "Please select a preferred time." });
  if (!treatment)                   errors.push({ id: "treatment", msg: "Please select the service required." });

  if (errors.length > 0) {
    errors.forEach(err => showFormError(err.id, err.msg));
    if (summaryContainer && summaryList) {
      errors.forEach(err => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#${err.id}">${err.msg}</a>`;
        summaryList.appendChild(li);
      });
      summaryContainer.classList.remove("hidden");
      summaryContainer.focus();
    }
    return;
  }

  const displayDate = new Date(date).toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  // BUG FIX: filter(Boolean) removes empty strings
  const waMessage = [
    `🧺 *Pickup & Laundry Request — ${D.site.name}*`,
    ``,
    `👤 *Name:* ${name}`,
    `📱 *Mobile:* ${phone}`,
    `📅 *Pickup Date:* ${displayDate}`,
    `🕐 *Time Slot:* ${time}`,
    `✨ *Service Category:* ${treatment}`,
    message ? `💬 *Special Instructions / Notes:* ${message}` : ``,
    ``,
    `_Sent from ${D.site.name} online booking portal._`
  ].filter(Boolean).join("\n");

  const btn = document.getElementById("submitBtn");
  btn.textContent = "Opening WhatsApp...";
  btn.style.opacity = "0.8";
  btn.style.pointerEvents = "none";

  setTimeout(() => {
    window.open(`https://wa.me/${D.whatsapp.number}?text=${encodeURIComponent(waMessage)}`, "_blank");
    btn.innerHTML = `${waSvg(20)} ✅ Sent!`;
    btn.style.background = "#16a34a";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
    setTimeout(() => { btn.innerHTML = `${waSvg(20)} ${D.appointment.submitLabel}`; btn.style.background = ""; }, 3000);
  }, 400);
}

function showFormError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  clearFormError(field);
  field.style.borderColor = "#DC2626";
  field.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.15)";
  const err = document.createElement("p");
  err.className = "form-error";
  err.style.cssText = "color:#DC2626;font-size:12px;margin-top:5px;font-weight:500;";
  err.innerHTML = `⚠️ ${message}`;
  field.parentNode.appendChild(err);
  const clear = () => { clearFormError(field); field.removeEventListener("input", clear); field.removeEventListener("change", clear); };
  field.addEventListener("input", clear);
  field.addEventListener("change", clear);
}

function clearFormError(field) {
  field.style.borderColor = "";
  field.style.boxShadow = "";
  const e = field.parentNode.querySelector(".form-error");
  if (e) e.remove();
}

function isValidPhone(phone) {
  return /^\d{7,15}$/.test(phone.replace(/[\s\-\+\(\)]/g,""));
}

/* ── SUPABASE CONFIG & KEEP-ALIVE ──────────────────────── */
function getEffectiveSupabaseConfig() {
  try {
    const custom = localStorage.getItem("custom_supabase_config");
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
      }
    }
  } catch (e) {}
  const cfg = window.SUPABASE_CONFIG || {};
  return { url: (cfg.url || "").trim(), anonKey: (cfg.anonKey || "").trim() };
}

function initSupabaseKeepAlive() {
  async function pingKeepAlive() {
    try {
      const cfg = getEffectiveSupabaseConfig();
      if (!cfg.url || !cfg.anonKey) return;
      const ka = D?.keepAlive || { enabled: true, intervalDays: 1 };
      if (ka.enabled === false) return;

      const intervalDays = Math.max(1, Math.min(6, parseInt(ka.intervalDays, 10) || 1));
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const lastPing = parseInt(localStorage.getItem("supabase_last_keepalive_ping") || "0", 10);
      
      if (now - lastPing >= intervalMs) {
        await fetch(`${cfg.url}/rest/v1/site_settings?select=id&limit=1`, {
          method: "GET",
          headers: {
            "apikey": cfg.anonKey,
            "Authorization": `Bearer ${cfg.anonKey}`
          }
        });
        localStorage.setItem("supabase_last_keepalive_ping", now.toString());
        console.log(`Supabase keep-alive ping triggered (Interval: ${intervalDays} day(s)).`);
      }
    } catch (e) {
      console.warn("Supabase keep-alive ping error:", e);
    }
  }

  pingKeepAlive();
  setInterval(pingKeepAlive, 60 * 60 * 1000);
}

/* ── BOOT ─────────────────────────────────────────────── */
(async function boot() {
  let loadedFromSupabase = false;
  try {
    const cfg = getEffectiveSupabaseConfig();
    if (cfg.url && cfg.anonKey && window.supabase) {
      const { createClient } = window.supabase;
      const client = createClient(cfg.url, cfg.anonKey);
      const { data, error } = await client
        .from("site_settings")
        .select("content")
        .eq("id", 1)
        .maybeSingle();
      
      if (!error && data && data.content) {
        D = data.content;
        
        // Safety: if the database row doesn't contain a newly introduced config block (like gallery), merge from local data.json
        try {
          const res = await fetch("data.json", { cache: "no-store" });
          const defaultData = await res.json();
          for (const key in defaultData) {
            if (D[key] === undefined) {
              D[key] = defaultData[key];
            }
          }
        } catch (mergeErr) {
          console.warn("Client fallback merge failed:", mergeErr);
        }
        
        loadedFromSupabase = true;
        console.log("Loaded configuration dynamically from Supabase database.");
      } else if (error) {
        console.warn("Supabase query error, falling back to local data.json:", error.message);
      }
    }
  } catch(supabaseErr) {
    console.warn("Failed to connect or load from Supabase, trying local fallback:", supabaseErr);
  }

  if (!loadedFromSupabase) {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      D = await res.json();
      console.log("Loaded configuration from local fallback data.json.");
    } catch(err) {
      console.error("Failed to load data.json", err);
      document.body.insertAdjacentHTML("afterbegin",
        `<div style="background:#7C3AED;color:#fff;padding:12px 24px;font-family:sans-serif;text-align:center;">Failed to load site data — check configurations and files.</div>`);
      return;
    }
  }

  // Initialize keep-alive with latest server settings
  initSupabaseKeepAlive();

  try {
    if (D.site.themeEnabled) {
      applyCustomThemeStyles(D.site.customTheme);
      document.body.className = "theme-" + (D.site.theme || "default");
    } else {
      applyCustomThemeStyles(null);
      document.body.className = "theme-default";
    }
    renderAll();
    initBehaviours();
  } catch (renderErr) {
    console.error("Error rendering content:", renderErr);
  }
})();

// Real-time Preview synchronization receiver from Admin panel
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_PREVIEW_DATA") {
    D = event.data.data;
    console.log("Real-time preview config updated from admin editor!");
    try {
      if (D.site.themeEnabled) {
        applyCustomThemeStyles(D.site.customTheme);
        document.body.className = "theme-" + (D.site.theme || "default");
      } else {
        applyCustomThemeStyles(null);
        document.body.className = "theme-default";
      }
      renderAll();
      // Re-initialize slider timers if needed
      if (D.hero && D.hero.slides && Array.isArray(D.hero.slides) && D.hero.slides.length > 0) {
        startHeroSlider(D.hero.slides);
      }
    } catch(err) {
      console.error("Failed to render preview update:", err);
    }
  }
});

// Dynamic custom theme override styles helper
function applyCustomThemeStyles(themeObj) {
  let styleEl = document.getElementById("custom-theme-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "custom-theme-style";
    document.head.appendChild(styleEl);
  }
  
  if (themeObj && (D.site.theme === 'custom') && D.site.themeEnabled) {
    const bg = themeObj.background || "#1a0a2e";
    const acc = themeObj.accent || "#0284C7";
    const accHover = themeObj.accentHover || "#DB2777";
    
    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.replace("#", ""), 16);
      if (isNaN(bigint)) return "2, 132, 199"; // fallback blue
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r}, ${g}, ${b}`;
    };
    
    const bgRgb = hexToRgb(bg);
    const accRgb = hexToRgb(acc);
    
    const escapedAcc = encodeURIComponent(acc);
    styleEl.innerHTML = `
      body.theme-custom {
        --plum: ${bg};
        --plum-rgb: ${bgRgb};
        --rose: ${acc};
        --rose-rgb: ${accRgb};
        --rose2: ${accHover};
        --purple: ${acc};
        --ring-rgb: ${accRgb};
        --blush: rgba(${accRgb}, 0.08);
        --border: rgba(${accRgb}, 0.2);
        --text: ${acc};
        --select-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${escapedAcc}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      }
    `;
  } else {
    styleEl.innerHTML = "";
  }
}
