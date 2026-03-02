/* ============================================
   AxeB2B Wallet — Platform JavaScript
   ============================================ */

const API_BASE = '/api';

// ---- AUTH STATE ----
function getToken() {
  return localStorage.getItem('axe_token');
}

function isLoggedIn() {
  return !!getToken();
}

// ---- WALLET BALANCE ----
async function loadWalletBalance() {
  const balanceEl = document.getElementById('wallet-balance');
  if (!balanceEl) return;

  if (!isLoggedIn()) {
    balanceEl.textContent = '—';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/wallet/balance`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      const data = await res.json();
      balanceEl.innerHTML = `<span class="currency">${data.currency}</span>${parseFloat(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
  } catch {
    balanceEl.textContent = '0.00';
  }
}

// ---- TRANSACTIONS ----
async function loadTransactions(page = 1) {
  const tbody = document.getElementById('txn-list');
  if (!tbody || !isLoggedIn()) return;

  try {
    const res = await fetch(`${API_BASE}/wallet/transactions?page=${page}&limit=10`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      const data = await res.json();
      renderTransactions(data.transactions);
    }
  } catch {
    // Show mock data if API unavailable
    renderMockTransactions();
  }
}

function renderTransactions(transactions) {
  const list = document.getElementById('txn-list');
  if (!list) return;

  if (!transactions || transactions.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:32px">No transactions yet.</div>';
    return;
  }

  list.innerHTML = transactions.map(txn => `
    <div class="txn-item">
      <div class="txn-icon">${txn.type === 'credit' ? '⬆️' : '⬇️'}</div>
      <div class="txn-info">
        <h4>${txn.description || 'Transaction'}</h4>
        <p>${new Date(txn.created_at).toLocaleString()}</p>
      </div>
      <div class="txn-amount ${txn.type}">
        ${txn.type === 'credit' ? '+' : '-'}₹${parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    </div>
  `).join('');
}

function renderMockTransactions() {
  const list = document.getElementById('txn-list');
  if (!list) return;

  const mock = [
    { icon: '💳', title: 'Wallet Top-up', time: '2 hours ago', amount: '+₹5,000.00', type: 'credit' },
    { icon: '📱', title: 'eSIM Purchase — India 5G', time: 'Yesterday', amount: '-₹299.00', type: 'debit' },
    { icon: '🌐', title: 'Domain: kimiaxe.com', time: '3 days ago', amount: '-₹899.00', type: 'debit' },
    { icon: '💬', title: 'SMS Credits — 10,000', time: '1 week ago', amount: '-₹1,200.00', type: 'debit' },
    { icon: '💳', title: 'Wallet Top-up', time: '2 weeks ago', amount: '+₹10,000.00', type: 'credit' },
  ];

  list.innerHTML = mock.map(t => `
    <div class="txn-item">
      <div class="txn-icon">${t.icon}</div>
      <div class="txn-info">
        <h4>${t.title}</h4>
        <p>${t.time}</p>
      </div>
      <div class="txn-amount ${t.type}">${t.amount}</div>
    </div>
  `).join('');
}

// ---- ADD MONEY MODAL ----
(function initAddMoney() {
  const form = document.getElementById('add-money-form');
  if (!form) return;

  // Quick amount buttons
  document.querySelectorAll('[data-amount]').forEach(btn => {
    btn.addEventListener('click', function () {
      const amountInput = document.getElementById('add-amount');
      if (amountInput) amountInput.value = this.dataset.amount;
    });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('add-amount')?.value);
    const method = document.querySelector('[data-payment-method].active')?.dataset.paymentMethod || 'razorpay';

    if (!amount || amount < 100) {
      showToast('Minimum top-up amount is ₹100.', 'error');
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Processing…';

    // Simulate payment gateway
    await new Promise(r => setTimeout(r, 1500));

    showToast(`₹${amount.toLocaleString('en-IN')} added to your wallet via ${method}!`, 'success');
    closeModal('add-money');
    loadWalletBalance();
    loadTransactions();

    btn.disabled = false;
    btn.textContent = 'Proceed to Pay';
  });
})();

// ---- PAYMENT METHOD SELECTOR ----
(function initPaymentMethods() {
  document.querySelectorAll('[data-payment-method]').forEach(card => {
    card.addEventListener('click', function () {
      document.querySelectorAll('[data-payment-method]').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });
})();

// ---- ESIM PURCHASE ----
(function initESIM() {
  const form = document.getElementById('esim-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const country = document.getElementById('esim-country')?.value;
    const plan = document.getElementById('esim-plan')?.value;

    if (!country || !plan) {
      showToast('Please select country and plan.', 'error');
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Purchasing…';

    await new Promise(r => setTimeout(r, 1200));

    showToast(`eSIM for ${country} purchased! Check your email for activation QR.`, 'success');
    form.reset();
    loadWalletBalance();

    btn.disabled = false;
    btn.textContent = 'Buy eSIM';
  });
})();

// ---- DOMAIN SEARCH ----
const domainCart = [];

(function initDomainSearch() {
  const form = document.getElementById('domain-search-form');
  const results = document.getElementById('domain-results');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    // Strip TLD if user typed full domain
    let raw = document.getElementById('domain-input')?.value?.trim().toLowerCase() || '';
    const domain = raw.replace(/\.[a-z]{2,}$/, '').replace(/[^a-z0-9-]/g, '');
    if (!domain) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span style="opacity:0.7">Searching…</span>';

    if (results) {
      results.style.display = 'block';
      results.innerHTML = `
        <div style="text-align:center;padding:32px;color:var(--muted)">
          <div style="font-size:2rem;margin-bottom:8px">🔍</div>
          Checking availability for <strong style="color:var(--text)">${domain}.*</strong>
        </div>`;
    }

    await new Promise(r => setTimeout(r, 900));

    const tlds = [
      { ext: '.com', price: '₹899', popular: true },
      { ext: '.in', price: '₹499', popular: true },
      { ext: '.net', price: '₹799', popular: false },
      { ext: '.org', price: '₹699', popular: false },
      { ext: '.io', price: '₹2,499', popular: true },
      { ext: '.co', price: '₹1,299', popular: false },
      { ext: '.ai', price: '₹4,999', popular: true },
      { ext: '.store', price: '₹1,499', popular: false },
    ];

    // Simulate availability (deterministic based on domain name for consistency)
    const takenSet = new Set();
    tlds.forEach(t => {
      const hash = (domain + t.ext).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      if (hash % 3 === 0) takenSet.add(t.ext);
    });

    if (results) {
      results.innerHTML = `
        <div style="margin-bottom:16px;font-size:0.85rem;color:var(--muted)">
          Showing results for <strong style="color:var(--text);font-family:'Geist Mono',monospace">${domain}.*</strong>
        </div>
        ${tlds.map(t => {
          const isAvailable = !takenSet.has(t.ext);
          const fullDomain = domain + t.ext;
          return `
            <div style="display:flex;align-items:center;gap:12px;background:var(--bg3);border:1px solid ${isAvailable ? 'var(--border2)' : 'var(--border)'};border-radius:10px;padding:14px 16px;margin-bottom:8px;opacity:${isAvailable ? '1' : '0.55'}">
              <div style="flex:1;min-width:0">
                <div style="font-family:'Geist Mono',monospace;font-size:0.95rem;font-weight:600;color:var(--text)">${fullDomain}</div>
                <div style="font-size:0.75rem;margin-top:2px;color:${isAvailable ? '#22c55e' : '#ef4444'}">
                  ${isAvailable ? '✅ Available' : '❌ Already Taken'}
                  ${t.popular ? '<span style="margin-left:8px;background:rgba(249,115,22,0.15);color:#f97316;border-radius:4px;padding:1px 6px;font-size:0.7rem">Popular</span>' : ''}
                </div>
              </div>
              <div style="font-family:'Geist Mono',monospace;font-weight:700;color:var(--text);white-space:nowrap">${t.price}<span style="font-size:0.7rem;color:var(--muted);font-weight:400">/yr</span></div>
              ${isAvailable
                ? `<button onclick="addDomainToCart('${fullDomain}','${t.price}')" style="background:var(--wallet-accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:opacity 0.2s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">Add to Cart</button>`
                : `<button disabled style="background:var(--bg2);color:var(--muted);border:1px solid var(--border);border-radius:8px;padding:8px 16px;font-size:0.8rem;cursor:not-allowed;white-space:nowrap">Taken</button>`
              }
            </div>`;
        }).join('')}
        <div id="domain-cart-bar" style="display:none;margin-top:20px;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border:1px solid var(--wallet-badge-border);border-radius:12px;padding:16px 20px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">🛒 Cart</div>
              <div id="domain-cart-items" style="font-family:'Geist Mono',monospace;font-size:0.9rem;color:var(--text)"></div>
            </div>
            <button onclick="checkoutDomains()" style="background:var(--wallet-accent);color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:0.85rem;font-weight:600;cursor:pointer">Checkout →</button>
          </div>
        </div>`;
      results.style.display = 'block';
    }

    btn.disabled = false;
    btn.innerHTML = '🔍 Search';
  });
})();

window.addDomainToCart = function (domain, price) {
  if (domainCart.find(d => d.domain === domain)) {
    showToast(`${domain} is already in your cart.`, 'error');
    return;
  }
  domainCart.push({ domain, price });
  showToast(`${domain} added to cart!`, 'success');

  const bar = document.getElementById('domain-cart-bar');
  const items = document.getElementById('domain-cart-items');
  if (bar && items) {
    bar.style.display = 'block';
    items.textContent = domainCart.map(d => `${d.domain} (${d.price}/yr)`).join(' · ');
  }
};

window.checkoutDomains = function () {
  if (domainCart.length === 0) return;
  const list = domainCart.map(d => `${d.domain} — ${d.price}/yr`).join('\n');
  showToast(`Proceeding to checkout for ${domainCart.length} domain(s). Login required.`, 'success');
  // In production: redirect to checkout page or open auth modal
  if (typeof openModal === 'function') openModal('auth');
};

// ---- BALANCE CHART ----
(function initBalanceChart() {
  const chart = document.getElementById('balance-chart-bars');
  if (!chart) return;

  const data = [8200, 7800, 9100, 8600, 10200, 9800, 11500, 10900, 12300, 11800, 13200, 12700];
  const max = Math.max(...data);
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

  chart.innerHTML = data.map((val, i) => `
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="height:${(val / max) * 80}px" title="₹${val.toLocaleString('en-IN')}"></div>
      <div class="chart-label">${months[i]}</div>
    </div>
  `).join('');
})();

// ---- PERIOD BUTTONS ----
(function initPeriodButtons() {
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
})();

// ---- WAITLIST FORM ----
(function initWaitlist() {
  const form = document.getElementById('wallet-waitlist-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]')?.value?.trim();
    if (!email) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Joining…';

    try {
      const res = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, platform: 'axeb2bwallet' }),
      });
      const data = await res.json();
      showToast(data.message || 'You\'re on the waitlist!', 'success');
      form.reset();
    } catch {
      showToast('Something went wrong. Try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Join Waitlist';
    }
  });
})();

// ---- MODAL HELPERS ----
function openModal(id) {
  const el = document.getElementById('modal-' + id);
  if (el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById('modal-' + id);
  if (el) {
    el.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  loadWalletBalance();
  loadTransactions();
});

// ---- UTILITIES ----
function showToast(message, type = 'info') {
  const existing = document.querySelector('.axe-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'axe-toast axe-toast-' + type;
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#f97316'};
    color:#fff;padding:12px 20px;border-radius:8px;font-size:0.85rem;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);animation:fadeUp 0.3s ease both;
    max-width:320px;line-height:1.4;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
