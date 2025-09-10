import { State, Trigger } from "../../utils/deepProxy"
import { KeyCodes } from "./keycodes"
import { AttackReason, PlayerFeedback } from "./playerFeedbacks"

type Vector3 = [x: number, y: number, z: number]
type Rotation = [pitch: number, yaw: number, roll: number]

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

type AimingMode = 'arcade' | 'strategic' | 'arty' | 'sniper' | 'postmortem' | 'debug' | 'video' | 'mapcase' | 'arcadeMapcase' | 'epicMapcase' | 'respawn' | 'deathfreecam' | 'dualgun' | 'arcadeEpicMinefieldMapcase' | 'killcam' | 'vehiclesSelection' | 'twinGun' | 'lookAtKiller'

export type VehicleWithOwner = Vehicle & {
  playerName: string
  playerId: number
  team: number
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
    state: State<'loading' | 'login' | 'hangar' | 'battle'>
    serverTime: State<number>
    fps: State<number>
    ping: State<number>
    isInReplay: State<boolean>
    dataProviderVersion: State<number>
  }

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
    isInHangar: State<boolean>
    battleMode: State<string>
    isInQueue: State<boolean>
    onEnqueue: Trigger<null>
    onDequeue: Trigger<null>
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
        unlockedModifications: (string | null)[]
        selectedModifications: (string | null)[]
        modifications: string[][]
      }>
    }
  }

  battle: {
    isInBattle: State<boolean>
    period: State<{
      tag: string
      endTime: number
      length: number
    }>

    arenaId: State<number>
    arena: State<{
      tag: string
      localizedName: string
      mode: string
      gameplay: string
      team: number
    }>
    vehicle: State<Vehicle>
    health: State<number>
    maxHealth: State<number>
    isAlive: State<boolean>

    position: State<Vector3>
    rotation: State<Rotation>
    velocity: State<[linear: number, angular: number]>
    turretYaw: State<number>
    turretRotationSpeed: State<number>
    gunPitch: State<number>

    aiming: {
      isAutoAim: State<boolean>
      isServerAim: State<boolean>
      idealDispersion: State<number>
      serverDispersion: State<number>
      clientDispersion: State<number>
      aimingTime: State<number>
      aimingMode: State<AimingMode>
    }

    efficiency: {
      damage: State<number>
      assist: State<number>
      blocked: State<number>
      stun: State<number>
    }

    teamBases: State<{
      [key: string]: {
        baseID: number
        points: number
        timeLeft: number
        invadersCount: number
        capturingStopped: boolean
      }[]
    }>

    onDamage: Trigger<{
      target: VehicleWithOwner | null,
      attacker: VehicleWithOwner | null,
      damage: number,
      health: number,
      reason: AttackReason
    }>

    onPlayerFeedback: Trigger<PlayerFeedback>
    onBattleResult: Trigger<unknown>
  }

  dossier: {
    current: State<{
      vehicleTag?: string
      movingAvgDamage: number
      damageRating: number
      battlesCount: number
    } | null>
  }

  moeInfo: {
    isAvailable: State<boolean>
    current: State<{
      vehicleTag: string
      battleCount: number
      damageBetterThanNPercent: number[]
    } | null>
  }

  extensions: WidgetsSdkExtensions
  registeredExtensions: State<string[]>
}

declare global {
  interface WidgetsSdkExtensions { }
}