export { SDK as WidgetSDK } from "./sdk/sdk"
export type { State, Trigger } from "./utils/deepProxy"
export { MetaTags as WidgetMetaTags } from "./sdk/metaTags"
export type { WidgetsSdkData } from "./sdk/dataTypes"
export type { KeyCodes } from "./sdk/dataTypes/keycodes"
export { I18n } from "./sdk/i18n"
export { injectStyles as injectStylesheet, setup as setupStyles } from "./sdk/style/index"
export { WidgetsRelay, type RelayState } from "./sdk/relay"
export { WidgetsRemote } from "./sdk/remote"
export { RemoteDebugConnection, SdkDebugConnection, RelayDebugConnection } from "./sdk/debugUtils"