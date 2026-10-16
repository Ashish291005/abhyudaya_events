// Supabase connection used by the website and the admin.
// Both values are PUBLIC by design (Supabase → Project Settings → API):
//   - Project URL
//   - "anon" / "publishable" key
// Security comes from the row-level rules in supabase/schema.sql, not from hiding these.
// NEVER put the "service_role" / secret key here.
window.AE_CONFIG = {
  supabaseUrl: 'https://pgkqrehsuaaoerngdqwg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBna3FyZWhzdWFhb2VybmdkcXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTA0ODYsImV4cCI6MjEwNzcyNjQ4Nn0.DRgkNxVbOsORsAf0W5dLcaCoVbv1tfgqwU2Gxq-01Yo'
};
