const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Reva backend is running 💜");
});

// --- Minimal AI assistant endpoints (in-memory) ---

// Sample tips and FAQs
const tips = [
    "Take three slow, deep breaths when you feel overwhelmed.",
    "Try skin-to-skin contact for soothing both you and your baby.",
    "Small, frequent snacks can help maintain energy while breastfeeding.",
    "Short walks (even indoors) can boost mood and circulation.",
    "Create a simple bedtime cue for your baby — a soft song or dim light."
];

const faqs = {
    breastfeeding: `Breastfeeding often works best when both you and baby are comfortable. Seek a lactation consultant for persistent pain or latch issues. It's okay to ask for help. Try repositioning, ensuring the baby's mouth covers more of the areola, and burping frequently.`,
    sleep: `Newborns sleep in short stretches. Focus on safe sleep practices and rest when you can. Consider short naps, a calming bedtime routine, and reduce screen time before bed. If sleep deprivation becomes severe, ask for support from family or a provider.`,
    postpartum: `Postpartum recovery varies. Rest, hydration, gentle movement, and reaching out for support help. If you experience heavy bleeding, fever, severe pain, or thoughts of harming yourself, contact a healthcare provider immediately.`
};

// In-memory tracking store
const trackingEntries = []; // { name, mood, sleepHours, at }

// Helper: empathetic wrapper
function empatheticReply(prefix, body) {
    return `${prefix} ${body} 💜`;
}

// Assistant endpoint: analyze message and respond with helpful actions
app.post('/assistant', (req, res) => {
    const { message = '', name = 'Friend', mood } = req.body || {};
    const text = String(message || '').toLowerCase();

    // Quick intent matching
    if (!text.trim()) {
        return res.json({ reply: "Hi — I'm here for you. How can I support you today?", suggestions: ['tip', 'faq:breastfeeding', 'track'] });
    }

    // Ask for tracking if user says they want to log
    if (text.includes('track') || text.includes('log') || text.includes('mood')) {
        return res.json({ reply: empatheticReply('Thanks for sharing —', 'I can log your mood and sleep. Would you like to record now?'), suggestions: ['track'] });
    }

    if (text.includes('breast') || text.includes('latch') || text.includes('feeding')) {
        return res.json({ reply: empatheticReply('Breastfeeding can be challenging —', faqs.breastfeeding), suggestions: ['tip', 'faq:breastfeeding'], resources: [{ title: 'La Leche League', url: 'https://www.llli.org' }, { title: 'Local lactation consultants', url: '/community' }] });
    }

    if (text.includes('sleep')) {
        return res.json({ reply: empatheticReply('Sleep is so important —', faqs.sleep), suggestions: ['tip', 'faq:sleep'] });
    }

    if (text.includes('recover') || text.includes('postpartum') || text.includes('pain')) {
        return res.json({ reply: empatheticReply('Recovery takes time —', faqs.postpartum), suggestions: ['faq:postpartum', 'tip'] });
    }

    if (text.includes('tip') || text.includes('advice') || text.includes('help')) {
        const rand = tips[Math.floor(Math.random() * tips.length)];
        return res.json({ reply: empatheticReply('Here’s a simple tip —', rand), suggestions: ['tip'] });
    }

    // Fall back: general supportive reply and suggest actions
    return res.json({ reply: empatheticReply('I hear you —', "Tell me more or choose a quick action: 'tip', 'track', or ask about 'breastfeeding' or 'sleep'."), suggestions: ['tip', 'track', 'faq:breastfeeding'] });
});

// Tips endpoint
app.get('/tips', (req, res) => {
    const sample = tips[Math.floor(Math.random() * tips.length)];
    res.json({ tip: sample, tips });
});

// FAQ endpoint
app.get('/faq', (req, res) => {
    const topic = String(req.query.topic || 'general').toLowerCase();
    if (topic && faqs[topic]) return res.json({ topic, answer: faqs[topic] });
    return res.json({ topic: 'general', answer: 'Ask me about breastfeeding, sleep, or postpartum recovery and I’ll share tips and resources.' });
});

// Tracking endpoints
app.post('/track', (req, res) => {
    const { name = 'Anonymous', mood = '', sleepHours = null } = req.body || {};
    const entry = { name, mood, sleepHours: (sleepHours !== null ? Number(sleepHours) : null), at: new Date().toISOString() };
    trackingEntries.push(entry);
    return res.json({ status: 'ok', entry });
});

app.get('/tracking', (req, res) => {
    const name = req.query.name;
    if (name) {
        return res.json({ entries: trackingEntries.filter(e => e.name === name) });
    }
    return res.json({ entries: trackingEntries.slice(-50) });
});

// Contact form receiver (simple echo/acknowledgement)
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body || {};   console.log('Contact form received:', { name, email, message });
    res.json({ status: 'ok', message: 'Thanks — we received your message.' });
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
