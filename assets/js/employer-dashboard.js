// Employer Dashboard — main overview page.
// Requires supabase.js, supabase-config.js, employer-dashboard-shell.js.

(async function () {

  var ctx = await initEmployerShell();
  var user = ctx.user, employer = ctx.employer, isActive = ctx.isActive;

  document.getElementById('dash-welcome-name').textContent = 'Good Morning, ' + (employer.school_name || 'there');

  // ---------------------------------------------------------------
  // REGISTRATION PROGRESS STEPPER
  // ---------------------------------------------------------------
  var hasSchoolInfo = !!(employer.school_name && employer.contact_person && employer.city);
  var hasSignedAgreement = !!employer.agreement_signed_at;

  var steps = [
    { label: 'Account Created', sub: 'Completed', state: 'done' },
    { label: 'School Information', sub: hasSchoolInfo ? 'Completed' : 'Incomplete', state: hasSchoolInfo ? 'done' : 'current' },
    { label: 'Recruitment Services Agreement', sub: hasSignedAgreement ? 'Signed' : 'Required', state: hasSignedAgreement ? 'done' : (hasSchoolInfo ? 'current' : 'locked') },
    { label: 'Registration Complete', sub: isActive ? 'Complete' : 'Locked', state: isActive ? 'done' : 'locked' }
  ];

  document.getElementById('reg-steps').innerHTML = steps.map(function (s, i) {
    var icon = s.state === 'done'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5 5L20 7" stroke="#0B1F3A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : (s.state === 'locked'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" stroke-width="1.5"/></svg>'
        : (i + 1));
    return '<div class="reg-step ' + s.state + '"><div class="reg-step-circle">' + icon + '</div><h5>' + s.label + '</h5><p>' + s.sub + '</p></div>';
  }).join('');

  var ctaEl = document.getElementById('reg-cta');
  var bannerSlot = document.getElementById('activation-banner-slot');
  var whySignCard = document.getElementById('why-sign-card');
  var regProgressSection = document.getElementById('reg-progress-section');

  if (isActive) {
    regProgressSection.style.display = 'none';
    bannerSlot.innerHTML =
      '<div class="activation-banner">' +
      '<div class="ab-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5 5L20 7" stroke="#0B1F3A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div><h3>Employer Registration Complete</h3><p>Welcome to Lantara Global. Your employer account is now active &mdash; you can post vacancies, review recommended candidates and coordinate interviews.</p></div>' +
      '</div>';
  } else {
    ctaEl.innerHTML =
      '<span class="eyebrow">One Final Step Remaining</span>' +
      '<h4>Activate Your Account</h4>' +
      '<p>Before posting vacancies or reviewing candidates, please review and sign the Recruitment Services Agreement to activate your employer account.</p>' +
      '<a href="agreement.html" class="btn btn-gold">Review &amp; Sign Agreement</a>';
    whySignCard.style.display = 'block';
  }

  // ---------------------------------------------------------------
  // LOCKED / UNLOCKED SIDEBAR + RECRUITMENT CARDS
  // ---------------------------------------------------------------
  if (isActive) {
    ['nav-vacancies', 'nav-candidates', 'nav-interviews'].forEach(function (id) {
      var el = document.getElementById(id);
      el.classList.remove('locked');
      el.removeAttribute('data-locked');
    });
    document.getElementById('lock-vacancies').style.display = 'none';
    document.getElementById('lock-candidates').style.display = 'none';
    document.getElementById('lock-interviews').style.display = 'none';

    document.getElementById('recruitment-cards-row').innerHTML =
      '<div class="dash-card"><div class="dash-card-head"><h3>My Vacancies</h3></div>' +
      '<div class="dash-empty"><svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v17l-5-3-5 3V4z" stroke="#6B7280" stroke-width="1.4" stroke-linejoin="round"/></svg><p>You don\'t have any active vacancies yet.</p><a href="#" data-coming-soon>Post Your First Vacancy &rarr;</a></div></div>' +
      '<div class="dash-card"><div class="dash-card-head"><h3>Recommended Candidates</h3></div>' +
      '<div class="dash-empty"><svg width="34" height="34" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="2.6" stroke="#6B7280" stroke-width="1.4"/><circle cx="17" cy="9" r="2.6" stroke="#6B7280" stroke-width="1.4"/></svg><p>Lantara hasn\'t recommended any candidates for your vacancies yet.</p></div></div>' +
      '<div class="dash-card"><div class="dash-card-head"><h3>Upcoming Interviews</h3></div>' +
      '<div class="dash-empty"><svg width="34" height="34" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="16" rx="2" stroke="#6B7280" stroke-width="1.4"/></svg><p>No interviews are currently scheduled.</p></div></div>';

    // re-wire the new [data-coming-soon] elements just inserted
    var soonModal = document.getElementById('coming-soon-modal');
    document.querySelectorAll('[data-coming-soon]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        soonModal.classList.add('open');
        soonModal.setAttribute('aria-hidden', 'false');
      });
    });

    document.getElementById('post-vacancy-btn').addEventListener('click', function (e) {
      e.preventDefault();
      soonModal.classList.add('open');
      soonModal.setAttribute('aria-hidden', 'false');
    });

  } else {
    document.getElementById('recruitment-cards-row').innerHTML =
      '<div class="locked-card"><div class="lc-icon" style="background:#FDF3E3;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="#C6A15B" stroke-width="1.5"/><path d="M8 10V7a4 4 0 018 0v3" stroke="#C6A15B" stroke-width="1.5"/></svg></div><h4>My Vacancies</h4><p>Complete your registration to post and manage vacancies.</p><a href="agreement.html" class="btn btn-navy-outline">Sign Agreement to Unlock</a></div>' +
      '<div class="locked-card"><div class="lc-icon" style="background:#E8EEFB;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="#2A5DAA" stroke-width="1.5"/><path d="M8 10V7a4 4 0 018 0v3" stroke="#2A5DAA" stroke-width="1.5"/></svg></div><h4>Recommended Candidates</h4><p>Candidate recommendations become available once your Recruitment Services Agreement has been completed.</p><a href="agreement.html" class="btn btn-navy-outline">Sign Agreement to Unlock</a></div>' +
      '<div class="locked-card"><div class="lc-icon" style="background:#E9F9EF;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="#1E8A4C" stroke-width="1.5"/><path d="M8 10V7a4 4 0 018 0v3" stroke="#1E8A4C" stroke-width="1.5"/></svg></div><h4>Upcoming Interviews</h4><p>Interview management becomes available after your employer account has been activated.</p><a href="agreement.html" class="btn btn-navy-outline">Sign Agreement to Unlock</a></div>';

    document.getElementById('post-vacancy-btn').addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('locked-modal').classList.add('open');
      document.getElementById('locked-modal').setAttribute('aria-hidden', 'false');
    });
  }

  // ---------------------------------------------------------------
  // STATS — vacancies is real, the rest have no data source yet
  // (no vacancy-management, candidate-recommendation, or interview
  // tables/UI exist yet, so these accurately show 0 for a new account)
  // ---------------------------------------------------------------
  var vacResult = await sb.from('job_listings').select('id', { count: 'exact' }).eq('employer_id', user.id);
  document.getElementById('stat-vacancies').textContent = vacResult.count || 0;

})();
