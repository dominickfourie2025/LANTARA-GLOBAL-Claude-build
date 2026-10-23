// Jobs Portal: real "Apply Now" for signed-in teachers.
// Visitors who are not signed in keep seeing the "Create Your Candidate Profile" pop-up (handled in script.js).
(function () {
  if (typeof sb === 'undefined') return;
  var state = { user: null, isTeacher: false, applied: {} };

  function jobOf(btn) {
    var card = btn.closest('.job-card');
    var title = btn.getAttribute('data-job') || '';
    var loc = card ? card.querySelector('.jc-location') : null;
    return { title: title, city: loc ? loc.textContent.trim() : '' };
  }
  function key(j) { return j.title + '|' + j.city; }

  async function findJob(j) {
    var r = await sb.from('job_listings').select('id').eq('status', 'published').eq('title', j.title).eq('city', j.city).limit(1);
    return r.data && r.data[0] ? r.data[0].id : null;
  }

  function markApplied(btn) {
    btn.classList.add('applied');
    btn.innerHTML = 'Applied &#10003;';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';
  }

  // Build the apply dialog once.
  var dlg = document.createElement('div');
  dlg.className = 'modal-overlay';
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  dlg.setAttribute('aria-hidden', 'true');
  dlg.innerHTML =
    '<div class="modal-box">' +
    '<button class="modal-close" aria-label="Close">&times;</button>' +
    '<h3 id="ap-title">Apply</h3>' +
    '<p id="ap-sub" style="color:var(--muted);margin-bottom:14px;"></p>' +
    '<div id="ap-form">' +
    '<label style="display:block;font-weight:600;color:var(--navy);margin-bottom:6px;">Message to our recruitment team (optional)</label>' +
    '<textarea id="ap-note" rows="4" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--radius);font:inherit;" placeholder="Tell us why you are a great fit&hellip;"></textarea>' +
    '<p style="font-size:13px;color:var(--muted);margin-top:8px;">Your Lantara Global profile and uploaded documents will be shared with our team.</p>' +
    '<div id="ap-err" style="display:none;color:#B3261E;margin-top:10px;font-size:14px;"></div>' +
    '<div style="display:flex;gap:12px;margin-top:18px;">' +
    '<button type="button" id="ap-submit" class="btn btn-gold" style="flex:1;justify-content:center;">Submit Application</button>' +
    '<button type="button" id="ap-cancel" class="btn btn-navy-outline" style="flex:1;justify-content:center;">Cancel</button>' +
    '</div></div>' +
    '<div id="ap-done" style="display:none;">' +
    '<p id="ap-done-msg" style="margin-bottom:18px;"></p>' +
    '<div style="display:flex;gap:12px;">' +
    '<a href="teacher-dashboard.html" class="btn btn-gold" style="flex:1;justify-content:center;">Go to Dashboard</a>' +
    '<button type="button" id="ap-close2" class="btn btn-navy-outline" style="flex:1;justify-content:center;">Keep Browsing</button>' +
    '</div></div></div>';
  document.body.appendChild(dlg);
  var $ = function (id) { return dlg.querySelector('#' + id); };
  function open() { dlg.classList.add('open'); dlg.setAttribute('aria-hidden', 'false'); }
  function close() { dlg.classList.remove('open'); dlg.setAttribute('aria-hidden', 'true'); }
  dlg.querySelector('.modal-close').addEventListener('click', close);
  $('ap-cancel').addEventListener('click', close);
  $('ap-close2').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

  var current = null;
  function show(title, sub, form, doneMsg) {
    $('ap-title').textContent = title;
    $('ap-sub').textContent = sub || '';
    $('ap-form').style.display = form ? 'block' : 'none';
    $('ap-done').style.display = form ? 'none' : 'block';
    $('ap-done-msg').textContent = doneMsg || '';
    $('ap-err').style.display = 'none';
    open();
  }

  $('ap-submit').addEventListener('click', async function () {
    var btn = this;
    btn.disabled = true;
    var jobId = await findJob(current.job);
    if (!jobId) {
      $('ap-err').textContent = 'This vacancy is not open for applications yet. Please contact our team.';
      $('ap-err').style.display = 'block'; btn.disabled = false; return;
    }
    var res = await sb.from('applications').insert({
      candidate_id: state.user.id,
      job_listing_id: jobId,
      cover_note: $('ap-note').value.trim() || null
    });
    btn.disabled = false;
    if (res.error) {
      if (res.error.code === '23505') {
        state.applied[key(current.job)] = true; markApplied(current.btn);
        show('Already applied', current.job.title + ' – ' + current.job.city, false, 'You have already applied for this vacancy. You can track it on your dashboard.');
        return;
      }
      $('ap-err').textContent = 'Could not submit your application: ' + res.error.message;
      $('ap-err').style.display = 'block'; return;
    }
    state.applied[key(current.job)] = true; markApplied(current.btn);
    show('Application submitted', current.job.title + ' – ' + current.job.city, false, 'Thank you! Our recruitment team will review your profile and be in touch.');
  });

  // Capture phase: runs before script.js's handler, so we can take over for signed-in users.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.apply-btn');
    if (!btn || !state.user) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var j = jobOf(btn);
    if (!state.isTeacher) {
      current = null;
      show('Teacher account needed', '', false, 'Applications are for candidate accounts. Please sign in with your teacher account to apply.');
      return;
    }
    if (state.applied[key(j)]) return;
    current = { job: j, btn: btn };
    $('ap-note').value = '';
    show('Apply: ' + j.title, j.city, true);
  }, true);

  (async function init() {
    try {
      var s = await sb.auth.getSession();
      var user = s.data && s.data.session ? s.data.session.user : null;
      if (!user) return;
      state.user = user;
      var c = await sb.from('candidates').select('id').eq('id', user.id).maybeSingle();
      state.isTeacher = !!(c.data && c.data.id);
      if (!state.isTeacher) return;
      var apps = await sb.from('applications').select('job_listings(title, city)').eq('candidate_id', user.id);
      (apps.data || []).forEach(function (a) {
        if (a.job_listings) state.applied[a.job_listings.title + '|' + a.job_listings.city] = true;
      });
      document.querySelectorAll('.apply-btn').forEach(function (b) {
        if (state.applied[key(jobOf(b))]) markApplied(b);
      });
    } catch (err) { /* stay in signed-out behaviour */ }
  })();
})();
