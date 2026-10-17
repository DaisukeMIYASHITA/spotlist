/* App-specific GA4 collection. No network request before an explicit analytics choice. */
(() => {
  'use strict';
  if (window.appAnalytics) return;
  const config = window.APP_ANALYTICS_CONFIG || {};
  const measurementId = config.measurementId || '';
  const path = config.pages && config.pages[window.location.pathname];
  const isLocal = /^(localhost|.*\.localhost|127\..*|0\.0\.0\.0|\[?::1\]?)$/.test(window.location.hostname);
  const eligible = !isLocal && /^G-[A-Z0-9]{6,}$/.test(measurementId)
    && window.location.protocol === 'https:'
    && (config.productionHosts || []).includes(window.location.hostname)
    && Boolean(path);
  const storageKey = 'app.analytics.consent.' + measurementId;
  const disabledKey = 'ga-disable-' + measurementId;
  let allowed = false;
  let initialized = false;
  let reloadRequested = false;
  let updateConsentDisplay = () => {};
  let choice = '';
  try { choice = localStorage.getItem(storageKey) || ''; } catch (_) { /* Session-only choice. */ }
  const hasExistingTag = typeof window.gtag === 'function'
    || Boolean(window.google_tag_manager)
    || Boolean(document.querySelector('script[src*="googletagmanager.com/"]'));

  function metadata() {
    let referrer = '';
    try {
      const source = new URL(document.referrer);
      if (/^https?:$/.test(source.protocol)) referrer = source.origin + '/';
    } catch (_) { /* Empty or invalid referrer. */ }
    return {
      page_location: window.location.origin + path.path,
      page_title: path.title,
      page_referrer: referrer
    };
  }

  function start() {
    if (!eligible || hasExistingTag || initialized || !allowed) return;
    initialized = true;
    window[disabledKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('set', { ...metadata(), ads_data_redaction: true, url_passthrough: false });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      ...metadata(), send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false
    });
    window.gtag('event', 'page_view', { ...metadata(), send_to: measurementId });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    script.referrerPolicy = 'no-referrer';
    document.head.appendChild(script);
  }

  function choose(value, persist = true) {
    const wasInitialized = initialized;
    choice = value;
    allowed = value === 'granted';
    if (persist) {
      try { localStorage.setItem(storageKey, value); } catch (_) { /* Session-only choice. */ }
    }
    window[disabledKey] = !allowed;
    window.dispatchEvent(new CustomEvent('app:analytics-consent', { detail: { measurementId, consent: value } }));
    updateConsentDisplay();
    if (allowed) start();
    // A reload removes the already-loaded tag after revocation; the disable flag stops new hits first.
    if (!allowed && wasInitialized && !reloadRequested) {
      reloadRequested = true;
      window.location.reload();
    }
  }

  window.appAnalytics = Object.freeze({
    track(name) {
      // No arbitrary properties, user IDs, input contents, tokens, filenames, or error strings.
      if (allowed && initialized && (config.events || []).includes(name)) {
        window.gtag('event', name, { ...metadata(), send_to: measurementId });
      }
    },
    setConsent(granted) { choose(granted === true ? 'granted' : 'denied'); }
  });
  // Apply another tab's choice without writing it back and creating a storage-event loop.
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    if (event.storageArea && event.storageArea !== localStorage) return;
    choose(event.newValue === 'granted' ? 'granted' : 'denied', false);
  });
  if (!eligible || hasExistingTag) return;
  allowed = choice === 'granted';
  window[disabledKey] = !allowed;
  if (allowed) start();

  function controls() {
    const section = document.createElement('details');
    section.id = 'analytics-settings';
    section.open = !choice;
    section.style.cssText = 'margin:24px auto;padding:16px;max-width:960px;font:14px/1.7 system-ui,sans-serif;color:#222;background:#fff;border:1px solid #ddd;border-radius:8px;';
    const summary = document.createElement('summary');
    summary.textContent = 'アクセス解析の設定';
    summary.style.cursor = 'pointer';
    const notice = document.createElement('p');
    notice.textContent = 'サービス改善のため、許可した場合にGoogle Analytics 4で閲覧ページと主要操作を計測します。Cookieを使用し、データはGoogleに送信されます。入力内容・メールアドレス・認証情報は送信しません。広告向けの計測は行いません。';
    const policy = document.createElement('a');
    policy.href = 'https://policies.google.com/technologies/partner-sites?hl=ja';
    policy.textContent = 'Googleによるデータの利用について';
    policy.target = '_blank';
    policy.rel = 'noopener noreferrer';
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    updateConsentDisplay = () => {
      status.textContent = allowed ? 'アクセス解析を許可しています' : 'アクセス解析は停止しています';
    };
    function button(label, granted) {
      const element = document.createElement('button');
      element.type = 'button';
      element.textContent = label;
      element.style.cssText = 'padding:10px 14px;margin:4px 8px 4px 0;min-height:44px;font:inherit;color:#222;background:#fff;border:1px solid #555;border-radius:6px;cursor:pointer;';
      element.addEventListener('click', () => choose(granted ? 'granted' : 'denied'));
      return element;
    }
    section.append(summary, notice, policy, status, button('許可する', true), button('許可しない', false));
    document.body.appendChild(section);
    updateConsentDisplay();
    document.addEventListener('click', (event) => {
      for (const item of config.clickEvents || []) {
        if (event.target.closest && event.target.closest(item.selector)) window.appAnalytics.track(item.event);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', controls, { once: true });
  else controls();
})();
