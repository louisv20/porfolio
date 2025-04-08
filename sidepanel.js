// sidepanel.js  
marked.setOptions({ headerIds: false, mangle: false, breaks: true, gfm: true, sanitize: true }); 

function getStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

const getWelcomeMessage = (lang = 'en') => lang === 'es'  
  ? `¡Bienvenido! 🌟\n\nSoy tu asistente de navegador. Puedo resumir videos, abrir sitios web, redactar correos o responder preguntas. Prueba:\n- "Resume este video"\n- "Abre [sitio]"\n- "Redacta un correo a [destinatario]"\n- "Responde al último correo"\n\n¿Cómo te ayudo hoy? (For English, type "english")`  
  : `Welcome! 🌟\n\nI'm your browser assistant. I can summarize videos, open websites, compose emails, or answer questions. Try:\n- "Summarize this video"\n- "Open [site]"\n- "Compose an email to [recipient]"\n- "Reply to my last email"\n\nHow can I help you today? (Para español, escribe "español")`;  

const addMessage = (chatbox, message, isUser, isStreaming = false, isThinking = false) => {  
  let div;  

  if (isThinking) {  
    div = document.createElement('div');  
    div.classList.add('message', 'assistant-message', 'thinking-message');  
    div.innerHTML = '<div class="thinking-container"><div class="spinner"></div><em>Thinking...</em></div>';  
    chatbox.appendChild(div);  
  } else if (isStreaming) {  
    div = chatbox.querySelector('.streaming-message');  
    if (!div) {  
      div = document.createElement('div');  
      div.classList.add('message', 'assistant-message', 'streaming-message');  
      div.style.visibility = 'visible';  
      chatbox.appendChild(div);  
    }  
    div.innerHTML = marked.parse(message);  
    div.offsetHeight;  
  } else {  
    div = document.createElement('div');  
    div.classList.add('message', isUser ? 'user-message' : 'assistant-message');  
    div.innerHTML = marked.parse(message);  
    chatbox.appendChild(div);  
  }  

  return div;  
};  

const debounce = (func, wait) => {  
  let timeout;  
  return (...args) => {  
    clearTimeout(timeout);  
    timeout = setTimeout(() => func(...args), wait);  
  };  
};  

let conversationHistory = [];  
const MAX_MESSAGES = 15;  

const truncateHistory = (history) => {  
  if (history.length > MAX_MESSAGES) {  
    return history.slice(-MAX_MESSAGES);  
  }  
  return history;  
};  

// Get device data for fingerprinting  
const getDeviceData = async () => {  
  return {  
    userAgent: navigator.userAgent,  
    language: navigator.language,  
    platform: navigator.platform,  
    screenWidth: window.screen.width,  
    screenHeight: window.screen.height,  
    screenDepth: window.screen.colorDepth,  
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,  
    plugins: Array.from(navigator.plugins).map(p => p.name).join(',')  
  };  
};  

// Check if user has access  
const checkAccess = async () => {  
  try {  
    // Get device information for fingerprinting  
    const deviceData = await getDeviceData();  
    
    // Send device data to server for validation  
    const response = await fetch('https://luisgcastro.com/.netlify/functions/validateAccess/validateAccess', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({  
        deviceData  
      })  
    });  
    
    const data = await response.json();  
    
    return {   
      hasAccess: data.valid,   
      purchaseDate: data.purchaseDate,  
      isTrial: data.is_trial || false,  
      trialExpiry: data.trial_expiry || null,  
      trialCancelled: data.trial_cancelled || false,  
      error: data.error  
    };  
  } catch (error) {  
    console.error('Access validation error:', error);  
    return { hasAccess: false, error: 'Failed to validate access' };  
  }  
};  

// Open payment page for new purchases (not upgrades)
const openPaymentPage = async () => {  
  try {  
    console.log('openPaymentPage function called');
    // Show loading screen  
    document.getElementById('loading-overlay').classList.remove('hidden');  
    
    // Get device data for fingerprinting  
    const deviceData = await getDeviceData();  
    console.log('Device data retrieved');
    
    // Check if user has an active trial
    const { hasAccess, isTrial, trialExpiry } = await checkAccess();
    console.log('Access checked. isTrial:', isTrial);
    
    // If user has an active trial, use the convertTrialToFullPurchase function instead
    if (isTrial) {
      console.log('User has active trial, redirecting to trial conversion');
      await convertTrialToFullPurchase();
      return;
    }
    
    // Get device hash from server  
    const response = await fetch('https://luisgcastro.com/.netlify/functions/generateDeviceHash', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({ deviceData })  
    });  
    
    const data = await response.json();  
    
    // If device already has purchased, refresh the UI  
    if (data.hasPurchased) {  
      await checkAndUpdateAccessState();  
      return;  
    }  
    
    // Open payment page with device hash in a new tab  
    if (data.deviceHash) {  
      chrome.tabs.create({   
        url: `https://luisgcastro.com/paymentpage.html?deviceHash=${data.deviceHash}`   
      });  
    } else {  
      throw new Error('Failed to get device hash');  
    }  
  } catch (error) {  
    console.error('Payment setup error:', error);  
    alert('There was an error setting up the payment. Please try again later.');  
  } finally {  
    // Hide loading screen  
    document.getElementById('loading-overlay').classList.add('hidden');  
  }  
};  

// Flag to prevent multiple simultaneous conversions
let isProcessingConversion = false;

// Convert trial to full purchase using existing payment method
const convertTrialToFullPurchase = async () => {
  // Prevent double processing
  if (isProcessingConversion) {
    console.log('Already processing a conversion, ignoring duplicate request');
    return;
  }
  
  isProcessingConversion = true;
  
  try {
    console.log('convertTrialToFullPurchase function called');
    // Show loading screen
    document.getElementById('loading-overlay').classList.remove('hidden');
    
    // Get the trial purchase ID from storage
    const purchaseId = await new Promise((resolve) => {
      chrome.storage.local.get(['trialPurchaseId'], (result) => {
        resolve(result.trialPurchaseId);
      });
    });
    
    if (!purchaseId) {
      console.error('Trial purchase ID not found');
      alert('Could not find your trial information. Please contact support.');
      return;
    }
    
    console.log('Trial purchase ID retrieved:', purchaseId);
    
    // Get device data for verification
    const deviceData = await getDeviceData();
    
    // Call the direct charge endpoint to convert the trial
    const response = await fetch('https://luisgcastro.com/.netlify/functions/testDirectCharge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        purchaseId,
        deviceData,
        isTrialConversion: true
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to process payment');
    }
    
    console.log('Trial successfully converted:', data);
    
    // Show success message
    alert('Your purchase was successful! You now have full access.');
    
    // Update UI to reflect the change
    await checkAndUpdateAccessState();
    
  } catch (error) {
    console.error('Trial conversion error:', error);
    alert('There was an error processing your payment: ' + (error.message || 'Unknown error'));
  } finally {
    // Hide loading screen
    document.getElementById('loading-overlay').classList.add('hidden');
    // Reset processing flag
    isProcessingConversion = false;
  }
};

// Start trial with payment method validation  
const startTrialWithPayment = async () => {  
  try {  
    // Show loading overlay  
    document.getElementById('loading-overlay').classList.remove('hidden');  
    
    // Get device data for fingerprinting  
    const deviceData = await getDeviceData();  
    
    // Get device hash from server  
    const response = await fetch('https://luisgcastro.com/.netlify/functions/generateDeviceHash', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json'  
      },  
      body: JSON.stringify({ deviceData })  
    });
    
    const data = await response.json();
    const deviceHash = data.deviceHash;
    
    // Open the trial page in a new tab
    chrome.tabs.create({
      url: `https://luisgcastro.com/trialpage.html?deviceHash=${deviceHash}`
    });
    
    // Listen for messages from background script or trial page
    chrome.runtime.onMessage.addListener(function(message) {
      console.log('Message received in sidepanel:', message);
      
      if (message.type === 'purchase_saved') {
        console.log('Purchase saved with ID:', message.purchaseId);
        checkAndUpdateAccessState();
        document.getElementById('loading-overlay').classList.add('hidden');
      }
      
      if (message.type === 'trial_activated' && message.purchaseId) {
        console.log('Trial activated with purchase ID:', message.purchaseId);
        // Save the purchase ID to Chrome storage for later use
        chrome.storage.local.set({ trialPurchaseId: message.purchaseId }, function() {
          console.log('Trial purchase ID saved to Chrome storage:', message.purchaseId);
        });
        checkAndUpdateAccessState();
      }
    });
    
    // Also listen for window messages (from the trial page)
    window.addEventListener('message', function(event) {
      // Only accept messages from our own origin
      if (event.origin !== 'https://luisgcastro.com') return;
      
      const message = event.data;
      console.log('Window message received:', message);
      
      if (message.type === 'trial_activated' && message.purchaseId) {
        console.log('Trial activated with purchase ID (from window message):', message.purchaseId);
        // Save the purchase ID to Chrome storage for later use
        chrome.storage.local.set({ trialPurchaseId: message.purchaseId }, function() {
          console.log('Trial purchase ID saved to Chrome storage:', message.purchaseId);
        });
        checkAndUpdateAccessState();
      }
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    document.getElementById('loading-overlay').classList.add('hidden');
  }
};

// Function to cancel trial  
const cancelTrial = async () => {  
  // Using Chrome Storage API to get the item
  const purchaseId = await new Promise((resolve) => {
    chrome.storage.local.get(['trialPurchaseId'], (result) => {
      resolve(result.trialPurchaseId);
    });
  });

  if (!purchaseId) {  
    alert('Trial ID not found. Please contact support.');  
    return;  
  }  
  
  if (!confirm('Are you sure you want to cancel your trial? Your card will not be charged, but you will lose access when your trial period ends.')) {  
    return;  
  }  
  
  try {  
    document.getElementById('loading-overlay').classList.remove('hidden'); 

    const status = await getStorage('status');
    if (status === 'cancelled') {
      console.log('Trial is already cancelled.');
      alert('Trial already cancelled');
      return; }
     // Exit the function if already cancelled 
    const response = await fetch('https://luisgcastro.com/.netlify/functions/cancelTrial', {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ purchaseId })  
    });  
    
    const data = await response.json();  
    
    if (response.ok && data.success) {
      // Save the response data to chrome.storage.local
      chrome.storage.local.set({ status: 'cancelled' }, () => {
        console.log('Cancellation status saved to chrome.storage');
      }); 
    }  
    
    alert('Your trial has been cancelled. You still have access until the trial period ends.');  
    
    // Update UI to show cancelled state  
    await checkAndUpdateAccessState();  
    
  } catch (error) {  
    console.error('Error cancelling trial:', error);  
    alert('Failed to cancel trial: ' + (error.message || 'Unknown error'));  
  } finally {  
    document.getElementById('loading-overlay').classList.add('hidden');  
  }  
};  

// Show trial banner with time remaining and cancel option  
const showTrialBanner = (expiryDate, isCancelled = false) => {  
  let trialBanner = document.getElementById('trial-banner');  
  
  if (!trialBanner) {  
    trialBanner = document.createElement('div');  
    trialBanner.id = 'trial-banner';  
    trialBanner.className = 'trial-banner';  
    
    const header = document.querySelector('#header');  
    header.parentNode.insertBefore(trialBanner, header.nextSibling);  
  }  
  
  const expiryTime = new Date(expiryDate).getTime();  
  const now = new Date().getTime();  
  const distance = expiryTime - now;  
  
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));  
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));  
  
  if (distance < 0) {  
    trialBanner.innerHTML = `  
      <div class="trial-text">Your trial has expired</div>  
      <button id="upgradeButton" class="upgrade-button">Upgrade Now</button>  
    `;  
    
    // Re-check access to show paywall  
    setTimeout(checkAndUpdateAccessState, 1000);  
  } else if (isCancelled) {  
    trialBanner.innerHTML = `  
      <div class="trial-text">Trial expires in: ${days}d ${hours}h <span class="cancelled">(Cancelled)</span></div>  
      <button disabled class="upgrade-button cancelled-button">Trial Cancelled</button>  
    `;  
  } else {  
    trialBanner.innerHTML = `  
      <div class="trial-text">Trial expires in: ${days}d ${hours}h - Your card will be charged $19.99 after the trial period</div>  
      <div class="trial-actions">  
        <button id="upgradeButton" class="upgrade-button">Upgrade Now</button>  
        <button id="cancelTrial" class="cancel-button">Cancel Trial</button>  
      </div>  
    `;  
    
    // Add event listener to cancel button  
    const cancelButton = document.getElementById('cancelTrial');
    if (cancelButton) {
      console.log('Adding event listener to cancel button');
      cancelButton.addEventListener('click', cancelTrial);  
    }
  }  
  
  // We'll use event delegation only, so no direct event listener here
  // This prevents double-triggering of the upgrade function
};  

// Hide trial banner  
const hideTrialBanner = () => {  
  const trialBanner = document.getElementById('trial-banner');  
  if (trialBanner) {  
    trialBanner.remove();  
  }  
};  

// Function to trigger payment processing when trial expires
const triggerTrialConversion = async () => {
  try {
    console.log('Triggering trial conversion');
    
    // Get the trial purchase ID from storage
    const purchaseId = await new Promise((resolve) => {
      chrome.storage.local.get(['trialPurchaseId'], (result) => {
        resolve(result.trialPurchaseId);
      });
    });
    
    if (!purchaseId) {
      console.error('No trial purchase ID found');
      return;
    }
    
    // Call the processScheduledPayments endpoint with the purchase ID
    const response = await fetch('https://luisgcastro.com/.netlify/functions/processScheduledPayments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        purchaseId,
        singlePurchase: true
      })
    });
    
    const result = await response.json();
    console.log('Trial conversion result:', result);
    
    // Update UI after processing
    await checkAndUpdateAccessState();
    
  } catch (error) {
    console.error('Error triggering trial conversion:', error);
  }
};

// Check access and update UI accordingly  
const checkAndUpdateAccessState = async () => {  
  // Show loading screen  
  document.getElementById('loading-overlay').classList.remove('hidden');  
  
  try {  
    const { hasAccess, isTrial, trialExpiry, trialCancelled } = await checkAccess();  
    
    // Check if trial has expired but not been converted yet
    if (isTrial && trialExpiry) {
      const now = new Date();
      const expiryDate = new Date(trialExpiry);
      
      if (now > expiryDate && !trialCancelled) {
        console.log('Trial has expired, triggering conversion');
        // Trigger payment processing
        triggerTrialConversion();
      }
    }
    
    if (hasAccess) {  
      // User has access, hide paywall and show chat  
      document.getElementById('paywall-container').classList.add('hidden');  
      document.getElementById('chatbox').classList.remove('hidden');  
      document.getElementById('userInput').classList.remove('hidden');  
      document.getElementById('sendButton').classList.remove('hidden');  
      document.querySelector('.input-container').classList.remove('hidden');  
      
      // If it's a trial, show trial banner  
      if (isTrial && trialExpiry) {  
        showTrialBanner(trialExpiry, trialCancelled);  
      } else {  
        hideTrialBanner();  
      }  
    } else {  
      // User doesn't have access, show paywall and hide chat  
      document.getElementById('paywall-container').classList.remove('hidden');  
      document.getElementById('chatbox').classList.add('hidden');  
      document.getElementById('userInput').classList.add('hidden');  
      document.getElementById('sendButton').classList.add('hidden');  
      document.querySelector('.input-container').classList.add('hidden');  
    }  
  } catch (error) {  
    console.error('Error checking access:', error);  
    // If there's an error, allow access by default (you might want to change this behavior)  
    document.getElementById('paywall-container').classList.add('hidden');  
  } finally {  
    // Hide loading screen  
    document.getElementById('loading-overlay').classList.add('hidden');  
  }  
};  

// Schedule periodic access checks  
const startAccessChecks = () => {  
  // Check access initially  
  checkAndUpdateAccessState();  
  
  // Set up periodic check (every 5 minutes)  
  setInterval(checkAndUpdateAccessState, 5 * 60 * 1000);  
};   

document.addEventListener('DOMContentLoaded', () => {  
  const chatbox = document.getElementById('chatbox');  
  const userInput = document.getElementById('userInput');  
  const sendButton = document.getElementById('sendButton');  
  const settingsButton = document.getElementById('settingsButton');  
  const buyNowBtn = document.getElementById('buyNowBtn');  

  // Add CSS for trial-related elements  
  const style = document.createElement('style');  
  style.textContent = `  
    .trial-banner {  
      background: linear-gradient(90deg, var(--darker-bg, #1a1a1a), var(--neon-secondary, #7700ff), var(--darker-bg, #1a1a1a));  
      color: white;  
      padding: 10px 20px;  
      display: flex;  
      justify-content: space-between;  
      align-items: center;  
      font-size: 0.9rem;  
      margin-bottom: 10px;  
    }  
    
    .trial-text {  
      font-weight: 500;  
    }  
    
    .upgrade-button {  
      background: var(--neon-primary, #00fff2);  
      color: var(--dark-bg, #222);  
      border: none;  
      border-radius: 15px;  
      padding: 5px 15px;  
      font-size: 0.8rem;  
      font-weight: 600;  
      cursor: pointer;  
      transition: all 0.3s ease;  
    }  
    
    .upgrade-button:hover {  
      background: white;  
      transform: translateY(-2px);  
    }  
    
    .trial-actions {  
      display: flex;  
      gap: 10px;  
    }  
    
    .cancel-button {  
      background: transparent;  
      border: 1px solid white;  
      color: white;  
      border-radius: 15px;  
      padding: 5px 15px;  
      font-size: 0.8rem;  
      cursor: pointer;  
      transition: all 0.3s ease;  
    }  
    
    .cancel-button:hover {  
      background: rgba(255,255,255,0.1);  
    }  
    
    .cancelled {  
      color: #ff5555;  
      font-style: italic;  
    }  
    
    .cancelled-button {  
      background: #666;  
      cursor: not-allowed;  
    }  
    
    .cancelled-button:hover {  
      transform: none;  
      background: #666;  
    }  
    
    .trial-option {  
      margin-top: 20px;  
      font-size: 0.9rem;  
      text-align: center;  
    }  
    
    .trial-option p {  
      color: var(--gray-text, #888);  
    }  
    
    #startTrialBtn {  
      background: transparent;  
      color: var(--neon-primary, #00fff2);  
      border: 1px solid var(--neon-primary, #00fff2);  
      border-radius: 20px;  
      padding: 8px 16px;  
      font-size: 0.9rem;  
      cursor: pointer;  
      transition: all 0.3s ease;  
      margin-top: 10px;  
      display: block;  
      width: 80%;  
      margin-left: auto;  
      margin-right: auto;  
    }  
    
    #startTrialBtn:hover {  
      background: rgba(0, 255, 242, 0.1);  
      transform: translateY(-2px);  
    }  
  `;  
  document.head.appendChild(style);  

  if (!chatbox || !userInput || !sendButton || !settingsButton || !buyNowBtn) {  
    return console.error('Missing DOM elements');  
  }  

  // Set up buy button  
  buyNowBtn.addEventListener('click', openPaymentPage);  

  // Look for the paywall container and add the trial button if it doesn't exist  
  const paywallContainer = document.getElementById('paywall-container');  
  if (paywallContainer && !document.getElementById('startTrialBtn')) {  
    const trialOption = document.createElement('div');  
    trialOption.className = 'trial-option';  
    trialOption.innerHTML = `  
      <p>Try it before you buy it:</p>  
      <button id="startTrialBtn">Start 7-Day Free Trial</button>  
    `;  
    paywallContainer.appendChild(trialOption);  
    
    // Add event listener to the trial button  
    document.getElementById('startTrialBtn').addEventListener('click', startTrialWithPayment);  
  }  

  // Start access checks  
  startAccessChecks();  

  chrome.storage.session.get(['languagePreference'], (result) => {  
    const languagePreference = result.languagePreference || 'English';  
    const langCode = languagePreference === 'Spanish' ? 'es' : 'en';  
    const welcomeMessage = getWelcomeMessage(langCode);  
    addMessage(chatbox, welcomeMessage, false);  
    conversationHistory.push({ role: 'assistant', content: welcomeMessage });  
    conversationHistory = truncateHistory(conversationHistory);  
  });  

  settingsButton.addEventListener('click', () => chrome.tabs.create({ url: 'settings.html' }));  

  const scrollChatbox = debounce(() => {  
    chatbox.scrollTop = chatbox.scrollHeight;  
  }, 100);  

  const sendMessage = async () => {  
    // Before sending a message, verify access  
    const { hasAccess } = await checkAccess();  
    if (!hasAccess) {  
      // If no access, show paywall and return  
      checkAndUpdateAccessState();  
      return;  
    }  

    const message = userInput.value.trim();  
    if (!message) return;  

    addMessage(chatbox, message, true);  
    conversationHistory.push({ role: 'user', content: message });  
    conversationHistory = truncateHistory(conversationHistory);  
    userInput.value = '';  
    scrollChatbox();  

    const thinking = addMessage(chatbox, '', false, false, true);  

    try {  
      let currentMessage = '';  
      let isFirstChunk = true;  
      let streamListener;  

      await chrome.runtime.sendMessage({  
        action: 'chat',  
        messages: conversationHistory  
      }, (response) => {  
        if (chrome.runtime.lastError) {  
          console.error('Send message error:', chrome.runtime.lastError);  
          thinking.remove();  
          if (streamListener) chrome.runtime.onMessage.removeListener(streamListener);  
          addMessage(chatbox, `Error: ${chrome.runtime.lastError.message}`, false);  
          conversationHistory.push({ role: 'assistant', content: `Error: ${chrome.runtime.lastError.message}` });  
          conversationHistory = truncateHistory(conversationHistory);  
          scrollChatbox();  
          return;  
        }  

        if (response?.type === 'action' || response?.type === 'summary' || response?.type === 'message') {  
          thinking.remove();  
          if (streamListener) chrome.runtime.onMessage.removeListener(streamListener);  
          const streamingDiv = chatbox.querySelector('.streaming-message');  
          if (streamingDiv) streamingDiv.remove();  
          addMessage(chatbox, response.content, false);  
          conversationHistory.push({ role: 'assistant', content: response.content });  
          conversationHistory = truncateHistory(conversationHistory);  
          scrollChatbox();  
        } else if (response?.type === 'error') {  
          thinking.remove();  
          if (streamListener) chrome.runtime.onMessage.removeListener(streamListener);  
          const errorMsg = response.content.includes('No valid API key found')  
            ? 'Please configure an API key in the settings to use this extension. Click the settings button to add one.'  
            : `Error: ${response.content}`;  
          addMessage(chatbox, errorMsg, false);  
          conversationHistory.push({ role: 'assistant', content: errorMsg });  
          conversationHistory = truncateHistory(conversationHistory);  
          scrollChatbox();  
        }  
      });  

      streamListener = function(msg, sender) {  
        if (msg.action === 'stream') {  
          if (msg.chunk === '[DONE]') {  
            chrome.runtime.onMessage.removeListener(streamListener);  
            return;  
          }  
          if (isFirstChunk) {  
            thinking.remove();  
            isFirstChunk = false;  
          }  
          if (!message.match(/^(?:send|compose|reply|redacta|escribe)/i)) {  
            currentMessage += msg.chunk;  
            addMessage(chatbox, currentMessage, false, true);  
            scrollChatbox();  
          }  
        }  
        return true;  
      };  
      chrome.runtime.onMessage.addListener(streamListener);  

    } catch (error) {  
      thinking.remove();  
      console.error('Sidepanel error:', error);  
      addMessage(chatbox, `Error: ${error.message}`, false);  
      conversationHistory.push({ role: 'assistant', content: `Error: ${error.message}` });  
      conversationHistory = truncateHistory(conversationHistory);  
      scrollChatbox();  
    }  
  };  

  sendButton.addEventListener('click', sendMessage);  
  userInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage()); 
  
  // Add event delegation for the upgrade button
  document.body.addEventListener('click', function (event) {
    console.log('Click detected on:', event.target);
    // Check if the clicked element has the ID "upgradeButton"
    if (event.target.matches('#upgradeButton')) {
      console.log('Upgrade button clicked via delegation');
      // Call the function to open the payment page
      openPaymentPage();
    }
  });

});
