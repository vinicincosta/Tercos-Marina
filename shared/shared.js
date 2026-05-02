/**
 * shared.js — Lógica reutilizável para todas as páginas de categoria.
 *
 * Exporta:
 *  - initNav()          → nav ativa + hambúrguer
 *  - initReveal()       → animação de entrada
 *  - initModal(images)  → modal de zoom com navegação
 *  - initWhatsApp(num)  → botões Solicitar Pedido
 *  - renderCatalog(cfg) → monta seções + cards a partir de um catálogo JSON
 */

/* ── Número WhatsApp da vendedora ── */
const WHATSAPP_NUMBER = "5518991540737";

/* ════════════════════════════════════
   NAV: destaque de link ativo + mobile
════════════════════════════════════ */
function initNav() {
  // Ativa link conforme seção visível
  const sections = document.querySelectorAll("section[id]");
  const links    = document.querySelectorAll(".nav-links li a");
  window.addEventListener("scroll", () => {
    let cur = "";
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 90) cur = s.id; });
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
  }, { passive: true });

  // Hambúrguer
  const btn   = document.getElementById("hamburger");
  const menu  = document.getElementById("mobileMenu");
  const close = document.getElementById("mobileClose");
  if (btn && menu) {
    btn.addEventListener("click",   () => menu.classList.add("open"));
    close?.addEventListener("click", closeMobile);
  }
}

function closeMobile() {
  document.getElementById("mobileMenu")?.classList.remove("open");
}
// Disponível globalmente para onclick inline
window.closeMobile = closeMobile;

/* ════════════════════════════════════
   REVEAL: fade-in ao entrar na viewport
════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("visible"), i * 55);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

/* ════════════════════════════════════
   MODAL DE ZOOM
   Recebe array de { src, alt, nome }
════════════════════════════════════ */
let _modalImages = [];
let _modalIndex  = 0;

function initModal() {
  const modal = document.getElementById("imgModal");
  if (!modal) return;
  const img     = modal.querySelector(".modal-img");
  const counter = modal.querySelector(".modal-counter");

  // Fecha ao clicar no fundo
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  document.getElementById("modalClose")?.addEventListener("click", closeModal);
  document.getElementById("modalPrev")?.addEventListener("click", () => navigateModal(-1));
  document.getElementById("modalNext")?.addEventListener("click", () => navigateModal(+1));

  // Fecha com ESC, navega com setas
  document.addEventListener("keydown", e => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape")      closeModal();
    if (e.key === "ArrowLeft")   navigateModal(-1);
    if (e.key === "ArrowRight")  navigateModal(+1);
  });

  // Swipe touch
  let startX = 0;
  modal.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener("touchend",   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) navigateModal(diff > 0 ? 1 : -1);
  });

  function updateModal() {
    const item = _modalImages[_modalIndex];
    if (!item || !img) return;
    img.style.opacity = "0";
    img.style.transform = "scale(.9)";
    setTimeout(() => {
      img.src = item.src;
      img.alt = item.alt || "";
      img.style.opacity = "1";
      img.style.transform = "scale(1)";
    }, 120);
    if (counter) counter.textContent = `${_modalIndex + 1} / ${_modalImages.length}`;
    // Prev/next visibility
    const prev = document.getElementById("modalPrev");
    const next = document.getElementById("modalNext");
    if (prev) prev.style.opacity = _modalIndex === 0 ? ".25" : "1";
    if (next) next.style.opacity = _modalIndex === _modalImages.length - 1 ? ".25" : "1";
  }

  window.openModal = function(images, index) {
    _modalImages = images;
    _modalIndex  = index;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
    updateModal();
  };

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
  window.closeModal = closeModal;

  function navigateModal(dir) {
    const next = _modalIndex + dir;
    if (next < 0 || next >= _modalImages.length) return;
    _modalIndex = next;
    updateModal();
  }
}

/* ════════════════════════════════════
   WHATSAPP: Solicitar Pedido
════════════════════════════════════ */
function initWhatsApp() {
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn-acessar");
    if (!btn) return;
    e.preventDefault();
    const card    = btn.closest(".card, .card-list");
    const produto = btn.dataset.produto || card?.querySelector("h3,h4")?.innerText || "Produto";
    const imgEl   = card?.querySelector("img");
    const imgSrc  = btn.dataset.img || imgEl?.src || "";
    const imgUrl  = imgSrc.startsWith("http")
      ? imgSrc
      : window.location.origin + imgSrc.replace(/^\.?\.?\/?/, "/");

    const msg =
`Olá, Marisa! Tudo bem? 😊

Meu nome é: _______________

Tenho interesse no seguinte produto:
✨ *${produto}*

Gostaria de saber mais sobre:
• Disponibilidade e prazo de entrega
• Opções de personalização
• Formas de pagamento

🖼️ Referência: ${imgUrl}

Aguardo seu retorno. Obrigada! 🙏`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  });
}

/* ════════════════════════════════════
   RENDER CATALOG
   Recebe catálogo e monta a página.

   catalog = {
     pageTitle: string,
     sections: [{
       id: string,
       title: string,
       subtitle: string,     // span em itálico
       groups: [{
         label: string,      // nome legível do grupo (ex: "São Bento")
         folder: string,     // pasta relativa (ex: "ImagensSaoBento")
         images: [string],   // nomes dos arquivos
         price: string,
         sub: string,
       }]
     }]
   }
════════════════════════════════════ */
function renderCatalog(catalog, imagesRoot) {
  const root = document.getElementById("catalog-root");
  if (!root) return;

  // Coleção global de imagens para o modal (por seção)
  const allImages = {};

  catalog.sections.forEach((sec, si) => {
    // Montar array de imagens da seção
    const secImages = [];
    sec.groups.forEach(g => {
      g.images.forEach(file => {
        secImages.push({
          src:  `${imagesRoot}/${g.folder}/${file}`,
          alt:  g.label,
          nome: g.label,
        });
      });
    });
    allImages[sec.id] = secImages;

    // ── Section HTML ──
    const section = document.createElement("section");
    section.id = sec.id;

    const header = document.createElement("div");
    header.className = "section-header reveal";
    header.innerHTML = `<h2>${sec.title}${sec.subtitle ? ` <span>${sec.subtitle}</span>` : ""}</h2>`;
    section.appendChild(header);

    const psec = document.createElement("div");
    psec.className = "product-section";

    const grid = document.createElement("div");
    grid.className = `grid-${sec.cols || 3} reveal`;

    // ── Cards ──
    sec.groups.forEach(g => {
      g.images.forEach((file, imgIdx) => {
        const src    = `${imagesRoot}/${g.folder}/${file}`;
        const secImgIndex = secImages.findIndex(i => i.src === src);
        const card   = buildCard({
          src, alt: g.label,
          title: g.label,
          sub:   g.sub   || "Artesanato devocional personalizado",
          price: g.price || "R$ 70,00",
          badge: imgIdx === 0 && g.badge ? g.badge : null,
          secId: sec.id,
          imgIndex: secImgIndex,
        });
        grid.appendChild(card);
      });
    });

    // Caso não haja imagens
    if (grid.children.length === 0) {
      grid.innerHTML = `<div class="empty-state"><strong>Em breve</strong>Novos produtos chegando!</div>`;
    }

    psec.appendChild(grid);
    section.appendChild(psec);
    root.appendChild(section);

    // Divisor entre seções (exceto na última)
    if (si < catalog.sections.length - 1) {
      const div = document.createElement("div");
      div.className = "divider";
      div.innerHTML = `<span class="divider-icon">✦</span>`;
      root.appendChild(div);
    }
  });

  // Delegação de clique nas imagens → abre modal com imagens da seção
  root.addEventListener("click", e => {
    const cardImg = e.target.closest(".card-img");
    if (!cardImg) return;
    const card    = cardImg.closest(".card");
    if (!card) return;
    const secId   = card.dataset.secId;
    const imgIdx  = parseInt(card.dataset.imgIndex ?? "0", 10);
    if (secId && allImages[secId]) {
      window.openModal(allImages[secId], imgIdx);
    }
  });

  // Re-inicializa reveal para novos elementos
  setTimeout(initReveal, 50);
}

/* ── Constrói um card DOM ── */
function buildCard({ src, alt, title, sub, price, badge, secId, imgIndex }) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.secId    = secId;
  card.dataset.imgIndex = imgIndex;

  const imgWrap = document.createElement("div");
  imgWrap.className = "card-img";
  const img = document.createElement("img");
  img.src     = src;
  img.alt     = alt;
  img.loading = "lazy";
  imgWrap.appendChild(img);

  if (badge) {
    const b = document.createElement("span");
    b.className = "card-badge";
    b.textContent = badge;
    imgWrap.appendChild(b);
  }

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `
    <h3>${title}</h3>
    <p class="sub">${sub}</p>
    <p class="card-price">${price}</p>
    <a href="#" class="btn-acessar"
       data-produto="${title}"
       data-img="${src}">Solicitar Pedido</a>`;

  card.appendChild(imgWrap);
  card.appendChild(body);
  return card;
}

/* ── Bootstrap: chame ao fim do body ── */
function initPage(catalog, imagesRoot) {
  initNav();
  initReveal();
  initModal();
  initWhatsApp();
  if (catalog) renderCatalog(catalog, imagesRoot);
}
