import { State, Trigger } from "../../utils/deepProxy"
import { KeyCodes } from "./keycodes"

type Vector3 = {
  x: number
  y: number
  z: number
}

export interface WidgetsSdkData {
  keyboard: {
    onAnyKey: Trigger<{
      isKeyDown: boolean,
      key: KeyCodes
    }>
  } & { [key in KeyCodes]: State<boolean> }

  game: {
    language: State<string>
    region: State<string>
    version: State<string>
  }

  battle: {
    onBattleStart: Trigger<null>
    state: State<'loading' | 'prebattle' | 'battle' | 'postbattle'>
    arenaId: State<number>
    arena: State<{
      tag: string
      mode: string
      gameplay: string
      team: number
    }>
    vehicle: State<{
      tag: string
      localizedName: string
      tier: number
      type: string
      role: string
    }>
    position: State<Vector3>
    health: State<number>
    maxHealth: State<number>
    onResult: Trigger<unknown>
  }

  player: {
    name: State<string>
    id: State<number>
  }

  account: {
    isPremium: State<boolean>
    battlesCount: State<number>
  }

  gameState: State<'loading' | 'hangar' | 'queue' | 'prebattle' | 'battle'>

  extensions: WidgetsSdkExtensions
  registeredExtensions: State<string[]>
}

declare global {
  interface WidgetsSdkExtensions { }
}