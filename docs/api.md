# Полный список всех доступных методов API

## WidgetSDK

Точка входа в SDK. Инициализирует SDK и предоставляет доступ к данным.

```ts
class WidgetSDK<T extends WidgetsSdkData> {
  get status(): SDKStatus;
  get data(): DeepProxy<T>;

  constructor(options?: Options);
  dispose(): void;

  onStatusChange(callback: (status: SDKStatus) => void, options?: { immediate: boolean }): () => boolean;
  onAnyChange(callback: (path: string, value: any) => void): () => boolean;
  onAnyTrigger(callback: (path: string, value: any) => void): () => boolean;
}
```

### onStatusChange
Подписка на изменение статуса SDK. Возвращает функцию отписки.  
Вторым аргументом можно передать `{ immediate: true }`, чтобы получить текущий статус сразу, это удобно для инициализации.

```ts
const sdk = new WidgetSDK()
const unsubscribe = sdk.onStatusChange(status => console.log(status))
<...>
unsubscribe()
```

### onAnyChange
Подписка на изменение любого значения в данных SDK. Возвращает функцию отписки.

Первый аргумент - путь к изменённому значению, второй - новое значение.

```ts
const sdk = new WidgetSDK()
const unsubscribe = sdk.onAnyChange((path, value) => console.log(path, value))
<...>
unsubscribe()
```

### onAnyTrigger
Подписка на срабатывание любого триггера в данных SDK. Возвращает функцию отписки.

Первый аргумент - путь к сработавшему триггеру, второй - значение триггера.

```ts
const sdk = new WidgetSDK()
const unsubscribe = sdk.onAnyTrigger((path, value) => console.log(path, value))
<...>
unsubscribe()
```


## State
Предоставляет интерфейс для доступа к текущему значению `value` и подписки на его изменение `watch`. Изменённое значения сохраняется в SDK и доступно в любой момент.  
При подписке `watch`, можно указать `{ immediate: true }` вторым значением, чтобы получить текущее значение сразу, это удобно для инициализации.

```ts
export type State<T> = {
  value: T | undefined,
  watch: (callback: (value: T, old: T) => void, options?: { immediate: boolean }) => (() => void)
}
```


## Trigger
Предоставляет интерфейс для подписки на событие. При срабатывании триггера вызывается колбэк, переданный в `watch`. Триггер не хранит значение, однако оно может быть передано в колбэк.

```ts
export type Trigger<T> = {
  watch: (callback: (value: T) => void) => (() => void)
}
```

## WidgetsSdkData
Типизация данных `data-provider`. Определяет структуру данных, доступных в SDK.

| Путь                 | Комментарий                                                  |
| -------------------- | ------------------------------------------------------------ |
| [game](#game)        | Информация об игре                                           |
| [player](#player)    | Информация об игроке                                         |
| [account](#account)  | Информация о состоянии аккаунта игрока                       |
| [platoon](#platoon)  | Информация о текущем взводе                                  |
| [hangar](#hangar)    | Информация актуальная в ангаре                               |
| [battle](#battle)    | Информация актуальная в бою                                  |
| registeredExtensions | Список зарегистрированных расширений `data-provider`'a       |
| extensions           | Точка входа в данные расширений [подробнее](./extensions.md) |

### Game
Общая информация об игре

| Путь                  | Описание                                         |
| --------------------- | ------------------------------------------------ |
| `language`            | Язык игры                                        |
| `region`              | Регион                                           |
| `version`             | Версия игры                                      |
| `server`              | Текущий сервер                                   |
| `state`               | Состояние (логин, ангар, бой)                    |
| `serverTime`          | Серверное время, обновляется раз в секунду       |
| `fps`                 | Текущий fps                                      |
| `ping`                | Текущий ping                                     |
| `isInReplay`          | Запущена ли игра в режиме воспроизведения реплея |
| `dataProviderVersion` | Версия data-provider'а                           |

```ts
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
```

### Player
Общая информация об игроке

| Путь      | Описание       |
| --------- | -------------- |
| `name`    | Никнейм игрока |
| `id`      | ID игрока      |
| `clanTag` | Клан игрока    |
| `clanId`  | ID клана       |

```ts
name: State<string>
id: State<number>
clanTag: State<string>
clanId: State<number>
```

### Account
Информация о состоянии аккаунта игрока

| Путь                        | Описание               |
| --------------------------- | ---------------------- |
| `credits`                   | Количество серебра     |
| `gold`                      | Количество золота      |
| `crystal`                   | Количество бон         |
| `premium`                   | Текущий премиум статус |
| `premium.[type].active`     | Активен ли премиум     |
| `premium.[type].expiration` | Дата окончания         |

```ts
credits: State<number>
gold: State<number>
crystal: State<number>
freeXp: State<number>
premium: State<{
  basic: { active: boolean, expiration: number }
  plus: { active: boolean, expiration: number }
  vip: { active: boolean, expiration: number }
}>

```


### Platoon
Информация о текущем взводе

| Путь              | Описание                               |
| ----------------- | -------------------------------------- |
| `isInPlatoon`     | Находится ли игрок во взводе           |
| `maxSlots`        | Максимальное количество доступных мест |
| `commander`       | Индекс командира взвода                |
| `slots`           | Информация о каждом игроке во взводе   |
| `slots.name`      | никнейм                                |
| `slots.dbid`      | id игрока                              |
| `slots.clanTag`   | тег клана                              |
| `slots.rating`    | рейтинг танковый                       |
| `slots.timeJoin`  | время присоединения ко взводу          |
| `slots.isOffline` | вышел ли игрок из сети                 |
| `slots.vehicle`   | выбранный танк                         |
| `slots.isReady`   | готовность игрока                      |

```ts
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
```

### Hangar
Информация о состояние ангара

| Путь                                            | Описание                                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `isInHangar`                                    | Находится ли игрок в ангаре                                                         |
| `battleMode`                                    | Выбранный режим боя                                                                 |
| `isInQueue`                                     | Находится ли игрок в очереди                                                        |
| `onEnqueue`                                     | Событие на вход в очередь                                                           |
| `onDequeue`                                     | Событие на выход из очереди                                                         |
| `vehicle`                                       | Информация о выбранном танке                                                        |
| `vehicle.info`                                  | [Общая информация о танке](#vehicle)                                                |
| `vehicle.xp`                                    | Текущее количество опыта                                                            |
| `vehicle.isBroken`                              | Нуждается ли танк в ремонте                                                         |
| `vehicle.isInBattle`                            | Находится ли танк в бою                                                             |
| `vehicle.crew`                                  | Информация о каждом [члене экипажа](#tankman)                                       |
| `vehicle.optDevices`                            | Информация о текущем оборудовании (учитывается выбранный слот)                      |
| `vehicle.optDevices.tag`                        | Тег оборудования (`null` если не установлено)                                       |
| `vehicle.optDevices.specialization`             | Специализация слота (`null` если нет)                                               |
| `vehicle.shells`                                | Информация о текущем боекомплекте                                                   |
| `vehicle.shells.tag`                            | Тег снаряда                                                                         |
| `vehicle.shells.count`                          | Количество снарядов                                                                 |
| `vehicle.consumables`                           | Информация о текущих расходниках (`null` если нет)                                  |
| `vehicle.boosters`                              | Информация о текущих инструкциях (сейчас одна, но в коде игры может быть несколько) |
| `vehicle.postProgression`                       | Информация о полевой модернизации                                                   |
| `vehicle.postProgression.level`                 | Уровень полевой модернизации                                                        |
| `vehicle.postProgression.features`              | Настройки полевой (включены или выключены переключения слотов перед началом боя)    |
| `vehicle.postProgression.unlockedModifications` | Разблокированные модификации                                                        |
| `vehicle.postProgression.selectedModifications` | Выбранные модификации                                                               |

```ts
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
    unlockedModifications: string[]
    selectedModifications: string[]
  }>
}
```


### Battle
Информация о состояние боя

| Путь                               | Описание                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `isInBattle`                       | Находится ли игрок в бою                                                                            |
| `period`                           | Информация о периоде боя                                                                            |
| `period.tag`                       | Тег периода (ожидание игроков, таймер до начала, бой, таймер после завершения)                      |
| `period.endTime`                   | Время окончания периода по `game.serverTime`                                                        |
| `period.length`                    | Длительность периода в секундах                                                                     |
| `arenaId`                          | ID боя (общий для всех игроков в бою, уникальный на всю игру)                                       |
| `arena`                            | Информация о карте                                                                                  |
| `arena.tag`                        | Тег карты                                                                                           |
| `arena.localizedName`              | Название карты на языке игры                                                                        |
| `arena.mode`                       | Режим боя                                                                                           |
| `arena.gameplay`                   | Тип игрового процесса                                                                               |
| `arena.team`                       | Номер команды игрока                                                                                |
| `vehicle`                          | [Общая информация о танке игрока](#vehicle)                                                         |
| `health`                           | Текущее количество здоровья                                                                         |
| `maxHealth`                        | Максимальное количество здоровья                                                                    |
| `isAlive`                          | Жив ли игрок                                                                                        |
| `position`                         | Позиция танка игрока                                                                                |
| `rotation`                         | Поворот танка игрока                                                                                |
| `velocity`                         | Скорость танка игрока                                                                               |
| `velocity[linear]`                 | Линейная скорость танка игрока                                                                      |
| `velocity[angular]`                | Угловая скорость танка игрока                                                                       |
| `turretYaw`                        | Поворот башни танка игрока                                                                          |
| `turretRotationSpeed`              | Скорость поворота башни танка игрока                                                                |
| `gunPitch`                         | Угол наклона пушки танка игрока                                                                     |
| `aiming`                           | Информация о прицеливании                                                                           |
| `aiming.isAutoAim`                 | Включено ли автоприцеливание                                                                        |
| `aiming.isServerAim`               | Используется ли серверное прицеливание                                                              |
| `aiming.idealDispersion`           | Минимально возможное значение разброса в текущих условиях                                           |
| `aiming.serverDispersion`          | Текущий серверный разброс (используется для серверного прицела)                                     |
| `aiming.clientDispersion`          | Текущий клиентский разброс (используется для клиентского прицела)                                   |
| `efficiency`                       | Информация о эффективности в бою (то что слева снизу рядом с ХП танка в игре)                       |
| `efficiency.damage`                | Суммарно нанесённый урон за бой                                                                     |
| `efficiency.assist`                | Суммарно нанесённый урон по помощи за бой                                                           |
| `efficiency.blocked`               | Суммарно заблокированный урон за бой                                                                |
| `efficiency.stun`                  | Суммарно нанесённый урон оглушения за бой                                                           |
| `teamBases`                        | Информация о точках захвата команды игрока                                                          |
| `teamBases[team]`                  | Информация о **точках** команды `team`. Их может быть несколько                                     |
| `teamBases[team].baseID`           | ID точки захвата                                                                                    |
| `teamBases[team].points`           | Количество очков захвата                                                                            |
| `teamBases[team].timeLeft`         | Время до завершения захвата в секундах                                                              |
| `teamBases[team].invadersCount`    | Количество захватчиков                                                                              |
| `teamBases[team].capturingStopped` | Заблокирован ли захват                                                                              |
| `onDamage`                         | Событие об изменение хп **ЛЮБОГО** танка в радиусе видимости игрока                                 |
| `onDamage.target`                  | Информация о танке которому нанесён урон (смотри [VehicleWithOwner](#VehicleWithOwner))             |
| `onDamage.attacker`                | Информация о танке который нанёс урон, если известен (смотри [VehicleWithOwner](#VehicleWithOwner)) |
| `onDamage.damage`                  | Количество урона                                                                                    |
| `onDamage.health`                  | Оставшееся здоровье цели                                                                            |
| `onDamage.reason`                  | Причина нанесения урона (Полный список причин [тут](/lib/sdk/dataTypes/playerFeedbacks.ts))         |
| `onPlayerFeedback`                 | События в бою [Подробнее](#playerfeedback)                                                          |
| `onBattleResult`                   | Событие окончания боя с полным его результатом [BattleResult](#battleresult)                        |


```ts
isInBattle: State<boolean>
period: State<{
  tag: string
  endTime: number
  length: number
}>

arenaId: State<number>
arena: State<{
  tag: string
  mode: string
  gameplay: string
  team: number
  localizedName: string
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
  source: number
}>

onPlayerFeedback: Trigger<PlayerFeedback>
onBattleResult: Trigger<unknown>
```


### Keyboard
События нажатий клавиш на клавиатуре.

> [!NOTE]
> Учитываются нажатия **только в окне игры**. Нажатия вне окна игры не обрабатываются.
>
> 
| Путь                 | Описание                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `onAnyKey`           | Событие нажатия любой клавиши                                                                              |
| `onAnyKey.key`       | Тег нажатой клавиши                                                                                        |
| `onAnyKey.isKeyDown` | Нажата или отпущена клавиша                                                                                |
| `KEY_<...>`          | Нажата или отпущена определённая клавиша. Полный список тегов клавиш [тут](/lib/sdk/dataTypes/keycodes.ts) |

```ts
onAnyKey: Trigger<{
  isKeyDown: boolean,
  key: KeyCodes
}>,
KEY_<...>: State<boolean>
```

## Служебные типы
### Vehicle
Общая информация о танке

| Путь                 | Описание                                                    |
| -------------------- | ----------------------------------------------------------- |
| `tag`                | Тег танка                                                   |
| `localizedName`      | Локализованное имя танка (для текущего языка игры)          |
| `localizedShortName` | Короткое локализованное имя танка (для текущего языка игры) |
| `level`              | Уровень танка                                               |
| `class`              | Класс танка                                                 |
| `role`               | Роль танка                                                  |

```ts
tag: string
localizedName: string
localizedShortName: string
level: number
class: string
role: string
```

### VehicleWithOwner
Информация о танке с его владельцем. Тоже самое что и [Vehicle](#vehicle), но с добавлением информации о владельце.

| Путь         | Описание             |
| ------------ | -------------------- |
| `playerName` | Никнейм игрока       |
| `playerId`   | ID игрока            |
| `team`       | Номер команды игрока |

```ts
Vehicle & {
  playerName: string
  playerId: number
  team: number
}
```

### Tankman
Информация о члене экипажа

| Путь                  | Описание                                                         |
| --------------------- | ---------------------------------------------------------------- |
| `vehicleTag`          | Тег танка на который он обучен                                   |
| `efficiencyRoleLevel` | Прогресс обучения основной специальности                         |
| `efficiencyRoleLevel` | Текущие роли которые он выполняет (например командир + наводчик) |
| `skills`              | Перки и их уровни                                                |
| `skills.tag`          | Тег перка                                                        |
| `skills.level`        | Уровень владения перком (от 0 до 100)                            |
| `isFemale`            | Женщина или мужчина                                              |

```ts
vehicleTag: string
efficiencyRoleLevel: number
roles: string[]
skills: { tag: string, level: number }[]
isFemale: boolean
```

### PlayerFeedback
Информация о событии в бою. Передаёт объект, где `type` - тип события, а `data` - дополнительные данные.
```ts
{
  type: string,
  data: ExtraData
}
```
Данные `data` зависят от типа события. Полный список событий и их данных [тут](/lib/sdk/dataTypes/playerFeedbacks.ts).
Есть несколько основных типов данных:
- `VisibleExtra` об обнаружении противника
- `DamageExtra` о нанесении урона (с причиной, целью и количеством)
- `CriticalHitExtra` о критическом попадании
Но есть и более специфичные типы.

![playerFeedbacks](/.github/player-feedback.png)

### BattleResult
Информация о результате боя, абсолютно всё, что передаёт игра. Типизации пока что нет, оно зависит от режима боя. Вы можете вывести результат в консоль и самостоятельно разобрать его.

```ts
{
  type: string,
  data: unknown
}
```