// Shared shell logic for every Employer Dashboard page.
// Requires assets/js/supabase.js and supabase-config.js loaded first.

async function initEmployerShell() {
  // Wait until Supabase has fully restored the session from storage.
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
    window.location.href = 'employer-sign-in.html';
    throw new Error('No session');
  }

  var user = session.user;

  var employerResult = await sb.from('employers').select('*').eq('id', user.id).single();
  var employer = employerResult.data;

  if (!employer) {
    // Signed in, but this account isn't an employer (e.g. a teacher
    // account somehow landed here). Don't show anything private.
    window.location.href = 'employer-sign-in.html';
    throw new Error('Not an employer account');
  }

  var isActive = employer.status === 'active';

  var nameEl = document.getElementById('dash-profile-name');
  var avatarEl = document.getElementById('dash-avatar');
  if (nameEl) nameEl.textContent = employer.school_name || user.email;
  if (avatarEl) {
    var initials = (employer.school_name || 'S').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    avatarEl.textContent = initials;
  }

  var signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async function () {
      await sb.auth.signOut();
      window.location.href = 'employer-sign-in.html';
    });
  }

  // "Coming soon" modal
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
    var closeSoon = function () { soonModal.classList.remove('open'); soonModal.setAttribute('aria-hidden', 'true'); };
    if (soonClose) soonClose.addEventListener('click', closeSoon);
    soonModal.addEventListener('click', function (e) { if (e.target === soonModal) closeSoon(); });
  }

  // "Locked feature" modal — clicking a locked recruitment nav item
  // or card explains why, and links to the agreement.
  var lockedModal = document.getElementById('locked-modal');
  if (lockedModal && !isActive) {
    document.querySelectorAll('[data-locked]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        lockedModal.classList.add('open');
        lockedModal.setAttribute('aria-hidden', 'false');
      });
    });
    var lockedClose = lockedModal.querySelector('.modal-close');
    var closeLocked = function () { lockedModal.classList.remove('open'); lockedModal.setAttribute('aria-hidden', 'true'); };
    if (lockedClose) lockedClose.addEventListener('click', closeLocked);
    lockedModal.addEventListener('click', function (e) { if (e.target === lockedModal) closeLocked(); });
  }

  // WeChat contact modal (shared across employer pages)
  var wechatModal = document.getElementById('wechat-modal');
  if (wechatModal) {
    document.querySelectorAll('[data-wechat]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        wechatModal.classList.add('open');
        wechatModal.setAttribute('aria-hidden', 'false');
      });
    });
    var wechatClose = wechatModal.querySelector('.modal-close');
    var closeWechat = function () { wechatModal.classList.remove('open'); wechatModal.setAttribute('aria-hidden', 'true'); };
    if (wechatClose) wechatClose.addEventListener('click', closeWechat);
    wechatModal.addEventListener('click', function (e) { if (e.target === wechatModal) closeWechat(); });
    var copyBtn = document.getElementById('wechat-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText('DominicFourie');
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy WeChat ID'; }, 2000);
      });
    }
  }

  return { user: user, employer: employer, isActive: isActive };
}
