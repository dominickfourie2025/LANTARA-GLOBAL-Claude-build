// Auth logic for Employer Sign Up / Sign In.
// Requires assets/js/supabase.js and assets/js/supabase-config.js to be
// loaded first (they define the `sb` client used below).

document.addEventListener('DOMContentLoaded', function () {

  // ---------------------------------------------------------------
  // EMPLOYER SIGN UP
  // ---------------------------------------------------------------
  var signupForm = document.getElementById('employer-signup-form');
  if (signupForm) {
    var signupError = document.getElementById('employer-signup-error') || document.getElementById('employer-signup-error-zh');
    var signupBtn = signupForm.querySelector('button[type="submit"]');

    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (signupError) signupError.classList.remove('show');

      var schoolName = signupForm.school_name.value.trim();
      var contactPerson = signupForm.contact_person.value.trim();
      var city = signupForm.city.value.trim();
      var email = signupForm.email.value.trim();
      var phoneWechat = signupForm.phone_wechat.value.trim();
      var password = signupForm.password.value;
      var confirmPassword = signupForm.confirm_password.value;

      if (password !== confirmPassword) {
        if (signupError) { signupError.textContent = 'Passwords do not match. Please check and try again.'; signupError.classList.add('show'); }
        return;
      }
      if (password.length < 8) {
        if (signupError) { signupError.textContent = 'Password must be at least 8 characters long.'; signupError.classList.add('show'); }
        return;
      }

      var originalBtnText = signupBtn.innerHTML;
      signupBtn.disabled = true;
      signupBtn.textContent = 'Creating your account…';

      // Same pattern as Teacher sign-up: pass everything as metadata so
      // the server-side trigger creates the `employers` row (bypassing
      // RLS), rather than inserting from the browser where there may
      // not be a session yet if email confirmation is required.
      var result = await sb.auth.signUp({
        email: email,
        password: password,
        options: {
          // Explicitly set the confirmation redirect. Without this,
          // Supabase falls back to the page's *origin* only (e.g.
          // https://dominickfourie2025.github.io), which drops the
          // /LANTARA-GLOBAL-Claude-build/ repo path entirely and sends
          // confirmed users to a 404 at the bare domain. This exact
          // URL must also be added to Supabase's Authentication ->
          // URL Configuration -> Redirect URLs allow-list.
          emailRedirectTo: window.location.origin + window.location.pathname.replace(/[^/]+$/, '') + 'employer-sign-in.html',
          data: {
            role: 'employer',
            school_name: schoolName,
            contact_person: contactPerson,
            city: city,
            contact_phone_wechat: phoneWechat
          }
        }
      });

      if (result.error) {
        if (signupError) { signupError.textContent = result.error.message; signupError.classList.add('show'); }
        signupBtn.disabled = false; signupBtn.innerHTML = originalBtnText;
        return;
      }

      if (!result.data.session) {
        signupForm.innerHTML =
          '<div style="text-align:center; padding:20px 0;">' +
          '<h3 style="margin-bottom:12px;">Check your email</h3>' +
          '<p style="color:var(--muted); font-size:14px;">We\'ve sent a confirmation link to <strong>' + email + '</strong>. ' +
          'Verify your email, then <a href="employer-sign-in.html" style="color:var(--gold-dark); font-weight:600;">sign in</a> to continue.</p>' +
          '</div>';
      } else {
        window.location.href = 'employer-dashboard.html';
      }
    });
  }

  // ---------------------------------------------------------------
  // EMPLOYER SIGN IN
  // ---------------------------------------------------------------
  var signinForm = document.getElementById('employer-signin-form');
  if (signinForm) {
    var signinError = document.getElementById('employer-signin-error') || document.getElementById('employer-signin-error-zh');
    var signinBtn = signinForm.querySelector('button[type="submit"]');

    signinForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (signinError) signinError.classList.remove('show');

      var email = signinForm.email.value.trim();
      var password = signinForm.password.value;

      var originalBtnText = signinBtn.innerHTML;
      signinBtn.disabled = true;
      signinBtn.textContent = 'Signing in…';

      var result = await sb.auth.signInWithPassword({ email: email, password: password });

      if (result.error) {
        if (signinError) {
          signinError.textContent = signinError.id === 'employer-signin-error-zh'
            ? '您输入的电子邮箱或密码不正确，请重试。'
            : 'The email address or password you entered is incorrect. Please try again.';
          signinError.classList.add('show');
        }
        signinBtn.disabled = false; signinBtn.innerHTML = originalBtnText;
        return;
      }

      window.location.href = 'employer-dashboard.html';
    });
  }

});
