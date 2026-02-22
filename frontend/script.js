// REVA Postpartum Support Website - Full Functionality

// --- BUTTON EVENT LISTENERS ---
function addButtonListeners() {
    // Exercise
    document.querySelectorAll('.btn-exercise').forEach(btn => {
        btn.addEventListener('click', openExerciseModal);
    });
    // Tracking
    document.querySelectorAll('.btn-track').forEach(btn => {
        btn.addEventListener('click', openTrackingModal);
    });
    // Add to Cart
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
    // Add to Wishlist
    /*
      frontend/script.js — REVA (client-side)
      - Fully modular client-side features backed by localStorage
      - Exercises, Tracking, AI Chat (placeholder), Shop, Cart, Wishlist, Forms
      - Robust DOM checks so script is safe to include on all pages
    */

    /* Utility helpers */
    const qs = (sel, root = document) => root.querySelector(sel);
    const qsa = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));
    const createEl = (tag, props = {}, ...children) => {
      const el = document.createElement(tag);
      Object.entries(props).forEach(([k, v]) => {
        if (k === 'class') el.className = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v);
      });
      children.flat().forEach(c => { if (c != null) el.append(typeof c === 'string' ? document.createTextNode(c) : c); });
      return el;
    };

    /* Toast notifications */
    const toastRoot = (() => {
      let root = qs('#reva-toast-root');
      if (!root) {
        root = createEl('div', { id: 'reva-toast-root', class: 'reva-toast-root' });
        document.body.appendChild(root);
      }
      return root;
    })();
    function toast(msg, opts = {}) {
      const t = createEl('div', { class: 'reva-toast' }, msg);
      toastRoot.appendChild(t);
      setTimeout(() => t.classList.add('visible'), 20);
      const ms = opts.ms || 3500;
      setTimeout(() => t.classList.remove('visible'), ms);
      setTimeout(() => t.remove(), ms + 400);
    }

    /* Modal helper */
    function openModal(selector) {
      const m = qs(selector);
      if (!m) return;
      m.classList.add('active');
      m.setAttribute('aria-hidden', 'false');
    }
    function closeModal(selector) {
      const m = qs(selector);
      if (!m) return;
      m.classList.remove('active');
      m.setAttribute('aria-hidden', 'true');
    }

    /* Storage helpers */
    const storage = {
      get(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch(e){ return fallback; } },
      set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    };

    /* ======================
       EXERCISES
       ====================== */
    const Exercises = (() => {
      const key = 'reva:exercises';
      const defaultList = [
        { id: 'e1', title: 'Breathing Exercise', desc: '5-minute guided breathing to ease tension.' },
        { id: 'e2', title: 'Gentle Stretch', desc: 'Simple postnatal stretches to restore movement.' },
        { id: 'e3', title: 'Mini Meditation', desc: '2-minute grounding meditation for calm.' }
      ];
      function list() { return storage.get(key, defaultList); }
      function completed() { return storage.get(key + ':completed', []); }
      function isCompleted(id) { return completed().includes(id); }
      function markDone(id) { const c = completed(); if (!c.includes(id)) { c.push(id); storage.set(key + ':completed', c); toast('Exercise saved'); renderExerciseModal(); } }
      function renderExerciseModal() {
        const modal = qs('#exerciseModal');
        if (!modal) return;
        const container = modal.querySelector('.modal-content');
        if (!container) return;
        const items = list().map(e => {
          const done = isCompleted(e.id);
          return createEl('div', { class: 'exercise-item' },
            createEl('h4', {}, e.title),
            createEl('p', {}, e.desc),
            createEl('div', { class: 'exercise-actions' },
              createEl('button', { class: 'btn-feature', dataset: { id: e.id } }, done ? 'Completed' : 'Mark Complete')
            )
          );
        });
        // Replace list area
        let listArea = modal.querySelector('.exercise-list');
        if (!listArea) {
          listArea = createEl('div', { class: 'exercise-list' });
          container.appendChild(listArea);
        }
        listArea.innerHTML = '';
        items.forEach(it => listArea.appendChild(it));
        listArea.querySelectorAll('button').forEach(btn => btn.addEventListener('click', e => { markDone(e.currentTarget.dataset.id); }));
      }
      return { open() { openModal('#exerciseModal'); renderExerciseModal(); }, close() { closeModal('#exerciseModal'); } };
    })();

    /* ======================
       TRACKING (Mood/Sleep/Baby)
       ====================== */
    const Tracker = (() => {
      const key = 'reva:tracking';
      function save(entry) {
        const all = storage.get(key, []);
        entry.id = Date.now().toString();
        entry.createdAt = new Date().toISOString();
        all.unshift(entry);
        storage.set(key, all);
        toast('Tracking entry saved');
        renderDashboard();
      }
      function list() { return storage.get(key, []); }
      function renderDashboard() {
        const dash = qs('#trackingDashboard');
        if (!dash) return;
        const entries = list();
        dash.innerHTML = '';
        if (!entries.length) { dash.appendChild(createEl('div', { class: 'muted' }, 'No entries yet.')); return; }
        entries.slice(0, 50).forEach(en => {
          const el = createEl('div', { class: 'track-entry' },
            createEl('div', { class: 'track-meta' }, `${new Date(en.createdAt).toLocaleString()}`),
            createEl('div', { class: 'track-main' }, `Mood: ${en.mood} · Sleep: ${en.sleep} · Baby: ${en.milestone}`),
            createEl('div', { class: 'track-notes' }, en.notes || '')
          );
          dash.appendChild(el);
        });
      }
      return { open() { openModal('#trackingModal'); }, save, renderDashboard };
    })();

    /* ======================
       AI CHAT (placeholder)
       - Local simulated bot if backend is unreachable
       ====================== */
    const AIChat = (() => {
      const boxSel = '#revaChatBox';
      const inputSel = '#revaChatInput';
      const typingSel = '#revaChatTyping';
      const historyKey = 'reva:chat:history';
      function append(msg, who = 'bot') {
        const box = qs(boxSel);
        if (!box) return;
        const el = createEl('div', { class: `reva-chat-message ${who}` }, msg);
        box.appendChild(el);
        box.scrollTop = box.scrollHeight;
      }
      function setTyping(on) { const t = qs(typingSel); if (t) t.style.display = on ? 'block' : 'none'; }
      function simulateReply(userMsg) {
        // Gentle, helpful canned replies using keywords
        const msg = userMsg.toLowerCase();
        if (msg.includes('sleep')) return 'Try a consistent routine — even short naps can help. Would you like a 2-minute guided breathing to support rest?';
        if (msg.includes('breast') || msg.includes('latch') || msg.includes('feed')) return 'For breastfeeding support, focus on position and comfort. Seek a lactation consultant if you feel pain.';
        if (msg.includes('anxiety') || msg.includes('sad') || msg.includes('depress')) return 'I hear you — feeling overwhelmed is common. Consider brief grounding exercises and reach out to your care provider for support.';
        return "Thanks for sharing — I'm here to help. Tell me more, or choose a guided exercise.";
      }
      async function send(userText) {
        if (!userText) return;
        append(userText, 'user');
        setTyping(true);
        // Try fetch to backend endpoint; fallback to simulate
        try {
          const res = await fetch('/api/reva/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userText }) });
          if (!res.ok) throw new Error('no-server');
          const json = await res.json();
          const reply = json.reply || simulateReply(userText);
          setTimeout(() => { setTyping(false); append(reply, 'bot'); }, 600 + Math.random() * 800);
        } catch (err) {
          // Local simulation path
          setTimeout(() => { setTyping(false); append(simulateReply(userText), 'bot'); }, 800 + Math.random() * 900);
        }
      }
      function init() {
        const sendBtn = qs('#revaChatSendBtn');
        const input = qs(inputSel);
        if (sendBtn) sendBtn.addEventListener('click', () => { if (input) { send(input.value.trim()); input.value = ''; } });
        if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(input.value.trim()); input.value = ''; } });
      }
      return { init, send };
    })();

    /* ======================
       SHOP, CART & WISHLIST
       ====================== */
    const Shop = (() => {
      const productsUrl = '/reva_shop_products.json';
      const productsKey = 'reva:products';
      const cartKey = 'reva:cart';
      const wishKey = 'reva:wishlist';

      async function loadProducts() {
        // Try server file first, then fallback to embedded JSON
        try {
          const r = await fetch(productsUrl, { cache: 'no-store' });
          if (!r.ok) throw new Error('no-file');
          const j = await r.json();
          const list = j.products || j;
          storage.set(productsKey, list);
          return list;
        } catch (err) {
          const fallback = storage.get(productsKey, null);
          if (fallback) return fallback;
          // minimal inline fallback
          const inline = [
            { id: 'p-demo', name: 'REVA Cozy Blanket', price: 49.99, image: '', desc: 'Soft blanket for nurturing moments.' }
          ];
          storage.set(productsKey, inline);
          return inline;
        }
      }

      function getCart() { return storage.get(cartKey, []); }
      function getWishlist() { return storage.get(wishKey, []); }
      function saveCart(cart) { storage.set(cartKey, cart); renderCart(); }
      function saveWishlist(w) { storage.set(wishKey, w); renderWishlist(); }

      function addToCart(id, qty = 1) {
        const cart = getCart();
        const found = cart.find(i => i.id === id);
        if (found) found.qty = Math.min(99, found.qty + qty); else cart.push({ id, qty });
        saveCart(cart);
        toast('Added to cart');
      }
      function addToWishlist(id) {
        const w = getWishlist(); if (!w.includes(id)) { w.push(id); saveWishlist(w); toast('Added to wishlist'); }
      }

      function renderProducts(list, target = '#shopProducts') {
        const area = qs(target);
        if (!area) return;
        area.innerHTML = '';
        list.forEach(p => {
          const card = createEl('div', { class: 'product-card' },
            createEl('img', { src: p.image || '', alt: p.name }),
            createEl('h4', {}, p.name),
            createEl('p', { class: 'muted' }, p.description || p.desc || ''),
            createEl('div', { class: 'product-meta' }, `$${p.price.toFixed(2)}`),
            createEl('div', { class: 'product-actions' },
              createEl('button', { class: 'btn-feature', dataset: { id: p.id } }, 'Add to Cart'),
              createEl('button', { class: 'btn-ghost', dataset: { id: p.id } }, 'Wishlist')
            )
          );
          area.appendChild(card);
        });
        // wire actions
        qsa('.product-actions button').forEach(btn => {
          const id = btn.dataset.id;
          if (btn.textContent.includes('Cart')) btn.addEventListener('click', () => addToCart(id));
          else btn.addEventListener('click', () => addToWishlist(id));
        });
      }

      function renderCart() {
        const root = qs('#cartDrawer'); if (!root) return;
        const cart = getCart();
        root.innerHTML = '';
        if (!cart.length) { root.appendChild(createEl('div', { class: 'muted' }, 'Your cart is empty')); return; }
        const products = storage.get(productsKey, []);
        cart.forEach(item => {
          const p = products.find(x => x.id === item.id) || { name: item.id, price: 0 };
          const row = createEl('div', { class: 'cart-row' },
            createEl('div', { class: 'cart-title' }, p.name),
            createEl('div', { class: 'cart-qty' },
              createEl('button', { class: 'qty-minus', dataset: { id: item.id } }, '−'),
              createEl('span', { class: 'qty-num' }, String(item.qty)),
              createEl('button', { class: 'qty-plus', dataset: { id: item.id } }, '+')
            ),
            createEl('div', { class: 'cart-price' }, `$${(p.price * item.qty || 0).toFixed(2)}`),
            createEl('button', { class: 'btn-ghost remove-item', dataset: { id: item.id } }, 'Remove')
          );
          root.appendChild(row);
        });
        // wire qty buttons
        qsa('.qty-minus').forEach(b => b.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id; const cart = getCart(); const it = cart.find(x => x.id === id); if (!it) return; it.qty = Math.max(1, it.qty - 1); saveCart(cart);
        }));
        qsa('.qty-plus').forEach(b => b.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id; const cart = getCart(); const it = cart.find(x => x.id === id); if (!it) return; it.qty = Math.min(99, it.qty + 1); saveCart(cart);
        }));
        qsa('.remove-item').forEach(b => b.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id; const cart = getCart().filter(x => x.id !== id); saveCart(cart);
        }));
      }

      function renderWishlist() {
        const root = qs('#wishlistArea'); if (!root) return;
        const w = getWishlist(); root.innerHTML = '';
        if (!w.length) { root.appendChild(createEl('div', { class: 'muted' }, 'No items in wishlist')); return; }
        const products = storage.get(productsKey, []);
        w.forEach(id => { const p = products.find(x => x.id === id) || { name: id }; root.appendChild(createEl('div', {}, p.name)); });
      }

      async function init() {
        const list = await loadProducts();
        // ensure shopProducts container exists
        if (qs('#shopProducts')) renderProducts(list, '#shopProducts');
        renderCart(); renderWishlist();
        // quick shop button
        const shopBtn = qs('#shopBtn'); if (shopBtn) shopBtn.addEventListener('click', () => { if (qs('#shopSection')) qs('#shopSection').scrollIntoView({behavior:'smooth'}); else toast('Shop opened'); });
      }

      return { init, addToCart, addToWishlist, renderCart };
    })();

    /* ======================
       FORMS
       ====================== */
    function wireForms() {
      qsa('form').forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const fm = new FormData(form);
          const obj = Object.fromEntries(fm.entries());
          // Basic validation
          const invalid = qsa('input[required], textarea[required]', form).some(i => !i.value.trim());
          if (invalid) { toast('Please complete required fields', { ms: 2500 }); return; }
          // Save
          const subs = storage.get('reva:forms', []);
          subs.push({ formId: form.id || 'form', data: obj, createdAt: new Date().toISOString() });
          storage.set('reva:forms', subs);
          form.reset();
          toast('Thanks — we saved your submission');
        });
      });
    }

    /* ======================
       UI Helpers
       ====================== */
    function enableSmoothScroll() { qsa('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const href = a.getAttribute('href'); if (!href || href === '#') return; e.preventDefault(); const t = qs(href); if (t) t.scrollIntoView({ behavior: 'smooth' }); })); }
    function enableFocusStyles() { qsa('button,input,textarea').forEach(el => { el.addEventListener('focus', () => el.classList.add('focused')); el.addEventListener('blur', () => el.classList.remove('focused')); }); }

    /* ======================
       INIT
       ====================== */
    document.addEventListener('DOMContentLoaded', () => {
      // Bind basic UI
      enableSmoothScroll(); enableFocusStyles(); wireForms(); AIChat.init();

      // Exercises buttons
      const tryExerciseBtn = qs('#tryExerciseBtn'); if (tryExerciseBtn) tryExerciseBtn.addEventListener('click', () => Exercises.open());
      const exerciseClose = qs('#exerciseModal .close'); if (exerciseClose) exerciseClose.addEventListener('click', () => Exercises.close());

      // Tracking
      const trackBtn = qs('#trackPatternsBtn'); if (trackBtn) trackBtn.addEventListener('click', () => { openModal('#trackingModal'); });
      const trackModal = qs('#trackingModal'); if (trackModal) {
        const form = trackModal.querySelector('#trackingForm'); if (form) form.addEventListener('submit', (e) => { e.preventDefault(); const f = new FormData(form); Tracker.save({ mood: f.get('mood'), sleep: f.get('sleep'), milestone: f.get('milestone'), notes: f.get('notes') }); form.reset(); closeModal('#trackingModal'); });
        const closeBtn = trackModal.querySelector('.close'); if (closeBtn) closeBtn.addEventListener('click', () => closeModal('#trackingModal'));
      }
      Tracker.renderDashboard();

      // Chat open/close
      const chatOpen = qs('.reva-chat-open'); if (chatOpen) chatOpen.addEventListener('click', () => { qs('#revaChatContainer').style.display = 'flex'; chatOpen.style.display = 'none'; });
      const chatClose = qs('.reva-chat-close'); if (chatClose) chatClose.addEventListener('click', () => { qs('#revaChatContainer').style.display = 'none'; if (chatOpen) chatOpen.style.display = 'inline-block'; });

      // Load shop
      Shop.init();

      // Render product area if missing
      if (!qs('#shopProducts') && qs('#shop')) {
        const shopArea = createEl('div', { id: 'shopProducts', class: 'container' }); qs('#shop').appendChild(shopArea);
        Shop.init();
      }

      // Cart drawer element
      if (!qs('#cartDrawer')) {
        const drawer = createEl('div', { id: 'cartDrawer', class: 'cart-drawer' }); document.body.appendChild(drawer);
      }
      Shop.renderCart();
    });

    /* Small CSS injection for toast + minimal product/card styles to ensure functionality without editing CSS files */
    (function injectStyles(){
      const css = `
      .reva-toast-root{position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;flex-direction:column;gap:8px}
      .reva-toast{background:linear-gradient(90deg,#fff,#fff);padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(15,17,42,0.08);opacity:0;transform:translateY(6px);transition:all .28s}
      .reva-toast.visible{opacity:1;transform:none}
      .product-card{background:#fff;padding:16px;border-radius:12px;box-shadow:0 8px 24px rgba(15,17,42,0.06);display:flex;flex-direction:column;gap:8px}
      .product-card img{width:100%;height:160px;object-fit:cover;border-radius:8px}
      .cart-drawer{position:fixed;right:16px;top:16vh;width:320px;max-height:60vh;overflow:auto;background:#fff;padding:12px;border-radius:12px;box-shadow:0 12px 36px rgba(15,17,42,0.08);z-index:9999}
      .track-entry{background:#fff;padding:12px;border-radius:10px;margin-bottom:10px;box-shadow:0 6px 18px rgba(15,17,42,0.04)}
      `;
      const s = document.createElement('style'); s.appendChild(document.createTextNode(css)); document.head.appendChild(s);
    })();

    // End of script
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise) {
    btnExercise.addEventListener('click', () => {
      // Placeholder: open exercise modal or alert
      alert('Try the Exercise! (Replace with modal)');
      // TODO: Integrate with exercise module/backend
    });
  }

  // Start Tracking Patterns
  const btnTrack = document.getElementById('btnTrack');
  if (btnTrack) {
    btnTrack.addEventListener('click', () => {
      alert('Start Tracking Patterns! (Replace with tracker modal)');
      // TODO: Integrate with tracking module/backend
    });
  }

  // Add to Cart
  document.querySelectorAll('.btnAddCart').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Cart: ${item}`);
      // TODO: Integrate with cart backend
    });
  });

  // Add to Wishlist
  document.querySelectorAll('.btnAddWishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.itemName || 'Item';
      alert(`Added to Wishlist: ${item}`);
      // TODO: Integrate with wishlist backend
    });
  });

  // Submit Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        alert('Please fill all required fields.');
        return;
      }
      alert('Form submitted successfully!');
      // TODO: Integrate with backend form submission
      form.reset();
    });
  });

  // Chat with REVA
  const btnChat = document.getElementById('btnChat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      openRevaChat();
      // TODO: Integrate with AI chat backend
    });
  }

  // Shop for Mom & Baby
  const btnShop = document.getElementById('btnShop');
  if (btnShop) {
    btnShop.addEventListener('click', () => {
      alert('Shop for Mom & Baby! (Replace with product modal/cart update)');
      // TODO: Integrate with shopping module/backend
    });
  }
});
// --- End REVA Button Functionality ---

// --- REVA Interactive Features ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const tryExerciseBtn = document.getElementById('tryExerciseBtn');
  if (tryExerciseBtn) {
    tryExerciseBtn.addEventListener('click', () => {
      openExerciseModal();
    });
  }

  // Start Tracking Patterns
  const trackPatternsBtn = document.getElementById('trackPatternsBtn');
  if (trackPatternsBtn) {
    trackPatternsBtn.addEventListener('click', () => {
      openTrackingModal();
    });
  }

  // Chat with REVA
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      openRevaChat();
    });
  }

  // Add to Cart
  const addToCartBtn = document.getElementById('addToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart.push('Mom & Baby Product');
      localStorage.setItem('cart', JSON.stringify(cart));
      alert('Added to cart!');
      // TODO: Integrate with backend cart API
    });
  }

  // Add to Wishlist
  const wishlistBtn = document.getElementById('wishlistBtn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wishlist.push('Mom & Baby Product');
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
      // TODO: Integrate with backend wishlist API
    });
  }

  // Shop for Mom & Baby
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      alert('Shop for Mom & Baby!');
      // TODO: Integrate with shopping module/backend
    });
  }

  // Forms (newsletter, contact, signup)
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea').forEach(input => {
        if (input.required && !input.value.trim()) valid = false;
      });
      if (!valid) {
        showFormMessage(form, 'Please fill all required fields.', false);
        return;
      }
      let submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      submissions.push(Object.fromEntries(new FormData(form).entries()));
      localStorage.setItem('formSubmissions', JSON.stringify(submissions));
      showFormMessage(form, 'Submission successful!', true);
      form.reset();
      // TODO: Integrate with backend form API
    });
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Hover effects and input focus animations
  document.querySelectorAll('button, input, textarea').forEach(el => {
    el.addEventListener('mouseover', () => el.classList.add('hovered'));
    el.addEventListener('mouseout', () => el.classList.remove('hovered'));
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});

// --- Exercise Modal Logic ---
function openExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.add('active');
}
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (modal) modal.classList.remove('active');
}
function markExerciseCompleted(exerciseName) {
  let completed = JSON.parse(localStorage.getItem('completedExercises') || '[]');
  if (!completed.includes(exerciseName)) completed.push(exerciseName);
  localStorage.setItem('completedExercises', JSON.stringify(completed));
  // TODO: Integrate with backend
}

// --- Tracking Modal Logic ---
function openTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.add('active');
}
function closeTrackingModal() {
  const modal = document.getElementById('trackingModal');
  if (modal) modal.classList.remove('active');
}
function saveTrackingEntry(entry) {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  entries.push(entry);
  localStorage.setItem('trackingEntries', JSON.stringify(entries));
  // TODO: Integrate with backend
}
function displayTrackingEntries() {
  let entries = JSON.parse(localStorage.getItem('trackingEntries') || '[]');
  const dashboard = document.getElementById('trackingDashboard');
  if (dashboard) {
    dashboard.innerHTML = entries.map(e => `<div class='track-entry'>Mood: ${e.mood}, Sleep: ${e.sleep}, Milestone: ${e.milestone}, Notes: ${e.notes}</div>`).join('');
  }
}

// --- Form Message Helper ---
function showFormMessage(form, msg, success) {
  let msgDiv = form.querySelector('.form-message');
  if (!msgDiv) {
    msgDiv = document.createElement('div');
    msgDiv.className = 'form-message';
    form.appendChild(msgDiv);
  }
  msgDiv.innerText = msg;
  msgDiv.style.color = success ? 'green' : 'red';
}

// --- Clear Comments for Backend Integration ---
// All localStorage actions have placeholders for backend API integration.
// Modular code for easy expansion.

// --- REVA Button Functionality ---

document.addEventListener('DOMContentLoaded', () => {
  // Try the Exercise
  const btnExercise = document.getElementById('btnExercise');
  if (btnExercise)