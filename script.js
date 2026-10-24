/* =============================================
   SCRIPT.JS – ZENTRIX TECHNOLOGIES
   Complete Client-Side Routing & Dynamic Logic
   ============================================= */

/* ---- Dark / Light Theme Toggle ---- */
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('zentrix-theme', theme);
  if (themeToggle) {
    const isDark = theme === 'dark';
    themeToggle.setAttribute('title', isDark ? 'Click sun to switch to White mode' : 'Click moon to switch to Dark mode');
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to White mode' : 'Switch to Dark mode');
  }
}

// Load saved theme
const savedTheme = localStorage.getItem('zentrix-theme') || 'light';
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

/* ---- Hamburger menu ---- */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
function setMenu(open) {
  if (!hamburger || !navLinks) return;
  hamburger.classList.toggle('open', open);
  navLinks.classList.toggle('open', open);
  navbar.classList.toggle('menu-open', open);
  document.body.classList.toggle('menu-open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

if (hamburger && navLinks) {
  hamburger.setAttribute('aria-controls', 'nav-links');
  hamburger.setAttribute('aria-expanded', 'false');

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    setMenu(!navLinks.classList.contains('open'));
  });

  // Close on outside click, Escape, or resizing back to desktop
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navbar.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      setMenu(false);
      hamburger.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) setMenu(false);
  });
}

/* =============================================
   CLIENT-SIDE PAGE ROUTING (Zentrix)
   ============================================= */
const validRoutes = ['home', 'about', 'services', 'advantage', 'contact', 'quote'];

// Normalise "/about", "#about", "about/" etc. to a bare route name
function toRoute(value) {
  return (value || '').replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '').toLowerCase();
}

function routeToPath(route, subAnchor) {
  const path = route === 'home' ? '/' : `/${route}`;
  return subAnchor ? `${path}#${subAnchor}` : path;
}

// mode: 'push' adds a history entry, 'replace' rewrites the current one, 'none' leaves it
function navigateTo(targetRoute, mode = 'push') {
  let cleanRoute = toRoute(targetRoute);

  // If route is a service anchor (e.g. service-ai, service-consulting), activate services and scroll
  let subAnchor = null;
  if (cleanRoute.startsWith('service-')) {
    subAnchor = cleanRoute;
    cleanRoute = 'services';
  }

  if (!validRoutes.includes(cleanRoute)) {
    cleanRoute = 'home';
  }

  // 1. Show the matching page view and hide others
  document.querySelectorAll('.page-view').forEach(view => {
    const isTarget = view.id === `view-${cleanRoute}`;
    view.classList.toggle('active-view', isTarget);
  });

  // 2. Update active link in navbar
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    const href = toRoute(link.getAttribute('href')) || 'home';
    link.classList.toggle('active', href === cleanRoute);
  });

  // 3. Scroll to sub-anchor or top
  if (subAnchor) {
    setTimeout(() => {
      const el = document.getElementById(subAnchor);
      if (el) {
        const navH = navbar ? navbar.offsetHeight : 70;
        const top = el.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 120);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 4. Update the URL to a clean path (e.g. /about) if needed
  const newPath = routeToPath(cleanRoute, subAnchor);
  if (mode !== 'none' && window.location.pathname + window.location.hash !== newPath) {
    history[mode === 'replace' ? 'replaceState' : 'pushState'](null, '', newPath);
  }
}

// Global click delegation for all navigation links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"], a[href^="/"]');
  if (!link) return;

  const rawHref = link.getAttribute('href');
  if (!rawHref || rawHref === '#' || rawHref.startsWith('http') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
    return;
  }

  const route = toRoute(rawHref) || 'home';
  if (validRoutes.includes(route) || route.startsWith('service-')) {
    e.preventDefault();
    navigateTo(route);

    // Close mobile menu if open
    setMenu(false);
  }
});

// Read the route from the current URL. Old hash links (/#about) still work.
function routeFromLocation() {
  const hash = toRoute(window.location.hash);
  const path = toRoute(window.location.pathname.replace(/\/index\.html$/, '/'));
  if (hash.startsWith('service-')) return hash;
  return path || hash || 'home';
}

// Handle browser back/forward
window.addEventListener('popstate', () => {
  navigateTo(routeFromLocation(), 'none');
});

// Initialize on page load, replacing legacy hash URLs with clean paths
navigateTo(routeFromLocation(), 'replace');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = window.matchMedia('(max-width: 600px)').matches;
const canAnimate = !reduceMotion && 'IntersectionObserver' in window;

/* ---- Navbar shadow, reading progress bar and hero parallax ---- */
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
navbar.appendChild(progressBar);
const heroImg = document.querySelector('.hero-figure img');

let scrollTicking = false;
function onScrollFrame() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  navbar.classList.toggle('scrolled', y > 8);
  progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  // Photo drifts slightly slower than the page while the hero is on screen
  if (heroImg && !reduceMotion && y < window.innerHeight * 1.2) {
    heroImg.style.transform = `translateY(${Math.min(y * 0.04, 16)}px)`;
  }
  scrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) { requestAnimationFrame(onScrollFrame); scrollTicking = true; }
}, { passive: true });
onScrollFrame();

/* ---- Split headings into words so they can rise in one by one ---- */
function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const outer = document.createElement('span');
          outer.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', i++);
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
  el.classList.add('is-split');
}
if (canAnimate) {
  document.querySelectorAll('.hero-headline, .section-title, .page-title').forEach(splitWords);
}

/* ---- Scroll reveal ---- */
const revealSelector = [
  '.section-header', isPhone ? '.services-carousel-wrapper' : '.service-card', '.advantage-card',
  '.cta-inner', '.about-narrative-box', '.vision-quote-box', '.value-card', '.team-card',
  '.strength-card', '.ai-cap-card', '.ai-tech-container', '.chapter-body', '.chapter-subheading',
  '.chapter-prose-callout', '.mobile-feat-card', '.disciplines-list', '.tech-editorial-col',
  '.tech-category-row', '.connected-path-node', '.delivery-para', '.benefit-item', '.contact-info',
  '.contact-form-container', '.industry-card', '.quote-sidebar', '.quote-form-wrap'
].join(',');

if (canAnimate) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(revealSelector).forEach(el => {
    // Stagger siblings in the same grid so cards arrive one after another
    const siblings = Array.from(el.parentElement.children).filter(c => c.matches(revealSelector));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 80}ms`;
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

/* ---- Count-up for the hero stats ---- */
function countUp(el) {
  const match = el.textContent.trim().match(/^(\d+)(.*)$/);
  if (!match) return;
  const target = parseInt(match[1], 10);
  const suffix = match[2];
  const start = performance.now();
  const duration = 1600;
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const heroStats = document.getElementById('hero-stats');
if (heroStats && canAnimate) {
  heroStats.classList.add('stats-waiting');
  const statsObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    heroStats.classList.replace('stats-waiting', 'stats-in');
    heroStats.querySelectorAll('.stat-num').forEach(countUp);
    statsObserver.disconnect();
  }, { threshold: 0.4 });
  statsObserver.observe(heroStats);
}

/* ---- Phone: services become a swipeable card carousel ---- */
(function initServiceSwiper() {
  const track = document.getElementById('services-track');
  const dots = document.getElementById('services-dots');
  if (!track || !dots) return;
  const cards = Array.from(track.children);

  cards.forEach((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'swipe-dot';
    dot.setAttribute('aria-label', `Show service ${i + 1}`);
    dot.addEventListener('click', () => track.scrollTo({ left: card.offsetLeft - track.offsetLeft - 16, behavior: 'smooth' }));
    dots.appendChild(dot);
  });

  let current = -1;
  function setCurrent() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    cards.forEach((card, i) => {
      const d = Math.abs(card.offsetLeft - track.offsetLeft + card.offsetWidth / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    if (best === current) return;
    current = best;
    cards.forEach((c, i) => c.classList.toggle('is-current', i === best));
    dots.querySelectorAll('.swipe-dot').forEach((d, i) => d.classList.toggle('active', i === best));
  }
  let ticking = false;
  track.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { setCurrent(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', setCurrent);
  setCurrent();

  // The first time the carousel comes into view, peek at the next card to show it can be swiped
  if (canAnimate && isPhone) {
    const peek = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      peek.disconnect();
      setTimeout(() => {
        track.scrollTo({ left: 70, behavior: 'smooth' });
        setTimeout(() => track.scrollTo({ left: 0, behavior: 'smooth' }), 650);
      }, 700);
    }, { threshold: 0.6 });
    peek.observe(track);
  }
})();

/* =============================================
   SUPABASE FORM SUBMISSIONS (Contact + Quote)
   ============================================= */
// Replace these with your values from Supabase → Project Settings → API.
// The anon/publishable key is safe in the browser (RLS allows insert only).
// NEVER put the service_role key here.
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';

const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function wireForm(formId, table, buildRow, successMsg) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!sb) {
      alert('Sorry, the form is unavailable right now. Please email us directly.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Sending...';

    // No .select() after insert – anon users can't read rows under RLS
    const { error } = await sb.from(table).insert(buildRow(new FormData(form)));

    btn.disabled = false;
    btn.innerHTML = label;

    if (error) {
      console.error('Supabase insert failed:', error);
      alert('Sorry, something went wrong. Please try again or email us directly.');
      return;
    }
    alert(successMsg);
    form.reset();
  });
}

wireForm('contact-form', 'contact_messages', (fd) => ({
  name: fd.get('name'),
  email: fd.get('email'),
  phone: fd.get('phone') || null,
  category: fd.get('category'),
  message: fd.get('message'),
}), 'Thank you! Your message has been received. Our engineering team will contact you within 24 hours.');

wireForm('quote-wizard-form', 'quote_requests', (fd) => ({
  services: fd.getAll('service'),
  timeline: fd.get('timeline'),
  budget: fd.get('budget'),
  name: fd.get('name'),
  company: fd.get('company') || null,
  email: fd.get('email'),
  phone: fd.get('phone') || null,
  details: fd.get('details') || null,
}), 'Quote Request Received! Thank you. Our architects will contact you within 24 hours with an estimate.');
