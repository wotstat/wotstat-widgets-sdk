import { MetaTags } from "./metaTags";

const enum Commands {
  clearData = 'CLEAR_DATA'
}

export class WidgetCommands {
  private readonly onClearDataCallbacks = new Map<() => void, boolean>()

  constructor() {
    if (document.readyState === "complete") {
      this.setup();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    }
  }

  private setup() {
    window.addEventListener('wotstat-widget-command', event => {
      if (!('detail' in event)) return
      if (typeof event.detail !== 'string') return
      this.processEvent(event.detail)
    })
  }

  private processEvent(event: string) {
    switch (event) {
      case Commands.clearData:
        for (const callback of this.onClearDataCallbacks.keys()) callback()
        break
    }
  }

  onClearData(callback: () => void) {
    this.onClearDataCallbacks.set(callback, false)

    const updateReadyToClearData = () => {
      MetaTags.setReadyToClearData([...this.onClearDataCallbacks.values()].some(Boolean))
    }

    return {
      setReadyToClearData: (isReady: boolean) => {
        this.onClearDataCallbacks.set(callback, isReady)
        updateReadyToClearData()
      },
      unsubscribe: () => {
        this.onClearDataCallbacks.delete(callback)
        updateReadyToClearData()
      }
    }
  }

  forceClearData() {
    this.processEvent(Commands.clearData)
  }
}

export const widgetCommands = new WidgetCommands()