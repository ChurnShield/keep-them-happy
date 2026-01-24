/**
 * ChurnShield Embeddable Cancel Flow Widget
 * Version: 1.1.0
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js"></script>
 * <script>
 *   ChurnShield.init({
 *     token: 'your-profile-id',          // Required: Your ChurnShield profile ID
 *     customerId: 'cus_xxx',              // Stripe customer ID (for display/lookup)
 *     subscriptionId: 'sub_xxx',          // Stripe subscription ID (REQUIRED for real offers)
 *     stripeSubscriptionId: 'sub_xxx',    // Alias for subscriptionId (for clarity)
 *     stripeCustomerId: 'cus_xxx',        // Alias for customerId (for clarity)
 *     onSave: function(result) { },       // Callback when customer is saved (offer accepted)
 *     onCancel: function() { },           // Callback when subscription is cancelled
 *     onClose: function() { }             // Callback when widget closes
 *   });
 *   
 *   // Open the widget:
 *   ChurnShield.open();
 * </script>
 * 
 * IMPORTANT: For real Stripe actions (applying discounts/pauses), you MUST provide 
 * the subscriptionId (or stripeSubscriptionId) in the format 'sub_xxx'.
 */

(function(window, document) {
  'use strict';

  // Widget state
  var state = {
    initialized: false,
    isOpen: false,
    config: null,
    options: null,
    sessionToken: null,
    step: 'loading', // loading, survey, offer, complete, error
    selectedReason: null,
    customFeedback: '',
    offer: null,
    finalStatus: null,
    error: null
  };

  // API base URL - Supabase Edge Functions endpoint
  var API_BASE_URL = 'https://rdstyfaveeokocztayri.supabase.co';

  // Elements
  var overlay = null;
  var modal = null;
  var contentContainer = null;

  // Reason labels
  var REASON_LABELS = {
    too_expensive: "It's too expensive",
    not_using_enough: "I'm not using it enough",
    missing_features: "Missing features I need",
    found_alternative: "Found a better alternative",
    technical_issues: "Technical issues",
    need_a_break: "I just need a break",
    other: "Other reason"
  };

  // ============= STYLES =============
  var WIDGET_STYLES = "\n    .cs-overlay {\n      position: fixed;\n      top: 0;\n      left: 0;\n      right: 0;\n      bottom: 0;\n      background: rgba(0, 0, 0, 0.6);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      z-index: 999999;\n      opacity: 0;\n      visibility: hidden;\n      transition: opacity 0.3s ease, visibility 0.3s ease;\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    }\n    .cs-overlay.cs-open {\n      opacity: 1;\n      visibility: visible;\n    }\n    .cs-modal {\n      width: 100%;\n      max-width: 420px;\n      max-height: 90vh;\n      border-radius: 16px;\n      overflow: hidden;\n      transform: scale(0.95) translateY(10px);\n      transition: transform 0.3s ease;\n      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);\n    }\n    .cs-overlay.cs-open .cs-modal {\n      transform: scale(1) translateY(0);\n    }\n    .cs-header {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      padding: 16px 20px;\n      border-bottom: 1px solid var(--cs-border);\n    }\n    .cs-logo {\n      height: 24px;\n      width: auto;\n    }\n    .cs-close {\n      background: none;\n      border: none;\n      cursor: pointer;\n      padding: 4px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      color: var(--cs-muted);\n      transition: color 0.2s;\n    }\n    .cs-close:hover {\n      color: var(--cs-text);\n    }\n    .cs-content {\n      padding: 24px;\n      overflow-y: auto;\n      max-height: calc(90vh - 60px);\n    }\n    .cs-title {\n      font-size: 20px;\n      font-weight: 600;\n      margin: 0 0 8px 0;\n      text-align: center;\n      color: var(--cs-text);\n    }\n    .cs-subtitle {\n      font-size: 14px;\n      margin: 0 0 24px 0;\n      text-align: center;\n      color: var(--cs-muted);\n    }\n    .cs-reasons {\n      display: flex;\n      flex-direction: column;\n      gap: 8px;\n    }\n    .cs-reason {\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      padding: 12px 16px;\n      border-radius: 8px;\n      border: 1px solid var(--cs-border);\n      background: transparent;\n      cursor: pointer;\n      transition: all 0.2s;\n      text-align: left;\n      width: 100%;\n    }\n    .cs-reason:hover {\n      border-color: var(--cs-primary);\n    }\n    .cs-reason.cs-selected {\n      border-color: var(--cs-primary);\n      background: var(--cs-primary-light);\n    }\n    .cs-reason-radio {\n      width: 18px;\n      height: 18px;\n      border-radius: 50%;\n      border: 2px solid var(--cs-border);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      flex-shrink: 0;\n      transition: border-color 0.2s;\n    }\n    .cs-reason.cs-selected .cs-reason-radio {\n      border-color: var(--cs-primary);\n    }\n    .cs-reason.cs-selected .cs-reason-radio::after {\n      content: '';\n      width: 10px;\n      height: 10px;\n      border-radius: 50%;\n      background: var(--cs-primary);\n    }\n    .cs-reason-label {\n      font-size: 14px;\n      color: var(--cs-text);\n    }\n    .cs-textarea {\n      width: 100%;\n      min-height: 80px;\n      padding: 12px;\n      border-radius: 8px;\n      border: 1px solid var(--cs-border);\n      background: var(--cs-bg);\n      color: var(--cs-text);\n      font-size: 14px;\n      font-family: inherit;\n      resize: vertical;\n      margin-top: 16px;\n    }\n    .cs-textarea:focus {\n      outline: none;\n      border-color: var(--cs-primary);\n    }\n    .cs-btn {\n      width: 100%;\n      padding: 12px 16px;\n      border-radius: 8px;\n      font-size: 14px;\n      font-weight: 500;\n      cursor: pointer;\n      transition: all 0.2s;\n      border: none;\n      margin-top: 8px;\n    }\n    .cs-btn-primary {\n      background: var(--cs-primary);\n      color: white;\n    }\n    .cs-btn-primary:hover {\n      filter: brightness(1.1);\n    }\n    .cs-btn-primary:disabled {\n      opacity: 0.5;\n      cursor: not-allowed;\n    }\n    .cs-btn-secondary {\n      background: transparent;\n      color: var(--cs-muted);\n    }\n    .cs-btn-secondary:hover {\n      color: var(--cs-text);\n    }\n    .cs-offer-icon {\n      width: 64px;\n      height: 64px;\n      border-radius: 50%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      margin: 0 auto 16px;\n      background: var(--cs-primary-light);\n    }\n    .cs-offer-icon svg {\n      width: 32px;\n      height: 32px;\n      color: var(--cs-primary);\n    }\n    .cs-offer-value {\n      font-size: 36px;\n      font-weight: 700;\n      text-align: center;\n      color: var(--cs-primary);\n      margin-bottom: 8px;\n    }\n    .cs-complete-icon {\n      width: 64px;\n      height: 64px;\n      border-radius: 50%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      margin: 0 auto 16px;\n    }\n    .cs-complete-icon.cs-success {\n      background: rgba(34, 197, 94, 0.2);\n    }\n    .cs-complete-icon.cs-cancelled {\n      background: rgba(148, 163, 184, 0.2);\n    }\n    .cs-complete-icon svg {\n      width: 32px;\n      height: 32px;\n    }\n    .cs-complete-icon.cs-success svg {\n      color: #22c55e;\n    }\n    .cs-complete-icon.cs-cancelled svg {\n      color: #94a3b8;\n    }\n    .cs-loading {\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      padding: 40px;\n    }\n    .cs-spinner {\n      width: 32px;\n      height: 32px;\n      border: 3px solid var(--cs-border);\n      border-top-color: var(--cs-primary);\n      border-radius: 50%;\n      animation: cs-spin 1s linear infinite;\n    }\n    @keyframes cs-spin {\n      to { transform: rotate(360deg); }\n    }\n    .cs-error {\n      text-align: center;\n      padding: 24px;\n    }\n    .cs-error-icon {\n      width: 48px;\n      height: 48px;\n      margin: 0 auto 16px;\n      color: #ef4444;\n    }\n    @media (max-width: 480px) {\n      .cs-modal {\n        max-width: 100%;\n        max-height: 100%;\n        border-radius: 0;\n        height: 100%;\n      }\n      .cs-content {\n        max-height: calc(100vh - 60px);\n      }\n    }\n  ";

  // ============= HELPER FUNCTIONS =============
  
  function injectStyles() {
    if (document.getElementById('churnshield-styles')) return;
    var style = document.createElement('style');
    style.id = 'churnshield-styles';
    style.textContent = WIDGET_STYLES;
    document.head.appendChild(style);
  }

  function applyBranding(branding) {
    var primaryColor = branding.primary_color || '#14B8A6';
    var isDark = branding.dark_mode !== false;
    
    var cssVars = {
      '--cs-primary': primaryColor,
      '--cs-primary-light': hexToRgba(primaryColor, 0.15),
      '--cs-bg': isDark ? '#0f172a' : '#ffffff',
      '--cs-card': isDark ? '#1e293b' : '#f8fafc',
      '--cs-text': isDark ? '#f8fafc' : '#0f172a',
      '--cs-muted': isDark ? '#94a3b8' : '#64748b',
      '--cs-border': isDark ? '#334155' : '#e2e8f0'
    };

    if (modal) {
      modal.style.backgroundColor = cssVars['--cs-card'];
      for (var key in cssVars) {
        modal.style.setProperty(key, cssVars[key]);
      }
    }
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  }

  function createElement(tag, className, innerHTML) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  }

  // ============= API CALLS =============

  function apiCall(endpoint, method, body) {
    var url = API_BASE_URL + '/functions/v1/widget-api/' + endpoint;
    
    var options = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options)
      .then(function(response) {
        if (!response.ok) {
          return response.json().then(function(err) {
            throw new Error(err.message || 'API Error');
          });
        }
        return response.json();
      });
  }

  function createSession() {
    return apiCall('session', 'POST', {
      token: state.options.token,
      customer_id: state.options.customerId,
      subscription_id: state.options.subscriptionId,
      // Real Stripe IDs for actual Stripe operations
      stripe_subscription_id: state.options.stripeSubscriptionId || state.options.subscriptionId,
      stripe_customer_id: state.options.stripeCustomerId || state.options.customerId
    });
  }

  function getConfig() {
    var params = new URLSearchParams({
      token: state.options.token
    });
    if (state.options.customerId) {
      params.append('customer_id', state.options.customerId);
    }
    if (state.options.subscriptionId) {
      params.append('subscription_id', state.options.subscriptionId);
    }
    return apiCall('config?' + params.toString(), 'GET');
  }

  function submitSurvey(reason, customFeedback) {
    return apiCall('survey', 'POST', {
      session_token: state.sessionToken,
      reason_selected: reason,
      custom_reason: reason === 'other' ? customFeedback : undefined,
      free_text_feedback: customFeedback
    });
  }

  function submitOfferResponse(accepted) {
    return apiCall('offer-response', 'POST', {
      session_token: state.sessionToken,
      accepted: accepted
    });
  }

  function submitAbandon(step) {
    return apiCall('abandon', 'POST', {
      session_token: state.sessionToken,
      abandoned_at_step: step
    });
  }

  // ============= RENDER FUNCTIONS =============

  function renderLoading() {
    return '\n      <div class="cs-loading">\n        <div class="cs-spinner"></div>\n        <p style="color: var(--cs-muted); margin-top: 16px;">Loading...</p>\n      </div>\n    ';
  }

  function renderError(message) {
    return '\n      <div class="cs-error">\n        <svg class="cs-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />\n        </svg>\n        <h3 class="cs-title">Something went wrong</h3>\n        <p class="cs-subtitle">' + escapeHtml(message) + '</p>\n        <button class="cs-btn cs-btn-primary" onclick="ChurnShield.close()">Close</button>\n      </div>\n    ';
  }

  function renderSurvey() {
    var surveyOptions = state.config.survey_options;
    var displayReasons = surveyOptions.display_order.length > 0
      ? surveyOptions.display_order.filter(function(r) { return surveyOptions.reasons.indexOf(r) !== -1; })
      : surveyOptions.reasons;
    
    var allReasons = displayReasons.concat(surveyOptions.custom_reasons || [], ['other']);

    var reasonsHtml = allReasons.map(function(reason) {
      var isSelected = state.selectedReason === reason;
      var label = REASON_LABELS[reason] || reason;
      return '\n        <button class="cs-reason ' + (isSelected ? 'cs-selected' : '') + '" data-reason="' + escapeHtml(reason) + '">\n          <div class="cs-reason-radio"></div>\n          <span class="cs-reason-label">' + escapeHtml(label) + '</span>\n        </button>\n      ';
    }).join('');

    var textareaHtml = state.selectedReason === 'other' 
      ? '<textarea class="cs-textarea" id="cs-feedback" placeholder="Please tell us more...">' + escapeHtml(state.customFeedback) + '</textarea>'
      : '';

    return '\n      <h2 class="cs-title">We\'re sorry to see you go</h2>\n      <p class="cs-subtitle">Before you cancel, please let us know why you\'re leaving</p>\n      <div class="cs-reasons">' + reasonsHtml + '</div>\n      ' + textareaHtml + '\n      <button class="cs-btn cs-btn-primary" id="cs-survey-submit" ' + (state.selectedReason ? '' : 'disabled') + '>Continue</button>\n    ';
  }

  function renderOffer() {
    var offer = state.offer;
    var widgetSettings = state.config.widget_settings;
    var isDiscount = offer.type === 'discount';

    var iconSvg = isDiscount
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

    var offerValue = isDiscount
      ? offer.percentage + '% OFF'
      : offer.duration_months + ' MONTH' + (offer.duration_months > 1 ? 'S' : '');

    var offerDescription = isDiscount
      ? 'for the next ' + offer.duration_months + ' month' + (offer.duration_months > 1 ? 's' : '')
      : 'Your account will be waiting for you when you\'re ready';

    return '\n      <div class="cs-offer-icon">' + iconSvg + '</div>\n      <h2 class="cs-title">Wait! We have an offer for you</h2>\n      <p class="cs-subtitle">' + (isDiscount ? 'We\'d hate to see you go. How about we give you' : 'Need a break? We can pause your subscription for') + '</p>\n      <div class="cs-offer-value">' + offerValue + '</div>\n      <p class="cs-subtitle">' + escapeHtml(offerDescription) + '</p>\n      <button class="cs-btn cs-btn-primary" id="cs-offer-accept">' + escapeHtml(widgetSettings.accept_button_text || 'Accept Offer') + '</button>\n      <button class="cs-btn cs-btn-secondary" id="cs-offer-decline">' + escapeHtml(widgetSettings.decline_button_text || 'No thanks, cancel anyway') + '</button>\n    ';
  }

  function renderComplete() {
    var isSaved = state.finalStatus === 'saved';
    
    var iconClass = isSaved ? 'cs-success' : 'cs-cancelled';
    var iconSvg = isSaved
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

    var title = isSaved ? 'Great! Your offer has been applied' : 'Your subscription has been cancelled';
    var subtitle = isSaved 
      ? 'Thank you for staying with us. Your discount has been applied to your account.'
      : 'We\'re sorry to see you go. You\'ll continue to have access until the end of your billing period.';

    return '\n      <div class="cs-complete-icon ' + iconClass + '">' + iconSvg + '</div>\n      <h2 class="cs-title">' + escapeHtml(title) + '</h2>\n      <p class="cs-subtitle">' + escapeHtml(subtitle) + '</p>\n      <button class="cs-btn cs-btn-primary" onclick="ChurnShield.close()">Close</button>\n    ';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    if (!contentContainer) return;

    var html;
    switch (state.step) {
      case 'loading':
        html = renderLoading();
        break;
      case 'survey':
        html = renderSurvey();
        break;
      case 'offer':
        html = renderOffer();
        break;
      case 'complete':
        html = renderComplete();
        break;
      case 'error':
        html = renderError(state.error || 'Something went wrong');
        break;
      default:
        html = renderLoading();
    }

    contentContainer.innerHTML = html;
    attachEventListeners();
  }

  function attachEventListeners() {
    // Survey reason buttons
    var reasonButtons = document.querySelectorAll('.cs-reason');
    reasonButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.selectedReason = btn.getAttribute('data-reason');
        render();
      });
    });

    // Feedback textarea
    var feedbackTextarea = document.getElementById('cs-feedback');
    if (feedbackTextarea) {
      feedbackTextarea.addEventListener('input', function(e) {
        state.customFeedback = e.target.value;
      });
    }

    // Survey submit
    var surveySubmit = document.getElementById('cs-survey-submit');
    if (surveySubmit) {
      surveySubmit.addEventListener('click', handleSurveySubmit);
    }

    // Offer accept
    var offerAccept = document.getElementById('cs-offer-accept');
    if (offerAccept) {
      offerAccept.addEventListener('click', function() { handleOfferResponse(true); });
    }

    // Offer decline
    var offerDecline = document.getElementById('cs-offer-decline');
    if (offerDecline) {
      offerDecline.addEventListener('click', function() { handleOfferResponse(false); });
    }
  }

  // ============= EVENT HANDLERS =============

  function handleSurveySubmit() {
    if (!state.selectedReason) return;

    var submitBtn = document.getElementById('cs-survey-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
    }

    submitSurvey(state.selectedReason, state.customFeedback)
      .then(function(response) {
        if (response.offer) {
          state.offer = response.offer;
          state.step = 'offer';
        } else {
          // No offer, complete cancellation
          state.finalStatus = 'cancelled';
          state.step = 'complete';
          if (state.options.onCancel) {
            state.options.onCancel();
          }
        }
        render();
      })
      .catch(function(err) {
        console.error('ChurnShield: Survey submit error', err);
        state.error = err.message;
        state.step = 'error';
        render();
      });
  }

  function handleOfferResponse(accepted) {
    var acceptBtn = document.getElementById('cs-offer-accept');
    var declineBtn = document.getElementById('cs-offer-decline');
    if (acceptBtn) {
      acceptBtn.disabled = true;
      acceptBtn.textContent = 'Processing...';
    }
    if (declineBtn) declineBtn.disabled = true;

    submitOfferResponse(accepted)
      .then(function(response) {
        state.finalStatus = response.status || (accepted ? 'saved' : 'cancelled');
        state.step = 'complete';
        
        if (accepted && state.options.onSave) {
          state.options.onSave();
        } else if (!accepted && state.options.onCancel) {
          state.options.onCancel();
        }
        
        render();
      })
      .catch(function(err) {
        console.error('ChurnShield: Offer response error', err);
        state.error = err.message;
        state.step = 'error';
        render();
      });
  }

  function handleClose() {
    // Track abandonment if not completed
    if (state.sessionToken && ['survey', 'offer'].indexOf(state.step) !== -1) {
      submitAbandon(state.step).catch(function() {
        // Silently fail - don't block close
      });
    }

    if (state.options && state.options.onClose) {
      state.options.onClose();
    }

    // Reset state
    state.isOpen = false;
    state.step = 'loading';
    state.selectedReason = null;
    state.customFeedback = '';
    state.offer = null;
    state.finalStatus = null;
    state.error = null;
    state.sessionToken = null;

    if (overlay) {
      overlay.classList.remove('cs-open');
    }
  }

  // ============= PUBLIC API =============

  var ChurnShield = {
    init: function(options) {
      if (!options || !options.token) {
        console.error('ChurnShield: token is required');
        return;
      }

      state.options = options;
      state.initialized = true;
      
      injectStyles();
      
      console.log('ChurnShield: Initialized');
    },

    open: function() {
      if (!state.initialized) {
        console.error('ChurnShield: Please call ChurnShield.init() first');
        return;
      }

      // Create overlay if it doesn't exist
      if (!overlay) {
        overlay = createElement('div', 'cs-overlay');
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) {
            ChurnShield.close();
          }
        });

        modal = createElement('div', 'cs-modal');
        
        var header = createElement('div', 'cs-header');
        header.innerHTML = '\n          <span style="font-weight: 600; color: var(--cs-text);">Cancel Subscription</span>\n          <button class="cs-close" aria-label="Close">\n            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n              <line x1="18" y1="6" x2="6" y2="18"/>\n              <line x1="6" y1="6" x2="18" y2="18"/>\n            </svg>\n          </button>\n        ';
        
        header.querySelector('.cs-close').addEventListener('click', ChurnShield.close);

        contentContainer = createElement('div', 'cs-content');

        modal.appendChild(header);
        modal.appendChild(contentContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
      }

      state.isOpen = true;
      state.step = 'loading';
      render();

      // Apply default branding initially
      applyBranding({ primary_color: '#14B8A6', dark_mode: true });

      // Trigger open animation
      requestAnimationFrame(function() {
        overlay.classList.add('cs-open');
      });

      // Fetch config and create session
      Promise.all([getConfig(), createSession()])
        .then(function(results) {
          var configData = results[0];
          var sessionData = results[1];

          state.config = configData;
          state.sessionToken = sessionData.session_token;

          // Update logo in header if available
          if (configData.branding && configData.branding.logo_url) {
            var headerEl = modal.querySelector('.cs-header span');
            if (headerEl) {
              headerEl.innerHTML = '<img src="' + escapeHtml(configData.branding.logo_url) + '" class="cs-logo" alt="Logo">';
            }
          }

          applyBranding(configData.branding || {});
          state.step = 'survey';
          render();
        })
        .catch(function(err) {
          console.error('ChurnShield: Failed to initialize', err);
          state.error = err.message;
          state.step = 'error';
          render();
        });
    },

    close: function() {
      handleClose();
    },

    isOpen: function() {
      return state.isOpen;
    }
  };

  // Expose to global scope
  window.ChurnShield = ChurnShield;

})(window, document);
