import { VehicleWithOwner } from "."

type Spotted = {
  type: 'spotted'
  data: {
    vehicle: VehicleWithOwner
    isVisible: boolean
    isDirect: boolean
    isRoleAction: boolean
  }
}

type RadioAssist = {
  type: 'radioAssist'
  data: null
}

export type PlayerFeedback = Spotted | RadioAssist