
type ValueType = any
type Path = string

export type InitMessage = {
  type: 'init',
  states: { path: Path, value: ValueType }[]
}

export type ChangeStateMessage = {
  type: 'state',
  path: Path,
  value: ValueType
}

export type TriggerMessage = {
  type: 'trigger',
  path: Path,
  value?: ValueType
}
