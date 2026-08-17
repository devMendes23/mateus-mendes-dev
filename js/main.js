(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------------- */
  /* Footer year                                                     */
  /* -------------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------------------------------------------------- */
  /* Mobile nav toggle                                               */
  /* -------------------------------------------------------------- */
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* -------------------------------------------------------------- */
  /* Cursor glow                                                     */
  /* -------------------------------------------------------------- */
  const glow = document.querySelector(".cursor-glow");
  if (glow && !prefersReducedMotion && matchMedia("(hover: hover)").matches) {
    let gx = window.innerWidth / 2;
    let gy = window.innerHeight / 2;
    let tx = gx;
    let ty = gy;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    const animateGlow = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx - 100}px, ${gy - 100}px)`;
      requestAnimationFrame(animateGlow);
    };
    requestAnimationFrame(animateGlow);
  }

  /* -------------------------------------------------------------- */
  /* Reactive dot-grid background                                    */
  /* -------------------------------------------------------------- */
  const canvas = document.getElementById("bg-grid");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width, height, dpr;
    let dots = [];
    const spacing = 46;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({ x: i * spacing, y: j * spacing });
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const radius = 160;

      for (const d of dots) {
        const dx = mouse.x - d.x;
        const dy = mouse.y - d.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let alpha = 0.05;
        let r = 1;

        if (dist < radius) {
          const t = 1 - dist / radius;
          alpha = 0.05 + t * 0.55;
          r = 1 + t * 1.6;
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 157, 66, ${alpha})`;
        ctx.fill();
      }
    }

    const noHover = !matchMedia("(hover: hover)").matches;
    let ambientT = Math.random() * 10;

    function loop() {
      if (noHover) {
        ambientT += 0.008;
        mouse.x = width / 2 + Math.cos(ambientT) * width * 0.38;
        mouse.y = height * 0.32 + Math.sin(ambientT * 1.3) * height * 0.22;
      }
      draw();
      if (!prefersReducedMotion) requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("mouseleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    resize();
    if (prefersReducedMotion) {
      draw();
    } else {
      requestAnimationFrame(loop);
    }
  }

  /* -------------------------------------------------------------- */
  /* Scroll reveal                                                   */
  /* -------------------------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("in-view"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      revealEls.forEach((el) => observer.observe(el));
    }
  }

  /* -------------------------------------------------------------- */
  /* Tilt effect on cards / windows                                  */
  /* -------------------------------------------------------------- */
  if (!prefersReducedMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const max = 6;

      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * max * 2;
        const ry = (px - 0.5) * max * 2;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)";
      });
    });
  }

  /* -------------------------------------------------------------- */
  /* Contact form                                                    */
  /* -------------------------------------------------------------- */
  const form = document.getElementById("contact-form");
  const statusEl = document.getElementById("form-status");

  if (form && statusEl) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector("button[type=submit]");
      const data = Object.fromEntries(new FormData(form).entries());

      if (!data.name || !data.email || !data.message) {
        statusEl.textContent = "Preenche nome, e-mail e mensagem antes de enviar.";
        statusEl.dataset.state = "error";
        return;
      }

      submitBtn.disabled = true;
      statusEl.dataset.state = "loading";
      statusEl.textContent = "Enviando...";

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(payload.error || "Falha ao enviar.");

        statusEl.dataset.state = "ok";
        statusEl.textContent = "Mensagem enviada! Te retorno em breve.";
        form.reset();
      } catch (err) {
        statusEl.dataset.state = "error";
        statusEl.textContent = "Não consegui enviar agora. Tenta de novo ou manda um e-mail direto.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* -------------------------------------------------------------- */
  /* Magnetic buttons                                                 */
  /* -------------------------------------------------------------- */
  if (!prefersReducedMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".btn, .nav-cta").forEach((el) => {
      const pull = 0.35;
      const lift = el.classList.contains("btn") ? -2 : 0;

      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) * pull;
        const dy = (e.clientY - rect.top - rect.height / 2) * pull;
        el.style.transform = `translate(${dx}px, ${dy + lift}px)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  /* -------------------------------------------------------------- */
  /* Scrollspy: highlight active nav link                            */
  /* -------------------------------------------------------------- */
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]:not(.nav-cta)');
  const spySections = Array.from(navLinks)
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (navLinks.length && spySections.length && "IntersectionObserver" in window) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = document.querySelector(`.main-nav a[href="#${entry.target.id}"]`);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    spySections.forEach((section) => spyObserver.observe(section));
  }
})();
