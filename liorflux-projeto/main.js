/* LiorFlux — configuração e comportamento do site (carregado por index.html) */

/* =====================================================================
   CONFIGURAÇÃO — edite só aqui.
   ===================================================================== */
const CONFIG = {
  empresa: {
    email: ""          // preencha SOMENTE com um e-mail confirmado. Vazio = nenhum e-mail aparece no site.
  },
  canais: {
    whatsapp: "https://w.app/liorstudios",
    instagram: "https://www.instagram.com/liorstudiosofc?cplk=MWFkeGE3dTRlbWRvNQ=="
  },
  // Formulário de e-mail: DESATIVADO (vazio = a coleta não existe).
  // NÃO preencha enquanto a Política de Privacidade não identificar quem controla os dados e um canal de contato.
  // Se um dia preencher, troque "connect-src 'none'" pelo domínio na tag Content-Security-Policy do index.html.
  formularioEmailEndpoint: "",
  // Script de medição de audiência. Vazio = nenhum rastreamento.
  // Se preencher, o site passa a pedir consentimento antes de carregar. Adicione o domínio em "script-src" na tag Content-Security-Policy do index.html.
  medicaoAudiencia: { scriptSrc: "" },
  atualizadoEm: "outubro de 2026"
};

/* ===== COMPORTAMENTO DO SITE ===== */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Avisos rápidos (toast) ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 4000);
  }

  /* ---------- 2. Canais de contato e e-mail (vêm do bloco CONFIG) ---------- */
  function applyConfig() {
    const empresa = CONFIG.empresa;
    $$('[data-cfg-meta]').forEach((el) => { el.textContent = CONFIG[el.dataset.cfgMeta]; });
    $$('[data-canal]').forEach((el) => { el.href = CONFIG.canais[el.dataset.canal]; });
    $$('[data-email-only]').forEach((el) => { el.hidden = !empresa.email; });
    $$('[data-email-link]').forEach((el) => { el.href = 'mailto:' + empresa.email; el.textContent = empresa.email; });
  }

  /* ---------- 3. Janela de contato (<dialog> nativo: foco preso e Esc já funcionam) ---------- */
  const modal = $('#waitlist-modal');
  const waitlistForm = $('#waitlist-form');
  const formError = $('#form-error');
  const formSuccess = $('#form-success');
  let lastFocused;

  function openModal() {
    lastFocused = document.activeElement;
    if (!modal.open) modal.showModal();
    document.body.classList.add('modal-open');
    $('#wa-cta').focus();
  }
  function closeModal() {
    if (modal.open) modal.close();
  }
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    formError.textContent = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  });
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  $$('[data-open-waitlist]').forEach((button) => button.addEventListener('click', () => {
    closeMobileMenu();
    openModal();
  }));
  $$('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));

  /* ---------- 4. Formulário de e-mail (só aparece se CONFIG.formularioEmailEndpoint estiver preenchido) ---------- */
  if (CONFIG.formularioEmailEndpoint) $('#email-block').hidden = false;
  waitlistForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = String(new FormData(waitlistForm).get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formError.textContent = 'Digite um e-mail válido.';
      $('#waitlist-email').focus();
      return;
    }
    if (!$('#waitlist-consent').checked) {
      formError.textContent = 'Marque a caixa para autorizar o contato por e-mail.';
      $('#waitlist-consent').focus();
      return;
    }
    formError.textContent = '';
    try {
      const response = await fetch(CONFIG.formularioEmailEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, consentimento: true, aceiteEm: new Date().toISOString(), origem: 'site-liorflux' })
      });
      if (!response.ok) throw new Error('falha');
      waitlistForm.hidden = true;
      formSuccess.hidden = false;
    } catch (error) {
      formError.textContent = 'Não foi possível enviar agora. Tente de novo ou chame no WhatsApp.';
    }
  });

  /* ---------- 5. Menu no celular ---------- */
  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');
  function closeMobileMenu() {
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) { closeMobileMenu(); return; }
    mobileMenu.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileMenu.hidden) { closeMobileMenu(); menuToggle.focus(); }
  });
  $$('.mobile-menu a').forEach((link) => link.addEventListener('click', closeMobileMenu));

  /* ---------- 6. Demonstração (dados fictícios) ---------- */
  const demoTabs = $$('[data-demo-tab]');
  const demoRows = $$('.demo-row');
  demoTabs.forEach((tab) => tab.addEventListener('click', () => {
    demoTabs.forEach((item) => item.setAttribute('aria-pressed', String(item === tab)));
    demoTabs.forEach((item) => item.classList.toggle('active', item === tab));
    demoRows.forEach((row) => { row.hidden = row.dataset.kind !== tab.dataset.demoTab; });
  }));
  $$('[data-demo-toast]').forEach((button) => button.addEventListener('click', () => {
    showToast('Demonstração: esta ação abriria a conversa no WhatsApp.');
  }));
  $$('.row-action').forEach((button) => button.addEventListener('click', () => {
    showToast('Demonstração: nenhuma mensagem foi enviada.');
  }));
  const demoDate = $('#demo-date');
  if (demoDate) demoDate.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  /* ---------- 7. Navegação interna e documentos legais (abrem sozinhos pelo link) ---------- */
  function goTo(hash, push) {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return false;
    if (target.matches('details.doc')) target.open = true;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (push) history.pushState(null, '', hash);
    return true;
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.getAttribute('href').length < 2) return;
    if (goTo(link.getAttribute('href'), true)) event.preventDefault();
  });
  window.addEventListener('hashchange', () => { if (location.hash.length > 1) goTo(location.hash, false); });

  /* ---------- 8. Cookies e medição de audiência (desligado enquanto CONFIG.medicaoAudiencia.scriptSrc estiver vazio) ---------- */
  function initConsent() {
    const bar = $('#cookie-bar');
    const reopen = $('#reabrir-consent');
    const src = CONFIG.medicaoAudiencia.scriptSrc;
    if (!src) { reopen.hidden = true; return; }
    reopen.hidden = false;
    const KEY = 'liorflux-consentimento';
    const loadMeasurement = () => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    };
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (error) { /* navegador bloqueou: segue sem salvar */ }
    if (saved === 'sim') loadMeasurement();
    else if (saved !== 'nao') bar.hidden = false;
    $$('[data-consent]', bar).forEach((button) => button.addEventListener('click', () => {
      const choice = button.dataset.consent;
      try { localStorage.setItem(KEY, choice); } catch (error) { /* ignora */ }
      bar.hidden = true;
      if (choice === 'sim') loadMeasurement();
      showToast(choice === 'sim' ? 'Medição de audiência ativada.' : 'Tudo bem. Não vamos medir seu acesso.');
    }));
    reopen.addEventListener('click', () => { bar.hidden = false; $('button', bar).focus(); });
  }

  /* ---------- 9. Entrada suave dos blocos ---------- */
  const revealTargets = $$('.step-item,.audience-card,.benefit-item,.demo-row');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
    }, { threshold: 0.15 });
    revealTargets.forEach((element) => observer.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }

  /* ---------- Início ---------- */
  applyConfig();
  initConsent();
  if (location.hash.length > 1) goTo(location.hash, false);
})();
