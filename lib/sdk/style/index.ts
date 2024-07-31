import { accentQueryKey, backgroundQueryKey, defaultAccentColor, defaultBackgroundColor } from './contstants'
import style from './style.scss?inline'


function setupHistoryChanged() {
  const pushState = history.pushState
  const replaceState = history.replaceState

  history.pushState = function (state: any, title: string, url?: string | URL | null) {
    const result = pushState.apply(history, arguments as any)
    window.dispatchEvent(new Event('locationchange'))
    return result
  }

  history.replaceState = function (state: any, title: string, url?: string | URL | null) {
    const result = replaceState.apply(history, arguments as any)
    window.dispatchEvent(new Event('locationchange'))
    return result
  }

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'))
  })

}

function onLocationChange(href: string) {
  const qeury = href.split('?')[1]
  if (!qeury) return

  const params = qeury.split('&').map(t => t.split('=')) as [string, string][]
  const map = new Map(params)

  const colorProcess = (key: string, defaultValue: string) => {
    const color = map.get(key) ?? defaultValue
    if (color.startsWith('#')) return color
    return `#${color}`
  }

  const accentColor = colorProcess(accentQueryKey, defaultAccentColor)
  const backgroundColor = colorProcess(backgroundQueryKey, defaultBackgroundColor)


  document.documentElement.style.setProperty('--wotstat-accent', accentColor)
  document.documentElement.style.setProperty('--wotstat-background', backgroundColor)
}

export function setup() {
  document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`)
  setupHistoryChanged()

  let previousHref = window.location.href
  window.addEventListener('locationchange', () => {
    if (window.location.href !== previousHref) {
      previousHref = window.location.href
      onLocationChange(previousHref)
    }
  })

  onLocationChange(previousHref)
}