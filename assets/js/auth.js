// Auth logic for Teacher Sign Up / Sign In.
// Requires assets/js/supabase.js and assets/js/supabase-config.js to be
// loaded first (they define the `sb` client used below).

document.addEventListener('DOMContentLoaded', function () {

  // ---------------------------------------------------------------
  // TEACHER SIGN UP
  // ---------------------------------------------------------------
  var signupForm = document.getElementById('signup-form');
  if (signupForm) {
    var signupError = document.getElementById('signup-error');
    var signupBtn = signupForm.querySelector('button[type="submit"]');

    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      signupError.classList.remove('show');

      var firstName = signupForm.first_name.value.trim();
      var lastName = signupForm.last_name.value.trim();
      var email = signupForm.email.value.trim();
      var password = signupForm.password.value;
      var confirmPassword = signupForm.confirm_password.value;
      var nationality = signupForm.nationality.value;
      var countryOfResidence = signupForm.country_of_residence.value;
      var cvFile = document.getElementById('cv-file-input').files[0];

      if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match. Please check and try again.';
        signupError.classList.add('show');
        return;
      }
      if (password.length < 8) {
        signupError.textContent = 'Password must be at least 8 characters long.';
        signupError.classList.add('show');
        return;
      }

      var originalBtnText = signupBtn.innerHTML;
      signupBtn.disabled = true;
      signupBtn.textContent = 'Creating your account…';

      try {
        // 1. Create the auth user. role: 'teacher' is read by a database
        //    trigger that auto-creates the matching row in `profiles`.
        var signUpResult = await sb.auth.signUp({
          email: email,
          password: password,
          options: { data: { role: 'teacher' } }
        });

        if (signUpResult.error) throw signUpResult.error;

        var user = signUpResult.data.user;
        if (!user) {
          throw new Error('Account created, but no session was returned. Please try signing in.');
        }

        // 2. Optional CV upload, before we know for sure the row exists is fine —
        //    storage policies only check auth.uid(), not the candidates row.
        var cvUrl = null;
        if (cvFile) {
          var ext = cvFile.name.split('.').pop();
          var path = user.id + '/cv.' + ext;
          var uploadResult = await sb.storage
            .from('candidate-documents')
            .upload(path, cvFile, { upsert: true });
          if (uploadResult.error) {
            console.warn('CV upload failed (continuing without it):', uploadResult.error.message);
          } else {
            cvUrl = path;
          }
        }

        // 3. Create the candidate profile row with the sign-up fields.
        var insertResult = await sb.from('candidates').insert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          nationality: nationality,
          country_of_residence: countryOfResidence,
          cv_url: cvUrl
        });

        if (insertResult.error) throw insertResult.error;

        // 4. Done. If email confirmation is required (Supabase default),
        //    there is no active session yet — send them to sign in instead
        //    of pretending they're logged in.
        if (!signUpResult.data.session) {
          signupForm.innerHTML =
            '<div style="text-align:center; padding:20px 0;">' +
            '<h3 style="margin-bottom:12px;">Check your email</h3>' +
            '<p style="color:var(--muted); font-size:14px;">We\'ve sent a confirmation link to <strong>' + email + '</strong>. ' +
            'Verify your email, then <a href="teacher-sign-in.html" style="color:var(--gold-dark); font-weight:600;">sign in</a> to continue.</p>' +
            '</div>';
        } else {
          // Email confirmation is off — user is already signed in.
          window.location.href = 'teacher-dashboard.html';
        }

      } catch (err) {
        signupError.textContent = err.message || 'Something went wrong creating your account. Please try again.';
        signupError.classList.add('show');
        signupBtn.disabled = false;
        signupBtn.innerHTML = originalBtnText;
      }
    });
  }

  // ---------------------------------------------------------------
  // TEACHER SIGN IN
  // ---------------------------------------------------------------
  var signinForm = document.getElementById('signin-form');
  if (signinForm) {
    var signinError = document.getElementById('signin-error');
    var signinBtn = signinForm.querySelector('button[type="submit"]');

    signinForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      signinError.classList.remove('show');

      var email = signinForm.email.value.trim();
      var password = signinForm.password.value;

      var originalBtnText = signinBtn.innerHTML;
      signinBtn.disabled = true;
      signinBtn.textContent = 'Signing in…';

      var result = await sb.auth.signInWithPassword({ email: email, password: password });

      if (result.error) {
        signinError.textContent = 'The email address or password you entered is incorrect. Please try again.';
        signinError.classList.add('show');
        signinBtn.disabled = false;
        signinBtn.innerHTML = originalBtnText;
        return;
      }

      window.location.href = 'teacher-dashboard.html';
    });
  }

  // "Continue with Google" — same button, used on the Sign In page.
  var googleBtn = document.getElementById('google-signin');
  if (googleBtn) {
    googleBtn.addEventListener('click', async function () {
      var result = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Must be added to Supabase's Redirect URLs allow-list
          // (Authentication -> URL Configuration) or this will fail.
          redirectTo: window.location.origin + window.location.pathname.replace(/[^/]+$/, '') + 'teacher-dashboard.html'
        }
      });
      if (result.error) {
        var signinError = document.getElementById('signin-error');
        if (signinError) {
          signinError.textContent = 'Google sign-in failed to start. Please try again.';
          signinError.classList.add('show');
        }
      }
      // On success, the browser navigates away to Google automatically —
      // nothing more to do here.
    });
  }

});
