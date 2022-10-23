import { Vec3 } from '@jscad/modeling/src/maths/types'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'

export interface Params {
  Key_padding: number
  Key_size: number
  Keyboard_offset: number
  Key_small_size_multiplier: number
  Keyboard_depth_mult: number
  // CSG.Vector3D
  Keyboard_arc_origin: Vec3
  Keyboard_wing_angle: number
  Keyboard_wing_angle_origin_offset: number
  Arc_height_max: number
  Arc_width: number
  Enable_debug: boolean
  Debug_point_base_size: number
}

export interface Variables {
  origin: Vec3
  keySmallSize: number
  baseKeyboardHeight: number
}

export type ExtendedParams = Params & Variables
