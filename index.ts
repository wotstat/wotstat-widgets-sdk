import { WidgetSDK } from "./lib/main"
// import { State, WidgetSDK } from "./dist/wotstat-widget-sdk.js"

// console.log("WidgetSDK loaded");


const widget = new WidgetSDK()

// const app = document.getElementById("app")

// declare global {
//   interface WidgetsSdkExtensions {
//     wotstat: {
//       t: State<number>
//     }
//   }
// }


// widget.onStatusChange(s => {
//   document.getElementById("status")!.innerHTML = `Status: ${s}`
// })

// widget.onAnyChange((key, value) => {
//   const li = document.createElement('li')
//   li.innerHTML = `${key}: ${value}`
//   document.getElementById("timeline")!.appendChild(li)
// })