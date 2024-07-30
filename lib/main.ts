import style from './style.scss?inline'

document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`)

export { SDK as WidgetSDK } from "./sdk/sdk"
export type { State, Trigger } from "./utils/deepProxy"