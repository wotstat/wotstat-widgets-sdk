# wotstat-widgets-sdk
[![npm package][npm-img]][npm-url]
[![Downloads][downloads-img]][downloads-url]
[![Build Status][build-img]][build-url]

JavaScript библиотека для создания веб-виджетов и связи с `wotstat-data-provider` модом.

![schema](https://raw.githubusercontent.com/WOT-STAT/wotstat-widgets-sdk/main/.github/widgets-sdk.png)

> Для работы SDK необходим мод [wotstat-data-provider](https://github.com/WOT-STAT/data-provider) или [wotstat-widgets](https://github.com/WOT-STAT/wotstat-widgets)

## Установка

### С помощью npm:
```bash
npm i wotstat-widgets-sdk
```

### С помощью CDN:
```html
<script src="https://unpkg.com/wotstat-widgets-sdk"></script>
```
После чего, будет объявлен глобальный объект `WotstatWidgetsSdk`.


> Рекомендуется использовать NPM  
> Вместе с пакетом устанавливается объявление типов, что сильно упрощает разработку.

## Использование

С помощью [widgets.wotstat.info/remote-control](https://widgets.wotstat.info/remote-control) можно тестировать виджеты. Поддерживается эмуляция data-provider и relay-server.

## WidgetsRelay
Используется для создания pear-to-pear взаимодействия между виджетами. Позволяет определить состояние, которое будет синхронизироваться между всеми виджетами, использующими этот `WidgetsRelay`. Состояния не хранятся на сервере, а передаются напрямую между виджетами. 


```js
import { WidgetsRelay } from 'wotstat-widgets-sdk'

const relay = new WidgetsRelay()

const simple = relay.createState('simple', 0)
const complex = relay.createState('complex', { foo: { bar: 0, 'long/deep': 0 }, baz: 0 })
```

Для установки значения состояния используется обычная запись в свойство `value`, при изменении комплексных значений, необходимо вызвать метод `trigger()`, чтоб сообщить системе, что значение изменилось.

```js

// Слежение за изменением, вызывается и при изменении своего значения и при синхронизации
simple.watch(v => {
  console.log('Simple value changed:', v)
  console.log('Current value:', simple.value)
  console.log('All users values:', simple.all)
}, { immediate: true })


// Изменение простого состояния
simple.value = 5

// Изменение комплексного состояния
counter.value.baz = 10
counter.trigger()
```

Синхронизация производится внутри канала по ключу состояния, ключ канала задаётся в URL, например: `?channel-key=demo` или в параметрах `new WidgetsRelay({ channel: 'demo' })`.

## WidgetsRemote
Используется для создания удалённых серверных состояний. Можно использовать отдельно от взаимодействия с игрой для веб виджетов общего назначения. Состояния можно редактировать через [widgets.wotstat.info/remote-control](https://widgets.wotstat.info/remote-control). Состояния хранятся на сервере и синхронизируются со всеми клиентами.

Для обеспечения безопасности, запись данных осуществляется с помощью произвольного ключа, а чтение данных осуществляется по хешу от этого ключа. На клиент хеш по умолчанию берётся из URL, например: `?remote-key=demo` или из параметров `new WidgetsRemote({ channel: 'demo' })`.

Состояния определяются с помощью метода `defineState<T>(key: string, defaultValue: T)`.

Поддерживается пять типов состояний:
- `number` - число
- `string` - строка
- `color` - цвет (формат `#RRGGBB`)
- `boolean` - логическое значение
- `select` - выбор из списка (варианты задаются в виде массива)

Для удобства редактирования, ключи могут быть разделены на группы с помощью символа `/`, например: `simple/number`, `helper/query`. В этом случае, в интерфейсе удалённого управления будет создана иерархия состояний. Кроме того, можно указать элемент, к которому будет привязано состояние с помощью опционального параметра `element`, который может быть элементом, селектором, либо функцией, возвращающей элемент. Для текстовых, числовых и булевых состояний, оно будет записываться в `element.innerText`. Кроме того, значение будет записываться в `attribute` и переменную стилей элемента с префиксом `remote-`. С помощью `defineElementHelper` можно указать элемент который будет отображаться в [widgets.wotstat.info/remote-control](https://widgets.wotstat.info/remote-control) рамкой для удобного определения состояния.

```js
import { WidgetsRemote } from 'wotstat-widgets-sdk'

const remote = new WidgetsRemote()

const number = remote.defineState('simple/number', 0)
const string = remote.defineState('simple/string', 'default')
const color = remote.defineState('simple/color', '#4c8cff', { type: 'color' })
const boolean = remote.defineState('simple/boolean', false)
const select = remote.defineState('simple/select', 'foo', {
  type: {
    type: 'select',
    variants: ['foo', 'bar', 'baz']
  }
})

const helperQuery = remote.defineState('helper/query', 0, { element: '#bbox' })
const helperElement = remote.defineState('helper/element', 0, { element: window.bbox })
const helperGetter = remote.defineState('helper/getter', 0, { element: () => window.bbox })
remote.defineElementHelper('simple', '#simple-states')

```

Для слежения за состоянием, можно использовать метод `watch`. Опциональный параметр `{ immediate: true }` позволяет сразу получить текущее значение состояния в момент подписки.

```js
// Подписка на изменение состояния
const unwatch = number.watch(v => {
 console.log('simple/number changed to', v)
}, { immediate: true })

// Получение текущего значения состояния
console.log('Current value of simple/number:', number.value)

// Отписка от изменения состояния
unwatch()
```

## WidgetSDK
Используется для связи с модом `wotstat-widgets` и получения данных из игр World of Tanks и Мир Танков.

```js
import { WidgetSDK } from 'wotstat-widgets-sdk'

// инициализация SDK
const sdk = new WidgetSDK()

// подписка на изменение статуса (ожидание открытия игры)
sdk.onStatusChange(status => console.log(status))

// получение текущего танка
const currentTank = sdk.data.hangar.vehicle.info.value
console.log('Current tank:', currentTank)

// подписка на изменение танка
sdk.data.hangar.vehicle.info.watch((newValue, oldValue) => {
  console.log('New tank:', newValue)
  console.log('Old tank:', oldValue)
})

// подписка на получение результата боя
sdk.data.battle.onBattleResult.watch(result => {
  console.log('Battle result:', result)
})

// подписка на действие очистки данных
const { setReadyToClearData } = sdk.commands.onClearData(() => {
  console.log('Clear data')
})

// готовность к очистке данных (если передать false, то кнопки очистки данных не будет)
setReadyToClearData(true)
```

Больше примеров можно найти тут: [examples](./examples)

### DataProvider
Для связи с модом `wotstat-data-provider` SDK предоставляет объект `data`, внутри него иерархическая структура данных, у которой на определённом уровне встречается `State` (состояние) или `Trigger` (событие).

Часть `data`:
```ts
{
  hangar: {
    vehicle: {
      info: {
        value: State<...>
      }
    }
  },
  battle: {
    onBattleResult: Trigger<...>
  }
}
```

Более подробная информация в [документации](./docs/api.md).

### Стили

SDK предоставляет некоторые стандартные стили для удобства разработки виджетов. Доступ к стилям можно получить двумя способами:
- Через использование длинных классов (например, `wotstat-background`, `wotstat-accent`)
- Через использование родительского класса `widgets-sdk-styles` и дочерних коротких классов (например, `background`, `accent`)

Стили будут доступны после инициализации SDK или вы можете проинициализировать их самостоятельно:

```js
import { injectStylesheet, setupStyles } from 'wotstat-widgets-sdk'

// Вставляет код CSS в head документа
injectStylesheet()

// Вставляет код CSS в head документа и добавляет обработчики на обновление стилей от query параметров. Вызов injectStylesheet не требуется.
setupStyles()
```

```html

> Цвета `background` и `accent` автоматически изменяются в зависимости от query параметров в URL.
>  `background` и `accent` соответственно, например: `?background=292929&accent=4ee100`. Поддерживается прозрачность.


#### Пример
```html
<body>
  <div class="widgets-sdk-styles">
    <div class="background">
      <h1 class="accent">Widget</h1>
    </div>
  </div>

  <div class="wotstat-background">
    <h1 class="wotstat-accent">Widget</h1>
  </div>
</body>
```

Более подробная информация в [документации о стилях](./docs/styles.md).

### WidgetMetaTags

`WidgetMetaTags` - содержит инструменты для работы с мета-тегами виджетов.  
На данный момент существует только один тег – `wotstat-widget:auto-height` для автоматического расчёта высоты виджета в моде `wotstat-widgets`.

```js
import { WidgetMetaTags } from 'wotstat-widgets-sdk'

// включить автоматическое изменение высоты виджета, если оно было отключено
WidgetMetaTags.setAutoHeight(true)

// сделать виджет доступным только в ангаре
WidgetMetaTags.setHangarOnly(true)

// разрешить очистку данных (пкм -> очистить данные)
WidgetMetaTags.setReadyToClearData(true)

// указать, что позиция виджета должна различаться в аркадном и снайперском прицелах (ручная настройка по ПКМ более приоритета)
WidgetMetaTags.setUseSniperMode(true)

// указать, что виджет должен быть в верхнем слое (ручная настройка по ПКМ более приоритета)
WidgetMetaTags.setPreferredTopLayer(true)

// убрать ограничение на размер виджета
WidgetMetaTags.setUnlimitedSize(true)

```

## Debug Виджет
Есть специальный `debug` виджет, который отображает почти все возможные данные SDK

https://widgets.wotstat.info/tools/debug

![](https://raw.githubusercontent.com/WOT-STAT/wotstat-widgets-sdk/main/.github/debug-widget.png)


[npm-img]: https://img.shields.io/npm/v/wotstat-widgets-sdk
[npm-url]: https://www.npmjs.com/package/wotstat-widgets-sdk
[build-img]: https://github.com/WOT-STAT/wotstat-widgets-sdk/actions/workflows/publish.yml/badge.svg
[build-url]: https://github.com/WOT-STAT/wotstat-widgets-sdk/actions/workflows/publish.yml
[downloads-img]: https://img.shields.io/npm/dt/wotstat-widgets-sdk
[downloads-url]: https://www.npmtrends.com/wotstat-widgets-sdk
