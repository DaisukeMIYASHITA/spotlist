import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const site = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(site, 'analytics.js'), 'utf8');
const actualConfigSource = readFileSync(resolve(site, 'analytics-config.js'), 'utf8');
function boot(overrides = {}) {
  const scripts = [], nodes = [], storage = new Map(), windowListeners = new Map();
  let storageWrites = 0;
  const samplePage = { path: '/', title: 'Fixed app name' };
  const config = {
    measurementId: 'G-TEST123456', appName: 'Test App', productionHosts: ['app.example'],
    pages: { '/': samplePage, '/index.html': samplePage }, events: ['safe_event'], ...overrides.config
  };
  if (overrides.consent) storage.set('app.analytics.consent.' + config.measurementId, overrides.consent);
  function element(tag) {
    return { tag, style: {}, append(...children) { this.children = children; }, setAttribute() {}, addEventListener() {} };
  }
  const location = {
    protocol: 'https:', hostname: 'app.example', origin: 'https://app.example', pathname: '/',
    search: '?email=secret@example.com&code=oauth-secret', hash: '#private', reload() { location.reloaded = true; location.reloadCount = (location.reloadCount || 0) + 1; },
    ...overrides.location
  };
  const document = {
    referrer: 'https://referrer.example/private?token=secret#private', readyState: 'complete',
    querySelector() { return overrides.existingTag || null; },
    createElement: element,
    head: { appendChild(value) { scripts.push(value); } },
    body: { appendChild(value) { nodes.push(value); } },
    addEventListener() {}
  };
  const window = {
    APP_ANALYTICS_CONFIG: config, location, dispatchEvent() {},
    addEventListener(type, listener) { windowListeners.set(type, listener); },
    ...overrides.window
  };
  const localStorage = {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storageWrites++; storage.set(key, value); }
  };
  const context = vm.createContext({ window, document, localStorage, URL, Date, CustomEvent: class {} });
  vm.runInContext(source, context);
  return {
    window, scripts, nodes, storage, context,
    receiveStorage(key, newValue) { windowListeners.get('storage')({ key, newValue, storageArea: localStorage }); },
    storageWrites: () => storageWrites,
    commands: () => (window.dataLayer || []).map(x => Array.from(x)) };
}

test('blank ID, unsupported host, localhost, HTTP, unknown route stay inert even after grant', () => {
  for (const override of [
    { config: { measurementId: '' } }, { config: { productionHosts: [] } },
    { location: { hostname: 'localhost' } },
    { config: { productionHosts: ['localhost'] }, location: { hostname: 'localhost' } },
    { config: { productionHosts: ['127.0.0.1'] }, location: { hostname: '127.0.0.1' } }, { location: { hostname: 'preview.app.example' } },
    { location: { protocol: 'http:' } }, { location: { pathname: '/private/user@example.com' } }
  ]) {
    const app = boot(override);
    app.window.appAnalytics.setConsent(true);
    app.window.appAnalytics.track('safe_event');
    assert.equal(app.scripts.length, 0);
    assert.equal(app.commands().length, 0);
    assert.equal(app.nodes.length, 0);
  }
});

test('no tag before explicit grant; fixed metadata and allowlisted events after grant', () => {
  const app = boot();
  assert.equal(app.scripts.length, 0);
  assert.equal(app.nodes.length, 1, 'settings remain reopenable');
  app.window.appAnalytics.track('safe_event');
  assert.equal(app.commands().length, 0);
  app.window.appAnalytics.setConsent(true);
  assert.equal(app.scripts.length, 1);
  assert.equal(app.scripts[0].referrerPolicy, 'no-referrer');
  assert.equal(app.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-TEST123456');
  assert.equal(app.commands().filter(c => c[0] === 'event' && c[1] === 'page_view').length, 1);
  app.window.appAnalytics.track('safe_event', { email: 'user@example.com' });
  app.window.appAnalytics.track('user@example.com');
  assert.equal(app.commands().filter(c => c[0] === 'event').length, 2);
  const event = app.commands().find(c => c[1] === 'safe_event')[2];
  assert.equal(event.page_location, 'https://app.example/');
  assert.equal(event.page_referrer, 'https://referrer.example/');
  assert.equal(event.page_title, 'Fixed app name');
  assert.equal(event.email, undefined);
  assert.doesNotMatch(JSON.stringify(app.commands()), /oauth-secret|token=|private|user@example|secret@example/);
  const config = app.commands().find(c => c[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
});

test('repeat grant / loader injection does not duplicate; revoke disables tag and future events', () => {
  const app = boot({ consent: 'granted' });
  app.window.appAnalytics.setConsent(true);
  vm.runInContext(source, app.context);
  assert.equal(app.scripts.length, 1);
  assert.equal(app.commands().filter(c => c[1] === 'page_view').length, 1);
  app.window.appAnalytics.setConsent(false);
  const count = app.commands().length;
  app.window.appAnalytics.track('safe_event');
  assert.equal(app.commands().length, count);
  assert.equal(app.window['ga-disable-G-TEST123456'], true);
  assert.equal(app.window.location.reloaded, true);
  assert.equal(app.storage.get('app.analytics.consent.G-TEST123456'), 'denied');
});

test('cross-tab consent changes sync display, stop events, and reload once without echoing storage writes', () => {
  const app = boot();
  const status = app.nodes[0].children[3];
  app.receiveStorage('app.analytics.consent.G-OTHER12345', 'granted');
  assert.equal(app.scripts.length, 0, 'other app choice is ignored');
  assert.equal(app.window.location.reloadCount, undefined);
  app.receiveStorage('app.analytics.consent.G-TEST123456', 'denied');
  assert.equal(app.window.location.reloadCount, undefined, 'no reload before initialization');
  app.receiveStorage('app.analytics.consent.G-TEST123456', 'granted');
  assert.equal(app.scripts.length, 1);
  assert.equal(status.textContent, 'アクセス解析を許可しています');
  app.receiveStorage('app.analytics.consent.G-TEST123456', 'denied');
  const count = app.commands().length;
  app.window.appAnalytics.track('safe_event');
  assert.equal(app.commands().length, count);
  assert.equal(app.window['ga-disable-G-TEST123456'], true);
  assert.equal(status.textContent, 'アクセス解析は停止しています');
  assert.equal(app.window.location.reloadCount, 1);
  app.receiveStorage('app.analytics.consent.G-TEST123456', 'denied');
  app.receiveStorage(null, null); // localStorage.clear() in another tab also revokes.
  assert.equal(app.window.location.reloadCount, 1);
  assert.equal(app.storageWrites(), 0, 'storage events must not write back');
});

test('existing tag avoids a second collection integration', () => {
  const app = boot({ existingTag: {}, consent: 'granted' });
  app.window.appAnalytics.setConsent(true);
  assert.equal(app.scripts.length, 0);
  assert.equal(app.commands().length, 0);
});

test('each real page includes exactly one loader and resolves local assets', () => {
  function htmlFiles(folder) {
    return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
      const path = resolve(folder, entry.name);
      return entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules'
        ? htmlFiles(path) : entry.isFile() && path.endsWith('.html') ? [path] : [];
    });
  }
  const context = vm.createContext({ window: {} });
  vm.runInContext(actualConfigSource, context);
  const config = context.window.APP_ANALYTICS_CONFIG;
  for (const page of htmlFiles(site)) {
    const html = readFileSync(page, 'utf8');
    for (const name of ['analytics-config.js', 'analytics.js']) {
      const matches = [...html.matchAll(new RegExp('<script src="([^"]*' + name.replace('.', '\\.') + ')" defer></script>', 'g'))];
      assert.equal(matches.length, 1, page + ' includes ' + name);
      assert.ok(existsSync(resolve(dirname(page), matches[0][1])));
    }
    const route = '/' + page.slice(site.length + 1).replace(/index\.html$/, '');
    assert.ok(config.pages[route], 'known route ' + route);
  }
});
