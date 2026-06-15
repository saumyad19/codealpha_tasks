// ============================================================
//  FAQ Chatbot – NLP Engine + UI Controller
//  Domain: E-Commerce (ShopSphere)
//  NLP: Tokenization → Lowercasing → Stopword Removal → TF-IDF Cosine Similarity
// ============================================================

// ── 1. FAQ DATASET ──────────────────────────────────────────
const FAQ_DATA = [
  {
    id: 1,
    category: "Orders",
    question: "How do I place an order on ShopSphere?",
    answer:
      "Placing an order is easy! Browse our catalog, click <strong>Add to Cart</strong> on any item, then head to your cart and click <strong>Checkout</strong>. Fill in your shipping address and payment details, then confirm your order. You'll receive an email confirmation within minutes. 🛒",
  },
  {
    id: 2,
    category: "Orders",
    question: "Can I modify or cancel my order after placing it?",
    answer:
      "You can modify or cancel your order within <strong>1 hour</strong> of placing it. Go to <em>My Orders → Order Details → Edit/Cancel</em>. After 1 hour, orders enter processing and can't be changed. Contact our support team if you need urgent help! ⏱️",
  },
  {
    id: 3,
    category: "Orders",
    question: "How do I track my order?",
    answer:
      "Track your order in real time! Visit <em>My Account → My Orders</em> and click your order ID. You'll see live tracking updates and a map view once your package ships. We also send SMS/email updates at every milestone. 📦",
  },
  {
    id: 4,
    category: "Shipping",
    question: "What are the shipping options and delivery times?",
    answer:
      "We offer three shipping tiers:<br>• <strong>Standard (Free)</strong> – 5–7 business days<br>• <strong>Express ($4.99)</strong> – 2–3 business days<br>• <strong>Same-Day ($9.99)</strong> – Available in 50+ cities<br>All orders placed before 12 PM qualify for same-day dispatch. 🚀",
  },
  {
    id: 5,
    category: "Shipping",
    question: "Do you offer free shipping?",
    answer:
      "Yes! Enjoy <strong>free standard shipping</strong> on all orders over $49. ShopSphere Prime members get free express shipping on every order. No promo code needed — discounts apply automatically at checkout. 🎉",
  },
  {
    id: 6,
    category: "Shipping",
    question: "Do you ship internationally?",
    answer:
      "We currently ship to <strong>42 countries</strong> across North America, Europe, and Asia-Pacific. International delivery takes 7–14 business days. Duties and taxes are calculated at checkout so there are no surprise fees. 🌍",
  },
  {
    id: 7,
    category: "Returns",
    question: "What is your return policy?",
    answer:
      "We offer a <strong>30-day hassle-free return policy</strong>. Items must be unused and in original packaging. Simply initiate a return from <em>My Orders</em>, print the prepaid label, and drop it off at any carrier location. Refunds are processed within 3–5 business days. ✅",
  },
  {
    id: 8,
    category: "Returns",
    question: "How do I return a damaged or defective item?",
    answer:
      "We're so sorry for the inconvenience! For damaged or defective items, take a photo and contact us via live chat or email within <strong>48 hours</strong> of delivery. We'll issue a full refund or send a replacement — whichever you prefer — at no cost to you. 💜",
  },
  {
    id: 9,
    category: "Returns",
    question: "When will I receive my refund?",
    answer:
      "Once we receive your returned item, your refund is processed within <strong>3–5 business days</strong>. Credit/debit card refunds appear in 5–10 days; ShopSphere Wallet refunds are instant. You'll get an email confirmation the moment it's initiated. 💳",
  },
  {
    id: 10,
    category: "Payments",
    question: "What payment methods do you accept?",
    answer:
      "We accept a wide range of payments:<br>• Visa, Mastercard, Amex, Discover<br>• PayPal & PayPal Credit<br>• Apple Pay & Google Pay<br>• ShopSphere Gift Cards<br>• Buy Now, Pay Later (Klarna / Afterpay)<br>All transactions are encrypted with 256-bit SSL. 🔒",
  },
  {
    id: 11,
    category: "Payments",
    question: "Is my payment information secure?",
    answer:
      "Absolutely. ShopSphere is <strong>PCI-DSS Level 1 compliant</strong> — the highest standard in payment security. We never store your raw card details. All data is tokenized and protected by end-to-end 256-bit AES encryption. 🛡️",
  },
  {
    id: 12,
    category: "Payments",
    question: "Can I use multiple payment methods for one order?",
    answer:
      "Yes! You can split payment between a <strong>ShopSphere Gift Card</strong> and any other payment method. For example, use a $20 gift card and pay the remaining balance with your credit card — all in one seamless checkout. 💰",
  },
  {
    id: 13,
    category: "Account",
    question: "How do I create an account?",
    answer:
      "Click <strong>Sign Up</strong> at the top of any page. Enter your name, email, and a strong password — or sign up instantly with Google or Apple. Verify your email, and you're all set to start shopping with personalized recommendations! 🎯",
  },
  {
    id: 14,
    category: "Account",
    question: "I forgot my password. How do I reset it?",
    answer:
      "Click <strong>Forgot Password?</strong> on the login page and enter your email. We'll send a secure reset link within 2 minutes. The link expires in 15 minutes for security. If you don't see the email, check your spam folder. 🔑",
  },
  {
    id: 15,
    category: "Account",
    question: "How do I update my shipping address?",
    answer:
      "Go to <em>My Account → Address Book</em> to add, edit, or delete addresses. You can save multiple addresses and set a default for faster checkout. Changes take effect immediately on future orders. 📍",
  },
  {
    id: 16,
    category: "Discounts",
    question: "How do I apply a promo code or coupon?",
    answer:
      "On the checkout page, look for the <strong>Promo Code</strong> field in your order summary. Type or paste your code and click <em>Apply</em>. The discount will reflect immediately in your total. Only one promo code per order unless stated otherwise. 🏷️",
  },
  {
    id: 17,
    category: "Discounts",
    question: "Does ShopSphere have a loyalty rewards program?",
    answer:
      "Yes! <strong>ShopSphere Stars</strong> rewards every purchase. Earn 1 Star per $1 spent. Redeem 100 Stars for $5 off. Reach Gold status at 500 Stars for double rewards and early access to sales. Check your Stars balance in <em>My Account → Rewards</em>. ⭐",
  },
  {
    id: 18,
    category: "Products",
    question: "How do I know if a product is authentic?",
    answer:
      "All products on ShopSphere are sourced directly from brands or authorized distributors. Look for the <strong>Verified Authentic</strong> badge on product listings. We have a zero-tolerance policy for counterfeits — every seller is vetted before listing. ✔️",
  },
  {
    id: 19,
    category: "Products",
    question: "Can I read product reviews before buying?",
    answer:
      "Absolutely! Every product page features <strong>verified purchase reviews</strong> with star ratings, photos, and detailed feedback. Filter reviews by rating, recency, or verified buyer status. Only customers who purchased the item can leave a review. 📝",
  },
  {
    id: 20,
    category: "Support",
    question: "How do I contact customer support?",
    answer:
      "Our support team is available <strong>24/7</strong> through multiple channels:<br>• 💬 Live Chat (fastest — avg. 90 sec response)<br>• 📧 Email: support@shopsphere.com<br>• 📞 Phone: 1-800-SHOP-NOW (8 AM–10 PM EST)<br>• 🐦 Twitter/X: @ShopSphereHelp",
  },
];

// ── 2. NLP PREPROCESSING ─────────────────────────────────────
const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","as","is","are","was","were","be","been","being","have",
  "has","had","do","does","did","will","would","could","should","may",
  "might","shall","can","need","dare","ought","used","i","me","my",
  "we","our","you","your","he","she","it","they","them","their","this",
  "that","these","those","what","which","who","how","when","where","why",
  "not","no","nor","so","yet","both","either","neither","each","every",
  "all","any","few","more","most","other","some","such","than","too",
  "very","just","about","after","before","into","through","during",
  "above","below","between","up","down","out","off","over","under",
  "again","then","once","here","there","s","t","re","ve","ll","d","m",
]);

/**
 * NLP Step 1 — Lowercasing
 */
function lowercase(text) {
  return text.toLowerCase();
}

/**
 * NLP Step 2 — Basic text cleaning
 * Remove punctuation, special characters, extra spaces
 */
function cleanText(text) {
  return text
    .replace(/[^\w\s]/g, " ")   // remove punctuation
    .replace(/\d+/g, " ")       // remove numbers
    .replace(/\s+/g, " ")       // collapse whitespace
    .trim();
}

/**
 * NLP Step 3 — Tokenization
 * Split into individual word tokens
 */
function tokenize(text) {
  return text.split(" ").filter((token) => token.length > 1);
}

/**
 * NLP Step 4 — Stopword Removal
 */
function removeStopwords(tokens) {
  return tokens.filter((token) => !STOPWORDS.has(token));
}

/**
 * Full NLP Pipeline: raw text → clean token array
 */
function nlpPipeline(text) {
  const step1 = lowercase(text);
  const step2 = cleanText(step1);
  const step3 = tokenize(step2);
  const step4 = removeStopwords(step3);
  return step4;
}

// ── 3. TF-IDF COSINE SIMILARITY ENGINE ───────────────────────

/**
 * Build vocabulary from all FAQ questions (pre-processed)
 */
function buildVocabulary(documents) {
  const vocab = new Set();
  documents.forEach((doc) => doc.forEach((token) => vocab.add(token)));
  return Array.from(vocab);
}

/**
 * Compute Term Frequency (TF) for a token list
 * TF(t,d) = count of t in d / total tokens in d
 */
function computeTF(tokens, vocab) {
  const tf = {};
  const total = tokens.length || 1;
  vocab.forEach((term) => {
    tf[term] = tokens.filter((t) => t === term).length / total;
  });
  return tf;
}

/**
 * Compute Inverse Document Frequency (IDF)
 * IDF(t) = log(N / (1 + df(t)))  — smoothed
 */
function computeIDF(tokenizedDocs, vocab) {
  const N = tokenizedDocs.length;
  const idf = {};
  vocab.forEach((term) => {
    const df = tokenizedDocs.filter((doc) => doc.includes(term)).length;
    idf[term] = Math.log((N + 1) / (df + 1)) + 1; // smoothed IDF
  });
  return idf;
}

/**
 * Compute TF-IDF vector for a document
 */
function tfidfVector(tokens, vocab, idf) {
  const tf = computeTF(tokens, vocab);
  const vector = {};
  vocab.forEach((term) => {
    vector[term] = tf[term] * idf[term];
  });
  return vector;
}

/**
 * Cosine Similarity between two TF-IDF vectors
 * cos(A,B) = (A · B) / (|A| × |B|)
 */
function cosineSimilarity(vecA, vecB) {
  const keys = Object.keys(vecA);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  keys.forEach((key) => {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ── 4. PRE-COMPUTE FAQ VECTORS ────────────────────────────────

// Tokenize all FAQ questions once at startup for performance
const tokenizedFAQs = FAQ_DATA.map((faq) => nlpPipeline(faq.question));

// Build shared vocabulary from all FAQ questions
const vocabulary = buildVocabulary(tokenizedFAQs);

// Compute IDF across the entire FAQ corpus
const corpusIDF = computeIDF(tokenizedFAQs, vocabulary);

// Pre-compute TF-IDF vectors for every FAQ question
const faqVectors = tokenizedFAQs.map((tokens) =>
  tfidfVector(tokens, vocabulary, corpusIDF)
);

/**
 * Find the best matching FAQ for a user query
 * Returns: { faq, score, processedTokens }
 */
function findBestMatch(userQuery) {
  const queryTokens = nlpPipeline(userQuery);

  if (queryTokens.length === 0) {
    return { faq: null, score: 0, processedTokens: [] };
  }

  // Extend vocabulary with any new query terms
  const extendedVocab = Array.from(new Set([...vocabulary, ...queryTokens]));

  // Compute query TF-IDF vector
  const queryVector = tfidfVector(queryTokens, extendedVocab, corpusIDF);

  // Compute cosine similarity against every FAQ
  let bestScore = -1;
  let bestIndex = -1;

  faqVectors.forEach((faqVector, i) => {
    // Extend faq vector with zero values for new query terms
    const extendedFaqVec = { ...faqVector };
    queryTokens.forEach((t) => {
      if (extendedFaqVec[t] === undefined) extendedFaqVec[t] = 0;
    });

    const score = cosineSimilarity(queryVector, extendedFaqVec);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  });

  return {
    faq: FAQ_DATA[bestIndex],
    score: bestScore,
    processedTokens: queryTokens,
  };
}

// ── 5. CHAT UI CONTROLLER ─────────────────────────────────────

const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const suggestionChips = document.querySelectorAll(".chip");

// Confidence thresholds
const HIGH_CONFIDENCE = 0.15;
const LOW_CONFIDENCE = 0.05;

// Conversation memory (for UI context)
let conversationHistory = [];
let messageCount = 0;

/**
 * Render a message bubble in the chat
 */
function renderMessage(text, sender = "bot", meta = null) {
  const msgWrapper = document.createElement("div");
  msgWrapper.className = `message ${sender}-message`;
  msgWrapper.style.animationDelay = "0ms";

  if (sender === "user") {
    msgWrapper.innerHTML = `
      <div class="bubble user-bubble">
        <p>${escapeHtml(text)}</p>
      </div>
      <div class="avatar user-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
      </div>
    `;
  } else {
    const confidence = meta ? confidenceBadge(meta.score) : "";
    const category = meta && meta.faq ? `<span class="msg-category">${meta.faq.category}</span>` : "";
    msgWrapper.innerHTML = `
      <div class="avatar bot-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.73V7h3a3 3 0 0 1 3 3v1h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1v-1a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>
      </div>
      <div class="bubble bot-bubble">
        <div class="bubble-header">${category}${confidence}</div>
        <p>${text}</p>
      </div>
    `;
  }

  chatMessages.appendChild(msgWrapper);
  scrollToBottom();
  messageCount++;
}

/**
 * Show typing indicator while processing
 */
function showTypingIndicator() {
  const typing = document.createElement("div");
  typing.className = "message bot-message typing-wrapper";
  typing.id = "typingIndicator";
  typing.innerHTML = `
    <div class="avatar bot-avatar">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.73V7h3a3 3 0 0 1 3 3v1h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1v-1a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>
    </div>
    <div class="bubble bot-bubble typing-bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(typing);
  scrollToBottom();
  return typing;
}

/**
 * Remove typing indicator
 */
function hideTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

/**
 * Generate confidence badge HTML
 */
function confidenceBadge(score) {
  if (score >= HIGH_CONFIDENCE) {
    return `<span class="confidence high">High match</span>`;
  } else if (score >= LOW_CONFIDENCE) {
    return `<span class="confidence medium">Partial match</span>`;
  }
  return `<span class="confidence low">Low match</span>`;
}

/**
 * Auto-scroll chat to latest message
 */
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
  });
}

/**
 * Escape HTML to prevent XSS from user input
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

/**
 * Fallback responses for when no good match is found
 */
const FALLBACK_RESPONSES = [
  "Hmm, I'm not quite sure about that. Try rephrasing your question, or browse our <strong>Help Center</strong> at help.shopsphere.com. 🤔",
  "That's a great question, but it's outside my FAQ knowledge. Our <strong>live support agents</strong> are available 24/7 and would love to help! 💬",
  "I couldn't find a precise match for that. Could you try asking about <strong>orders, shipping, returns, payments, or your account</strong>? 🔍",
];

/**
 * Main query handler — orchestrates the full NLP pipeline
 */
async function handleQuery(query) {
  const trimmed = query.trim();
  if (!trimmed) return;

  // Store in history
  conversationHistory.push({ role: "user", text: trimmed });

  // Render user message
  renderMessage(trimmed, "user");

  // Clear input
  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  // Show typing animation
  const typingEl = showTypingIndicator();

  // Simulate realistic processing delay (350–800ms)
  const delay = 350 + Math.random() * 450;

  await new Promise((resolve) => setTimeout(resolve, delay));

  hideTypingIndicator();

  // Run NLP matching
  const { faq, score, processedTokens } = findBestMatch(trimmed);

  let responseText;
  let meta = { score, faq };

  if (score >= LOW_CONFIDENCE && faq) {
    responseText = faq.answer;
    conversationHistory.push({ role: "bot", text: faq.answer, faqId: faq.id });
  } else {
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    responseText = fallback;
    meta = { score: 0, faq: null };
  }

  renderMessage(responseText, "bot", meta);

  // Update NLP debug panel
  updateDebugPanel(trimmed, processedTokens, score, faq);
}

/**
 * Update the NLP transparency panel
 */
function updateDebugPanel(raw, tokens, score, faq) {
  const panel = document.getElementById("debugPanel");
  if (!panel) return;

  document.getElementById("dbRaw").textContent = raw;
  document.getElementById("dbTokens").textContent =
    tokens.length > 0 ? tokens.join(", ") : "(no meaningful tokens)";
  document.getElementById("dbScore").textContent =
    (score * 100).toFixed(1) + "%";
  document.getElementById("dbMatch").textContent = faq
    ? `"${faq.question}" (${faq.category})`
    : "No match found";

  const bar = document.getElementById("scoreBar");
  const pct = Math.min(score * 400, 100); // scale for visibility
  bar.style.width = pct + "%";
  bar.className = "score-fill " + (pct > 50 ? "high" : pct > 20 ? "med" : "low");

  panel.classList.add("active");
}

// ── 6. WELCOME MESSAGE ────────────────────────────────────────
function renderWelcome() {
  const welcome = document.createElement("div");
  welcome.className = "welcome-block";
  welcome.innerHTML = `
    <div class="bot-orb">
      <div class="orb-ring ring1"></div>
      <div class="orb-ring ring2"></div>
      <div class="orb-core">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.73V7h3a3 3 0 0 1 3 3v1h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h1v-1a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 9a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 0 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>
      </div>
    </div>
    <h2>Hi, I'm <span class="brand-name">Sphere</span> 👋</h2>
    <p>Your AI-powered ShopSphere assistant. I can help with orders, shipping, returns, payments, and more.</p>
    <p class="sub">Ask me anything, or tap a suggestion below.</p>
  `;
  chatMessages.appendChild(welcome);
}

// ── 7. EVENT LISTENERS ────────────────────────────────────────
sendBtn.addEventListener("click", () => handleQuery(userInput.value));

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleQuery(userInput.value);
  }
});

userInput.addEventListener("input", () => {
  sendBtn.disabled = userInput.value.trim().length === 0;
  // Auto-resize textarea
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

// Suggestion chips
suggestionChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    handleQuery(chip.textContent);
    // Hide suggestions after use
    document.querySelector(".suggestions").style.display = "none";
  });
});

// Toggle NLP debug panel
const toggleDebug = document.getElementById("toggleDebug");
if (toggleDebug) {
  toggleDebug.addEventListener("click", () => {
    const panel = document.getElementById("debugPanel");
    panel.classList.toggle("open");
    toggleDebug.textContent = panel.classList.contains("open")
      ? "Hide NLP Details ▲"
      : "View NLP Details ▼";
  });
}

// FAQ category filter buttons
document.querySelectorAll(".faq-filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const category = btn.dataset.category;
    document.querySelectorAll(".faq-filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const items = document.querySelectorAll(".faq-item");
    items.forEach((item) => {
      if (category === "all" || item.dataset.category === category) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
  });
});

// ── 8. INIT ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  renderWelcome();
  sendBtn.disabled = true;

  // Particle background
  initParticles();
});

/**
 * Lightweight canvas particle system for background ambiance
 */
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);

  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.8 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    // Draw faint connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener("resize", () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });
}
