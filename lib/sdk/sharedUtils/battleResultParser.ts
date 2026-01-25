
type WotVehicle = {
  accountDBID: number
  kills: number
  damageDealt: number
  damageBlockedByArmor: number
  damageAssistedTrack: number
  damageAssistedStun: number
  damageAssistedSmoke: number
  damageAssistedRadio: number
  spotted: number

  credits: number
  capturePoints: number
  damageReceived: number
  damaged: number
  directHits: number
  lifeTime: number
  mileage: number
  shots: number
  xp: number
}

type Player = {
  avatar: {
    playerRank?: number,
  }
  bdid: number,
  clanAbbrev: string,
  clanDBID: number,
  name: string,
  prebattleID: number,
  realName: string,
  team: number,
}

const VEHICLE_DEVICE_TYPE_NAMES = ['engine', 'ammoBay', 'fuelTank', 'radio', 'track', 'gun', 'turretRotator', 'surveyingDevice', 'STUN_PLACEHOLDER', 'wheel'] as const
const VEHICLE_TANKMAN_TYPE_NAMES = ['commander', 'driver', 'radioman', 'gunner', 'loader'] as const

type CritVariant = {
  type: 'DESTROYED_DEVICES',
  value: typeof VEHICLE_DEVICE_TYPE_NAMES[number]
} | {
  type: 'CRITICAL_DEVICES',
  value: typeof VEHICLE_DEVICE_TYPE_NAMES[number]
} | {
  type: 'DESTROYED_TANKMENS',
  value: typeof VEHICLE_TANKMAN_TYPE_NAMES[number]
}

type PersonalDamageDetails = {
  crits: CritVariant[]
  damageAssistedInspire: number
  damageAssistedRadio: number
  damageAssistedSmoke: number
  damageAssistedStun: number
  damageAssistedTrack: number
  damageBlockedByArmor: number
  damageDealt: number
  damageReceived: number
  deathReason: number
  directEnemyHits: number
  directHits: number
  explosionHits: number
  fire: number
  noDamageDirectHitsReceived: number
  piercingEnemyHits: number
  piercings: number
  rickochetsReceived: number
  spotted: number
  stunDuration: number
  stunNum: number
  targetKills: number
}

function get<T>(obj: object | null, key: string) {
  return obj && key in obj ? obj[key as keyof typeof obj] as T : null;
}

function sum(key: string) {
  return (acc: number, value: any) => acc + value[key]
}

function iterateInt64SetBitsIndexes(mask: number) {
  const indexes = []
  for (let i = 0; i < 64; i++) {
    if (mask & 1) {
      indexes.push(i)
    }
    mask >>= 1
  }
  return indexes
}

function critsParserGenerator(mask: number) {
  mask = mask & -257
  const maskMap = {
    DESTROYED_DEVICES: [mask >> 12 & 4095, VEHICLE_DEVICE_TYPE_NAMES] as const,
    CRITICAL_DEVICES: [mask & 4095, VEHICLE_DEVICE_TYPE_NAMES] as const,
    DESTROYED_TANKMENS: [mask >> 24 & 255, VEHICLE_TANKMAN_TYPE_NAMES] as const
  }

  let result = [] as CritVariant[]
  for (const [subType, [subMask, types]] of Object.entries(maskMap)) {
    if (subMask > 0) {
      for (const index of iterateInt64SetBitsIndexes(subMask)) {
        result.push({ type: subType as keyof typeof maskMap, value: types[index] as any })
      }
    }
  }

  return result
}

export function parseBattleResult(result: unknown) {
  if (typeof result !== 'object' || result === null) return null

  const arenaUniqueID = get<number>(result, 'arenaUniqueID')
  const players = get<object>(result, 'players')
  const personal = get<object>(result, 'personal')
  const vehicles = get<{ [key: number]: WotVehicle[] }>(result, 'vehicles')
  if (!players || !vehicles || !personal) return null

  const avatar = get<object>(personal, 'avatar')
  const avatars = get<Record<number, object>>(result, 'avatars')
  if (!avatar || !avatars) return null

  const personalBdid = get<number>(avatar, 'accountDBID')
  if (!personalBdid) return null

  const transformedPlayers = Object.entries(players).map(([key, value]) => ({
    ...value,
    avatar: avatars[Number.parseInt(key)],
    bdid: Number.parseInt(key)
  })) as Player[]

  const playerByBdid = new Map<number, Player>(transformedPlayers.map(player => [player.bdid, player]))

  const playerByVehicle = new Map<number, Player | 'bot'>()
  const vehicleByPlayer = new Map<number, WotVehicle[]>()

  for (const [key, value] of Object.entries(vehicles)) {
    const keyNumber = Number.parseInt(key)
    for (const vehicle of value) {
      playerByVehicle.set(keyNumber, playerByBdid.get(vehicle.accountDBID) ?? 'bot')

      if (!vehicleByPlayer.has(keyNumber)) {
        vehicleByPlayer.set(keyNumber, [])
      }

      vehicleByPlayer.get(keyNumber)!.push(vehicle)
    }
  }

  const playerVehiclePairs = Array.from(vehicleByPlayer.entries())
    .map(([playerBdid, vehicles]) => ({
      player: playerByBdid.get(vehicles[0].accountDBID) ?? 'bot' as const,
      vehicles: vehicles,
      stats: {
        kills: vehicles.reduce(sum('kills'), 0),
        damageDealt: vehicles.reduce(sum('damageDealt'), 0),
        damageBlockedByArmor: vehicles.reduce(sum('damageBlockedByArmor'), 0),
        damageAssistedTrack: vehicles.reduce(sum('damageAssistedTrack'), 0),
        damageAssistedStun: vehicles.reduce(sum('damageAssistedStun'), 0),
        damageAssistedSmoke: vehicles.reduce(sum('damageAssistedSmoke'), 0),
        damageAssistedRadio: vehicles.reduce(sum('damageAssistedRadio'), 0),
        credits: vehicles.reduce(sum('credits'), 0),
        capturePoints: vehicles.reduce(sum('capturePoints'), 0),
        droppedCapturePoints: vehicles.reduce(sum('droppedCapturePoints'), 0),
        damageReceived: vehicles.reduce(sum('damageReceived'), 0),
        damaged: vehicles.reduce(sum('damaged'), 0),
        directHits: vehicles.reduce(sum('directHits'), 0),
        lifeTime: vehicles.reduce(sum('lifeTime'), 0),
        mileage: vehicles.reduce(sum('mileage'), 0),
        shots: vehicles.reduce(sum('shots'), 0),
        spotted: vehicles.reduce(sum('spotted'), 0),
        xp: vehicles.reduce(sum('xp'), 0),
      }
    }))

  const personalVehicle = playerVehiclePairs.find(pair => pair.player != 'bot' && pair.player.bdid === personalBdid)

  const common = get<object>(result, 'common')
  const winnerTeam = get<number>(common, 'winnerTeam')
  const resultType = winnerTeam == 0 ? 'draw' : winnerTeam == get<number>(avatar, 'team') ? 'win' : 'lose'


  const details = Object.entries(personal)
    .filter(([key, value]) => key !== 'avatar')
    .map(([key, value]) => value)
    .map(t => Object.values(t.details).map((t: any) => ({ ...t, crits: critsParserGenerator(t.crits) })) as PersonalDamageDetails[])
    .reduce((acc, value) => acc.concat(value), [])

  const comp7 = {
    ratingDelta: get<number>(avatar, 'comp7RatingDelta'),
    rating: get<number>(avatar, 'comp7Rating'),
    qualActive: get<boolean>(avatar, 'comp7QualActive'),
    qualBattleIndex: get<number>(avatar, 'comp7QualBattleIndex'),
    rank: get<[number, number]>(avatar, 'comp7Rank'),
  }

  const arenaTypeID = get<number>(common, 'arenaTypeID') ?? 0


  let prebattleID = 0
  if (personalVehicle && personalVehicle?.player !== 'bot' && 'prebattleID' in personalVehicle.player) {
    prebattleID = personalVehicle.player.prebattleID;
  }

  const platoon = prebattleID == 0 ? [personalVehicle] :
    playerVehiclePairs.filter(t => t.player != 'bot' && t.player.prebattleID == prebattleID)

  return {
    arenaUniqueID,
    result: resultType as typeof resultType,
    common: {
      bonusType: get<number>(common, 'bonusType'),
      arenaTypeID: get<number>(common, 'arenaTypeID'),
      arenaId: arenaTypeID & (1 << 16) - 1,
      winnerTeam: get<number>(common, 'winnerTeam'),
      duration: get<number>(common, 'duration') ?? 0,
      arenaCreateTime: get<number>(common, 'arenaCreateTime') ?? 0,
    },
    players: playerVehiclePairs,
    personal: personalVehicle ? {
      ...personalVehicle,
      comp7,
      details,
    } : undefined,
    platoon
  }
}
