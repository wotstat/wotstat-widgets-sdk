import { ShellType } from "../dataTypes/playerFeedbacks";
import EN from "./en.json";
import RU from "./ru.json";

type Language = 'ru' | 'en'

const Translations = {
  en: EN,
  ru: RU,
} as const

export namespace I18n {

  export function t(key: string, lang: Language = 'en') {
    const keys = key.split('.')

    let value = Translations[lang] as Record<string, any>
    for (const part of keys) {
      if (part in value) {
        value = value[part]
      } else {
        throw new Error(`Key: ${key} not found in translation`);
      }
    }

    return value
  }

  export function shortShellName(shellType: ShellType, lang: Language = 'en') {
    return t(`shortShellNames.${shellType}`, lang)
  }
}