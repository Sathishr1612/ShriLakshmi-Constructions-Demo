/* Shri Lakshmi Constructions & Engineers — interactions & animations */
(function () {
  'use strict';

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.body.classList.add('loading');
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  function hideLoader() {
    const pre = $('#preloader');
    if (!pre || pre.classList.contains('done')) return;
    pre.classList.add('done');
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    AOS.init({ duration: 900, easing: 'ease-out-cubic', once: true, offset: 80 });
  }
  window.addEventListener('load', () => setTimeout(hideLoader, 1900));
  setTimeout(hideLoader, 4500); // safety net if an asset hangs

  /* ---------- Navbar, back-to-top ---------- */
  const nav = $('#mainNav');
  const backTop = $('.back-top');
  const ring = $('.back-top circle');
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? y / max : 0;
    nav.classList.toggle('scrolled', y > 60);
    backTop.classList.toggle('show', y > 500);
    ring.style.strokeDashoffset = 132 - 132 * pct;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Close mobile menu after picking a link
  $$('#navMenu .nav-link, #navMenu .btn-enquire').forEach(a => a.addEventListener('click', () => {
    const menu = $('#navMenu');
    if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  }));

  /* ---------- Hero photo panel: one image at a time ---------- */
  const slidesWrap = $('#heroSlides');
  if (slidesWrap) {
    const slides = $$('.hs-slide', slidesWrap);
    const now = $('#hsNow'), bar = $('#hsBar');
    let idx = 0, timer = null;
    const go = n => {
      slides[idx].classList.remove('active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('active');
      now.textContent = String(idx + 1).padStart(2, '0');
      bar.classList.remove('run'); void bar.offsetWidth;
      if (!reduceMotion) bar.classList.add('run');
    };
    const start = () => { if (reduceMotion) return; clearInterval(timer); timer = setInterval(() => go(idx + 1), 6000); go(idx); };
    $('#hsPrev').addEventListener('click', () => { go(idx - 1); start(); });
    $('#hsNext').addEventListener('click', () => { go(idx + 1); start(); });
    slidesWrap.addEventListener('mouseenter', () => { clearInterval(timer); bar.classList.remove('run'); });
    slidesWrap.addEventListener('mouseleave', start);
    start();
  }

  /* ---------- Founder photo curtain reveal (photo stays visible without JS) ---------- */
  const notePhoto = $('.note-photo');
  if (notePhoto && !reduceMotion) {
    document.documentElement.classList.add('js-reveal');
    const reveal = () => {
      if (notePhoto.getBoundingClientRect().top < window.innerHeight * 0.85) {
        notePhoto.classList.add('in-view');
        window.removeEventListener('scroll', reveal);
      }
    };
    window.addEventListener('scroll', reveal, { passive: true });
    window.addEventListener('load', reveal);
    reveal();
  }

  /* ---------- Counters & process line (on view) ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.classList.contains('counter')) animateCounter(el);
      else el.classList.add('in-view');
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  $$('.counter').forEach(el => io.observe(el));

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1800, start = performance.now();
    (function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------- Process: the drawing builds itself step by step ---------- */
  const fig = $('#buildFig');
  if (fig) {
    const stepBtns = $$('.howto-step');
    const layers = $$('[data-show]', fig);
    const caption = $('#figCaption');
    const captions = [
      'Fig. 01 — Site visit & survey',
      'Fig. 02 — Architectural & structural drawings',
      'Fig. 03 — Estimate prepared, plan approved',
      'Fig. 04 — Construction, floor by floor',
      'Fig. 05 — Keys handed over'
    ];
    let current = 1, autoplay = !reduceMotion, timer = null;

    const show = n => {
      current = n;
      stepBtns.forEach(btn => {
        const on = +btn.dataset.step === n;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on);
        btn.classList.remove('playing');
      });
      layers.forEach(l => l.classList.toggle('on', l.dataset.show.split(',').includes(String(n))));
      caption.textContent = captions[n - 1];
      if (autoplay) {
        const btn = stepBtns[n - 1];
        void btn.offsetWidth; // restart the progress bar
        btn.classList.add('playing');
      }
    };
    const play = () => {
      clearInterval(timer);
      timer = setInterval(() => show(current % stepBtns.length + 1), 5000);
      show(current);
    };

    stepBtns.forEach(btn => btn.addEventListener('click', () => {
      autoplay = false;
      clearInterval(timer);
      show(+btn.dataset.step);
    }));

    show(1);
    // start playing only once the section is on screen
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting && autoplay) { play(); obs.disconnect(); }
    }, { threshold: 0.35 }).observe(fig);
  }

  /* ---------- Project filter ---------- */
  const filterBtns = $$('.filter-btn');
  const items = $$('.project-item');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    items.forEach(it => {
      const match = f === 'all' || it.dataset.status === f;
      if (match) {
        it.classList.remove('gone');
        requestAnimationFrame(() => requestAnimationFrame(() => it.classList.remove('hide')));
      } else {
        it.classList.add('hide');
        setTimeout(() => { if (it.classList.contains('hide')) it.classList.add('gone'); }, 450);
      }
    });
  }));

  /* ---------- Tilt effect ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    $$('.tilt, .project-card, .service-card').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-8px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* Magnetic buttons */
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const gallery = $$('.gallery-item');
  const lbModal = new bootstrap.Modal($('#lightbox'));
  const lbImg = $('#lbImg'), lbCap = $('#lbCaption');
  let current = 0;
  function showImg(i) {
    current = (i + gallery.length) % gallery.length;
    const a = gallery[current];
    lbImg.style.opacity = 0;
    setTimeout(() => {
      lbImg.src = a.getAttribute('href');
      lbImg.alt = a.querySelector('img').alt;
      lbCap.textContent = a.querySelector('span').textContent.trim();
      lbImg.style.transition = 'opacity .35s';
      lbImg.style.opacity = 1;
    }, 150);
  }
  gallery.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); showImg(i); lbModal.show(); }));
  $('.lb-nav.prev').addEventListener('click', () => showImg(current - 1));
  $('.lb-nav.next').addEventListener('click', () => showImg(current + 1));
  document.addEventListener('keydown', e => {
    if (!$('#lightbox').classList.contains('show')) return;
    if (e.key === 'ArrowLeft') showImg(current - 1);
    if (e.key === 'ArrowRight') showImg(current + 1);
  });

  /* ---------- Enquiry form ----------
     No backend yet: on submit we validate, show the thank-you message and
     open WhatsApp with the enquiry pre-filled so it reaches the sales team. */
  const form = $('#enquiryForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    const name = $('#fName').value.trim();
    const phone = $('#fPhone').value.trim();
    const email = $('#fEmail').value.trim();
    const interest = $('#fInterest').value;
    const msg = $('#fMsg').value.trim();
    const text = `New enquiry from website%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}` +
      (email ? `%0AEmail: ${encodeURIComponent(email)}` : '') +
      `%0AInterested in: ${encodeURIComponent(interest)}` +
      (msg ? `%0AMessage: ${encodeURIComponent(msg)}` : '');
    $('#formSuccess').classList.add('show');
    window.open(`https://wa.me/918147573925?text=${text}`, '_blank', 'noopener');
    setTimeout(() => {
      form.reset();
      form.classList.remove('was-validated');
      $('#formSuccess').classList.remove('show');
    }, 6000);
  });
})();
