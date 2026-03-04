// KimiAxe — Supabase Configuration
// Auto-generated — Do not edit manually

const SUPABASE_URL = 'https://gjtmryogyqmztttwqcoq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdG1yeW9neXFtenR0dHdxY29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTQ5ODgsImV4cCI6MjA4ODE5MDk4OH0.XryBavcC8ErB8JYr7VedX-CsELTbX5FA1c71EiPH3EA';

// Initialize Supabase client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ─── AUTH FUNCTIONS ───────────────────────────────────────
async function signUp(name, email, password, phone = '', country = 'India') {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, phone, country } }
  });
  if (error) throw error;
  // Insert into users table
  if (data.user) {
    await supabase.from('users').insert({
      id: data.user.id, name, email, phone, country
    });
  }
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/login.html';
}

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getUserProfile(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

// ─── WALLET FUNCTIONS ─────────────────────────────────────
async function getWalletBalance(userId) {
  const { data, error } = await supabase.from('users').select('wallet_balance').eq('id', userId).single();
  if (error) throw error;
  return data.wallet_balance;
}

async function addTransaction(userId, type, amount, description) {
  const { data, error } = await supabase.from('transactions').insert({
    user_id: userId, type, amount, description
  });
  if (error) throw error;
  // Update wallet balance
  const balance = await getWalletBalance(userId);
  const newBalance = type === 'credit' ? balance + amount : balance - amount;
  await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', userId);
  return data;
}

async function getTransactions(userId) {
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ─── SMS FUNCTIONS ────────────────────────────────────────
async function createCampaign(userId, senderId, message, recipientsCount) {
  const { data, error } = await supabase.from('sms_campaigns').insert({
    user_id: userId, sender_id: senderId, message, recipients_count: recipientsCount
  });
  if (error) throw error;
  return data;
}

async function getCampaigns(userId) {
  const { data, error } = await supabase.from('sms_campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ─── LINKS FUNCTIONS ──────────────────────────────────────
async function createShortLink(userId, originalUrl, shortCode) {
  const { data, error } = await supabase.from('short_links').insert({
    user_id: userId, original_url: originalUrl, short_code: shortCode
  });
  if (error) throw error;
  return data;
}

async function getShortLinks(userId) {
  const { data, error } = await supabase.from('short_links').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function incrementClicks(shortCode) {
  const { data } = await supabase.from('short_links').select('clicks').eq('short_code', shortCode).single();
  await supabase.from('short_links').update({ clicks: (data?.clicks || 0) + 1 }).eq('short_code', shortCode);
}

// ─── AUTH GUARD ───────────────────────────────────────────
async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

// ─── REALTIME ─────────────────────────────────────────────
function subscribeToWallet(userId, callback) {
  return supabase.channel('wallet-' + userId)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: 'id=eq.' + userId }, callback)
    .subscribe();
}
