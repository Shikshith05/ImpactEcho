/* ImpactEcho Dashboard — fully dynamic from backend */

const walletAddress = localStorage.getItem('walletAddress') || "";

// Get user profile (name/email) if available
function getUserProfile(walletAddress) {
  const profileKey = `userProfile_${walletAddress}`;
  const profile = localStorage.getItem(profileKey);
  return profile ? JSON.parse(profile) : null;
}

const userProfile = getUserProfile(walletAddress);

// Use profile name if available, otherwise wallet address
// Make user global so chatbot can access it
window.user = { 
  username: userProfile && userProfile.name ? userProfile.name : (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Guest"),
  walletAddress: walletAddress,
  email: userProfile ? userProfile.email : ""
};
const user = window.user;
const livesPer25 = 25;

/* --- DOM References --- */
const usernameBanner = document.getElementById("username-banner");
const welcomeInline = document.getElementById("welcomeInline");
const usernameInput = document.getElementById("usernameInput");
const causesGrid = document.getElementById("causesGrid");
const totalImpactEl = document.getElementById("totalImpact");
const donationsMadeEl = document.getElementById("donationsMade");
const causesSupportedEl = document.getElementById("causesSupported");
const livesImpactedEl = document.getElementById("livesImpacted");
const impactProgressBar = document.getElementById("impactProgressBar");
const impactPercent = document.getElementById("impactPercent");
const recentList = document.getElementById("recentList");

/* --- State --- */
let causes = [];
// Make these global so chatbot can access them
window.totalImpact = 0;
window.donationsMade = 0;
window.livesImpacted = 0;
window.supportedCauses = new Set();
window.recentDonations = [];
let selectedCause = null; // For confirmation modal

// Convenience accessors
const getTotalImpact = () => window.totalImpact;
const getDonationsMade = () => window.donationsMade;
const getLivesImpacted = () => window.livesImpacted;
const getSupportedCauses = () => window.supportedCauses;
const getRecentDonations = () => window.recentDonations;

/* --- User Data Persistence Functions --- */
function getUserDataKey() {
  return `userData_${user.walletAddress}`;
}

function saveUserData() {
  if (!user.walletAddress) return;
  
  const userData = {
    totalImpact: window.totalImpact,
    donationsMade: window.donationsMade,
    livesImpacted: window.livesImpacted,
    supportedCauses: Array.from(window.supportedCauses),
    recentDonations: window.recentDonations,
    lastUpdated: new Date().toISOString()
  };
  
  localStorage.setItem(getUserDataKey(), JSON.stringify(userData));
}

function loadUserData() {
  if (!user.walletAddress) return;
  
  const savedData = localStorage.getItem(getUserDataKey());
  if (savedData) {
    try {
      const userData = JSON.parse(savedData);
      // Update global window variables for chatbot access
      window.totalImpact = userData.totalImpact || 0;
      window.donationsMade = userData.donationsMade || 0;
      window.livesImpacted = userData.livesImpacted || 0;
      
      // Restore supportedCauses Set
      if (userData.supportedCauses) {
        window.supportedCauses.clear();
        userData.supportedCauses.forEach(id => window.supportedCauses.add(id));
      }
      
      // Restore recentDonations array
      if (userData.recentDonations) {
        window.recentDonations.length = 0;
        window.recentDonations.push(...userData.recentDonations);
      }
      
      // Update UI with loaded data
      updateStats();
      renderRecentDonations();
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }
}

/* --- Helper Functions --- */
const formatINR = (num) => "₹" + Number(num).toLocaleString();

/* --- Username Logic --- */
function renderUsername() {
  usernameBanner.textContent = user.username;
  welcomeInline.textContent = user.username;
  
  // Show user's name or wallet address in the input field
  if (userProfile && userProfile.name) {
    usernameInput.value = userProfile.name;
  } else {
    usernameInput.value = user.walletAddress || "Not Connected";
  }
  
  usernameInput.readOnly = true;
  usernameInput.style.cursor = "not-allowed";
  usernameInput.style.opacity = "0.7";
  usernameInput.placeholder = "Click to edit profile";
  
  // Add click handler to edit profile
  usernameInput.onclick = () => {
    showEditProfileModal();
  };
  usernameInput.style.cursor = "pointer";
  
  // Render badge after username
  renderBadge();
}

/* --- Badge System --- */
const BADGE_RANKS = [
  { name: 'Bronze Guardian', icon: '🥉', threshold: 10000, class: 'badge-bronze', color: '#CD7F32' },
  { name: 'Silver Benefactor', icon: '🥈', threshold: 50000, class: 'badge-silver', color: '#C0C0C0' },
  { name: 'Gold Philanthropist', icon: '🥇', threshold: 150000, class: 'badge-gold', color: '#FFD700' },
  { name: 'Platinum Champion', icon: '💎', threshold: 500000, class: 'badge-platinum', color: '#E5E4E2' },
  { name: 'Diamond Legend', icon: '👑', threshold: 1000000, class: 'badge-diamond', color: '#00d4ff' }
];

function getBadgeRank(totalDonations) {
  for (let i = BADGE_RANKS.length - 1; i >= 0; i--) {
    if (totalDonations >= BADGE_RANKS[i].threshold) {
      return BADGE_RANKS[i];
    }
  }
  return null; // No badge yet
}

function renderBadge() {
  const badgeContainer = document.getElementById('userBadge');
  if (!badgeContainer) return;
  
  const totalDonations = window.totalImpact || 0;
  const currentBadge = getBadgeRank(totalDonations);
  
  if (currentBadge) {
    // Render current badge with info button
    badgeContainer.innerHTML = `
      <div class="rank-badge ${currentBadge.class}">
        <span class="badge-icon">${currentBadge.icon}</span>
        <span class="badge-name">${currentBadge.name}</span>
      </div>
      <div class="badge-info-btn">i</div>
      <div class="badge-tooltip">
        <h4>🏆 Donor Rank System</h4>
        <div class="badge-criteria">
          ${BADGE_RANKS.map((rank, index) => {
            const isAchieved = totalDonations >= rank.threshold;
            const isCurrent = rank.name === currentBadge.name;
            const progress = Math.min((totalDonations / rank.threshold) * 100, 100);
            
            return `
              <div class="criteria-item ${rank.class.replace('badge-', '')}" style="opacity: ${isAchieved ? 1 : 0.6};">
                <span class="criteria-icon">${rank.icon}</span>
                <div style="flex: 1;">
                  <div class="criteria-text">
                    <strong style="color: ${rank.color};">${rank.name}</strong>
                    ${isCurrent ? '<span style="color:#00ff87;"> ✓ Current</span>' : ''}
                    ${!isAchieved && index > 0 ? '<span style="color:#ff006e;"> 🔒 Locked</span>' : ''}
                  </div>
                  ${!isAchieved ? `
                    <div style="margin-top:4px;width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
                      <div style="width:${progress}%;height:100%;background:${rank.color};"></div>
                    </div>
                  ` : ''}
                </div>
                <span class="criteria-amount">${formatINR(rank.threshold)}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(139,92,246,0.3);text-align:center;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Your Progress: <strong style="color:#00ff87;">${formatINR(totalDonations)}</strong>
          </p>
        </div>
      </div>
    `;
  } else {
    // No badge yet - show progress to first badge
    const firstBadge = BADGE_RANKS[0];
    const progress = (totalDonations / firstBadge.threshold) * 100;
    const remaining = firstBadge.threshold - totalDonations;
    
    badgeContainer.innerHTML = `
      <div class="rank-badge" style="background:rgba(139,92,246,0.2);border:2px dashed #8b5cf6;animation:none;">
        <span class="badge-icon">🎯</span>
        <span class="badge-name">New Donor</span>
      </div>
      <div class="badge-info-btn">i</div>
      <div class="badge-tooltip">
        <h4>🏆 Donor Rank System</h4>
        <p style="color:#94a3b8;font-size:13px;margin-bottom:16px;">
          Earn badges by making donations! Your first rank is just <strong style="color:#00ff87;">${formatINR(remaining)}</strong> away!
        </p>
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:12px;color:#94a3b8;">Progress to ${firstBadge.icon} ${firstBadge.name}</span>
            <span style="font-size:12px;color:#fff;font-weight:700;">${progress.toFixed(1)}%</span>
          </div>
          <div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
            <div style="width:${progress}%;height:100%;background:linear-gradient(90deg, #ff006e 0%, #8b5cf6 100%);transition:width 0.5s ease;"></div>
          </div>
        </div>
        <div class="badge-criteria">
          ${BADGE_RANKS.map(rank => `
            <div class="criteria-item ${rank.class.replace('badge-', '')}" style="opacity: 0.6;">
              <span class="criteria-icon">${rank.icon}</span>
              <div class="criteria-text"><strong style="color: ${rank.color};">${rank.name}</strong></div>
              <span class="criteria-amount">${formatINR(rank.threshold)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

/* --- Fetch Causes from Backend --- */
async function fetchCauses() {
  try {
    const res = await fetch("/causes");
    const data = await res.json();
    causes = data;
    renderCauses();
    updateStats();
  } catch (err) {
    console.error("Error fetching causes:", err);
    causesGrid.innerHTML = "<p class='muted'>Unable to load causes at the moment.</p>";
  }
}

/* --- Render Causes with Smooth Animations --- */
function renderCauses() {
  causesGrid.innerHTML = "";
  causes.forEach((cause, index) => {
    const percent = Math.min((cause.raised / cause.goal) * 100, 100).toFixed(1);
    const remaining = Math.max(0, cause.goal - cause.raised);
    const isFullyFunded = remaining <= 0;
    
    const card = document.createElement("div");
    card.className = "cause-card card";
    card.style.animationDelay = `${index * 0.1}s`;
    
    const buttonHTML = isFullyFunded 
      ? `<button class="fund-btn" data-id="${cause.id}" style="background:#00ff87;cursor:not-allowed;" disabled>✅ Goal Reached!</button>`
      : `<button class="fund-btn" data-id="${cause.id}">Fund Cause</button>`;
    
    const statusText = isFullyFunded
      ? `<p class="muted small" style="color:#00ff87;font-weight:600;">🎉 ${formatINR(cause.raised)} raised - Goal reached!</p>`
      : `<p class="muted small">${formatINR(cause.raised)} raised of ${formatINR(cause.goal)} <span style="color:#ff006e;">(₹${remaining} remaining)</span></p>`;
    
    const ngoLabel = cause.ngo_name ? `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span style="background:linear-gradient(135deg,#8b5cf6,#ff006e);padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;">🏢 ${cause.ngo_name}</span>
      </div>
    ` : '';
    
    card.innerHTML = `
      <img src="${cause.image}" alt="${cause.title}" class="cause-img">
      ${ngoLabel}
      <h3>${cause.title}</h3>
      <p style="font-size:14px;line-height:1.6;color:#94a3b8;">${cause.description}</p>
      <div class="progress-wrap-small">
        <div class="progress-small-fill" style="width:0%;"></div>
      </div>
      ${statusText}
      ${buttonHTML}
    `;
    causesGrid.appendChild(card);
    
    // Animate progress bar with delay
    setTimeout(() => {
      const progressBar = card.querySelector('.progress-small-fill');
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }
    }, 100 + (index * 100));
  });

  document.querySelectorAll(".fund-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", handleFundClick);
  });

  causesSupportedEl.textContent = supportedCauses.size;
}

/* --- Handle Funding - Show Modal --- */
async function handleFundClick(e) {
  const button = e.target;
  const id = Number(button.getAttribute("data-id"));
  selectedCause = causes.find((c) => c.id === id);
  
  const goal = selectedCause.goal || 0;
  const raised = selectedCause.raised || 0;
  const remaining = Math.max(0, goal - raised);
  
  // Show modal
  document.getElementById('fundingModal').style.display = 'block';
  
  // Set cause name with NGO label if available
  const causeNameEl = document.getElementById('modalCauseName');
  if (selectedCause.ngo_name) {
    causeNameEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <span style="font-size:12px;color:#8b5cf6;font-weight:600;">🏢 ${selectedCause.ngo_name}</span>
        <span>${selectedCause.title}</span>
      </div>
    `;
  } else {
    causeNameEl.textContent = selectedCause.title;
  }
  
  document.getElementById('modalWallet').textContent = user.walletAddress || "Not connected";
  document.getElementById('modalGoal').textContent = formatINR(goal);
  document.getElementById('modalRaised').textContent = formatINR(raised);
  document.getElementById('modalRemaining').textContent = formatINR(remaining);
  document.getElementById('donationAmount').value = '';
  document.getElementById('donationAmount').max = remaining; // Set max attribute
  document.getElementById('modalAmount').textContent = '₹0';
  document.getElementById('modalImpact').textContent = '0 lives';
  document.getElementById('confirmCheckbox').checked = false;
  document.getElementById('confirmBtn').disabled = true;
  document.getElementById('donationError').style.display = 'none';
  
  // Check if cause is fully funded
  if (remaining <= 0) {
    document.getElementById('donationAmount').disabled = true;
    document.getElementById('donationAmount').placeholder = 'Goal already reached!';
    document.getElementById('donationError').textContent = '✅ This cause has reached its funding goal!';
    document.getElementById('donationError').style.color = '#00ff87';
    document.getElementById('donationError').style.display = 'block';
  } else {
    document.getElementById('donationAmount').disabled = false;
    document.getElementById('donationAmount').placeholder = `Max: ₹${remaining}`;
  }
}

/* --- Close Modal --- */
function closeFundingModal() {
  document.getElementById('fundingModal').style.display = 'none';
  selectedCause = null;
}

/* --- Handle Amount Input --- */
document.addEventListener('DOMContentLoaded', () => {
  const amountInput = document.getElementById('donationAmount');
  const confirmCheckbox = document.getElementById('confirmCheckbox');
  const confirmBtn = document.getElementById('confirmBtn');
  
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      const amount = Number(e.target.value);
      const errorDiv = document.getElementById('donationError');
      
      if (amount > 0) {
        document.getElementById('modalAmount').textContent = formatINR(amount);
        const lives = Math.floor(amount / livesPer25);
        document.getElementById('modalImpact').textContent = `~${lives} ${lives === 1 ? 'life' : 'lives'} impacted`;
        
        // Validate against remaining amount
        if (selectedCause) {
          const goal = selectedCause.goal || 0;
          const raised = selectedCause.raised || 0;
          const remaining = Math.max(0, goal - raised);
          
          if (amount > remaining) {
            errorDiv.textContent = `⚠️ Amount exceeds remaining limit! Maximum: ₹${remaining}`;
            errorDiv.style.color = '#ff006e';
            errorDiv.style.display = 'block';
          } else {
            errorDiv.style.display = 'none';
          }
        }
      } else {
        document.getElementById('modalAmount').textContent = '₹0';
        document.getElementById('modalImpact').textContent = '0 lives';
        errorDiv.style.display = 'none';
      }
      updateConfirmButton();
    });
  }
  
  if (confirmCheckbox) {
    confirmCheckbox.addEventListener('change', updateConfirmButton);
  }
});

function updateConfirmButton() {
  const amount = Number(document.getElementById('donationAmount').value);
  const checked = document.getElementById('confirmCheckbox').checked;
  
  // Check if amount exceeds remaining
  let isValid = amount > 0 && checked;
  if (selectedCause && amount > 0) {
    const goal = selectedCause.goal || 0;
    const raised = selectedCause.raised || 0;
    const remaining = Math.max(0, goal - raised);
    if (amount > remaining) {
      isValid = false;
    }
  }
  
  document.getElementById('confirmBtn').disabled = !isValid;
}

/* --- Confirm Donation --- */
async function confirmDonation() {
  const amount = Number(document.getElementById('donationAmount').value);
  if (!amount || amount <= 0 || !selectedCause) return;
  
  // Final validation against remaining amount
  const goal = selectedCause.goal || 0;
  const raised = selectedCause.raised || 0;
  const remaining = Math.max(0, goal - raised);
  
  if (amount > remaining) {
    alert(`❌ Donation amount (₹${amount}) exceeds the remaining needed amount (₹${remaining}). Please enter a valid amount.`);
    return;
  }
  
  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = '⏳ Processing Blockchain Transaction...';
  
  let blockchainTxHash = null;
  let blockchainSuccess = false;
  
  try {
    // 🔥 TRY REAL BLOCKCHAIN DONATION FIRST
    if (window.blockchainService && window.ethereum) {
      try {
        confirmBtn.textContent = '🔗 Connecting to Blockchain...';
        
        // Initialize blockchain service if not already done
        if (!window.blockchainService.initialized) {
          await window.blockchainService.initialize();
        }
        
        confirmBtn.textContent = '💰 Sending ETH Transaction...';
        
        // Make REAL blockchain donation
        const txResult = await window.blockchainService.donate(amount, selectedCause.title);
        
        blockchainSuccess = true;
        blockchainTxHash = txResult.txHash;
        
        console.log('✅ REAL BLOCKCHAIN DONATION SUCCESSFUL!');
        console.log('Transaction Hash:', blockchainTxHash);
        console.log('Block Number:', txResult.blockNumber);
        console.log('Gas Used:', txResult.gasUsed);
        
      } catch (blockchainError) {
        console.warn('⚠️  Blockchain transaction failed:', blockchainError.message);
        console.log('📝 Falling back to simulated donation for demo purposes');
        
        // If user rejected or insufficient funds, show specific message
        if (blockchainError.message.includes('rejected')) {
          throw new Error('❌ Transaction rejected. Please try again.');
        }
        if (blockchainError.message.includes('Insufficient')) {
          throw new Error('❌ Insufficient ETH balance in wallet.');
        }
      }
    } else {
      console.log('📝 Blockchain service not available, using simulated donation');
    }
    
    // Update locally (whether blockchain succeeded or not)
    confirmBtn.textContent = '💾 Saving Transaction...';
    
    selectedCause.raised += amount;
    window.totalImpact += amount;
    window.donationsMade++;
    window.livesImpacted += Math.floor(amount / livesPer25);
    window.supportedCauses.add(selectedCause.title);
    
    // Create transaction record
    const transaction = {
      id: Date.now(),
      cause: selectedCause.title,
      amount: amount,
      timestamp: new Date().toISOString(),
      wallet: user.walletAddress,
      status: blockchainSuccess ? 'confirmed' : 'completed',
      txHash: blockchainTxHash,
      blockchain: blockchainSuccess
    };
    
    // Store transaction (wallet-specific)
    const transactionKey = `transactions_${user.walletAddress}`;
    const transactions = JSON.parse(localStorage.getItem(transactionKey) || '[]');
    transactions.unshift(transaction);
    localStorage.setItem(transactionKey, JSON.stringify(transactions));
    
    // Log donation to backend
    try {
      await fetch('/api/log-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: user.walletAddress,
          cause_title: selectedCause.title,
          cause_id: selectedCause.id,
          amount: amount,
          tx_hash: blockchainTxHash,
          blockchain: blockchainSuccess
        })
      });
    } catch (err) {
      console.error('Error logging donation:', err);
    }
    
    // Refresh causes from backend to get latest data
    await fetchCauses();
    
    // Update UI
    renderCauses();
    updateStats();
    addRecentDonation(selectedCause.title, amount);
    renderTransactionHistory();
    
    // Close modal and show success
    closeFundingModal();
    
    // Show appropriate success message
    if (blockchainSuccess) {
      alert(`✅ REAL BLOCKCHAIN DONATION SUCCESSFUL!\n\n💰 Amount: ₹${amount}\n🔗 Transaction Hash: ${blockchainTxHash.substring(0, 10)}...\n📦 Verified on blockchain!\n\n📥 Receipt available in Transaction History.`);
    } else {
      alert('✅ Donation successful! Receipt available in Transaction History.\n\n(Demo mode: Enable local blockchain for real transactions)');
    }
    
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Transaction';
    
  } catch (error) {
    console.error('❌ Donation failed:', error);
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Transaction';
    alert(error.message || '❌ Donation failed. Please try again.');
  }
}

/* --- Stats Update with Smooth Animations --- */
function updateStats() {
  // Animate number changes
  animateNumber(totalImpactEl, window.totalImpact, formatINR);
  animateNumber(donationsMadeEl, window.donationsMade);
  animateNumber(livesImpactedEl, window.livesImpacted);
  causesSupportedEl.textContent = window.supportedCauses.size;

  const avgProgress =
    causes.reduce((sum, c) => sum + (c.raised / c.goal) * 100, 0) / causes.length || 0;
  const percent = Math.min(avgProgress, 100).toFixed(1);
  
  // Smooth progress bar animation
  setTimeout(() => {
    impactProgressBar.style.width = `${percent}%`;
    impactPercent.textContent = `${percent}%`;
  }, 100);
  
  // Update badge based on new total
  renderBadge();
  
  // Save user data whenever stats are updated
  saveUserData();
}

/* --- Animate Numbers --- */
function animateNumber(element, targetValue, formatter = null) {
  const currentValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
  const duration = 800;
  const steps = 30;
  const increment = (targetValue - currentValue) / steps;
  let current = currentValue;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    current += increment;
    
    if (step >= steps) {
      current = targetValue;
      clearInterval(timer);
    }
    
    element.textContent = formatter ? formatter(Math.floor(current)) : Math.floor(current);
  }, duration / steps);
}

/* --- Recent Donations with Animation --- */
function addRecentDonation(title, amount) {
  // Remove "No donations yet" message if present
  const noDonatonsMsg = recentList.querySelector('.muted');
  if (noDonatonsMsg) {
    noDonatonsMsg.remove();
  }

  const li = document.createElement("li");
  li.textContent = `Funded ${formatINR(amount)} to "${title}"`;
  li.style.animation = 'none';
  recentList.prepend(li);
  
  // Add to recentDonations array
  window.recentDonations.unshift({ causeName: title, amount: amount, timestamp: new Date().toISOString() });
  if (window.recentDonations.length > 6) {
    window.recentDonations.pop();
  }
  
  // Trigger animation
  setTimeout(() => {
    li.style.animation = '';
  }, 10);

  if (recentList.children.length > 6) {
    const lastItem = recentList.lastChild;
    lastItem.style.transition = 'all 0.3s ease';
    lastItem.style.opacity = '0';
    lastItem.style.transform = 'translateX(-20px)';
    setTimeout(() => {
      recentList.removeChild(lastItem);
    }, 300);
  }
  
  // Save user data whenever recent donations are updated
  saveUserData();
}

/* --- Render Recent Donations from Saved Data --- */
function renderRecentDonations() {
  if (!window.recentDonations || window.recentDonations.length === 0) {
    return; // Keep default "No donations yet" message
  }
  
  // Remove "No donations yet" message
  const noDonatonsMsg = recentList.querySelector('.muted');
  if (noDonatonsMsg) {
    noDonatonsMsg.remove();
  }
  
  // Clear list
  recentList.innerHTML = '';
  
  // Render saved donations
  window.recentDonations.forEach(donation => {
    const li = document.createElement("li");
    li.textContent = `Funded ${formatINR(donation.amount)} to "${donation.causeName}"`;
    recentList.appendChild(li);
  });
}

/* --- Add Success Animation to Donation --- */
function showSuccessAnimation(button) {
  const originalText = button.textContent;
  button.textContent = '✓ Funded!';
  button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  
  setTimeout(() => {
    button.textContent = originalText;
  }, 2000);
}

/* --- Logout Functionality --- */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      // Clear session storage (temporary data)
      sessionStorage.clear();
      
      // Keep all user data for all wallets (keys starting with 'transactions_', 'userData_', or 'userProfile_')
      const itemsToKeep = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('transactions_') || key.startsWith('userData_') || key.startsWith('userProfile_'))) {
          itemsToKeep[key] = localStorage.getItem(key);
        }
      }
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore all transaction histories
      Object.keys(itemsToKeep).forEach(key => {
        localStorage.setItem(key, itemsToKeep[key]);
      });
      
      // Request MetaMask to disconnect (revoke permissions)
      if (window.ethereum && window.ethereum.request) {
        try {
          // This will prompt user to disconnect on next connection
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }]
          });
        } catch (err) {
          console.log('MetaMask disconnect:', err.message);
        }
      }
      
      // Redirect to logout endpoint
      window.location.href = "/donator-logout";
      
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: just redirect
      window.location.href = "/donator-logout";
    }
  });
}

/* --- Transaction History --- */
function getTransactionKey() {
  // Get wallet-specific key for transactions
  return `transactions_${user.walletAddress}`;
}

function renderTransactionHistory() {
  const transactions = JSON.parse(localStorage.getItem(getTransactionKey()) || '[]');
  const container = document.getElementById('transactionList');
  
  if (transactions.length === 0) {
    container.innerHTML = '<p class="muted">No transactions yet</p>';
    return;
  }
  
  container.innerHTML = transactions.map(t => {
    const date = new Date(t.timestamp);
    const blockchainBadge = t.blockchain ? 
      `<span style="background:#10b981;color:white;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;display:inline-block;margin-left:8px;">⛓️ BLOCKCHAIN VERIFIED</span>` : 
      `<span style="background:#6b7280;color:white;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;display:inline-block;margin-left:8px;">📝 DEMO MODE</span>`;
    
    const txHashInfo = t.txHash ? 
      `<div class="transaction-meta" style="color:#10b981;font-family:monospace;font-size:11px;">
        Tx: ${t.txHash.slice(0, 16)}...${t.txHash.slice(-10)}
      </div>` : '';
    
    return `
      <div class="transaction-item">
        <div class="transaction-info">
          <h4>${t.cause} ${blockchainBadge}</h4>
          <div class="transaction-meta">
            ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}
          </div>
          <div class="transaction-meta">
            Wallet: ${t.wallet.slice(0, 10)}...${t.wallet.slice(-8)}
          </div>
          ${txHashInfo}
          <div class="transaction-actions">
            <button class="btn-receipt" onclick="downloadReceipt(${t.id})">📥 Download Receipt</button>
          </div>
        </div>
        <div class="transaction-amount">${formatINR(t.amount)}</div>
      </div>
    `;
  }).join('');
}

/* --- Receipt Generation --- */
function downloadReceipt(transactionId) {
  const transactions = JSON.parse(localStorage.getItem(getTransactionKey()) || '[]');
  const transaction = transactions.find(t => t.id === transactionId);
  
  if (!transaction) {
    alert('Transaction not found');
    return;
  }
  
  const date = new Date(transaction.timestamp);
  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ImpactEcho - Donation Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #8b5cf6;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #ff006e 0%, #8b5cf6 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .logo {
      width: 160px;
      height: 160px;
      margin: 0 auto 20px;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
    }
    .header h1 {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    .receipt-body {
      padding: 40px;
    }
    .receipt-title {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #8b5cf6;
    }
    .receipt-title h2 {
      font-size: 28px;
      color: #1a0b2e;
      margin-bottom: 8px;
    }
    .receipt-number {
      color: #8b5cf6;
      font-weight: 700;
      font-family: monospace;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin: 30px 0;
    }
    .info-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #8b5cf6;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .info-value {
      font-size: 16px;
      color: #1a0b2e;
      font-weight: 600;
      word-break: break-all;
    }
    .amount-section {
      background: linear-gradient(135deg, #8b5cf6 0%, #ff006e 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .amount-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .amount-value {
      font-size: 48px;
      font-weight: 900;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #e0e0e0;
    }
    .footer p {
      color: #666;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .thank-you {
      font-size: 24px;
      color: #8b5cf6;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .verification {
      margin-top: 20px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px dashed #8b5cf6;
    }
    .verification-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    .verification-id {
      font-family: monospace;
      color: #1a0b2e;
      font-weight: 700;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <img src="${window.location.origin}/static/logo.png" alt="ImpactEcho" class="logo">
      <h1>ImpactEcho</h1>
      <p>Amplifying Generosity Worldwide</p>
    </div>
    
    <div class="receipt-body">
      <div class="receipt-title">
        <h2>Donation Receipt</h2>
        <p class="receipt-number">Receipt #${transaction.id}</p>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <div class="info-label">Transaction Date</div>
          <div class="info-value">${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        
        <div class="info-section">
          <div class="info-label">Transaction Time</div>
          <div class="info-value">${date.toLocaleTimeString('en-US')}</div>
        </div>
        
        <div class="info-section">
          <div class="info-label">Cause/Project</div>
          <div class="info-value">${transaction.cause}</div>
        </div>
        
        <div class="info-section">
          <div class="info-label">Transaction Status</div>
          <div class="info-value">✅ ${transaction.status.toUpperCase()}</div>
        </div>
      </div>
      
      <div class="info-section" style="grid-column: 1 / -1; margin: 20px 0;">
        <div class="info-label">Donor Wallet Address</div>
        <div class="info-value">${transaction.wallet}</div>
      </div>
      
      <div class="amount-section">
        <div class="amount-label">Total Donation Amount</div>
        <div class="amount-value">${formatINR(transaction.amount)}</div>
      </div>
      
      ${transaction.blockchain && transaction.txHash ? `
      <div style="background:#10b981;color:white;padding:20px;border-radius:12px;margin:20px 0;text-align:center;">
        <div style="font-size:20px;font-weight:700;margin-bottom:10px;">⛓️ BLOCKCHAIN VERIFIED DONATION</div>
        <div style="font-size:13px;opacity:0.95;margin-bottom:15px;">This transaction has been permanently recorded on the blockchain</div>
        <div style="background:rgba(255,255,255,0.2);padding:15px;border-radius:8px;font-family:monospace;word-break:break-all;font-size:12px;">
          <div style="font-weight:700;margin-bottom:5px;">Transaction Hash:</div>
          ${transaction.txHash}
        </div>
      </div>
      ` : `
      <div style="background:#6b7280;color:white;padding:15px;border-radius:12px;margin:20px 0;text-align:center;font-size:13px;">
        📝 Demo Mode - Enable local blockchain for verified transactions
      </div>
      `}
      
      <div class="verification">
        <div class="verification-label">Receipt ID:</div>
        <div class="verification-id">${transaction.id}-${Date.now().toString(36)}</div>
      </div>
    </div>
    
    <div class="footer">
      <p class="thank-you">Thank You for Your Generosity! 🙏</p>
      <p>Your contribution will make a real difference in someone's life.</p>
      ${transaction.blockchain ? '<p style="margin-top:15px;font-weight:600;color:#10b981;">✅ This donation is cryptographically verified on the blockchain</p>' : ''}
      <p style="margin-top: 20px; font-size: 12px;">This receipt is electronically generated and valid without signature.</p>
      <p style="font-size: 12px; margin-top: 4px;">© ${new Date().getFullYear()} ImpactEcho · All rights reserved</p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Create blob and download
  const blob = new Blob([receiptHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ImpactEcho-Receipt-${transaction.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert('✅ Receipt downloaded! Open the HTML file in your browser to view or print.');
}

/* --- Profile Management --- */
function showEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (!modal) {
    alert('Profile editing not available on this page');
    return;
  }
  
  // Pre-fill with current profile data
  const profile = getUserProfile(user.walletAddress);
  if (profile) {
    document.getElementById('editProfileName').value = profile.name || '';
    document.getElementById('editProfileEmail').value = profile.email || '';
  }
  
  modal.style.display = 'flex';
}

function closeEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function saveUserProfile(walletAddress, name, email) {
  const profileKey = `userProfile_${walletAddress}`;
  const profile = {
    name: name,
    email: email || '',
    walletAddress: walletAddress,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(profileKey, JSON.stringify(profile));
  return profile;
}

function updateProfile() {
  const nameInput = document.getElementById('editProfileName');
  const emailInput = document.getElementById('editProfileEmail');
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  
  if (!name) {
    alert('Please enter your name');
    return;
  }
  
  // Save profile
  saveUserProfile(user.walletAddress, name, email);
  
  // Update display
  user.username = name;
  user.email = email;
  renderUsername();
  
  // Close modal
  closeEditProfileModal();
  
  alert(`✅ Profile updated successfully!`);
  
  // Reload page to reflect changes everywhere
  setTimeout(() => location.reload(), 500);
}

/* --- Initialize --- */
function init() {
  renderUsername();
  loadUserData(); // Load saved user data first
  fetchCauses();
  renderTransactionHistory();
}

document.addEventListener("DOMContentLoaded", init);

