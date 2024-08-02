
export namespace MetaTags {

  export function enableAutoHeight() {
    if (document.head.querySelector('meta[name="wotstat-widget:auto-height"]')) return

    const meta = document.createElement('meta')
    meta.name = 'wotstat-widget:auto-height'
    meta.content = 'true'
    document.head.appendChild(meta)
  }

  export function disableAutoHeight() {
    const meta = document.head.querySelector('meta[name="wotstat-widget:auto-height"]')
    if (meta) meta.remove()
  }
}