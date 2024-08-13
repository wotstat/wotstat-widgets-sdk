# Стили

SDK добавляет несколько классов для стилизации. Классы доступны через префикс `wotstat-` или через родительский класс `widgets-sdk-styles`.

## Список цветов
| Переменная             | Класс        | Назначение       | Значение    | Цвет                                              |
| ---------------------- | ------------ | ---------------- | ----------- | ------------------------------------------------- |
| `--wotstat-background` | `background` | Цвет фона        | `#292929`   | ![](https://placehold.co/32x32/292929/292929/png) |
| `--wotstat-accent`     | `accent`     | Цвет акцента     | `#4ee100`   | ![](https://placehold.co/32x32/4ee100/4ee100/png) |
| `--wotstat-primary`    | `primary`    | Первичный цвет   | `#ffffff`   | ![](https://placehold.co/32x32/ffffff/ffffff/png) |
| `--wotstat-secondary`  | `secondary`  | Вторичный цвет   | `#c4c4c4`   | ![](https://placehold.co/32x32/c4c4c4/c4c4c4/png) |
| `--wotstat-separator`  | `separator`  | Цвет разделителя | `#c4c4c466` | ![](https://placehold.co/32x32/909090/909090/png) |

> [!NOTE]
> Цвета `background` и `accent` автоматически изменяются в зависимости от query параметров в URL.

## Дополнительные классы

### `number`

Класс для цифровых значений. Запрет переноса и использование `tabular-nums` чтоб при изменении значения не менялась ширина блока.

```css
.number {
  text-wrap: none;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
```

### `autoscale`

Класс который определяет размер шрифта в зависимости от ширины экрана. Это необходимо для адаптивности виджета под разные размеры. Все дочернии значения (`font-size`, `padding`, `border-radius` и т.д.) необходимо задавать в `em`. Тогда при изменении ширины экрана все размеры будут масштабироваться.

```css
.autoscale {
  font-size: 4vw;
}
```

### `card`

Класс для стандартной карточки как у WotStat

```css
.card {
  background-color: var(--wotstat-background);
  color: var(--wotstat-primary);
  margin: 0;
  padding: 1em;
  border-radius: 1em;
}
```

## Рекомендации
- Рекомендуется всегда делать виджеты адаптивными. Для этого используйте класс `autoscale`.
- Для простоты использования классов используйте родительский класс `widgets-sdk-styles`.
- Используйте переменные для указания цветов фона и акцента.

```html
<div class="widgets-sdk-styles">
  <div class="autoscale">
    <div class="card">
      <p class="primary">Hello <span class="accent">Widgets!</span></p>
    </div>
  </div>
</div>
```