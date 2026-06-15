# 🛍️ ShopSphere — AI FAQ Chatbot

> An intelligent, NLP-powered FAQ chatbot for e-commerce, built with vanilla JavaScript and TF-IDF cosine similarity matching. Portfolio-level UI with deep-space glassmorphism design.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit-8b5cf6?style=for-the-badge)](https://YOUR-NETLIFY-URL.netlify.app)
[![License](https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge)](LICENSE)
[![Made With](https://img.shields.io/badge/Made%20With-Vanilla%20JS-f59e0b?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 📸 Preview

```
┌──────────────────────────────────────────────────────┐
│  🛍️ ShopSphere / FAQ Assistant      ● AI Online      │
├──────────────┬───────────────────────────────────────┤
│ Browse by    │                                       │
│ Category     │   Hi, I'm Sphere 👋                   │
│              │   Your AI-powered assistant...        │
│ Quick        │                                       │
│ Questions    │  [User]: How do I track my order?     │
│              │  [Bot]:  Track in My Account → ...    │
│ NLP          │                                       │
│ Inspector    │  [📦 Track] [🚚 Shipping] [↩️ Return] │
│              │  ┌──────────────────────────┐  [▶]   │
│              │  │ Ask anything…            │        │
│              │  └──────────────────────────┘        │
└──────────────┴───────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 NLP Pipeline | Tokenization → Lowercasing → Text Cleaning → Stopword Removal |
| 📐 TF-IDF + Cosine Similarity | Full vector-space model for accurate query matching |
| 💬 ChatGPT-style UI | Message bubbles, typing animation, auto-scroll |
| 🔬 NLP Inspector | Real-time view of preprocessing steps and match scores |
| 🗂️ 20 FAQs, 9 Categories | Orders, Shipping, Returns, Payments, Account, and more |
| 📱 Fully Responsive | Mobile-first, works on all screen sizes |
| ⚡ Zero Dependencies | Pure HTML + CSS + JavaScript, no frameworks needed |
| 🎨 Deep-space Glassmorphism | Violet/indigo palette, particle canvas, animated orbs |
| ♿ Accessible | ARIA roles, keyboard navigation, focus management |

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure with ARIA accessibility
- **CSS3** — Glassmorphism, CSS variables, grid/flexbox, keyframe animations
- **Vanilla JavaScript (ES2020)** — NLP engine, TF-IDF, cosine similarity, UI logic
- **Canvas API** — Animated particle background
- **Google Fonts** — Inter + JetBrains Mono

---

## 🧠 How the NLP Works

### Pipeline (4 Steps)

```
Raw Input:  "How can I track WHERE my ORDER is right now?"
             ↓
Step 1 — Lowercase:       "how can i track where my order is right now"
             ↓
Step 2 — Clean Text:      "how can i track where my order is right now"
             ↓
Step 3 — Tokenize:        ["how","can","i","track","where","my","order","is","right","now"]
             ↓
Step 4 — Remove Stopwords: ["track","order","right"]
```

### TF-IDF Cosine Similarity

The system pre-computes TF-IDF vectors for all 20 FAQ questions at startup:

```
TF(term, doc)  = count(term in doc) / total_terms_in_doc
IDF(term)      = log((N + 1) / (df + 1)) + 1   [smoothed]
TF-IDF(t,d)    = TF(t,d) × IDF(t)

cosine_sim(A,B) = (A · B) / (|A| × |B|)
```

When a user submits a query:
1. The query goes through the same NLP pipeline
2. A TF-IDF vector is computed for the query
3. Cosine similarity is measured against all 20 pre-computed FAQ vectors
4. The FAQ with the highest similarity score above the threshold is returned

### Confidence Thresholds

| Score | Badge | Behavior |
|---|---|---|
| ≥ 0.15 (15%) | 🟢 High match | Best FAQ returned |
| 0.05–0.15 | 🟡 Partial match | Best FAQ returned with caution badge |
| < 0.05 | 🔴 Low match | Fallback response shown |

---

## 📂 Project Structure

```
faq-chatbot/
├── index.html     ← App shell: layout, semantic HTML, ARIA
├── style.css      ← Deep-space theme, animations, responsive grid
├── app.js         ← FAQ dataset + NLP engine + UI controller
└── README.md      ← You are here
```

---

## 🚀 Getting Started

### Option 1 — Open directly

Just double-click `index.html`. The app works offline with no server needed.

### Option 2 — VS Code + Live Server (recommended)

```bash
# 1. Install Live Server extension in VS Code
# 2. Open the faq-chatbot/ folder in VS Code
# 3. Right-click index.html → "Open with Live Server"
# 4. Browser opens at http://127.0.0.1:5500
```

### Option 3 — Python local server

```bash
cd faq-chatbot
python -m http.server 8080
# Open http://localhost:8080
```

---

## 🌐 Deploy to Netlify

### Drag-and-Drop (instant, no CLI)

1. Go to [netlify.com](https://netlify.com) → **Log in**
2. Click **"Add new site" → "Deploy manually"**
3. Drag the entire `faq-chatbot/` folder onto the upload zone
4. Your live URL is ready in ~10 seconds: `https://RANDOM-NAME.netlify.app`
5. Optionally rename it under **Site settings → Change site name**

### Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
cd faq-chatbot
netlify deploy --dir . --prod
```

---

## 📤 Push to GitHub

```bash
# 1. Create a new repo at github.com (name it: faq-chatbot)

# 2. Inside your faq-chatbot/ folder:
git init
git add .
git commit -m "feat: initial commit — ShopSphere FAQ chatbot"

# 3. Link to GitHub (replace YOUR_USERNAME):
git remote add origin https://github.com/YOUR_USERNAME/faq-chatbot.git
git branch -M main
git push -u origin main
```

After pushing, enable GitHub Pages:  
**Repo Settings → Pages → Source: main branch / root → Save**

---

## ⚙️ NLP Concepts Explained

### Where AI concepts are applied

| Concept | Where Used |
|---|---|
| Tokenization | `tokenize()` — splits query into word tokens |
| Stopword Removal | `removeStopwords()` — filters noise words |
| TF (Term Frequency) | `computeTF()` — importance of term in one doc |
| IDF (Inverse Document Frequency) | `computeIDF()` — rarity across all docs |
| TF-IDF Vectorization | `tfidfVector()` — converts text to numeric vector |
| Cosine Similarity | `cosineSimilarity()` — angle between query + FAQ vectors |
| Vocabulary Building | `buildVocabulary()` — shared token space |

### Limitations of this approach

1. **No semantic understanding** — "parcel" and "package" are treated as different terms
2. **No context memory** — each query is independent; no multi-turn reasoning
3. **Small corpus** — 20 FAQs limit coverage; unseen topics get fallback responses
4. **No stemming/lemmatization** — "shipping" ≠ "ship" ≠ "shipped"
5. **No typo handling** — "ordeer" won't match "order"

### How to improve with real AI

```
Current:  TF-IDF cosine similarity (keyword matching)
             ↓
Level 2:  Word2Vec / GloVe embeddings (semantic similarity)
             ↓
Level 3:  Sentence-BERT / Universal Sentence Encoder
             ↓
Level 4:  OpenAI GPT-4 API with RAG (Retrieval Augmented Generation)
             ↓
Level 5:  Fine-tuned LLM on your domain FAQs
```

**OpenAI API integration example:**
```javascript
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gpt-4o",
    messages: [
      { role: "system", content: `You are a helpful ShopSphere assistant. FAQs: ${JSON.stringify(FAQ_DATA)}` },
      { role: "user", content: userQuery }
    ]
  })
});
```

---

## 📊 FAQ Dataset Summary

| Category | # of FAQs |
|---|---|
| Orders | 3 |
| Shipping | 3 |
| Returns | 3 |
| Payments | 3 |
| Account | 3 |
| Discounts | 2 |
| Products | 2 |
| Support | 1 |
| **Total** | **20** |

---

## 📄 License

MIT © 2025 — Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- NLP concepts: [TF-IDF Wikipedia](https://en.wikipedia.org/wiki/Tf%E2%80%93idf), [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- Design inspiration: Linear.app, Vercel Dashboard, Anthropic Claude UI
- Font: [Inter](https://rsms.me/inter/) by Rasmus Andersson
