(function () {
  // 1. Identify botId from script tag or global variable
  const scriptTag = document.currentScript || Array.from(document.querySelectorAll('script')).find(s => s.src.includes('widget.js'));
  let botId = null;
  let apiHost = "";

  if (scriptTag) {
    const url = new URL(scriptTag.src);
    botId = url.searchParams.get("botId");
    apiHost = url.origin;
  }

  // Fallback to global config if script search failed
  if (!botId && window.VieloraWidgetConfig) {
    botId = window.VieloraWidgetConfig.botId;
  }

  if (!botId) {
    console.error("Vielora Widget Error: Missing botId in script tag URL parameters.");
    return;
  }

  // Set local origin if blank
  if (!apiHost) {
    apiHost = window.location.origin;
  }

  // Fetch bot configuration
  fetch(`${apiHost}/api/bots?botId=${botId}`)
    .then((res) => {
      if (!res.ok) throw new Error("Bot configuration not found");
      return res.json();
    })
    .then((bot) => {
      initializeWidget(bot);
    })
    .catch((err) => {
      console.warn("Vielora Widget: Could not initialize widget. Details:", err);
    });

  // 2. Initialize Widget elements inside Shadow DOM
  function initializeWidget(bot) {
    const primaryColor = bot.widgetConfig?.primaryColor || "#2DB87A";
    const displayName = bot.widgetConfig?.displayName || bot.name;
    const welcomeMessage = bot.widgetConfig?.welcomeMessage || "Xin chào!";
    const placeholderText = bot.widgetConfig?.placeholderText || "Nhập tin nhắn...";

    // Create mount container
    const container = document.createElement("div");
    container.id = "vielora-chat-widget-container";
    document.body.appendChild(container);

    // Create shadow DOM root
    const shadowRoot = container.attachShadow({ mode: "open" });

    // Styles for Shadow DOM
    const styles = `
      :host {
        --primary-color: ${primaryColor};
        --primary-hover: ${primaryColor}dd;
      }
      .vielora-wrapper {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 13px;
        color: #1e293b;
        z-index: 2147483647;
      }
      .vielora-bubble {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background-color: var(--primary-color);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2147483647;
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
      }
      .vielora-bubble:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
      }
      .vielora-bubble svg {
        fill: #ffffff;
        width: 24px;
        height: 24px;
        transition: transform 0.3s ease;
      }
      .vielora-bubble.open svg {
        transform: rotate(90deg);
      }
      .vielora-window {
        position: fixed;
        bottom: 88px;
        right: 20px;
        width: 340px;
        height: 480px;
        border-radius: 12px;
        background-color: #ffffff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        z-index: 2147483647;
        overflow: hidden;
        opacity: 0;
        transform: translateY(25px) scale(0.95);
        pointer-events: none;
        transition: opacity 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        border: 1px solid #e2e8f0;
      }
      .vielora-window.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .vielora-header {
        padding: 14px 16px;
        color: #ffffff;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: justify;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
      .vielora-header-info {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
      }
      .vielora-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
      }
      .vielora-bot-meta {
        display: flex;
        flex-direction: column;
      }
      .vielora-bot-name {
        font-weight: bold;
        font-size: 13px;
        margin: 0;
        line-height: 1.2;
      }
      .vielora-bot-status {
        font-size: 9px;
        opacity: 0.9;
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .vielora-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #22c55e;
      }
      .vielora-close {
        font-size: 14px;
        cursor: pointer;
        opacity: 0.8;
        padding: 4px;
        transition: opacity 0.2s;
        background: transparent;
        border: none;
        color: #ffffff;
      }
      .vielora-close:hover {
        opacity: 1;
      }
      .vielora-body {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        background-color: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .vielora-message {
        display: flex;
        gap: 8px;
        max-width: 85%;
        animation: vieloraFadeIn 0.25s ease forwards;
      }
      .vielora-message.user {
        margin-left: auto;
        flex-direction: row-reverse;
      }
      .vielora-msg-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: bold;
        color: #475569;
        shrink-0: 0;
      }
      .vielora-message.user .vielora-msg-avatar {
        background-color: #475569;
        color: #ffffff;
      }
      .vielora-msg-bubble {
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 12px;
        line-height: 1.5;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .vielora-message.bot .vielora-msg-bubble {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        color: #0f172a;
        border-top-left-radius: 0;
      }
      .vielora-message.user .vielora-msg-bubble {
        background-color: var(--primary-color);
        color: #ffffff;
        border-top-right-radius: 0;
      }
      .vielora-footer {
        padding: 10px 14px;
        background-color: #ffffff;
        border-t: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .vielora-input-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .vielora-input {
        flex: 1;
        padding: 8px 12px;
        border-radius: 20px;
        border: 1px solid #cbd5e1;
        outline: none;
        font-size: 12px;
        background-color: #f1f5f9;
        transition: border-color 0.2s, background-color 0.2s;
      }
      .vielora-input:focus {
        border-color: var(--primary-color);
        background-color: #ffffff;
      }
      .vielora-send {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--primary-color);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, transform 0.1s active;
        color: #ffffff;
      }
      .vielora-send:hover {
        background-color: var(--primary-hover);
      }
      .vielora-send svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
      }
      .vielora-watermark {
        font-size: 8px;
        color: #94a3b8;
        text-align: center;
        text-decoration: none;
        display: block;
        margin-top: 2px;
      }
      .vielora-watermark strong {
        color: var(--primary-color);
      }
      .vielora-typing {
        display: flex;
        gap: 3px;
        align-items: center;
        padding: 8px 10px;
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        border-top-left-radius: 0;
        width: 30px;
        animation: vieloraFadeIn 0.2s ease forwards;
      }
      .vielora-typing-dot {
        width: 4px;
        height: 4px;
        background-color: #94a3b8;
        border-radius: 50%;
        animation: vieloraBounce 1.4s infinite ease-in-out;
      }
      .vielora-typing-dot:nth-child(1) { animation-delay: 0s; }
      .vielora-typing-dot:nth-child(2) { animation-delay: 0.16s; }
      .vielora-typing-dot:nth-child(3) { animation-delay: 0.32s; }
      
      @keyframes vieloraFadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes vieloraBounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
    `;

    // Active Message state array
    const chatHistory = [
      { role: "assistant", content: welcomeMessage }
    ];

    // Build DOM inside Shadow DOM
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    shadowRoot.appendChild(styleEl);

    const wrapper = document.createElement("div");
    wrapper.className = "vielora-wrapper";
    shadowRoot.appendChild(wrapper);

    // Chat Window HTML
    const chatWindow = document.createElement("div");
    chatWindow.className = "vielora-window";
    chatWindow.innerHTML = `
      <div class="vielora-header">
        <div class="vielora-header-info">
          <div class="vielora-avatar" style="background-color: rgba(255,255,255,0.25)">
            ${displayName.substring(0,2).toUpperCase()}
          </div>
          <div class="vielora-bot-meta">
            <h4 class="vielora-bot-name">${displayName}</h4>
            <span class="vielora-bot-status">
              <span class="vielora-status-dot"></span>Trực tuyến
            </span>
          </div>
        </div>
        <button class="vielora-close" aria-label="Đóng">✕</button>
      </div>
      <div class="vielora-body"></div>
      <div class="vielora-footer">
        <div class="vielora-input-row">
          <input type="text" class="vielora-input" placeholder="${placeholderText}" />
          <button class="vielora-send" aria-label="Gửi">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <a class="vielora-watermark" href="https://vielora.com" target="_blank">
          Powered by <strong>Vielora</strong>
        </a>
      </div>
    `;
    wrapper.appendChild(chatWindow);

    // Chat Bubble HTML
    const chatBubble = document.createElement("div");
    chatBubble.className = "vielora-bubble";
    chatBubble.innerHTML = `
      <svg class="vielora-bubble-icon" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    `;
    wrapper.appendChild(chatBubble);

    const bodyEl = chatWindow.querySelector(".vielora-body");
    const inputEl = chatWindow.querySelector(".vielora-input");
    const sendBtn = chatWindow.querySelector(".vielora-send");
    const closeBtn = chatWindow.querySelector(".vielora-close");

    // Populate Initial welcome message
    renderMessages();

    // Toggle Chat Window
    chatBubble.addEventListener("click", () => {
      const isOpen = chatWindow.classList.toggle("open");
      chatBubble.classList.toggle("open", isOpen);
      
      // Update bubble icon if open
      if (isOpen) {
        chatBubble.innerHTML = `
          <svg class="vielora-bubble-icon" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        `;
        inputEl.focus();
      } else {
        chatBubble.innerHTML = `
          <svg class="vielora-bubble-icon" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        `;
      }
    });

    closeBtn.addEventListener("click", () => {
      chatWindow.classList.remove("open");
      chatBubble.classList.remove("open");
      chatBubble.innerHTML = `
        <svg class="vielora-bubble-icon" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      `;
    });

    // Handle inputs
    const sendMessage = () => {
      const text = inputEl.value.trim();
      if (!text) return;

      inputEl.value = "";
      
      // Add user message
      chatHistory.push({ role: "user", content: text });
      renderMessages();

      // Show typing indicator
      const typingEl = document.createElement("div");
      typingEl.className = "vielora-message bot";
      typingEl.innerHTML = `
        <div class="vielora-msg-avatar">${displayName.substring(0,2).toUpperCase()}</div>
        <div class="vielora-typing">
          <span class="vielora-typing-dot"></span>
          <span class="vielora-typing-dot"></span>
          <span class="vielora-typing-dot"></span>
        </div>
      `;
      bodyEl.appendChild(typingEl);
      bodyEl.scrollTop = bodyEl.scrollHeight;

      // POST message to API
      fetch(`${apiHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: botId,
          messages: chatHistory
        })
      })
      .then((res) => res.json())
      .then((data) => {
        // Remove typing indicator
        typingEl.remove();

        if (data && !data.error) {
          chatHistory.push({ role: "assistant", content: data.content });
        } else {
          chatHistory.push({ role: "assistant", content: "Đã xảy ra lỗi kết nối." });
        }
        renderMessages();
      })
      .catch((err) => {
        typingEl.remove();
        chatHistory.push({ role: "assistant", content: "Lỗi kết nối máy chủ." });
        renderMessages();
      });
    };

    sendBtn.addEventListener("click", sendMessage);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    // Helper functions
    function renderMessages() {
      bodyEl.innerHTML = "";
      chatHistory.forEach((msg) => {
        const msgEl = document.createElement("div");
        msgEl.className = `vielora-message ${msg.role === "user" ? "user" : "bot"}`;
        
        const avatarChar = msg.role === "user" ? "U" : displayName.substring(0,2).toUpperCase();
        
        msgEl.innerHTML = `
          <div class="vielora-msg-avatar">${avatarChar}</div>
          <div class="vielora-msg-bubble">${msg.content}</div>
        `;
        bodyEl.appendChild(msgEl);
      });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    }
  }
})();
