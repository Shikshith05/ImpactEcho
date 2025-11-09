document.addEventListener("DOMContentLoaded", () => {
  // ---------- Get Real User Data ----------
  function getUserData() {
    const walletAddress = localStorage.getItem('walletAddress') || "";
    
    // Get transactions first (always from localStorage)
    const transactionKey = `transactions_${walletAddress}`;
    const transactions = JSON.parse(localStorage.getItem(transactionKey) || '[]');
    
    // Try to get data from dashboard global scope first (if available)
    if (typeof window.user !== 'undefined' && window.user.walletAddress) {
      // Use live dashboard data
      const supportedCausesArray = window.supportedCauses ? Array.from(window.supportedCauses) : [];
      const recentDonationsArray = window.recentDonations || [];
      
      return {
        walletAddress: window.user.walletAddress || walletAddress,
        username: window.user.username || "Guest",
        email: window.user.email || "",
        transactions: transactions,
        totalImpact: window.totalImpact || 0,
        donationsMade: window.donationsMade || 0,
        livesImpacted: window.livesImpacted || 0,
        supportedCauses: supportedCausesArray,
        recentDonations: recentDonationsArray
      };
    }
    
    // Fallback to localStorage if dashboard globals not available
    const profileKey = `userProfile_${walletAddress}`;
    const profile = localStorage.getItem(profileKey);
    const userProfile = profile ? JSON.parse(profile) : null;
    
    const userDataKey = `userData_${walletAddress}`;
    const userData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
    
    // Calculate data from transactions if userData not available
    let totalImpact = userData.totalImpact || 0;
    let donationsMade = userData.donationsMade || 0;
    let livesImpacted = userData.livesImpacted || 0;
    let supportedCauses = userData.supportedCauses || [];
    let recentDonations = userData.recentDonations || [];
    
    // If we have transactions but no userData, calculate from transactions
    if (transactions.length > 0 && donationsMade === 0) {
      totalImpact = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      donationsMade = transactions.length;
      livesImpacted = Math.floor(totalImpact / 25);
      supportedCauses = [...new Set(transactions.map(t => t.cause))];
      recentDonations = transactions.slice(0, 6).map(t => ({
        causeName: t.cause,
        amount: t.amount,
        timestamp: t.timestamp
      }));
    }
    
    return {
      walletAddress,
      username: userProfile && userProfile.name ? userProfile.name : (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Guest"),
      email: userProfile ? userProfile.email : "",
      transactions: transactions,
      totalImpact: totalImpact,
      donationsMade: donationsMade,
      livesImpacted: livesImpacted,
      supportedCauses: supportedCauses,
      recentDonations: recentDonations
    };
  }

  // ---------- Inject Chatbot HTML ----------
  document.body.insertAdjacentHTML("beforeend", `
    <button id="chatbot-button">💬</button>
    <div id="chatbot">
      <div id="chatbot-header">
        <span style="font-weight:700;">ImpactEcho AI 🤖</span>
        <button id="close-chat" style="background:transparent;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;margin-left:auto;">×</button>
      </div>
      <div id="chatbot-messages"></div>
      <div id="chatbot-input">
        <input id="user-input" type="text" placeholder="Ask about your donations..." />
        <button id="send-btn">Send</button>
      </div>
    </div>
  `);

  // ---------- Elements ----------
  const chatBtn = document.getElementById("chatbot-button");
  const chatWindow = document.getElementById("chatbot");
  const messagesDiv = document.getElementById("chatbot-messages");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const closeBtn = document.getElementById("close-chat");

  // ---------- Toggle Chat ----------
  chatBtn.onclick = () => {
    chatWindow.style.display = chatWindow.style.display === "flex" ? "none" : "flex";
    if (chatWindow.style.display === "flex") {
      userInput.focus();
    }
  };
  
  closeBtn.onclick = () => {
    chatWindow.style.display = "none";
  };

  // ---------- Send Message ----------
  sendBtn.onclick = handleUserMessage;
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleUserMessage();
  });

  // ---------- Initial Greeting ----------
  // Delay greeting slightly to ensure dashboard data is loaded
  setTimeout(() => {
    const userData = getUserData();
    const greeting = userData.username !== "Guest" 
      ? `Hey ${userData.username}! 👋 I'm ImpactEcho AI. Ask me about your donations, impact, or causes!`
      : `Hey! 👋 I'm ImpactEcho AI. Connect your wallet to see your donation data!`;
    addMessage("bot", greeting);
  }, 500);

  // ---------- Core Chat Logic ----------
  function handleUserMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    addMessage("user", text);
    userInput.value = "";

    showTypingAnimation();

    setTimeout(() => {
      removeTypingAnimation();
      const reply = generateAIResponse(text.toLowerCase());
      addMessage("bot", reply, true); // Allow HTML
    }, 800);
  }

  function addMessage(sender, text, allowHTML = false) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);
    
    if (allowHTML) {
      msgDiv.innerHTML = text;
    } else {
      msgDiv.textContent = text;
    }
    
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // ---------- Typing Indicator ----------
  let typingDiv;
  function showTypingAnimation() {
    typingDiv = document.createElement("div");
    typingDiv.classList.add("typing");
    typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  function removeTypingAnimation() {
    if (typingDiv) typingDiv.remove();
  }

  // ---------- Dynamic AI Responses ----------
  function generateAIResponse(text) {
    // Get fresh data every time
    const data = getUserData();
    
    // Debug logging
    console.log('🤖 Chatbot Debug - User Data:', data);
    console.log('🤖 Total Impact:', data.totalImpact);
    console.log('🤖 Donations Made:', data.donationsMade);
    console.log('🤖 Supported Causes:', data.supportedCauses);
    console.log('🤖 Transactions:', data.transactions);
    
    // Format currency
    const formatINR = (num) => "₹" + Number(num).toLocaleString();
    
    // Greeting
    if (["hi", "hello", "hey", "yo", "hola", "hii", "sup"].some(w => text.includes(w))) {
      return data.username !== "Guest"
        ? `Hey ${data.username}! 👋<br><br>I'm here to help you with:<br>• Your donation history<br>• Impact statistics<br>• Cause information<br>• Transaction details<br><br>What would you like to know?`
        : `Hey there! 👋<br><br>Please connect your MetaMask wallet to see your personalized donation data!`;
    }

    // Check if user is connected
    if (data.username === "Guest") {
      return "⚠️ Please connect your MetaMask wallet first to view your donation data!";
    }

    // Total donations/impact
    if (text.includes("total") || text.includes("how much") || text.includes("donated")) {
      if (data.donationsMade === 0) {
        return "You haven't made any donations yet! 💝<br><br>Check out the amazing causes below and make your first impact!";
      }
      
      return `📊 <strong>Your Impact Summary:</strong><br><br>` +
             `💰 <strong>Total Donations:</strong> ${formatINR(data.totalImpact)}<br>` +
             `🎯 <strong>Donations Made:</strong> ${data.donationsMade}<br>` +
             `❤️ <strong>Lives Impacted:</strong> ${data.livesImpacted.toLocaleString()}<br>` +
             `🌟 <strong>Causes Supported:</strong> ${data.supportedCauses.length}<br><br>` +
             `<span style="color:#10b981;">Amazing work! Every donation counts! 🎉</span>`;
    }

    // Causes supported
    if (text.includes("cause") || text.includes("campaign") || text.includes("support")) {
      if (data.supportedCauses.length === 0) {
        return "You haven't supported any causes yet! 🌱<br><br>Scroll down to explore available causes and make your first donation!";
      }
      
      const causesList = data.supportedCauses.slice(0, 5).map(cause => `• ${cause}`).join('<br>');
      const more = data.supportedCauses.length > 5 ? `<br>...and ${data.supportedCauses.length - 5} more!` : '';
      
      return `🌍 <strong>Causes You Support:</strong><br><br>${causesList}${more}<br><br>` +
             `<span style="color:#8b5cf6;">Thank you for making a difference! 💜</span>`;
    }

    // Recent donations
    if (text.includes("recent") || text.includes("last") || text.includes("latest")) {
      if (data.recentDonations.length === 0) {
        return "No recent donations found. Start making an impact today! 🚀";
      }
      
      const recentList = data.recentDonations.slice(0, 3).map(d => {
        const date = new Date(d.timestamp);
        return `• ${formatINR(d.amount)} to <strong>${d.causeName}</strong><br>  <span style="color:#94a3b8;font-size:12px;">${date.toLocaleDateString()}</span>`;
      }).join('<br><br>');
      
      return `📜 <strong>Recent Donations:</strong><br><br>${recentList}<br><br>` +
             `<span style="color:#10b981;">Keep up the great work! 🌟</span>`;
    }

    // Transaction history
    if (text.includes("transaction") || text.includes("history") || text.includes("receipt")) {
      if (data.transactions.length === 0) {
        return "No transactions yet! Make your first donation to see your transaction history! 💝";
      }
      
      const txCount = data.transactions.length;
      const blockchainCount = data.transactions.filter(t => t.blockchain).length;
      
      return `🔗 <strong>Transaction History:</strong><br><br>` +
             `📊 <strong>Total Transactions:</strong> ${txCount}<br>` +
             `⛓️ <strong>Blockchain Verified:</strong> ${blockchainCount}<br>` +
             `📝 <strong>Demo Mode:</strong> ${txCount - blockchainCount}<br><br>` +
             `You can download receipts from the "Transaction History" section below! 📥`;
    }

    // Impact/stats
    if (text.includes("impact") || text.includes("stat") || text.includes("progress")) {
      if (data.donationsMade === 0) {
        return "Start donating to track your impact! 🌱<br><br>Every contribution makes a difference!";
      }
      
      return `🎯 <strong>Your Impact Stats:</strong><br><br>` +
             `💸 <strong>Total Impact:</strong> ${formatINR(data.totalImpact)}<br>` +
             `🎁 <strong>Donations:</strong> ${data.donationsMade}<br>` +
             `👥 <strong>Lives Impacted:</strong> ${data.livesImpacted.toLocaleString()}<br>` +
             `🌟 <strong>Causes:</strong> ${data.supportedCauses.length}<br><br>` +
             `<span style="color:#ff006e;">You're a champion! 🏆</span>`;
    }

    // Profile info
    if (text.includes("profile") || text.includes("my info") || text.includes("account")) {
      return `👤 <strong>Your Profile:</strong><br><br>` +
             `📛 <strong>Name:</strong> ${data.username}<br>` +
             `📧 <strong>Email:</strong> ${data.email || 'Not set'}<br>` +
             `💼 <strong>Wallet:</strong> ${data.walletAddress.slice(0, 10)}...${data.walletAddress.slice(-8)}<br><br>` +
             `<span style="color:#8b5cf6;">Click your name in the dashboard to edit your profile! ✏️</span>`;
    }

    // Blockchain info
    if (text.includes("blockchain") || text.includes("verify") || text.includes("proof")) {
      const blockchainTxs = data.transactions.filter(t => t.blockchain);
      
      if (blockchainTxs.length === 0) {
        return `🔗 <strong>Blockchain Integration:</strong><br><br>` +
               `Your donations are currently in demo mode.<br><br>` +
               `To enable REAL blockchain verification:<br>` +
               `1. Start Anvil (local blockchain)<br>` +
               `2. Donations will be verified on-chain<br>` +
               `3. Get permanent blockchain receipts!<br><br>` +
               `<span style="color:#10b981;">Check BLOCKCHAIN_INTEGRATION.md for setup! 📚</span>`;
      }
      
      return `⛓️ <strong>Blockchain Verified Donations:</strong><br><br>` +
             `✅ ${blockchainTxs.length} of your donations are permanently recorded on the blockchain!<br><br>` +
             `Your donations have real transaction hashes and can be verified by anyone. That's true transparency! 🌟`;
    }

    // Help
    if (text.includes("help") || text.includes("what can") || text.includes("command")) {
      return `🤖 <strong>I can help you with:</strong><br><br>` +
             `💰 <strong>"total donations"</strong> - See your impact summary<br>` +
             `🌍 <strong>"causes"</strong> - View supported causes<br>` +
             `📜 <strong>"recent"</strong> - Check recent donations<br>` +
             `🔗 <strong>"transactions"</strong> - View transaction history<br>` +
             `📊 <strong>"impact"</strong> - See your stats<br>` +
             `👤 <strong>"profile"</strong> - View account info<br>` +
             `⛓️ <strong>"blockchain"</strong> - Blockchain verification info<br><br>` +
             `Just ask naturally! I understand context! 😊`;
    }

    // Thank you
    if (text.includes("thank") || text.includes("thanks") || text.includes("awesome")) {
      return `You're most welcome! 💙<br><br>Every donation you make creates real impact. Thank you for being part of ImpactEcho! 🌟`;
    }

    // Goodbye
    if (text.includes("bye") || text.includes("see you") || text.includes("goodbye")) {
      return `Goodbye! 👋 Keep making a difference! Your impact matters! 💜<br><br>Come back anytime you need help!`;
    }

    // Fallback responses with context
    const fallbacks = [
      `Hmm, I'm not sure about that. Try asking about:<br>• Your donations<br>• Causes you support<br>• Transaction history<br>• Your impact stats`,
      `I didn't quite catch that! 🤔<br><br>I can help you with donation info, causes, transactions, and more. Just ask!`,
      `Not sure I understood that. Type <strong>"help"</strong> to see what I can do! 💡`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
});
