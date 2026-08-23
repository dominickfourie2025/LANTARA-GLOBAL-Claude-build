// Shared Supabase client setup — loaded on every page that needs auth
// (currently: teacher-sign-up.html, teacher-sign-in.html)

var SUPABASE_URL = 'https://kbrebymkkmaxehywjwkp.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_lAh3iNo60ROS9zyKwJgPSg_LK5Sy81k';

// `supabase` here is the global exposed by assets/js/supabase.js (the library).
// We name our actual client instance `sb` so it doesn't collide with that global.
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
