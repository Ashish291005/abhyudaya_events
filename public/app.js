(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => /^(https?:\/\/|\/)/i.test(String(u || '')) ? String(u) : '';

  const ICONS = {
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M7 13h3M7 17h3M14 13h3"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="8" y="2" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M7 15l1.5 5h2L9 15M17 8a5 5 0 0 1 0 8M20 5a9 9 0 0 1 0 14"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="7" r="3"/><circle cx="5" cy="9" r="2.2"/><circle cx="19" cy="9" r="2.2"/><path d="M6 21v-2a6 6 0 0 1 12 0v2M1.5 19v-1a3.5 3.5 0 0 1 4-3.5M22.5 19v-1a3.5 3.5 0 0 0-4-3.5"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-5h6v5M12 2v3M10 11h4"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7 10-7"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>'
  };

  let C;

  async function init() {
    try { C = await (await fetch('/api/content', { cache: 'no-store' })).json(); }
    catch { C = null; }
    if (C) render();
    setupInteractions();
    setTimeout(() => { $('#preloader').classList.add('done'); startHero(); }, 900);
  }

  function render() {
    const { site, hero, about, contact } = C;
    document.title = `${site.name} | ${site.tagline}`;
    $('meta[name=description]').content = site.seoDescription || '';
    if (C.theme) Object.entries(C.theme).forEach(([k, v]) => v && document.documentElement.style.setProperty(`--${k}`, v));
    ['#footLogo', '.pre-logo'].forEach(s => { if (site.logo) $(s).src = safeUrl(site.logo); });
    if (site.logoMark) $('#navLogo').src = safeUrl(site.logoMark);
    $('#announce').innerHTML = site.announcement ? `<span>${esc(site.announcement)}</span>` : '';
    $('#footTag').textContent = site.tagline;

    // hero
    $('#heroEyebrow').textContent = hero.eyebrow;
    $('#heroTitle').innerHTML = esc(hero.title).split(' ').map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
    $$('#heroTitle .w > span').forEach((s, i) => s.style.transitionDelay = `${0.15 + i * 0.08}s`);
    $('#heroSub').textContent = hero.subtitle;
    $('#heroCta1').textContent = hero.ctaPrimary;
    $('#heroCta2').textContent = hero.ctaSecondary;
    // slides: admin-managed; fall back to the older plain image list
    C.slides = (hero.slides && hero.slides.length ? hero.slides : (hero.images || []).map(u => ({ image: u }))).filter(s => s.image);
    const media = $('#heroMedia');
    if (hero.video) media.innerHTML = `<video class="on" src="${esc(safeUrl(hero.video))}" autoplay muted loop playsinline></video>`;
    else media.innerHTML = C.slides.map((s, i) => `<img src="${esc(safeUrl(s.image))}" alt="" ${i ? 'loading="lazy"' : ''}>`).join('');
    $('#cfStage').innerHTML = C.slides.map((s, i) => `<figure class="cf-slide" data-i="${i}"><img src="${esc(safeUrl(s.image))}" alt="${esc(s.caption || '')}" ${i > 2 ? 'loading="lazy"' : ''} draggable="false"></figure>`).join('');
    if (!C.slides.length) $('#coverflow').remove();

    // marquee
    const words = C.services.map(s => s.title);
    $('#marquee').innerHTML = [...words, ...words].map(w => `<span>${esc(w)}</span>`).join('');

    // about
    $('#aboutImg').src = safeUrl(about.image);
    $('#aboutTitle').textContent = about.title;
    $('#aboutText').textContent = about.text;
    $('#founderName').textContent = about.founder;
    $('#founderTitle').textContent = about.founderTitle;
    $('#objectives').innerHTML = C.objectives.map((o, i) => `<li class="reveal" style="transition-delay:${i * .1}s"><b>0${i + 1}</b><span>${esc(o)}</span></li>`).join('');
    $('#stats').innerHTML = C.stats.map(s => `<div class="stat reveal"><strong data-count="${+s.value || 0}" data-suffix="${esc(s.suffix)}">0</strong><span>${esc(s.label)}</span></div>`).join('');

    // services
    // services: expanding image panels; the active one opens wide with details
    $('#serviceGrid').className = 'svc-panels reveal';
    $('#serviceGrid').innerHTML = C.services.map((s, i) => `
      <article class="sp${i ? '' : ' active'}" data-i="${i}" tabindex="0" aria-label="${esc(s.title)}">
        <div class="sp-bg" style="background-image:url('${esc(safeUrl(s.image))}')"></div>
        <div class="sp-shade"></div>
        <div class="sp-closed"><span class="sp-num">${String(i + 1).padStart(2, '0')}</span><span class="sp-vtitle">${esc(s.title)}</span><span class="sp-icon">${ICONS[s.icon] || ICONS.sparkle}</span></div>
        <div class="sp-open">
          <div class="sp-top"><span class="sp-icon">${ICONS[s.icon] || ICONS.sparkle}</span><span class="sp-num">${String(i + 1).padStart(2, '0')} / ${String(C.services.length).padStart(2, '0')}</span></div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
          <ul>${(s.points || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul>
          <button class="btn btn-rose btn-sm" data-svc-more="${i}">Discover more →</button>
        </div>
        <div class="sp-progress"><span></span></div>
      </article>`).join('');

    // process (section hides when it has no steps)
    if (!(C.process || []).length) $('#process').remove();
    else
    $('#timeline').insertAdjacentHTML('beforeend', C.process.map((p, i) => `
      <div class="step-card reveal" style="transition-delay:${i * .15}s"><div class="n">0${i + 1}</div><h4>${esc(p.title)}</h4><p>${esc(p.text)}</p></div>`).join(''));

    // gallery
    // filter buttons follow the admin's category list (in its order), showing only categories that have photos
    const usedCats = new Set(C.gallery.map(g => g.category).filter(Boolean));
    const cats = ['All', ...(C.galleryCategories ? C.galleryCategories.filter(c => usedCats.has(c)) : usedCats)];
    $('#filters').innerHTML = cats.map((c, i) => `<button class="${i ? '' : 'on'}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    $('#masonry').innerHTML = C.gallery.map((g, i) => `
      <figure class="g-item reveal" data-cat="${esc(g.category)}" data-i="${i}">
        <img src="${esc(safeUrl(g.image))}" alt="${esc(g.caption)}" loading="lazy">
        <figcaption><small>${esc(g.category)}</small><strong>${esc(g.caption)}</strong></figcaption>
      </figure>`).join('');

    // testimonials
    // two rows of cards gliding in opposite directions; each row is doubled so the loop is seamless
    const tCard = t => `
      <figure class="t-card">
        <div class="t-top"><span class="stars">★★★★★</span><span class="q" aria-hidden="true">”</span></div>
        <blockquote>${esc(t.quote)}</blockquote>
        <figcaption><span class="avatar">${esc((t.name || '?').trim().charAt(0))}</span><span><b>${esc(t.name)}</b><small>${esc(t.role)}</small></span></figcaption>
      </figure>`;
    const ts = C.testimonials || [];
    if (!ts.length) $('#testimonials .t-wall').remove();
    else {
      const fill = list => { let out = [...list]; while (out.length < 6) out = out.concat(list); return out; };
      const r1 = fill(ts), r2 = fill([...ts].reverse());
      $('#tRow1').innerHTML = `<div class="t-track">${[...r1, ...r1].map(tCard).join('')}</div>`;
      $('#tRow2').innerHTML = `<div class="t-track">${[...r2, ...r2].map(tCard).join('')}</div>`;
    }
    const cl = C.clients || [];
    $('#clients').innerHTML = [...cl, ...cl, ...cl, ...cl].map(c => `<span>${esc(c)}</span>`).join('');

    // faq
    $('#accordion').innerHTML = (C.faqs || []).map(f => `
      <div class="acc reveal"><button aria-expanded="false">${esc(f.q)}<span>+</span></button><div class="ans"><div>${esc(f.a)}</div></div></div>`).join('');

    // contact
    const tel = (contact.phone || '').replace(/[^\d+]/g, '');
    $('#contactList').innerHTML = [
      contact.phone && `<li class="reveal"><a href="tel:${esc(tel)}"><i>${ICONS.phone}</i><span><small>Call us</small><strong>${esc(contact.phone)}</strong></span></a></li>`,
      contact.email && `<li class="reveal"><a href="mailto:${esc(contact.email)}"><i>${ICONS.mail}</i><span><small>Email</small><strong>${esc(contact.email)}</strong></span></a></li>`,
      contact.instagramHandle && `<li class="reveal"><a href="${esc(safeUrl(contact.instagram))}" target="_blank" rel="noopener"><i>${ICONS.insta}</i><span><small>Instagram</small><strong>${esc(contact.instagramHandle)}</strong></span></a></li>`,
      contact.founder && `<li class="reveal"><div><i>${ICONS.user}</i><span><small>Founder</small><strong>${esc(contact.founder)}</strong></span></div></li>`,
      contact.address && `<li class="reveal"><div><i>${ICONS.pin}</i><span><small>Location</small><strong>${esc(contact.address)}</strong></span></div></li>`
    ].filter(Boolean).join('');
    $('#footContact').innerHTML = `<a href="tel:${esc(tel)}">${esc(contact.phone)}</a><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a><div>Founder: ${esc(contact.founder)}</div>`;
    if (contact.whatsapp) $('#whatsapp').href = `https://wa.me/${encodeURIComponent(contact.whatsapp)}?text=${encodeURIComponent('Hi Abhyudaya Events! I would like to plan an event.')}`;
    else $('#whatsapp').remove();
    if (/^https?:\/\//i.test(contact.instagram || '')) $('#instaFloat').href = contact.instagram;
    else $('#instaFloat').remove();
  }

  // ---------------- hero slideshow ----------------
  function startHero() {
    $('#heroTitle').classList.add('in');
    const bgs = $$('#heroMedia img'), slides = $$('.cf-slide');
    const n = slides.length;
    if (!n) return;
    const DUR = 5000, bar = $('#cfBar'), cap = $('#cfCaption');
    let i = 0, timer;

    // place every slide around the active one (circular distance)
    const layout = () => {
      const wide = innerWidth > 600;
      slides.forEach((s, k) => {
        let d = k - i; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        const a = Math.abs(d);
        s.style.transform = `translate(-50%,-50%) translateX(${d * (wide ? 52 : 40)}%) translateZ(${-a * 180}px) rotateY(${-Math.sign(d) * Math.min(a, 1) * 38}deg) scale(${a ? .92 : 1})`;
        s.style.opacity = a > 2 ? 0 : a === 2 ? .35 : 1;
        s.style.filter = a ? `brightness(${a === 1 ? .55 : .35})` : 'none';
        s.style.zIndex = 10 - a;
        s.style.pointerEvents = a > 2 ? 'none' : 'auto';
        s.classList.toggle('active', !a);
      });
      bgs.forEach((b, k) => b.classList.toggle('on', k === i));
      const sl = C.slides[i];
      cap.classList.add('swap');
      setTimeout(() => { $('small', cap).textContent = sl.category || ''; $('strong', cap).textContent = sl.caption || ''; cap.classList.remove('swap'); }, 250);
      $('#cfCount').textContent = `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
      bar.classList.remove('run'); bar.style.transitionDuration = '0s'; void bar.offsetWidth;
      bar.style.transitionDuration = `${DUR}ms`; bar.classList.add('run');
    };
    const go = k => { i = (k + n) % n; layout(); play(); };
    const play = () => { clearTimeout(timer); timer = setTimeout(() => go(i + 1), DUR); };

    $('#cfPrev').onclick = () => go(i - 1);
    $('#cfNext').onclick = () => go(i + 1);
    // click side slide to bring it forward; click active to open lightbox
    $('#cfStage').addEventListener('click', e => {
      if (moved) return;
      const s = e.target.closest('.cf-slide'); if (!s) return;
      const k = +s.dataset.i;
      if (k !== i) return go(k);
      const lb = $('#lightbox'); $('img', lb).src = safeUrl(C.slides[k].image); $('figcaption', lb).textContent = C.slides[k].caption || ''; lb.classList.add('open');
    });
    // drag / swipe
    let x0 = null, moved = false;
    const stage = $('#cfStage');
    stage.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
    addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { moved = true; go(i + (dx < 0 ? 1 : -1)); setTimeout(() => moved = false, 50); }
    });
    // keyboard + pause when hovering / tab hidden
    $('#coverflow').addEventListener('mouseenter', () => { clearTimeout(timer); bar.classList.remove('run'); });
    $('#coverflow').addEventListener('mouseleave', () => layout() || play());
    addEventListener('keydown', e => { if ($('#lightbox').classList.contains('open') || $('.ev-pop.open')) return; if (e.key === 'ArrowLeft' && scrollY < innerHeight) go(i - 1); if (e.key === 'ArrowRight' && scrollY < innerHeight) go(i + 1); });
    document.addEventListener('visibilitychange', () => document.hidden ? clearTimeout(timer) : play());
    addEventListener('resize', layout);
    layout(); play();
  }

  // ---------------- events: section + popup ----------------
  const LIVE_HOURS = 8;
  function eventState(ev) {
    const t = ev.date ? new Date(ev.date) : null;
    if (!t || isNaN(t)) return { t: null, state: 'upcoming' };
    const now = Date.now();
    if (now < t) return { t, state: 'upcoming' };
    if (now < +t + LIVE_HOURS * 36e5) return { t, state: 'live' };
    return { t, state: 'past' };
  }
  const fmtDate = t => t.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = t => t.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const relDay = t => {
    const d = Math.round((new Date(t).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);
    return d === 0 ? 'Tonight' : d === 1 ? 'Tomorrow' : d < 8 ? `In ${d} days` : 'Upcoming';
  };
  const posters = ev => (ev.posters || []).filter(Boolean);
  const ctaAttrs = link => /^https?:/.test(link) ? 'target="_blank" rel="noopener"' : '';
  const isHttp = u => /^https?:\/\//i.test(u || '');
  // venue text, linked to Google Maps when the admin added a map link
  const venueHTML = ev => isHttp(ev.mapLink)
    ? `<a class="venue-link" href="${esc(ev.mapLink)}" target="_blank" rel="noopener">${esc(ev.venue)}<em>📍 Open in Google Maps ↗</em></a>`
    : esc(ev.venue);
  // line-up entries are { name, link } (older content may still hold plain strings)
  const lineupHTML = (ev, label, extra = '') => {
    const items = (ev.lineup || []).map(l => typeof l === 'string' ? { name: l } : l).filter(l => l && l.name);
    if (!items.length) return '';
    return `<div class="lineup">${label ? '<small>Line-up</small>' : ''}<div>${items.map(l => isHttp(l.link)
      ? `<a href="${esc(l.link)}" target="_blank" rel="noopener" ${extra} title="Open ${esc(l.name)}'s profile">${esc(l.name)}<i>↗</i></a>`
      : `<span>${esc(l.name)}</span>`).join('')}</div></div>`;
  };
  // every way to book this event, in the order visitors should see them
  const bookOptions = ev => {
    const isUrl = u => /^https?:\/\//i.test(u || '');
    const opts = [];
    if (isUrl(ev.districtLink)) opts.push({ url: ev.districtLink, label: 'District', sub: 'by Zomato · instant e-tickets' });
    if (isUrl(ev.bmsLink)) opts.push({ url: ev.bmsLink, label: 'BookMyShow', sub: 'Instant e-tickets' });
    const cta = safeUrl(ev.ctaLink);
    if (cta) opts.push({ url: cta, label: ev.ctaText || 'Contact us', sub: /wa\.me|whatsapp/i.test(cta) ? 'Chat with us on WhatsApp' : 'Talk to our team' });
    return opts;
  };
  // one "Book Now" button: a direct link when there is a single option, otherwise a small menu
  const bookHTML = (ev, extra = '') => {
    const opts = bookOptions(ev);
    if (opts.length <= 1) {
      const u = opts[0]?.url || '#contact';
      return `<a class="btn btn-rose btn-book" href="${esc(u)}" ${ctaAttrs(u)} ${extra}>Book Now <span aria-hidden="true">→</span></a>`;
    }
    return `<div class="book"><button type="button" class="btn btn-rose btn-book" aria-haspopup="true" aria-expanded="false">Book Now <span aria-hidden="true">▾</span></button>
      <div class="book-menu" role="menu"><p>Choose where to book</p>${opts.map(o => `<a role="menuitem" href="${esc(o.url)}" ${ctaAttrs(o.url)} ${extra}><span><b>${esc(o.label)}</b><small>${esc(o.sub)}</small></span><i>↗</i></a>`).join('')}</div></div>`;
  };
  document.addEventListener('click', e => {
    const btn = e.target.closest('.book > .btn-book');
    $$('.book.open').forEach(b => { if (!btn || b !== btn.parentElement) { b.classList.remove('open'); $('.btn-book', b).setAttribute('aria-expanded', 'false'); } });
    if (btn) { const open = btn.parentElement.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open)); }
  });
  const countdownHTML = () => `<div class="ev-count"><p class="cd-label"><i></i>Starts in</p><div class="cd-row">${['Days', 'Hours', 'Mins', 'Secs'].map(u => `<div class="cd-unit"><b>00</b><small>${u}</small></div>`).join('<span class="cd-sep">:</span>')}</div></div>`;
  const countdowns = [];
  function tickCountdowns() {
    countdowns.forEach(({ el, t }) => {
      const s = Math.max(0, Math.floor((t - Date.now()) / 1000));
      const vals = [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60];
      $$('b', el).forEach((b, k) => {
        const v = String(vals[k]).padStart(2, '0');
        if (b.textContent === v) return;
        b.textContent = v;
        b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip');
      });
    });
  }
  function openPosters(ev, start = 0) {
    const list = posters(ev); if (!list.length) return;
    const lb = $('#lightbox'); let k = start;
    const show = () => { $('img', lb).src = safeUrl(list[k]); $('figcaption', lb).textContent = `${ev.title}${list.length > 1 ? ` · ${k + 1}/${list.length}` : ''}`; };
    // temporarily take over the lightbox arrows for this poster set
    $('.lb-prev', lb).onclick = () => { k = (k - 1 + list.length) % list.length; show(); };
    $('.lb-next', lb).onclick = () => { k = (k + 1) % list.length; show(); };
    lb.dataset.mode = 'event'; show(); lb.classList.add('open');
  }

  function renderEvents() {
    const list = (C.events || []).map((ev, i) => ({ ev, i, ...eventState(ev) })).filter(x => x.ev.title && x.state !== 'past')
      .sort((a, b) => (a.t || Infinity) - (b.t || Infinity));
    const sec = $('#events');
    if (!list.length) { sec.remove(); $$('a[href="#events"]').forEach(a => a.remove()); return []; }
    sec.hidden = false;
    $('#eventList').classList.toggle('single', list.length === 1);
    $('#eventList').innerHTML = list.map(({ ev, i, t, state }) => {
      const ps = posters(ev);
      const badge = state === 'live' ? '<span class="ev-status live"><i></i>Happening now</span>' : t ? `<span class="ev-status">${relDay(t)}</span>` : '<span class="ev-status">Upcoming</span>';
      return `
      <article class="event-card reveal" data-ev="${i}">
        <div class="event-poster" data-open="${i}" role="button" tabindex="0" aria-label="View ${esc(ev.title)} posters">
          ${ps[0] ? `<div class="poster-bg" style="background-image:url('${esc(safeUrl(ps[0]))}')"></div>` : ''}
          ${ps.map((p, k) => `<img src="${esc(safeUrl(p))}" alt="${esc(ev.title)} poster ${k + 1}" class="${k ? 'alt' : ''}" loading="lazy">`).join('')}
          ${ps.length > 1 ? `<span class="poster-hint">${ps.length} posters · tap to view</span>` : ''}
        </div>
        <div class="event-info">
          <div class="event-head">
            <div>${badge}<h3>${esc(ev.title)}</h3>${ev.subtitle ? `<p class="event-sub">${esc(ev.subtitle)}</p>` : ''}</div>
          </div>
          <div class="event-cols">
            <ul class="event-meta">
              ${t ? `<li><i>◆</i><span><small>Date</small>${esc(fmtDate(t))}${ev.showTime === false ? '' : ` · ${esc(fmtTime(t))}`}</span></li>` : ''}
              ${ev.venue ? `<li><i>◆</i><span><small>Venue</small>${venueHTML(ev)}</span></li>` : ''}
              ${ev.organisers ? `<li><i>◆</i><span><small>Presented by</small>${esc(ev.organisers)}</span></li>` : ''}
            </ul>
            <div>
              ${lineupHTML(ev, true)}
              ${ev.description ? `<p class="event-desc">${esc(ev.description)}</p>` : ''}
            </div>
          </div>
          <div class="event-foot">
            ${state === 'upcoming' && t ? countdownHTML() : ''}
            <div class="ev-actions">${bookHTML(ev)}</div>
          </div>
        </div>
      </article>`;
    }).join('');
    $$('.event-card').forEach(card => {
      const x = list.find(l => l.i === +card.dataset.ev);
      const cd = $('.ev-count', card); if (cd) countdowns.push({ el: cd, t: x.t });
    });
    $('#eventList').addEventListener('click', e => { const p = e.target.closest('[data-open]'); if (p) openPosters(C.events[+p.dataset.open]); });
    $('#eventList').addEventListener('keydown', e => { const p = e.target.closest('[data-open]'); if (p && e.key === 'Enter') openPosters(C.events[+p.dataset.open]); });
    return list;
  }

  function setupEvents() {
    const list = renderEvents();
    const featured = list.find(x => x.ev.popup);
    if (featured) setupEventPopup(featured);
    if (countdowns.length) { tickCountdowns(); setInterval(tickCountdowns, 1000); }
  }

  function setupEventPopup({ ev, i, t, state }) {
    const key = `ae_ev_seen_${ev.title}_${ev.date}`;
    const ps = posters(ev);
    const when = t ? `${fmtDate(t)}${ev.showTime === false ? '' : ` · ${fmtTime(t)}`}` : '';
    const tag = state === 'live' ? 'Happening Now' : (ev.tag || (t ? relDay(t) : 'Upcoming Event'));
    document.body.insertAdjacentHTML('beforeend', `
      <div class="ev-pop" id="evPop" role="dialog" aria-modal="true" aria-labelledby="evTitle">
        <div class="ev-card">
          <button class="ev-close" aria-label="Close">×</button>
          <div class="ev-img" data-poster>${ps[0] ? `<div class="ev-img-bg" style="background-image:url('${esc(safeUrl(ps[0]))}')"></div><img src="${esc(safeUrl(ps[0]))}" alt="${esc(ev.title)} poster">` : ''}<span class="ev-tag">${esc(tag)}</span></div>
          <div class="ev-body">
            <p class="eyebrow">Don't miss it</p>
            <h3 id="evTitle">${esc(ev.title)}</h3>
            ${ev.subtitle ? `<p class="event-sub">${esc(ev.subtitle)}</p>` : ''}
            <div class="ev-meta">${when ? `<span><b>◆ When:</b> ${esc(when)}</span>` : ''}${ev.venue ? `<span><b>◆ Where:</b> ${esc(ev.venue)}</span>` : ''}</div>
            ${lineupHTML(ev, false, 'data-evgo')}
            ${state === 'upcoming' && t ? countdownHTML() : ''}
            <div class="ev-actions">${bookHTML(ev, 'data-evgo')}</div>
          </div>
        </div>
      </div>
      <button class="ev-pill" id="evPill"><i></i>${esc(ev.title)}</button>`);
    const pop = $('#evPop'), pill = $('#evPill');
    const cd = $('.ev-count', pop); if (cd) countdowns.push({ el: cd, t });
    const open = () => { pop.classList.add('open'); pill.classList.remove('show'); document.body.style.overflow = 'hidden'; };
    const close = () => { pop.classList.remove('open'); pill.classList.add('show'); document.body.style.overflow = ''; try { sessionStorage.setItem(key, '1'); } catch {} };
    pop.addEventListener('click', e => {
      if (e.target.closest('[data-poster]')) { close(); return openPosters(ev); }
      if (e.target === pop || e.target.closest('.ev-close,[data-evgo]')) close();
    });
    addEventListener('keydown', e => { if (e.key === 'Escape' && pop.classList.contains('open')) close(); });
    pill.onclick = open;
    let seen = false; try { seen = !!sessionStorage.getItem(key); } catch {}
    if (seen) pill.classList.add('show');
    else setTimeout(open, Math.max(0, +ev.delay || 4) * 1000);
  }

  // ---------------- interactions ----------------
  function setupInteractions() {
    // nav + progress + to-top
    const nav = $('#nav'), prog = $('.scroll-progress'), top = $('#toTop');
    const sections = $$('section[id]');
    const onScroll = () => {
      const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle('scrolled', y > 40);
      prog.style.width = `${(y / h) * 100}%`;
      top.classList.toggle('show', y > 800);
      const cur = sections.findLast(s => s.offsetTop - 140 <= y);
      $$('.nav-links a').forEach(a => a.classList.toggle('active', cur && a.getAttribute('href') === `#${cur.id}`));
      const hm = $('#heroMedia'); if (hm && y < innerHeight) hm.style.transform = `translateY(${y * 0.35}px)`;
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
    const burger = $('#burger'), links = $('#navLinks');
    burger.onclick = () => { burger.classList.toggle('open'); links.classList.toggle('open'); };
    $$('#navLinks a').forEach(a => a.onclick = () => { burger.classList.remove('open'); links.classList.remove('open'); });

    // reveal + counters + timeline
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      const c = $('[data-count]', e.target); if (c) countUp(c);
      io.unobserve(e.target);
    }), { threshold: .15 });
    $$('.reveal, .timeline').forEach(el => io.observe(el));

    // custom cursor
    if (matchMedia('(hover:hover)').matches) {
      const dot = $('.cursor-dot'), ring = $('.cursor-ring'); let mx = 0, my = 0, rx = 0, ry = 0;
      addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx - 3}px,${my - 3}px)`; });
      (function loop() { rx += (mx - rx) * .15; ry += (my - ry) * .15; ring.style.transform = `translate(${rx - ring.offsetWidth / 2}px,${ry - ring.offsetHeight / 2}px)`; requestAnimationFrame(loop); })();
      document.addEventListener('mouseover', e => ring.classList.toggle('hover', !!e.target.closest('a,button,.svc,.g-item')));
      // magnetic buttons
      $$('.magnetic').forEach(b => {
        b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
        b.addEventListener('mouseleave', () => b.style.transform = '');
      });
    }

    sparkles();
    if (!C) return;

    // service modal
    const modal = $('#modal');
    const openSvc = i => {
      const s = C.services[i];
      $('#modalBody').innerHTML = `<img src="${esc(safeUrl(s.image))}" alt=""><div class="mb"><p class="eyebrow">Service</p><h3>${esc(s.title)}</h3><div class="ornament" style="justify-content:flex-start"><i></i><b>⚜</b><i></i></div><p class="lead">${esc(s.text)}</p><ul>${(s.points || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul><a href="#contact" class="btn btn-rose" data-close>Enquire about this</a></div>`;
      modal.classList.add('open'); document.body.style.overflow = 'hidden';
      const sel = $('#enquiry select[name=eventType]'); sel.dataset.pref = s.title;
    };
    const closeModal = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };
    // service panels: hover/tap/focus opens one, and they always keep advancing on their own from there
    const panels = $$('.sp'), SP_DUR = 6000;
    let spTimer;
    const activate = k => {
      panels.forEach((p, j) => {
        p.classList.toggle('active', j === k);
        // restart the progress line on the newly opened panel
        const bar = $('.sp-progress span', p); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      });
      clearTimeout(spTimer);
      spTimer = setTimeout(() => activate((k + 1) % panels.length), SP_DUR);
    };
    panels.forEach((p, k) => {
      p.addEventListener('mouseenter', () => { if (!p.classList.contains('active')) activate(k); });
      p.addEventListener('focus', () => { if (!p.classList.contains('active')) activate(k); });
      p.addEventListener('click', e => {
        if (e.target.closest('[data-svc-more]')) return openSvc(k);
        if (!p.classList.contains('active')) activate(k);
      });
      p.addEventListener('keydown', e => { if (e.key === 'Enter') openSvc(k); });
    });
    // start the auto-advance only once the section is on screen
    if (panels.length) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { activate(0); o.disconnect(); } }, { threshold: .3 }).observe($('#serviceGrid'));
    modal.onclick = e => { if (e.target === modal || e.target.closest('.modal-close,[data-close]')) closeModal(); };

    // gallery filter + lightbox
    $('#filters').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('#filters button').forEach(x => x.classList.toggle('on', x === b));
      $$('.g-item').forEach(g => g.classList.toggle('hide', b.dataset.cat !== 'All' && g.dataset.cat !== b.dataset.cat));
    };
    const lb = $('#lightbox'); let li = 0;
    const visible = () => $$('.g-item:not(.hide)').map(g => +g.dataset.i);
    const showLb = i => { li = i; const g = C.gallery[i]; $('img', lb).src = safeUrl(g.image); $('figcaption', lb).textContent = g.caption; };
    const step = d => { const v = visible(); showLb(v[(v.indexOf(li) + d + v.length) % v.length]); };
    $('#masonry').onclick = e => { const g = e.target.closest('.g-item'); if (g) { $('.lb-prev', lb).onclick = () => step(-1); $('.lb-next', lb).onclick = () => step(1); showLb(+g.dataset.i); lb.classList.add('open'); } };
    $('.lb-close', lb).onclick = () => lb.classList.remove('open');
    
    lb.onclick = e => { if (e.target === lb) lb.classList.remove('open'); };
    addEventListener('keydown', e => {
      if (e.key === 'Escape') { lb.classList.remove('open'); closeModal(); }
      if (lb.classList.contains('open')) { if (e.key === 'ArrowLeft') $('.lb-prev', lb).click(); if (e.key === 'ArrowRight') $('.lb-next', lb).click(); }
    });


    // faq
    $('#accordion').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      const acc = b.parentElement, open = !acc.classList.contains('open');
      $$('.acc').forEach(a => { a.classList.remove('open'); $('button', a).setAttribute('aria-expanded', 'false'); });
      if (open) { acc.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    };

    setupForm();
    setupEvents();
    // elements rendered after the observer was set up (event cards) still need to fade in
    $$('.reveal:not(.in)').forEach(el => io.observe(el));
  }

  function setupForm() {
    const form = $('#enquiry'), steps = $$('.step', form), labels = $$('.steps span', form), msg = $('#formMsg');
    let cur = 0;
    const go = i => { cur = i; steps.forEach((s, k) => s.classList.toggle('active', k === i)); labels.forEach((l, k) => l.classList.toggle('active', k <= i)); };
    form.addEventListener('click', e => {
      if (e.target.closest('.next')) {
        const sel = form.eventType;
        if (cur === 0 && !sel.value) { sel.classList.add('invalid'); msg.textContent = 'Please choose an event type.'; return; }
        sel.classList.remove('invalid'); msg.textContent = ''; go(cur + 1);
      }
      if (e.target.closest('.prev')) go(cur - 1);
    });
    form.onsubmit = async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || (!data.email && !data.phone)) { msg.textContent = 'Please share your name and an email or phone number.'; return; }
      if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) { msg.textContent = 'Please enter a valid email.'; return; }
      msg.textContent = 'Sending…';
      // open the WhatsApp tab right away (inside the click) so popup blockers allow it
      const waNum = String(C.contact.enquiryWhatsapp || C.contact.whatsapp || '').replace(/\D/g, '');
      const waWin = waNum ? window.open('', '_blank') : null;
      try {
        const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error((await r.json()).error);
        form.reset(); go(0);
        if (waNum) {
          const fields = [['Name', data.name], ['Phone', data.phone], ['Email', data.email], ['Event', data.eventType], ['Date', data.date],
            ['Guests', data.guests], ['Budget', data.budget], ['Details', data.message]].filter(([, v]) => v).map(([k, v]) => `*${k}:* ${v}`);
          const text = ['Hello Abhyudaya Events! I would like to plan an event.', '', ...fields].join('\n');
          const url = `https://wa.me/${waNum}?text=${encodeURIComponent(text)}`;
          if (waWin) waWin.location.href = url; else location.href = url;
          msg.innerHTML = `✦ Thank you! Your enquiry is saved. Please press <b>Send</b> in WhatsApp to reach us. <a href="${esc(url)}" target="_blank" rel="noopener" style="text-decoration:underline">Open WhatsApp again</a>`;
        } else msg.textContent = '✦ Thank you! Our team will reach out within 24 hours.';
      } catch (err) { waWin?.close(); msg.textContent = err.message || 'Something went wrong. Please call us instead.'; }
    };
  }

  function countUp(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 2000;
    const tick = t => { const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * e) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  // floating rose-gold particles in hero
  function sparkles() {
    const cv = $('#sparkles'); if (!cv || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = cv.getContext('2d'); let W, H, ps;
    const size = () => { W = cv.width = cv.offsetWidth * devicePixelRatio; H = cv.height = cv.offsetHeight * devicePixelRatio; ps = Array.from({ length: Math.min(90, W / 18) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 * devicePixelRatio + .3, s: Math.random() * .4 + .1, a: Math.random() * Math.PI * 2 })); };
    size(); addEventListener('resize', size);
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y -= p.s; p.a += .02; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        ctx.globalAlpha = .35 + Math.sin(p.a) * .35;
        ctx.fillStyle = p.r > 1.5 ? '#e3ab92' : '#D6D6D6';
        ctx.beginPath(); ctx.arc(p.x + Math.sin(p.a) * 6, p.y, p.r, 0, 7); ctx.fill();
      }
      requestAnimationFrame(draw);
    })();
  }

  init();
})();
