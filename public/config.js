// Supabase connection used by the website and the admin.
// Both values are PUBLIC by design (Supabase → Project Settings → API):
//   - Project URL
//   - "anon" / "publishable" key
// Security comes from the row-level rules in supabase/schema.sql, not from hiding these.
// NEVER put the "service_role" / secret key here.
window.AE_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
