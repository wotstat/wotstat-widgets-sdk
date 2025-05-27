
const META_PREFIX = 'wotstat-widget:'

function setMeta(name: string, content: string = 'true') {
  const prefixedName = META_PREFIX + name
  if (document.head.querySelector(`meta[name="${prefixedName}"]`)) {
    if (content === 'true') return
    const meta = document.head.querySelector(`meta[name="${prefixedName}"]`) as HTMLMetaElement
    meta.content = content
    return
  }

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

  export function setPreferredTopLayer(enabled: boolean) {
    if (enabled) setMeta('preferred-top-layer')
    else removeMeta('preferred-top-layer')
  }

  export function setUnlimitedSize(enabled: boolean) {
    if (enabled) setMeta('unlimited-size')
    else removeMeta('unlimited-size')
  }

  export function setInsets(value: false | string | number | { top?: number, right?: number, bottom?: number, left?: number }) {
    if (typeof value === "object") {
      const { top = 0, right = 0, bottom = 0, left = 0 } = value
      value = `${top} ${right} ${bottom} ${left}`
    } else if (typeof value === "number") {
      value = `${value} ${value} ${value} ${value}`
    } else if (typeof value === "string") {
      const splitted = value.trim().split(/\s\s*/)
      const values = splitted.map(v => parseFloat(v))
      if (values.length == 1) {
        value = `${values[0]} ${values[0]} ${values[0]} ${values[0]}`
      } else if (values.length == 2) {
        value = `${values[0]} ${values[1]} ${values[0]} ${values[1]}`
      } else if (values.length == 3) {
        value = `${values[0]} ${values[1]} ${values[2]} ${values[1]}`
      } else if (values.length == 4) {
        value = `${values[0]} ${values[1]} ${values[2]} ${values[3]}`
      }
    }

    if (value === false || value === '0 0 0 0') removeMeta('insets')
    else setMeta('insets', value)
  }

  /**
   * @deprecated This function is deprecated. Use setAutoHeight(true) instead.
   */
  export function enableAutoHeight() {
    setMeta('auto-height')
  }

  /**
   * @deprecated This function is deprecated. Use setAutoHeight(false) instead.
   */
  export function disableAutoHeight() {
    removeMeta('auto-height')
  }

}