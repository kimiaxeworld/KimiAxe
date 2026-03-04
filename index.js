const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = 'https://gjtmryogyqmztttwqcoq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdG1yeW9neXFtenR0dHdxY29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTQ5ODgsImV4cCI6MjA4ODE5MDk4OH0.XryBavcC8ErB8JYr7VedX-CsELTbX5FA1c71EiPH3EA';

const supabase = axios.create({
  baseURL: SUPABASE_URL + '/rest/v1',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    res.json({ success: true, message: 'Register endpoint ready', email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    res.json({ success: true, message: 'Login endpoint ready' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shorten URL
app.post('/api/links/shorten', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const slug = Math.random().toString(36).substring(2, 8);
    
    await supabase.post('/short_links', {
      original_url: url,
      short_code: slug,
      clicks: 0
    });
    
    res.json({ 
      success: true, 
      short_url: `https://axexvx.link/s/${slug}`, 
      slug 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KimiAxe API running on port ${PORT}`));
