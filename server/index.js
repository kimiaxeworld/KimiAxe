const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = 'https://gjtmryogyqmztttwqcoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdG1yeW9neXFtenR0dHdxY29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTQ5ODgsImV4cCI6MjA4ODE5MDk4OH0.XryBavcC8ErB8JYr7VedX-CsELTbX5FA1c71EiPH3EA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Auth - Register (direct insert)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    // Create user in auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } }
    });
    
    if (error) {
      // If already exists, try sign in
      if (error.message.includes('already registered')) {
        return res.json({ success: false, error: 'Email already exists', code: 'EMAIL_EXISTS' });
      }
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ success: true, user: data.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) return res.status(400).json({ error: error.message });
    
    res.json({ success: true, user: data.user, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet - Get Balance
app.get('/api/wallet/balance', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    
    const { data, error } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();
    
    res.json({ balance: data?.wallet_balance || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet - Add Balance
app.post('/api/wallet/add', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const { amount } = req.body;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    
    // Get current balance
    const { data: current } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();
    
    const newBalance = (current?.wallet_balance || 0) + amount;
    
    await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id);
    
    res.json({ success: true, balance: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Link Shortener - Create
app.post('/api/links/shorten', async (req, res) => {
  try {
    const { url, custom_alias } = req.body;
    
    const slug = custom_alias || Math.random().toString(36).substring(2, 8);
    
    const { data, error } = await supabase
      .from('short_links')
      .insert([{ original_url: url, short_code: slug, clicks: 0 }])
      .select()
      .single();
    
    if (error) return res.status(400).json({ error: error.message });
    
    res.json({ 
      success: true, 
      short_url: `https://axexvx.link/s/${slug}`, 
      slug: slug 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Link Stats
app.get('/api/links/:slug/stats', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data, error } = await supabase
      .from('short_links')
      .select('*')
      .eq('short_code', slug)
      .single();
    
    if (error || !data) return res.status(404).json({ error: 'Link not found' });
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redirect Short Link
app.get('/s/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data, error } = await supabase
      .from('short_links')
      .select('original_url, clicks')
      .eq('short_code', slug)
      .single();
    
    if (error || !data) {
      return res.redirect('https://kimiaxe.com');
    }
    
    // Update clicks
    await supabase
      .from('short_links')
      .update({ clicks: (data.clicks || 0) + 1 })
      .eq('short_code', slug);
    
    res.redirect(data.original_url);
  } catch (err) {
    res.redirect('https://kimiaxe.com');
  }
});

// SMS - Send (Placeholder)
app.post('/api/sms/send', async (req, res) => {
  res.json({ success: true, message: 'SMS sent', to: req.body.to });
});

// Contact
app.post('/api/contact', async (req, res) => {
  res.json({ success: true });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KimiAxe API running on port ${PORT}`));
