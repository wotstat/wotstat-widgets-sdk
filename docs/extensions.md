# Расширения

Доступ к данным расширений осуществляется по пути `data.extensions`, список зарегистрированных расширений можно получить по пути `data.registeredExtensions`.

Вы можете подписаться на изменения данных расширения даже если оно не зарегистрировано в SDK. В этом случае значение по любому пути будет `undefined` до тех пор, пока расширение не будет зарегистрировано.

Рекомендуется типизировать используемые расширения с помощью d.ts файлов.

> [!IMPORTANT]
> Объявление типов расширений необходимо исключительно для удобства разработки и не влияет на работу SDK.

```ts
import { State, Trigger, WidgetSDK } from "wotstat-widgets-sdk"

declare global {
  interface WidgetsSdkExtensions {
    exampleExtension: {
      exampleState: State<number>
      exampleTrigger: Trigger<number>
    }
  }
}

const sdk = new WidgetSDK()
sdk.data.extensions.exampleExtension.exampleState.onChange(<...>)
```

## Разработка расширений
Подробнее о том, как разрабатывать свои расширения для SDK, можно узнать в [документации data-provider](https://github.com/WOT-STAT/data-provider).