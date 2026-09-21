// Shared shell logic for every dashboard page (Teacher Dashboard + all
// sub-pages). Requires assets/js/supabase.js and supabase-config.js
// loaded first. Each page calls initDashShell() and awaits it before
// doing its own page-specific data fetching.

async function initDashShell() {
  // Wait until Supabase has fully restored the session from storage.
  // A plain getSession() right after a page navigation can return null
  // even when the user is signed in — that causes the flicker → redirect
  // back to the sign-in page.
  var session = null;

  var sessionResult = await sb.auth.getSession();
  session = sessionResult.data.session;

  if (!session) {
    session = await new Promise(function (resolve) {
      var timeout = setTimeout(function () {
        if (subscription) subscription.unsubscribe();
        resolve(null);
      }, 2500);

      var { data: { subscription } } = sb.auth.onAuthStateChange(function (event, s) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          clearTimeout(timeout);
          if (subscription) subscription.unsubscribe();
          resolve(s);
        }
      });
    });
  }

  if (!session) {
    window.location.href = 'teacher-sign-in.html';
    throw new Error('No session'); // stop the calling page's script here
  }

  var user = session.user;

  var candidateResult = await sb.from('candidates').select('*').eq('id', user.id).single();
  var candidate = candidateResult.data;

  var firstName = (candidate && candidate.first_name) ? candidate.first_name : 'there';
  var displayName = candidate ? ((candidate.first_name || '') + ' ' + (candidate.last_name || '')).trim() : (user.email || 'Teacher');
  if (!displayName) displayName = user.email;

  var nameEl = document.getElementById('dash-profile-name');
  var avatarEl = document.getElementById('dash-avatar');
  if (nameEl) nameEl.textContent = displayName;
  if (avatarEl) avatarEl.textContent = firstName.charAt(0).toUpperCase();

  var signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async function () {
      await sb.auth.signOut();
      window.location.href = 'teacher-sign-in.html';
    });
  }

  // "Coming soon" modal wiring (shared across pages that still have
  // unbuilt links, e.g. Messages' "start a conversation" type actions)
  var soonModal = document.getElementById('coming-soon-modal');
  if (soonModal) {
    document.querySelectorAll('[data-coming-soon]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        soonModal.classList.add('open');
        soonModal.setAttribute('aria-hidden', 'false');
      });
    });
    var soonClose = soonModal.querySelector('.modal-close');
    var closeSoon = function () {
      soonModal.classList.remove('open');
      soonModal.setAttribute('aria-hidden', 'true');
    };
    if (soonClose) soonClose.addEventListener('click', closeSoon);
    soonModal.addEventListener('click', function (e) { if (e.target === soonModal) closeSoon(); });
  }

  return { user: user, candidate: candidate };
}

function showToast(id) {
  var el = document.getElementById(id || 'save-toast');
  if (!el) return;
  el.classList.add('show');
  setTimeout(function () { el.classList.remove('show'); }, 3500);
}
