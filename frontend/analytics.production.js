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

  window.clarity = window.clarity || function clarity() {
    ;(window.clarity.q = window.clarity.q || []).push(arguments)
  }

  var clarityScript = document.createElement('script')
  clarityScript.async = true
  clarityScript.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(clarityProjectId)
  document.head.appendChild(clarityScript)
})()
