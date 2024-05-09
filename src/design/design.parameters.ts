import { Vec3 } from "@jscad/modeling/src/maths/vec3";
import { ParameterDefinitions } from "../jscad";

export const parametersKeys = [
  "Key_padding",
  "Key_size",
  "Keyboard_offset",
  "Key_small_size_multiplier",
  "Keyboard_depth_mult",
  "Keyboard_arc_origin",
  "Keyboard_wing_angle",
  "Keyboard_wing_angle_origin_offset",
  "Arc_height_max",
  "Arc_width",
  "Enable_debug",
  "Debug_point_base_size"
]

export interface DesignParameters {
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

export const calculatedParameterKeys = [
  "origin",
  "keySmallSize",
  "baseKeyboardHeight"
]

export interface Variables {
  origin: Vec3
  keySmallSize: number
  baseKeyboardHeight: number
}

export type ExtendedParams = DesignParameters & Variables

export const getDesignParametersDefinitions = (): ParameterDefinitions => [
  { name: 'keys', type: 'group', caption: 'Keys' },
  { name: 'Key_padding', type: 'number', initial: 4, min: 0, step: 1, max: 6, caption: 'Distance between keys' },
  { name: 'Key_size', type: 'number', initial: 14.75, min: 4, step: 0.25, max: 20, caption: ' Regular key size' },
  { name: 'Keyboard_offset', type: 'number', initial: 6, min: 0, step: 1, max: 8 },
  { name: 'Key_small_size_multiplier', type: 'number', initial: 0.6, min: 0.5, step: 0.1, max: 1 },

  { name: 'ergonomic', type: 'group', caption: 'Keyboard (Ergonomic)' },
  { name: 'Keyboard_depth_mult', caption: 'How deeper should keyboard be in the middle?', type: 'number', initial: 1.05, min: 1, step: 0.01, max: 1.2 },
  { name: 'Keyboard_arc_origin', caption: 'How deep should keyboard be?', type: 'Vec3', initial: [0, 18.5, 21.25] },
  { name: 'Keyboard_wing_angle', caption: 'How steep keyboard angle should be?', type: 'number', initial: 12.5, min: 0, step: 0.5, max: 45 },
  { name: 'Keyboard_wing_angle_origin_offset', caption: 'Where the angle of keyboard wing should start', type: 'number', initial: -18, min: -20, step: 0.5, max: 20 },
  { name: 'Arc_height_max', type: 'number', initial: 22.5, min: 0, max: 30 },
  { name: 'Arc_width', type: 'number', initial: 160 },

  { name: 'debug', type: 'group', caption: 'Debug' },
  { name: 'Enable_debug', caption: 'Enable all debug methods of showing points', type: 'boolean', initial: true },
  { name: 'Debug_point_base_size', caption: 'How large a base point should be?', type: 'number', initial: 1 }
]

type EnrichParameters = (params: DesignParameters) => ExtendedParams;

export const deriveDesignParameters: EnrichParameters = (params) => {
  const keySmallSize: number = params.Key_size * params.Key_small_size_multiplier
  const baseKeyboardHeight = params.Keyboard_offset * 2 + 5 * params.Key_size + 5 * params.Key_padding + keySmallSize;
  return (
    {
      ...params,
      ...{
        // Origin for the sketch
        origin: [0, 0, 0],
        keySmallSize,
        // _v_keyboard_wing_angle_origin=[0, Keyboard_wing_angle_origin_offset, 0];
        baseKeyboardHeight: baseKeyboardHeight
      }
    }
  );
}