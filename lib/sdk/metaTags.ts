
const META_PREFIX = 'wotstat-widget:'

function setMeta(name: string, content: string = 'true') {
  const prefixedName = META_PREFIX + name
  if (document.head.querySelector(`meta[name="${prefixedName}"]`)) return
  const meta = document.createElement('meta')
  meta.name = prefixedName
  meta.content = content
  document.head.appendChild(meta)
}

function removeMeta(name: string) {
  const meta = document.head.querySelector(`meta[name="${META_PREFIX + name}"]`)
  if (meta) meta.remove()
}

export namespace MetaTags {
  export function setAutoHeight(enabled: boolean) {
    if (enabled) setMeta('auto-height')
    else removeMeta('auto-height')
  }

  export function setHangarOnly(enabled: boolean) {
    if (enabled) setMeta('hangar-only')
    else removeMeta('hangar-only')
  }

  export function setReadyToClearData(enabled: boolean) {
    if (enabled) setMeta('ready-to-clear-data')
    else removeMeta('ready-to-clear-data')
  }

  export function setUseSniperMode(enabled: boolean) {
    if (enabled) setMeta('use-sniper-mode')
    else removeMeta('use-sniper-mode')
  }

  /**
   * @deprecated This function is deprecated. Use setAutoHeight(true) instead.
   */
  export function enableAutoHeight() {
    setMeta('wotstat-widget:auto-height')
  }

  /**
   * @deprecated This function is deprecated. Use setAutoHeight(false) instead.
   */
  export function disableAutoHeight() {
    removeMeta('wotstat-widget:auto-height')
  }

}