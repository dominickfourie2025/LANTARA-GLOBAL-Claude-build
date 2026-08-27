// Teacher Dashboard — main overview page.
// Requires supabase.js, supabase-config.js, and dashboard-shell.js
// (defines `sb` and `initDashShell`/`showToast`) loaded first.

(async function () {

  var ctx = await initDashShell();
  var user = ctx.user;
  var candidate = ctx.candidate;

  var firstName = (candidate && candidate.first_name) ? candidate.first_name : 'there';
  document.getElementById('dash-welcome-name').textContent = 'Welcome back, ' + firstName + '!';

  // ---------------------------------------------------------------
  // PROFILE CHECKLIST — computed from actual candidate fields
  // ---------------------------------------------------------------
  var checklistItems = [
    { label: 'Personal Information', done: !!(candidate && candidate.first_name && candidate.nationality) },
    { label: 'CV Uploaded', done: !!(candidate && candidate.cv_url) },
    { label: 'Qualifications Added', done: !!(candidate && candidate.highest_qualification) },
    { label: 'Teaching Experience Added', done: !!(candidate && candidate.teaching_experience_years) },
    { label: 'Subject Preferences', done: !!(candidate && candidate.preferred_school_types && candidate.preferred_school_types.length) },
    { label: 'Work Eligibility', done: !!(candidate && candidate.visa_status) },
    { label: 'Add References', done: !!(candidate && candidate.reference_info) }
  ];
  var doneCount = checklistItems.filter(function (i) { return i.done; }).length;
  var pct = Math.round((doneCount / checklistItems.length) * 100);

  document.getElementById('stat-completeness').textContent = pct + '%';
  document.getElementById('stat-completeness-bar').style.width = pct + '%';
  document.getElementById('checklist-pct').textContent = pct + '% Complete';
  document.getElementById('checklist-bar').style.width = pct + '%';

  document.getElementById('checklist-items').innerHTML = checklistItems.map(function (item) {
    return '<div class="check-item ' + (item.done ? 'done' : '') + '">' +
      '<span class="ci-dot">' + (item.done ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5 5L20 7" stroke="#0B1F3A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') + '</span>' +
      item.label + '</div>';
  }).join('');

  // ---------------------------------------------------------------
  // APPLICATIONS
  // ---------------------------------------------------------------
  var appsResult = await sb
    .from('applications')
    .select('*, job_listings(title, city, institution_type)')
    .eq('candidate_id', user.id)
    .order('created_at', { ascending: false });
  var applications = appsResult.data || [];

  document.getElementById('stat-applications').textContent = applications.length;

  var statusMap = {
    applied: { label: 'Application Received', cls: 'received' },
    reviewing: { label: 'Under Review', cls: 'review' },
    interview: { label: 'Interview Scheduled', cls: 'interview' },
    offered: { label: 'Offer Received', cls: 'offer' },
    rejected: { label: 'Not Selected', cls: 'review' },
    withdrawn: { label: 'Withdrawn', cls: 'review' }
  };

  var appsListEl = document.getElementById('applications-list');
  if (applications.length === 0) {
    appsListEl.innerHTML =
      '<div class="dash-empty">' +
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M4 10l8-5 8 5" stroke="#6B7280" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 10v9h14v-9" stroke="#6B7280" stroke-width="1.4" stroke-linejoin="round"/></svg>' +
      "<p>You haven't applied for any opportunities yet.</p>" +
      '<a href="opportunities.html">Browse Teaching Opportunities &rarr;</a>' +
      '</div>';
  } else {
    appsListEl.innerHTML = applications.slice(0, 5).map(function (app) {
      var st = statusMap[app.status] || { label: app.status, cls: 'review' };
      var title = app.job_listings ? app.job_listings.title : 'Position';
      var city = app.job_listings ? app.job_listings.city : '';
      var date = new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return '<div class="app-item">' +
        '<div class="opp-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 21V6l8-3 8 3v15" stroke="#C6A15B" stroke-width="1.4" stroke-linejoin="round"/></svg></div>' +
        '<div class="app-info"><h4>' + title + '</h4><p>' + city + '</p></div>' +
        '<div class="app-meta"><span class="status-badge ' + st.cls + '">' + st.label + '</span><div class="app-date">Applied ' + date + '</div></div>' +
        '</div>';
    }).join('');
  }

  // ---------------------------------------------------------------
  // INTERVIEWS — derived from applications with status='interview'.
  // NOTE: schema has no interview date/time field yet; see messages.html
  // note for the equivalent gap. Shown honestly rather than invented.
  // ---------------------------------------------------------------
  var interviewApps = applications.filter(function (a) { return a.status === 'interview'; });
  document.getElementById('stat-interviews').textContent = interviewApps.length;

  var interviewsListEl = document.getElementById('interviews-list');
  if (interviewApps.length === 0) {
    interviewsListEl.innerHTML =
      '<div class="dash-empty">' +
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="16" rx="2" stroke="#6B7280" stroke-width="1.4"/><path d="M4 10h16" stroke="#6B7280" stroke-width="1.4"/></svg>' +
      '<p>No interviews are currently scheduled.</p>' +
      '</div>';
  } else {
    interviewsListEl.innerHTML = interviewApps.slice(0, 4).map(function (app) {
      var title = app.job_listings ? app.job_listings.title : 'Position';
      var city = app.job_listings ? app.job_listings.city : '';
      return '<div class="interview-item">' +
        '<div class="interview-date"><span class="im">TBC</span></div>' +
        '<div class="interview-info"><h4>' + title + '</h4><p>' + city + '</p>' +
        '<div class="interview-time">Date &amp; time to be confirmed via message</div></div>' +
        '</div>';
    }).join('');
  }

  // ---------------------------------------------------------------
  // SAVED JOBS COUNT
  // ---------------------------------------------------------------
  var savedResult = await sb.from('saved_jobs').select('job_listing_id', { count: 'exact' }).eq('candidate_id', user.id);
  document.getElementById('stat-saved').textContent = savedResult.count || 0;

  // ---------------------------------------------------------------
  // RECOMMENDED OPPORTUNITIES — real published listings
  // ---------------------------------------------------------------
  var listingsResult = await sb
    .from('job_listings')
    .select('*')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3);
  var listings = listingsResult.data || [];

  var oppListEl = document.getElementById('opportunities-list');
  if (listings.length === 0) {
    oppListEl.innerHTML =
      '<div class="dash-empty">' +
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v17l-5-3-5 3V4z" stroke="#6B7280" stroke-width="1.4" stroke-linejoin="round"/></svg>' +
      '<p>No opportunities are available right now &mdash; check back soon.</p>' +
      '<a href="opportunities.html">Browse the Jobs Portal &rarr;</a>' +
      '</div>';
  } else {
    oppListEl.innerHTML = listings.map(function (job) {
      return '<div class="opp-item">' +
        '<div class="opp-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 21V6l8-3 8 3v15" stroke="#C6A15B" stroke-width="1.4" stroke-linejoin="round"/></svg></div>' +
        '<div class="opp-info"><h4>' + job.title + '</h4><div class="opp-school">' + (job.institution_type || '') + '</div>' +
        '<div class="opp-loc"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.2 7-11.5S16 3 12 3 5 5.2 5 9.5 12 21 12 21z" stroke="#6B7280" stroke-width="1.4"/></svg>' + (job.city || '') + '</div></div>' +
        '<div class="opp-actions">' +
        '<a href="opportunities.html" class="btn btn-navy-outline">View Details</a>' +
        '<button class="bookmark-btn" data-job-id="' + job.id + '" aria-label="Save job"><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v17l-5-3-5 3V4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' +
        '</div></div>';
    }).join('');

    document.querySelectorAll('.bookmark-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var jobId = btn.getAttribute('data-job-id');
        if (btn.classList.contains('saved')) {
          await sb.from('saved_jobs').delete().eq('candidate_id', user.id).eq('job_listing_id', jobId);
          btn.classList.remove('saved');
        } else {
          await sb.from('saved_jobs').insert({ candidate_id: user.id, job_listing_id: jobId });
          btn.classList.add('saved');
        }
      });
    });
  }

})();
