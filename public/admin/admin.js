(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let content = null, rev = 0, enquiries = [], dirty = false, current = 'dashboard';

  // ---------- Supabase client ----------
  // Only the public URL + anon key live in the browser. Every write is checked in the
  // database (supabase/schema.sql): non-admins are refused even with a valid login.
  const CFG = window.AE_CONFIG || {};
  const sb = CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase
    ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
        // session lives only in this tab: closing the browser signs the admin out
        auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;
  // turn database/auth errors into short, human messages
  const fail = (error, fallback = 'Something went wrong') => {
    if (!error) return;
    const m = error.message || '';
    if (/stale/.test(m)) throw new Error('stale');
    if (error.code === '42501' || /not authorized|permission denied|row-level security/i.test(m)) throw new Error('This account is not allowed to do that.');
    if (/JWT|session|expired/i.test(m)) { logout(); throw new Error('Session expired — please sign in again.'); }
    throw new Error(m || fallback);
  };
  const toEnquiry = r => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, eventType: r.event_type, date: r.event_date,
    guests: r.guests, budget: r.budget, message: r.message, status: r.status, createdAt: r.created_at });
  async function loadContent() {
    const { data, error } = await sb.from('site_content').select('data, rev').eq('id', 1).maybeSingle();
    fail(error, 'Could not load content');
    if (!data) throw new Error('No website content found. Run supabase/seed.sql in Supabase first.');
    content = data.data; rev = data.rev;
  }
  async function loadEnquiries() {
    const { data, error } = await sb.from('enquiries').select('*').order('created_at', { ascending: false }).limit(1000);
    fail(error, 'Could not load enquiries');
    enquiries = data.map(toEnquiry);
  }
  async function publish(next) {
    const { data, error } = await sb.rpc('save_content', { new_data: next, expected_rev: rev });
    fail(error, 'Could not save');
    rev = data;
  }

  // ---------- schema: drives every content editor ----------
  const ICON_OPTS = ['calendar', 'mic', 'megaphone', 'star', 'users', 'building', 'sparkle', 'heart'];
  const SECTIONS = {
    site: { title: 'General', path: 'site', fields: [
      ['name', 'Company name'], ['tagline', 'Tagline'], ['logo', 'Full logo (loader &amp; footer)', 'image'], ['logoMark', 'AE mark (header)', 'image'],
      ['announcement', 'Announcement bar (leave empty to hide)'], ['seoDescription', 'SEO description', 'textarea']] },
    hero: { title: 'Hero Banner', path: 'hero', fields: [
      ['eyebrow', 'Small heading'], ['title', 'Main headline (last 2 words are highlighted)'], ['subtitle', 'Sub-headline', 'textarea'],
      ['ctaPrimary', 'Primary button text'], ['ctaSecondary', 'Secondary button text'],
      ['video', 'Background video (optional — replaces the blurred photo background)', 'video']] },
    slides: { title: 'Hero Carousel Photos', path: 'hero.slides', type: 'items', label: 'Slide', blank: { image: '', caption: '', category: '' },
      fields: [['image', 'Photo (portrait works best)', 'image'], ['caption', 'Caption'], ['category', 'Small label (e.g. Weddings)']] },
    events: { title: 'Events', path: 'events', type: 'items', label: 'Event',
      hint: 'Upcoming and live events appear in the Events section of the website automatically and disappear 8 hours after they start. Tick "Show as popup" on the one event you want visitors to see first.',
      blank: { title: 'New Event', subtitle: '', date: '', showTime: true, venue: '', organisers: '', lineup: [], mapLink: '', description: '', posters: [], ctaText: 'Get Passes', ctaLink: '#contact', phones: [], popup: false, tag: '', delay: 4 },
      fields: [['title', 'Event name'], ['subtitle', 'Tagline'], ['date', 'Date & start time', 'datetime'], ['showTime', 'Show start time on the website', 'checkbox'],
        ['venue', 'Venue'], ['mapLink', 'Google Maps link for the venue (open the place in Google Maps → Share → Copy link)'],
        ['organisers', 'Presented by'], ['description', 'Description', 'textarea'], ['lineup', 'Line-up / artists (each name can link to their Instagram or Google page)', 'people'],
        ['posters', 'Posters (first one is the main poster)', 'imagelist'], ['ctaText', 'Button text'], ['ctaLink', 'Button link (WhatsApp, ticket URL or #contact)'],
        ['districtLink', 'District (by Zomato) ticket link (optional)'], ['bmsLink', 'BookMyShow ticket link (optional)'],
        ['phones', 'Pass enquiry numbers', 'list'], ['popup', 'Show as popup when visitors arrive', 'checkbox'], ['tag', 'Popup badge text (optional)'], ['delay', 'Popup delay (seconds)', 'number']] },
    about: { title: 'About & Objectives', path: 'about', fields: [
      ['title', 'Heading'], ['text', 'About text', 'textarea'], ['image', 'Image', 'image'],
      ['founder', 'Founder name'], ['founderTitle', 'Founder title']],
      extra: { path: 'objectives', title: 'Objectives', type: 'list' } },
    stats: { title: 'Statistics', path: 'stats', type: 'items', label: 'Stat', blank: { value: 0, suffix: '+', label: '' },
      fields: [['value', 'Number', 'number'], ['suffix', 'Suffix (e.g. + or K+)'], ['label', 'Label']] },
    services: { title: 'Services', path: 'services', type: 'items', label: 'Service', blank: { icon: 'sparkle', title: 'New Service', text: '', points: [], image: '' },
      fields: [['title', 'Title'], ['icon', 'Icon', 'select', ICON_OPTS], ['text', 'Description', 'textarea'], ['image', 'Hover image', 'image'], ['points', 'Highlights', 'list']] },
    process: { title: 'Process', path: 'process', type: 'items', label: 'Step', blank: { title: '', text: '' },
      fields: [['title', 'Step title'], ['text', 'Description', 'textarea']] },
    gallery: { title: 'Gallery', path: 'gallery', type: 'items', label: 'Photo', blank: { image: '', caption: '', category: '' }, categories: 'galleryCategories',
      fields: [['image', 'Image', 'image'], ['caption', 'Caption'], ['category', 'Category', 'select', () => content.galleryCategories || []]] },
    testimonials: { title: 'Testimonials', path: 'testimonials', type: 'items', label: 'Testimonial', blank: { quote: '', name: '', role: '' },
      fields: [['quote', 'Quote', 'textarea'], ['name', 'Name'], ['role', 'Role / Company']] },
    clients: { title: 'Clients Strip', path: 'clients', type: 'list' },
    faqs: { title: 'FAQ', path: 'faqs', type: 'items', label: 'Question', blank: { q: '', a: '' },
      fields: [['q', 'Question'], ['a', 'Answer', 'textarea']] },
    contact: { title: 'Contact Details', path: 'contact', fields: [
      ['phone', 'Phone'], ['whatsapp', 'WhatsApp number for the floating button (digits with country code, e.g. 917889231615)'],
      ['enquiryWhatsapp', 'WhatsApp number that receives enquiry-form submissions (leave empty to use the number above)'], ['email', 'Email'],
      ['instagramHandle', 'Instagram name'], ['instagram', 'Instagram URL'], ['founder', 'Founder'], ['address', 'Location / address']] },
    theme: { title: 'Brand Colours', path: 'theme', fields: [
      ['navy', 'Deep Navy (primary)', 'color'], ['rose', 'Beige (accent)', 'color'], ['platinum', 'Platinum', 'color'],
      ['pearl', 'Pearl White (background)', 'color'], ['charcoal', 'Dark Charcoal (text)', 'color']] }
  };
  const MENU = [
    ['Overview', [['dashboard', 'Dashboard'], ['enquiries', 'Enquiries']]],
    ['Website Content', [['site', 'General'], ['hero', 'Hero Banner'], ['slides', 'Hero Carousel'], ['events', 'Events & Popup'], ['about', 'About & Objectives'], ['stats', 'Statistics'], ['services', 'Services'], ['process', 'Process'], ['gallery', 'Gallery'], ['testimonials', 'Testimonials'], ['clients', 'Clients Strip'], ['faqs', 'FAQ'], ['contact', 'Contact Details']]],
    ['Settings', [['theme', 'Brand Colours'], ['settings', 'Account & Backup']]]
  ];

  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600); };
  const setDirty = v => { dirty = v; $('#dirty').hidden = !v; };

  // ---------- light / dark theme (remembered per browser) ----------
  const themeBtn = $('#themeBtn');
  const paintThemeBtn = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    themeBtn.textContent = dark ? '☀' : '☾';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };
  themeBtn.onclick = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('ae_admin_theme', next); } catch {}
    paintThemeBtn();
  };
  paintThemeBtn();

  // ---------- auth (Supabase Auth: passwords are checked and rate-limited on Supabase's servers) ----------
  const loginErr = msg => { $('#loginErr').textContent = msg; };
  // a valid login is not enough: the account must also be on the admins list
  async function isAdmin() {
    const { data, error } = await sb.from('admins').select('user_id').maybeSingle();
    return !error && !!data;
  }
  $('#loginForm').onsubmit = async e => {
    e.preventDefault();
    if (!sb) return;
    const f = Object.fromEntries(new FormData(e.target));
    const btn = $('#loginBtn'); btn.disabled = true; loginErr('');
    try {
      const { error } = await sb.auth.signInWithPassword({ email: String(f.email).trim(), password: f.password });
      // same message for wrong email or wrong password, so the form doesn't reveal which accounts exist
      if (error) return loginErr(/rate|too many/i.test(error.message) ? 'Too many attempts. Please wait a few minutes.' : 'Invalid email or password.');
      if (!(await isAdmin())) { await sb.auth.signOut(); return loginErr('This account does not have admin access.'); }
      e.target.reset();
      await start();
    } catch (err) { loginErr(err.message); }
    finally { btn.disabled = false; }
  };
  function showLogin() { content = null; enquiries = []; setDirty(false); $('#app').hidden = true; $('#login').hidden = false; }
  async function logout() { try { await sb?.auth.signOut(); } catch {} showLogin(); }
  $('#logout').onclick = logout;

  async function start() {
    try { await Promise.all([loadContent(), loadEnquiries()]); }
    catch (err) { loginErr(err.message); return; }
    $('#login').hidden = true; $('#app').hidden = false;
    buildMenu(); show(current);
  }

  function buildMenu() {
    const n = enquiries.filter(e => e.status === 'new').length;
    $('#menu').innerHTML = MENU.map(([g, items]) => `<div class="group">${g}</div>` + items.map(([k, l]) =>
      `<button data-k="${k}" class="${k === current ? 'on' : ''}">${l}${k === 'enquiries' && n ? `<span class="badge">${n}</span>` : ''}</button>`).join('')).join('');
  }
  $('#menu').onclick = e => { const b = e.target.closest('button'); if (b) { show(b.dataset.k); $('#side').classList.remove('open'); } };
  $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
  $('#side').onclick = e => { if (e.target === $('#side')) $('#side').classList.remove('open'); };

  $('#saveBtn').onclick = async () => {
    const btn = $('#saveBtn'); btn.disabled = true;
    try { await publish(content); setDirty(false); toast('✦ Published — website updated'); }
    catch (err) { if (err.message === 'stale') return staleReload(); toast(err.message); }
    finally { btn.disabled = false; }
  };
  // another tab (or device) saved newer content: never overwrite it, load the latest instead
  async function staleReload() {
    alert('The website content was changed somewhere else after you opened this page (another tab or device).\n\nTo avoid overwriting those changes, the latest content will now be loaded. Please redo your last edits.');
    try { await loadContent(); } catch (err) { return toast(err.message); }
    setDirty(false); show(current);
  }
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  function show(k) {
    current = k;
    $$('#menu button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    const title = MENU.flatMap(m => m[1]).find(x => x[0] === k)?.[1] || '';
    $('#pageTitle').textContent = title;
    $('#saveBtn').hidden = ['dashboard', 'enquiries', 'settings'].includes(k);
    const v = $('#view');
    if (k === 'dashboard') return renderDashboard(v);
    if (k === 'enquiries') return renderEnquiries(v);
    if (k === 'settings') return renderSettings(v);
    renderSection(v, SECTIONS[k]);
  }

  // ---------- dashboard ----------
  function renderDashboard(v) {
    const by = s => enquiries.filter(e => e.status === s).length;
    const week = enquiries.filter(e => Date.now() - new Date(e.createdAt) < 7 * 864e5).length;
    v.innerHTML = `
      <div class="kpis">
        <div class="kpi"><small>Total enquiries</small><strong>${enquiries.length}</strong></div>
        <div class="kpi"><small>New</small><strong>${by('new')}</strong></div>
        <div class="kpi"><small>This week</small><strong>${week}</strong></div>
        <div class="kpi"><small>Booked</small><strong>${by('booked')}</strong></div>
      </div>
      <div class="kpis">
        <div class="kpi"><small>Services</small><strong>${content.services.length}</strong></div>
        <div class="kpi"><small>Gallery photos</small><strong>${content.gallery.length}</strong></div>
        <div class="kpi"><small>Testimonials</small><strong>${content.testimonials.length}</strong></div>
      </div>
      <div class="card"><h3>Latest enquiries</h3>${enquiryTable(enquiries.slice(0, 5), false)}</div>`;
  }

  // ---------- enquiries ----------
  function enquiryTable(list, full = true) {
    if (!list.length) return '<p class="empty">No enquiries yet. They will appear here when visitors submit the contact form.</p>';
    return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Name</th><th>Contact</th><th>Event</th>${full ? '<th>Details</th>' : ''}<th>Status</th>${full ? '<th></th>' : ''}</tr></thead><tbody>${list.map(e => `
      <tr class="${e.status === 'new' ? 'new' : ''}">
        <td>${new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td><strong>${esc(e.name)}</strong></td>
        <td>${e.phone ? `<a href="tel:${esc(e.phone)}">${esc(e.phone)}</a><br>` : ''}${e.email ? `<a href="mailto:${esc(e.email)}">${esc(e.email)}</a>` : ''}</td>
        <td>${esc(e.eventType)}${e.date ? `<br><small>${esc(e.date)}</small>` : ''}</td>
        ${full ? `<td><small>${[e.guests && 'Guests: ' + esc(e.guests), e.budget && 'Budget: ' + esc(e.budget)].filter(Boolean).join('<br>')}${e.message ? `<br>${esc(e.message)}` : ''}</small></td>` : ''}
        <td>${full ? `<select data-id="${e.id}">${['new', 'contacted', 'booked', 'closed'].map(s => `<option ${s === e.status ? 'selected' : ''}>${s}</option>`).join('')}</select>` : `<span class="pill ${esc(e.status)}">${esc(e.status)}</span>`}</td>
        ${full ? `<td><button class="btn danger sm" data-del="${e.id}">Delete</button></td>` : ''}
      </tr>`).join('')}</tbody></table></div>`;
  }
  function renderEnquiries(v) {
    v.innerHTML = `<div class="card">
      <div class="toolbar"><input id="q" placeholder="Search name, email, phone, event…"><select id="fs"><option value="">All statuses</option><option>new</option><option>contacted</option><option>booked</option><option>closed</option></select>
      <button class="btn ghost" id="csv">Export CSV</button><button class="btn ghost" id="refresh">Refresh</button></div><div id="tbl"></div></div>`;
    const draw = () => {
      const q = $('#q').value.toLowerCase(), s = $('#fs').value;
      $('#tbl').innerHTML = enquiryTable(enquiries.filter(e => (!s || e.status === s) && (!q || JSON.stringify(e).toLowerCase().includes(q))));
    };
    $('#q').oninput = draw; $('#fs').onchange = draw; draw();
    $('#refresh').onclick = async () => { try { await loadEnquiries(); buildMenu(); draw(); toast('Refreshed'); } catch (err) { toast(err.message); } };
    $('#tbl').onchange = async e => {
      const id = e.target.dataset.id; if (!id) return;
      try { const { error } = await sb.from('enquiries').update({ status: e.target.value }).eq('id', id); fail(error); }
      catch (err) { draw(); return toast(err.message); }
      enquiries.find(x => x.id === id).status = e.target.value; buildMenu(); draw(); toast('Status updated');
    };
    $('#tbl').onclick = async e => {
      const id = e.target.dataset.del; if (!id || !confirm('Delete this enquiry permanently?')) return;
      try { const { error } = await sb.from('enquiries').delete().eq('id', id); fail(error); } catch (err) { return toast(err.message); }
      enquiries = enquiries.filter(x => x.id !== id); buildMenu(); draw(); toast('Deleted');
    };
    $('#csv').onclick = () => {
      const cols = ['createdAt', 'name', 'email', 'phone', 'eventType', 'date', 'guests', 'budget', 'message', 'status'];
      const csv = [cols.join(','), ...enquiries.map(e => cols.map(c => `"${String(e[c] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `enquiries-${new Date().toISOString().slice(0, 10)}.csv` });
      a.click();
    };
  }

  // ---------- generic content editor ----------
  function fieldHTML([key, label, type = 'text', opts], val, id) {
    const a = `data-bind="${id}"`;
    if (type === 'textarea') return `<label class="field"><span>${label}</span><textarea ${a}>${esc(val)}</textarea></label>`;
    if (type === 'checkbox') return `<label class="field check"><input type="checkbox" ${a} ${val ? 'checked' : ''}><span>${label}</span></label>`;
    if (type === 'datetime') return `<label class="field"><span>${label}</span><input type="datetime-local" ${a} value="${esc(val)}"></label>`;
    if (type === 'number') return `<label class="field"><span>${label}</span><input type="number" ${a} value="${esc(val)}"></label>`;
    if (type === 'color') return `<label class="field"><span>${label}</span><input type="color" ${a} value="${esc(val || '#000000')}"></label>`;
    if (type === 'select') {
      // opts can be a fixed list or a function (e.g. the current gallery categories)
      const list = typeof opts === 'function' ? ['', ...opts()] : opts;
      if (val && !list.includes(val)) list.push(val);
      return `<label class="field"><span>${label}</span><select ${a}>${list.map(o => `<option value="${esc(o)}" ${o === val ? 'selected' : ''}>${o === '' ? '— No category —' : esc(o)}</option>`).join('')}</select></label>`;
    }
    if (type === 'image' || type === 'video') return `<div class="field"><span>${label}</span><div class="img-field">${type === 'video' ? (val ? `<video src="${esc(val)}" muted></video>` : '<img alt="">') : `<img src="${esc(val)}" alt="">`}<input type="text" ${a} value="${esc(val)}" placeholder="Paste a URL or upload →"><label class="btn ghost sm">Upload<input type="file" accept="${type}/*" hidden data-upload="${id}"></label></div></div>`;
    if (type === 'list') return `<div class="field"><span>${label} (one per line)</span><textarea ${a} data-list="1">${esc((val || []).join('\n'))}</textarea></div>`;
    if (type === 'imagelist') return `<div class="field"><span>${label}</span>${(val || []).map((u, i) => fieldHTML([i, `Slide ${i + 1}`, 'image'], u, `${id}.${i}`) + `<button class="btn danger sm" data-rmimg="${id}.${i}" style="margin-bottom:12px">Remove slide</button>`).join('')}<button class="btn ghost sm" data-addimg="${id}">+ Add slide</button></div>`;
    if (type === 'people') {
      // rows of { name, link } — e.g. artists with their Instagram / Google profile
      const rows = (val || []).map(p => typeof p === 'string' ? { name: p, link: '' } : p);
      return `<div class="field people"><span>${label}</span>
        ${rows.map((p, i) => `<div class="person"><input type="text" data-bind="${id}.${i}.name" value="${esc(p.name)}" placeholder="Name (e.g. DJ Chhavi)">
          <input type="url" data-bind="${id}.${i}.link" value="${esc(p.link)}" placeholder="Instagram or Google link (optional)">
          <button class="btn danger sm" data-rmperson="${id}.${i}" title="Remove">✕</button></div>`).join('')}
        <button class="btn ghost sm" data-addperson="${id}">+ Add artist</button></div>`;
    }
    return `<label class="field"><span>${label}</span><input type="text" ${a} value="${esc(val)}"></label>`;
  }
  const getPath = p => p.split('.').reduce((o, k) => o?.[k], content);
  const setPath = (p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], content)[last] = v; };

  function renderSection(v, S) {
    const data = getPath(S.path);
    let html = '';
    if (S.type === 'items') {
      html = (S.hint ? `<p class="hint">${S.hint}</p>` : '') + `<p class="hint">Reorder with ↑ ↓. Changes go live after <b>Save &amp; Publish</b>.</p>` + data.map((it, i) => `
        <div class="item"><div class="item-head"><strong>${S.label} ${i + 1}${it.title || it.caption || it.label || it.name || it.q ? ' — ' + esc(it.title || it.caption || it.label || it.name || it.q) : ''}</strong>
          <div class="tools"><button class="btn ghost sm" data-mv="${i}:-1">↑</button><button class="btn ghost sm" data-mv="${i}:1">↓</button><button class="btn danger sm" data-rm="${i}">Remove</button></div></div>
          <div class="grid">${S.fields.map(f => fieldHTML(f, it[f[0]], `${S.path}.${i}.${f[0]}`)).join('')}</div></div>`).join('') +
        `<button class="btn" data-add>+ Add ${S.label}</button>`;
      html = `<div class="card"><h3>${S.title}</h3>${html}</div>`;
      if (S.categories) {
        const cats = content[S.categories] || [];
        const used = c => data.filter(it => it.category === c).length;
        html = `<div class="card"><h3>Categories</h3>
          <p class="hint">These become the filter buttons above the gallery. A category only shows on the website when at least one photo uses it.</p>
          <div class="chips">${cats.map((c, i) => `<span class="chip">${esc(c)} <small>${used(c)}</small><button data-rmcat="${i}" title="Remove category">✕</button></span>`).join('') || '<span class="hint">No categories yet.</span>'}</div>
          <div class="chip-add"><input type="text" id="newCat" placeholder="New category, e.g. Birthdays"><button class="btn sm" data-addcat>+ Add category</button></div>
        </div>` + html;
      }
    } else if (S.type === 'list') {
      html = `<div class="card"><h3>${S.title}</h3>${fieldHTML(['', 'Items', 'list'], data, S.path)}</div>`;
    } else {
      html = `<div class="card"><h3>${S.title}</h3>${S.hint ? `<p class="hint">${S.hint}</p>` : ''}${S.fields.map(f => fieldHTML(f, data[f[0]], `${S.path}.${f[0]}`)).join('')}</div>`;
      if (S.extra) html += `<div class="card"><h3>${S.extra.title}</h3>${fieldHTML(['', 'Items', 'list'], getPath(S.extra.path), S.extra.path)}</div>`;
    }
    if (S.path === 'theme') html += `<button class="btn ghost" id="resetTheme">Reset to brand palette</button>`;
    v.innerHTML = html;

    v.onkeydown = e => { if (e.key === 'Enter' && e.target.id === 'newCat') { e.preventDefault(); $('[data-addcat]', v).click(); } };
    v.oninput = e => {
      const p = e.target.dataset.bind; if (!p) return;
      let val = e.target.value;
      if (e.target.dataset.list) val = val.split('\n').map(s => s.trim()).filter(Boolean);
      if (e.target.type === 'number') val = +val;
      if (e.target.type === 'checkbox') val = e.target.checked;
      setPath(p, val); setDirty(true);
      const prev = e.target.closest('.img-field')?.querySelector('img,video'); if (prev) prev.src = val;
    };
    v.onchange = async e => {
      const p = e.target.dataset.upload; if (!p) return;
      const file = e.target.files[0]; if (!file) return;
      const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4', 'video/webm': 'webm' };
      if (!EXT[file.type]) return toast('Only PNG, JPG, WEBP, GIF images or MP4/WEBM videos can be uploaded');
      if (file.size > 20 * 1024 * 1024) return toast('File too large (max 20 MB)');
      toast('Uploading…');
      try {
        const name = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${EXT[file.type]}`;
        const { error } = await sb.storage.from('media').upload(name, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
        fail(error, 'Upload failed');
        const url = sb.storage.from('media').getPublicUrl(name).data.publicUrl;
        setPath(p, url); setDirty(true); renderSection(v, S); toast('Uploaded — remember to Save & Publish');
      } catch (err) { toast(err.message); }
    };
    v.onclick = e => {
      const t = e.target;
      if (t.dataset.add !== undefined) { data.push(structuredClone(S.blank)); }
      else if (t.dataset.rm) { if (!confirm('Remove this item?')) return; data.splice(+t.dataset.rm, 1); }
      else if (t.dataset.mv) { const [i, d] = t.dataset.mv.split(':').map(Number); const j = i + d; if (j < 0 || j >= data.length) return; [data[i], data[j]] = [data[j], data[i]]; }
      else if (t.dataset.addimg) { getPath(t.dataset.addimg).push(''); }
      else if (t.dataset.addcat !== undefined) {
        const name = $('#newCat').value.trim(); if (!name) return toast('Type a category name first');
        const cats = content[S.categories] = content[S.categories] || [];
        if (cats.some(c => c.toLowerCase() === name.toLowerCase())) return toast('That category already exists');
        cats.push(name);
      }
      else if (t.dataset.rmcat) {
        const cats = content[S.categories]; const name = cats[+t.dataset.rmcat]; const n = data.filter(it => it.category === name).length;
        if (!confirm(`Remove the "${name}" category?${n ? `\n\n${n} photo(s) use it and will be left without a category.` : ''}`)) return;
        cats.splice(+t.dataset.rmcat, 1); data.forEach(it => { if (it.category === name) it.category = ''; });
      }
      else if (t.dataset.addperson) { const p = t.dataset.addperson; const cur = (getPath(p) || []).map(x => typeof x === 'string' ? { name: x, link: '' } : x); cur.push({ name: '', link: '' }); setPath(p, cur); }
      else if (t.dataset.rmperson) { const ks = t.dataset.rmperson.split('.'); const i = +ks.pop(); const p = ks.join('.'); setPath(p, (getPath(p) || []).map(x => typeof x === 'string' ? { name: x, link: '' } : x).filter((_, k) => k !== i)); }
      else if (t.dataset.rmimg) { const ks = t.dataset.rmimg.split('.'); const i = +ks.pop(); getPath(ks.join('.')).splice(i, 1); }
      else if (t.id === 'resetTheme') { Object.assign(content.theme, { navy: '#11213C', rose: '#D8C3A5', platinum: '#D6D6D6', pearl: '#F8F9FA', charcoal: '#2C3338' }); }
      else return;
      setDirty(true); renderSection(v, S);
    };
  }

  // ---------- settings ----------
  function renderSettings(v) {
    v.innerHTML = `
      <div class="card"><h3>Change password</h3>
        <p class="hint">Signed in as <b id="meEmail"></b>. Use a long, unique password (12+ characters).</p>
        <form id="pw" class="grid">
          <label class="field"><span>Current password</span><input name="current" type="password" required autocomplete="current-password"></label>
          <label class="field"><span>New password</span><input name="next" type="password" required minlength="12" autocomplete="new-password"></label>
          <label class="field"><span>Repeat new password</span><input name="again" type="password" required minlength="12" autocomplete="new-password"></label>
          <div class="field" style="align-self:end"><button class="btn">Update password</button></div>
        </form></div>
      <div class="card"><h3>Sessions</h3>
        <p class="hint">Lost a device or think someone else signed in? This signs your account out everywhere, including here.</p>
        <button class="btn danger" id="signOutAll">Sign out of all devices</button></div>
      <div class="card"><h3>Backup &amp; restore</h3>
        <p class="hint">Download all website content as a file, or restore from a previous backup.</p>
        <div class="toolbar"><button class="btn ghost" id="dl">Download backup</button><label class="btn ghost">Restore from file<input type="file" accept=".json" hidden id="restore"></label></div></div>`;
    sb.auth.getUser().then(({ data }) => { $('#meEmail').textContent = data?.user?.email || ''; });
    $('#pw').onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      if (f.next !== f.again) return toast('The new passwords do not match');
      if (f.next === f.current) return toast('Choose a password different from the current one');
      try {
        const { data: { user } } = await sb.auth.getUser();
        // confirm the current password before allowing a change
        const { error: reauth } = await sb.auth.signInWithPassword({ email: user.email, password: f.current });
        if (reauth) return toast('Current password is incorrect');
        const { error } = await sb.auth.updateUser({ password: f.next });
        fail(error, 'Could not change password');
        e.target.reset(); toast('Password updated');
      } catch (err) { toast(err.message); }
    };
    $('#signOutAll').onclick = async () => {
      if (!confirm('Sign out of every device, including this one?')) return;
      try { await sb.auth.signOut({ scope: 'global' }); } catch {}
      showLogin();
    };
    $('#dl').onclick = () => Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })), download: 'abhyudaya-content-backup.json' }).click();
    $('#restore').onchange = async e => {
      try { const c = JSON.parse(await e.target.files[0].text()); if (!c.site || !c.services) throw new Error('Not a valid backup file');
        if (!confirm('Replace all website content with this backup?')) return;
        delete c._rev; await publish(c); content = c; setDirty(false); toast('Restored & published'); }
      catch (err) { if (err.message === 'stale') return staleReload(); toast(err.message); }
    };
  }

  // ---------- boot ----------
  if (!sb) {
    $('#loginForm').querySelectorAll('input,button').forEach(el => el.disabled = true);
    loginErr('Supabase is not configured yet. Add your project URL and anon key to public/config.js.');
  } else {
    sb.auth.onAuthStateChange(evt => { if (evt === 'SIGNED_OUT') showLogin(); });
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      if (await isAdmin()) start(); else { await sb.auth.signOut(); showLogin(); }
    });
  }
})();
