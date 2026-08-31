// Scroll-shrink header
  var header = document.getElementById('site-header');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }, { passive: true });

  // Mobile menu toggle
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.primary-nav');
  var langToggle = document.querySelector('.lang-toggle');
  var ctaBtn = document.querySelector('.nav-right .btn');
  var signinLink = document.querySelector('.nav-right .signin-link');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.style.display === 'flex';
      nav.style.display = open ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.position = 'absolute';
      nav.style.top = '70px';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.background = '#0B1F3A';
      nav.style.padding = '20px 32px';
      nav.style.gap = '16px';
      if (langToggle) langToggle.style.display = open ? 'none' : 'block';
      if (signinLink) signinLink.style.display = open ? 'none' : 'inline-block';
      if (ctaBtn) ctaBtn.style.display = open ? 'none' : 'inline-flex';
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item .faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item.open').forEach(function (el) {
        if (el !== item) el.classList.remove('open');
      });
      item.classList.toggle('open', !wasOpen);
    });
  });

  // Password show/hide toggle (auth pages)
  document.querySelectorAll('.pw-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      var showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });

  // Salary filter pills (Jobs Portal)
  document.querySelectorAll('.salary-pills .salary-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      pill.parentElement.querySelectorAll('.salary-pill').forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
    });
  });

  // Reveal-on-scroll
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // Apply-now modal (Jobs Portal)
  var modal = document.getElementById('apply-modal');
  if (modal) {
    document.querySelectorAll('.apply-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      });
    });
    var closeModal = function () {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    };
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // Upload-box click-to-upload (Sign Up pages)
  document.querySelectorAll('.upload-box').forEach(function (box) {
    var input = box.querySelector('input[type="file"]');
    var label = box.querySelector('p');
    if (!input) return;
    box.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () {
      if (input.files && input.files[0] && label) {
        label.textContent = input.files[0].name;
      }
    });
  });

  // Form validation feedback placeholder (no backend wired yet)
  // NOTE: #signup-form and #signin-form (Teacher pages) now have real
  // Supabase handling in assets/js/auth.js and are excluded here.
  // Employer forms are still placeholder-only until that backend is wired.
  document.querySelectorAll('#employer-signup-form, #employer-signin-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Backend (Supabase) wiring to be added in the next phase.
      // For now, this simply prevents a full-page form submit/reload.
      console.log('Form submitted (backend not yet connected):', form.id);
    });
  });

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'your-password',
  options: {
    // Explicitly set where the user should go AFTER clicking the email link:
    emailRedirectTo: 'https://github.com/dominickfourie2025/LANTARA-GLOBAL-Claude-build/blob/main/teacher-dashboard.html',
  },
})
