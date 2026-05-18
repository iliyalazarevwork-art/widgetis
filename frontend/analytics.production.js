(function () {
  var gaMeasurementId = 'G-3CQ7CLTR6H'
  var clarityProjectId = 'wk1dnqivth'

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', gaMeasurementId, { send_page_view: false })

  var gaScript = document.createElement('script')
  gaScript.async = true
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaMeasurementId)
  document.head.appendChild(gaScript)

  function isAdminContext() {
    try {
      if (String(window.location.pathname || '').indexOf('/admin') === 0) return true
      if (localStorage.getItem('wty_is_admin') === '1') return true
    } catch (e) { /* storage blocked */ }
    return false
  }

  function installClarityBlock() {
    var noop = function () {}
    try {
      Object.defineProperty(window, 'clarity', { value: noop, writable: false, configurable: false })
    } catch (e) { window.clarity = noop }
    var origFetch = window.fetch
    if (typeof origFetch === 'function') {
      window.fetch = function (input, init) {
        try {
          var url = typeof input === 'string' ? input : (input && input.url) || ''
          if (/clarity\.ms/i.test(url)) {
            return Promise.resolve(new Response('', { status: 204 }))
          }
        } catch (e) { /* ignore */ }
        return origFetch.apply(this, arguments)
      }
    }
    var XHRopen = XMLHttpRequest.prototype.open
    var XHRsend = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__wtyBlockedClarity = /clarity\.ms/i.test(String(url || ''))
      return XHRopen.apply(this, arguments)
    }
    XMLHttpRequest.prototype.send = function () {
      if (this.__wtyBlockedClarity) { try { this.abort() } catch (e) {} return }
      return XHRsend.apply(this, arguments)
    }
    var origSendBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator)
    if (origSendBeacon) {
      navigator.sendBeacon = function (url, data) {
        if (/clarity\.ms/i.test(String(url || ''))) return true
        return origSendBeacon(url, data)
      }
    }
  }

  window.__wtyBlockClarity = installClarityBlock

  if (isAdminContext()) {
    installClarityBlock()
    return
  }

  window.clarity = window.clarity || function clarity() {
    ;(window.clarity.q = window.clarity.q || []).push(arguments)
  }

  var clarityScript = document.createElement('script')
  clarityScript.async = true
  clarityScript.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(clarityProjectId)
  document.head.appendChild(clarityScript)
})()
