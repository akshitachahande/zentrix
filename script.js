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
const savedTheme = localStorage.getItem('zentrix-theme') || 'dark';
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    // Spin animation on toggle
    themeToggle.style.transform = 'rotate(360deg) scale(1.15)';
    setTimeout(() => { themeToggle.style.transform = ''; }, 400);
  });
}

/* ---- Navbar scroll effect ---- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

/* ---- Hamburger menu ---- */
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
    if (window.innerWidth > 768) setMenu(false);
  });
}

/* =============================================
   CLIENT-SIDE PAGE ROUTING (Matching avertistech.com)
   ============================================= */
const validRoutes = ['home', 'about', 'services', 'advantage', 'contact', 'quote'];

function navigateTo(targetRoute) {
  let cleanRoute = (targetRoute || '').replace(/^#\/?/, '').replace(/^\//, '').toLowerCase();
  
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
    const href = link.getAttribute('href').replace(/^#\/?/, '').replace(/^\//, '').toLowerCase();
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

  // 4. Update URL hash if needed
  if (window.location.hash !== `#${cleanRoute}`) {
    history.pushState(null, '', `#${cleanRoute}`);
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

  const route = rawHref.replace(/^#\/?/, '').replace(/^\//, '').toLowerCase();
  if (validRoutes.includes(route) || route.startsWith('service-')) {
    e.preventDefault();
    navigateTo(route);

    // Close mobile menu if open
    setMenu(false);
  }
});

// Handle browser back/forward and hash changes
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash) navigateTo(hash);
});

// Initialize on page load
const initialHash = window.location.hash.slice(1) || 'home';
navigateTo(initialHash);

/* ---- Counter animation for stats (triggered by intersection) ---- */
function animateCounter(el, target, suffix = '', duration = 1800) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNums = entry.target.querySelectorAll('.stat-num');
      statNums.forEach(el => {
        const target = parseInt(el.getAttribute('data-target')) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
        animateCounter(el, target, suffix);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const heroStats = document.getElementById('hero-stats');
if (heroStats) statsObserver.observe(heroStats);

/* ---- Core IT Services Carousel (Home Page) ---- */
(function initServicesCarousel() {
  const track = document.getElementById('services-track');
  const prevBtn = document.getElementById('services-prev');
  const nextBtn = document.getElementById('services-next');
  const dotsContainer = document.getElementById('carousel-dots');

  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards = Array.from(track.children);
  const totalCards = cards.length;
  let currentIndex = 0;

  function getVisibleCount() {
    const w = window.innerWidth;
    if (w <= 768) return 1;
    if (w <= 1100) return 2;
    return 3;
  }

  function getCardWidth() {
    if (cards.length === 0) return 0;
    const card = cards[0];
    const gap = 24;
    return card.offsetWidth + gap;
  }

  function getMaxIndex() {
    return Math.max(0, totalCards - getVisibleCount());
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    const maxIndex = getMaxIndex();
    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      if (i === currentIndex) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function goTo(index) {
    const maxIndex = getMaxIndex();
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    const offset = currentIndex * getCardWidth();
    track.style.transform = `translateX(-${offset}px)`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
    updateDots();
  }

  prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  // Touch / swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      goTo(currentIndex + (diff > 0 ? 1 : -1));
    }
  });

  buildDots();
  goTo(0);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(Math.min(currentIndex, getMaxIndex()));
    }, 150);
  });
})();

/* ---- Animated number ticker for advantage card numbers ---- */
document.querySelectorAll('.adv-number').forEach((el) => {
  const num = parseInt(el.textContent);
  el.textContent = '00';
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        let count = 0;
        const target = num;
        const step = Math.max(1, Math.floor(target / 20));
        const interval = setInterval(() => {
          count = Math.min(count + step, target);
          el.textContent = String(count).padStart(2, '0');
          if (count >= target) clearInterval(interval);
        }, 60);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  obs.observe(el);
});

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
