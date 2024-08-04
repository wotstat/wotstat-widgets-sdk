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
  efficiencyRoleLevel: number
  vehicleTag: string
  roles: string[]
  skills: Skill[]
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
    clanId: State<number>
    clanTag: State<string>
  }

  account: {
    credits: State<number>
    gold: State<number>
    crystal: State<number>
    freeXp: State<number>
    premium: State<{
      basic: { active: boolean, expiration: number }
      plus: { active: boolean, expiration: number }
      vip: { active: boolean, expiration: number }
    }>
  }

  platoon: {
    isInPlatoon: State<boolean>
    maxSlots: State<number>
    commander: State<number>
    slots: State<({
      name: string
      clanTag: string
      dbid: number
      rating: number
      timeJoin: number
      isOffline: boolean
      vehicle: Vehicle | null
      isReady: boolean
    } | null)[]>
  }

  hangar: {
    vehicle: {
      info: State<Vehicle>
      xp: State<number>
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
      postProgression: State<{
        level: number
        features: {
          optSwitchEnabled: boolean,
          shellsSwitchEnabled: boolean,
        }
        unlockedModifications: string[]
        selectedModifications: string[]
      }>
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