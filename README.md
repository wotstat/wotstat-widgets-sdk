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

Стили будут доступны после инициализации SDK.

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
