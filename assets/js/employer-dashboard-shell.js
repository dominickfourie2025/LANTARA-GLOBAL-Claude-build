// TEMPORARY DIAGNOSTIC VERSION — do not leave this in production
async function initEmployerShell() {
  console.log('[Lantara] initEmployerShell started');

  var sessionResult = await sb.auth.getSession();
  console.log('[Lantara] getSession result:', sessionResult);

  var session = sessionResult.data && sessionResult.data.session;

  if (!session) {
    console.log('[Lantara] No session from getSession — waiting for onAuthStateChange...');
    session = await new Promise(function (resolve) {
      var sub = null;
      var timeout = setTimeout(function () {
        console.log('[Lantara] Timeout waiting for auth event');
        if (sub) sub.unsubscribe();
        resolve(null);
      }, 3000);

      var result = sb.auth.onAuthStateChange(function (event, s) {
        console.log('[Lantara] onAuthStateChange event:', event, s);
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          clearTimeout(timeout);
          if (sub) sub.unsubscribe();
          resolve(s);
        }
      });
      sub = result.data.subscription;
    });
  }

  console.log('[Lantara] Final session:', session);

  if (!session) {
    console.error('[Lantara] STILL NO SESSION — this is why you are bounced');
    // TEMP: show alert instead of silent redirect
    alert('No session found. Check console for details.');
    window.location.href = 'employer-sign-in.html';
    throw new Error('No session');
  }

  var user = session.user;
  console.log('[Lantara] User ID:', user.id, 'Email:', user.email);

  var employerResult = await sb.from('employers').select('*').eq('id', user.id).single();
  console.log('[Lantara] employers query result:', employerResult);

  var employer = employerResult.data;

  if (!employer) {
    console.error('[Lantara] SESSION EXISTS but no row in employers table for this user ID');
    console.error('[Lantara] Error from Supabase:', employerResult.error);
    alert('You are signed in, but there is no employer profile for this account. Check console.');
    // TEMP: do NOT redirect so you can read the console
    // window.location.href = 'employer-sign-in.html';
    throw new Error('Not an employer account');
  }

  console.log('[Lantara] Employer found:', employer);

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

  // Keep the rest of the modal wiring so the page is usable while testing
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
