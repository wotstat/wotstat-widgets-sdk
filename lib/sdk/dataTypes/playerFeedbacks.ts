import { VehicleWithOwner } from "."

export type ShellType =
  'HOLLOW_CHARGE' |
  'ARMOR_PIERCING' |
  'ARMOR_PIERCING_HE' |
  'ARMOR_PIERCING_CR' |
  'SMOKE' |
  'HE_MODERN' |
  'HE_LEGACY_STUN' |
  'HE_LEGACY_NO_STUN' |
  'FLAME'

type AttackReason =
  'shot' |
  'fire' |
  'ramming' |
  'world_collision' |
  'death_zone' |
  'drowning' |
  'gas_attack' |
  'overturn' |
  'manual' |
  'artillery_protection' |
  'artillery_sector' |
  'bombers' |
  'recovery' |
  'artillery_eq' |
  'bomber_eq' |
  'minefield_eq' |
  'spawned_bot_explosion' |
  'berserker_eq' |
  'smoke' |
  'corrodingShot' |
  'AdaptationHealthRestore' |
  'thunderStrike' |
  'fireCircle' |
  'clingBrander' |
  'ram_cling_brander' |
  'ram_brander' |
  'fort_artillery_eq' |
  'static_deathzone' |
  'cgf_world' |
  'none'

type VisibleExtra = {
  isVisible: boolean
  isDirect: boolean
  isRoleAction: boolean
  vehicle: VehicleWithOwner
}

type DamageExtra = {
  damage: number,
  attackReason: AttackReason,
  secondaryReason: AttackReason,
  shellType: ShellType,
  vehicle: VehicleWithOwner
}

type CriticalHitExtra = {
  critsCount: number,
  attackReason: AttackReason,
  secondaryReason: AttackReason,
  shellType: ShellType,
  vehicle: VehicleWithOwner
}

type Spotted = {
  type: 'spotted'
  data: VisibleExtra
}

type TargetVisibility = { type: 'targetVisibility', data: VisibleExtra }
type Detected = { type: 'detected', data: VisibleExtra }
type RadioAssist = { type: 'radioAssist', data: DamageExtra }
type TrackAssist = { type: 'trackAssist', data: DamageExtra }
type Tanking = { type: 'tanking', data: DamageExtra }
type Damage = { type: 'damage', data: DamageExtra }
type SmokeAssist = { type: 'smokeAssist', data: DamageExtra }
type InspireAssist = { type: 'inspireAssist', data: DamageExtra }
type ReceivedDamage = { type: 'receivedDamage', data: DamageExtra }
type StunAssist = { type: 'stunAssist', data: DamageExtra }
type Crit = { type: 'crit', data: CriticalHitExtra }
type ReceivedCrit = { type: 'receivedCrit', data: CriticalHitExtra }
type EnemySectorCaptured = { type: 'enemySectorCaptured', data: null }
type DestructibleDestroyed = { type: 'destructibleDestroyed', data: null }
type DefenderBonus = { type: 'defenderBonus', data: null }
type Kill = { type: 'kill', data: { vehicle: VehicleWithOwner } }
type BaseCaptureDropped = { type: 'baseCaptureDropped', data: { points: number } }
type DestructibleDamaged = { type: 'destructibleDamaged', data: { damage: number } }
type DestructiblesDefended = { type: 'destructiblesDefended', data: { extra: unknown } }
type BaseCapturePoints = { type: 'baseCapturePoints', data: { points: number, session: number } }
type BaseCaptureBlocked = { type: 'baseCaptureBlocked', data: { points: number, session: number } }
type MultiStun = { type: 'multiStun', data: { stunCount: number } }


export type PlayerFeedback =
  TargetVisibility |
  Detected |
  RadioAssist |
  TrackAssist |
  Tanking |
  Damage |
  SmokeAssist |
  InspireAssist |
  ReceivedDamage |
  StunAssist |
  Crit |
  ReceivedCrit |
  EnemySectorCaptured |
  DestructibleDestroyed |
  DefenderBonus |
  Kill |
  BaseCaptureDropped |
  DestructibleDamaged |
  DestructiblesDefended |
  BaseCapturePoints |
  BaseCaptureBlocked |
  MultiStun 