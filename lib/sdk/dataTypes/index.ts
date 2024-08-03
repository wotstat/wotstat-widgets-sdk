import { State, Trigger } from "../../utils/deepProxy"
import { KeyCodes } from "./keycodes"

type Vector3 = {
  x: number
  y: number
  z: number
}

type Vehicle = {
  tag: string
  localizedName: string
  localizedShortName: string
  level: number
  class: string
  role: string
}

type Skill = {
  tag: string
  level: number
}

type Tankman = {
  order: number
  efficiencyRoleLevel: number
  vehicleTag: string
  roles: string[]
  slills: Skill[]
  isFemale: boolean
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
    server: State<string>
  }

  gameState: State<'loading' | 'hangar' | 'queue' | 'prebattle' | 'battle'>

  player: {
    name: State<string>
    id: State<number>
  }

  account: {
    isPremium: State<boolean>
    battlesCount: State<number>
  }

  hangar: {
    vehicle: {
      info: State<Vehicle>
      crew: State<Tankman[]>
      optDevices: State<{
        tag: string | null
        specialization: string | null
      }[]>,
      shells: State<{ tag: string, count: number }[]>
      consumables: State<(string | null)[]>
      boosters: State<(string | null)[]>
      isBroken: State<boolean>
      isInBattle: State<boolean>
    }
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

  extensions: WidgetsSdkExtensions
  registeredExtensions: State<string[]>
}

declare global {
  interface WidgetsSdkExtensions { }
}