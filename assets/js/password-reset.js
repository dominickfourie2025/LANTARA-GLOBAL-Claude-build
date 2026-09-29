// Password reset flow — shared by four pages:
//   forgot-password.html / forgot-password-zh.html   (ask for an email)
//   reset-password.html  / reset-password-zh.html    (choose a new password)
//
// Forgot page: calls Supabase resetPasswordForEmail with an EXPLICIT redirectTo
//   pointing at the matching reset page. Without an explicit redirect, Supabase
//   falls back to the bare page origin and drops the /LANTARA-GLOBAL-Claude-build/
//   folder, which 404s (same problem the sign-up confirmation links had).
//   Both reset-page URLs must be in Supabase's Authentication -> URL
//   Configuration -> Redirect URLs allow-list.
//
// Reset page: the emailed link lands here carrying a recovery session in the
//   URL hash. The Supabase client picks that up automatically; the user then
//   chooses a new password via updateUser().
//
// Language comes from each page's <html lang>; per-page targets come from
// data-* attributes on <html>, so this file works unchanged in both languages.

(function () {
  'use strict';

  var isZh = document.documentElement.lang === 'zh-CN';
  var MIN_PASSWORD_LENGTH = 8; // matches the sign-up forms
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var T = isZh ? {
    errEmail: '请输入有效的电子邮箱地址。',
    errRate: '请求过于频繁，请稍后再试。',
    errGeneric: '出现问题，请稍后重试。',
    sending: '发送中…',
    sent: '如果该邮箱地址已注册账户，我们已向其发送密码重置链接。请查看您的收件箱（以及垃圾邮件文件夹）。',
    errShort: '密码至少需要 8 个字符。',
    errMismatch: '两次输入的密码不一致。',
    errSame: '新密码不能与旧密码相同。',
    errUpdate: '无法更新您的密码，请重试。',
    updating: '更新中…',
    done: '您的密码已更新，正在跳转至登录页面…'
  } : {
    errEmail: 'Please enter a valid email address.',
    errRate: 'Too many requests. Please wait a little while before trying again.',
    errGeneric: 'Something went wrong. Please try again in a moment.',
    sending: 'Sending…',
    sent: "If an account exists for that email address, we've sent a password reset link. Please check your inbox (and your spam folder).",
    errShort: 'Password must be at least 8 characters long.',
    errMismatch: 'The two passwords do not match.',
    errSame: 'Your new password must be different from your old one.',
    errUpdate: "We couldn't update your password. Please try again.",
    updating: 'Updating…',
    done: 'Your password has been updated. Redirecting you to sign in…'
  };

  function showMessage(el, text) {
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
  }
  function hideMessage(el) {
    if (!el) return;
    el.classList.remove('show');
  }
  function isRateLimit(err) {
    var msg = String((err && err.message) || '').toLowerCase();
    return !!err && (
      err.status === 429 ||
      err.code === 'over_email_send_rate_limit' ||
      err.code === 'over_request_rate_limit' ||
      msg.indexOf('rate limit') !== -1 ||
      msg.indexOf('too many') !== -1
    );
  }

  // ---------------------------------------------------------------
  // FORGOT PASSWORD PAGE
  // ---------------------------------------------------------------
  var forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    var fpError = document.getElementById('fp-error');
    var fpSuccess = document.getElementById('fp-success');

    forgotForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideMessage(fpError);
      hideMessage(fpSuccess);

      var email = forgotForm.email.value.trim();
      if (!EMAIL_RE.test(email)) {
        showMessage(fpError, T.errEmail);
        return;
      }

      var btn = forgotForm.querySelector('button[type="submit"]');
      var originalBtnHtml = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = T.sending;

      var resetPage = document.documentElement.getAttribute('data-reset-page') || 'reset-password.html';
      var redirectTo = window.location.origin +
        window.location.pathname.replace(/[^/]+$/, '') + resetPage;

      var result;
      try {
        result = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
      } catch (err) {
        result = { error: err };
      }

      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;

      if (result.error) {
        console.error('resetPasswordForEmail failed:', result.error);
        showMessage(fpError, isRateLimit(result.error) ? T.errRate : T.errGeneric);
        return;
      }

      // Deliberately the same message whether or not the address has an
      // account, so this page can't be used to discover who is registered.
      forgotForm.style.display = 'none';
      showMessage(fpSuccess, T.sent);
    });
  }

  // ---------------------------------------------------------------
  // RESET PASSWORD PAGE
  // ---------------------------------------------------------------
  var resetForm = document.getElementById('reset-form');
  if (resetForm) {
    var rpError = document.getElementById('rp-error');
    var rpSuccess = document.getElementById('rp-success');
    var verifyingBox = document.getElementById('reset-verifying');
    var invalidBox = document.getElementById('reset-invalid');

    // Captured by a tiny inline script in <head>, before the Supabase client
    // gets a chance to consume and clear the URL hash.
    var initialHash = window.__lgHash || window.location.hash || '';
    var linkHadError = /(?:^|[#&])error(?:_code|_description)?=/.test(initialHash);

    var settled = false;
    function showForm() {
      if (settled) return;
      settled = true;
      verifyingBox.style.display = 'none';
      resetForm.style.display = 'block';
    }
    function showInvalid() {
      if (settled) return;
      settled = true;
      verifyingBox.style.display = 'none';
      invalidBox.style.display = 'block';
    }

    if (linkHadError) {
      // e.g. #error=access_denied&error_code=otp_expired — link used or expired.
      showInvalid();
    } else {
      // Fires once the client has read the recovery token from the URL.
      sb.auth.onAuthStateChange(function (event) {
        if (event === 'PASSWORD_RECOVERY') showForm();
      });

      // Fallback for a reload (hash already consumed, session already saved),
      // and for the timing where the event fired before we subscribed.
      var attempts = 0;
      (function checkSession() {
        sb.auth.getSession().then(function (res) {
          if (settled) return;
          if (res && res.data && res.data.session) { showForm(); return; }
          attempts += 1;
          if (attempts >= 8) { showInvalid(); return; }
          setTimeout(checkSession, 500);
        });
      })();
    }

    resetForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideMessage(rpError);
      hideMessage(rpSuccess);

      var password = resetForm.password.value;
      var confirmPassword = resetForm.confirm_password.value;

      if (password.length < MIN_PASSWORD_LENGTH) {
        showMessage(rpError, T.errShort);
        return;
      }
      if (password !== confirmPassword) {
        showMessage(rpError, T.errMismatch);
        return;
      }

      var btn = resetForm.querySelector('button[type="submit"]');
      var originalBtnHtml = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = T.updating;

      var result;
      try {
        result = await sb.auth.updateUser({ password: password });
      } catch (err) {
        result = { error: err };
      }

      if (result.error) {
        console.error('updateUser failed:', result.error);
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
        var msg = String(result.error.message || '').toLowerCase();
        var same = result.error.code === 'same_password' ||
          msg.indexOf('different from the old password') !== -1;
        showMessage(rpError, same ? T.errSame : T.errUpdate);
        return;
      }

      // Work out where to send them before signing out (role is stored in the
      // user metadata at sign-up). Signing out means they sign in fresh with
      // the new password rather than landing in an unexpected half-state.
      var user = result.data && result.data.user;
      var role = user && user.user_metadata && user.user_metadata.role;
      var target = role === 'employer'
        ? (document.documentElement.getAttribute('data-employer-signin') || 'employer-sign-in.html')
        : (document.documentElement.getAttribute('data-teacher-signin') || 'teacher-sign-in.html');

      resetForm.style.display = 'none';
      showMessage(rpSuccess, T.done);

      try { await sb.auth.signOut(); } catch (err) { /* not fatal */ }
      setTimeout(function () { window.location.href = target; }, 2200);
    });
  }
})();
