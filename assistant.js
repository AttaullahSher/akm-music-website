// AKM Music — "Ask AKM" shopping assistant (Gemini via Firebase AI Logic)
// Appears on the shop page only when Firebase is configured. The model gets
// the customer's question plus a shortlist of matching catalog items and
// answers as a friendly AKM salesperson. Checkout stays WhatsApp.

(function () {
  'use strict';

  if (!window.AKM_FIREBASE_CONFIG || !window.AKM_AI_ENABLED) return;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // ---------- UI ----------
  const fab = document.createElement('button');
  fab.className = 'ai-fab';
  fab.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i><span>Ask AKM</span>';
  fab.setAttribute('aria-label', 'Ask AKM assistant');

  const panel = document.createElement('div');
  panel.className = 'ai-panel';
  panel.innerHTML = `
    <div class="ai-head">
      <strong><i class="fas fa-wand-magic-sparkles"></i> Ask AKM</strong>
      <span>AI shopping helper</span>
      <button class="ai-close" aria-label="Close"><i class="fas fa-times"></i></button>
    </div>
    <div class="ai-msgs" id="aiMsgs">
      <div class="ai-msg bot">Hi! 👋 Tell me what you're looking for — e.g. <em>"best beginner guitar under AED 1,500"</em> or <em>"strings for a classical guitar"</em> — and I'll suggest from our catalog.</div>
    </div>
    <div class="ai-inputrow">
      <input type="text" id="aiInput" placeholder="What are you looking for?" maxlength="300">
      <button id="aiSend" aria-label="Send"><i class="fas fa-paper-plane"></i></button>
    </div>`;

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    fab.addEventListener('click', () => panel.classList.toggle('open'));
    panel.querySelector('.ai-close').addEventListener('click', () => panel.classList.remove('open'));
    panel.querySelector('#aiSend').addEventListener('click', send);
    panel.querySelector('#aiInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  });

  function addMsg(cls, html) {
    const div = document.createElement('div');
    div.className = 'ai-msg ' + cls;
    div.innerHTML = html;
    const box = document.getElementById('aiMsgs');
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  }

  // ---------- catalog shortlist ----------
  let catalog = null;
  async function getCatalog() {
    if (catalog) return catalog;
    const res = await fetch('products.json?v=' + new Date().toISOString().slice(0, 10), { cache: 'no-cache' });
    catalog = (await res.json()).products;
    return catalog;
  }

  function shortlist(q, products) {
    const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = products.map(p => {
      const hay = (p.name + ' ' + p.category + ' ' + p.brand).toLowerCase();
      let score = terms.reduce((s, t) => s + (hay.includes(t) ? 2 : 0), 0);
      if (p.inStock) score += 1;
      return { p, score };
    }).filter(x => x.score > 1);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 14).map(x => x.p);
  }

  // ---------- chat ----------
  let busy = false;
  async function send() {
    const input = document.getElementById('aiInput');
    const q = input.value.trim();
    if (!q || busy) return;
    busy = true;
    input.value = '';
    addMsg('user', esc(q));
    const thinking = addMsg('bot', '<i class="fas fa-ellipsis fa-fade"></i>');

    try {
      const products = await getCatalog();
      const picks = shortlist(q, products);
      const ctx = picks.map(p =>
        `- ${p.name} | ${p.brand} | ${p.category} | AED ${p.price} | ${p.inStock ? 'in stock' : 'on order'}`).join('\n');

      const prompt =
`You are the friendly in-store assistant of AKM Music, a musical instrument shop in Abu Dhabi (since 1984). A customer asks: "${q}"

Here are matching products from our catalog (only recommend from this list; if nothing fits, say so and suggest asking on WhatsApp):
${ctx || '(no close matches found)'}

Reply in under 120 words, warm and helpful. Mention 1-3 specific products with their AED prices. Currency is AED. Do not invent products or prices. End by inviting them to add to cart or ask us on WhatsApp.`;

      const answer = await window.AKM.askGemini(prompt);
      thinking.remove();

      if (!answer) {
        addMsg('bot', 'I\'m having trouble thinking right now 😅 — please use the search bar above, or <a href="https://wa.me/97126219929" target="_blank" rel="noopener">ask us on WhatsApp</a>.');
      } else {
        addMsg('bot', esc(answer).replace(/\n/g, '<br>'));
        if (picks.length) {
          addMsg('bot cards', picks.slice(0, 3).map(p => `
            <a class="ai-card" href="shop.html?q=${encodeURIComponent(p.name.split(' ').slice(0, 4).join(' '))}">
              <img src="${esc(p.image)}" alt="" loading="lazy">
              <span class="ai-card-name">${esc(p.name)}</span>
              <span class="ai-card-price">AED ${p.price.toLocaleString('en-AE')}</span>
            </a>`).join(''));
        }
        if (window.gtag) gtag('event', 'ai_assistant_query');
      }
    } catch (err) {
      thinking.remove();
      addMsg('bot', 'Something went wrong — please try again or <a href="https://wa.me/97126219929" target="_blank" rel="noopener">message us on WhatsApp</a>.');
    }
    busy = false;
  }
})();
