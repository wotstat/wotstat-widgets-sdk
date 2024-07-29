
import { ChangeStateMessage, InitMessage, TriggerMessage } from "./types";


export function isValidInitData(data: unknown): data is InitMessage {

  if (typeof data !== 'object') return false;
  if (data === null) return false;
  if (!('type' in data)) return false;
  if (data.type !== 'init') return false;
  if (!('states' in data)) return false;
  if (!Array.isArray(data.states)) return false;

  return true;
}

export function isValidChangeStateData(data: unknown): data is ChangeStateMessage {
  if (typeof data !== 'object') return false;
  if (data === null) return false;
  if (!('type' in data)) return false;
  if (data.type !== 'state') return false;
  if (!('path' in data)) return false;
  if (!('value' in data)) return false;

  return true;
}

export function isValidTriggerData(data: unknown): data is TriggerMessage {
  if (typeof data !== 'object') return false;
  if (data === null) return false;
  if (!('type' in data)) return false;
  if (data.type !== 'trigger') return false;
  if (!('path' in data)) return false;

  return true;
}