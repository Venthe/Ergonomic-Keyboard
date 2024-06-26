import { Vec3 } from "@jscad/modeling/src/maths/vec3";
import { ParameterDefinitions } from "../jscad";

// FIXME: Workaround for verification, should match ParameterDefinitions and DesignParameters
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
  "Debug_point_base_size",
  "Integrated_numpad",
  "Arrow_block",
  "Function_row",
  "Stagger"
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
  Integrated_numpad: boolean
  Arrow_block: 'condensed' | 'normal'
  Function_row: boolean
  Stagger: 'normal_stagger' | 'equal_stagger' | "symmetrical_stagger" | "columnar_stagger" | "ortholinear"
}

// FIXME: Workaround for verification, should match Variables
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
  { name: 'configuration', type: 'group', caption: 'Keyboard configuration' },
  { name: 'Integrated_numpad', type: 'boolean', caption: "Should keyboard be integrated?", initial: true },
  { name: 'Arrow_block', type: 'choice', caption: "How arrow block should be laid out?", initial: 'normal', values: ['condensed', 'normal'] },
  { name: 'Function_row', type: 'boolean', caption: "Should include functional row?", initial: true },
  { name: 'Stagger', type: 'choice', caption: "Stagger type", initial: 'normal_stagger', values: ['normal_stagger', 'equal_stagger', "symmetrical_stagger", "columnar_stagger", "ortholinear"] },

  { name: 'keys', type: 'group', caption: 'Keys' },
  { name: 'Key_padding', type: 'float', initial: 4, min: 0, step: 1, max: 6, caption: 'Distance between keys' },
  { name: 'Key_size', type: 'float', initial: 14.75, min: 4, step: 0.25, max: 20, caption: ' Regular key size' },
  { name: 'Keyboard_offset', type: 'float', initial: 6, min: 0, step: 1, max: 8 },
  { name: 'Key_small_size_multiplier', type: 'float', initial: 0.6, min: 0.5, step: 0.1, max: 1 },

  { name: 'ergonomic', type: 'group', caption: 'Keyboard (Ergonomic)' },
  { name: 'Keyboard_depth_mult', caption: 'How deeper should keyboard be in the middle?', type: 'float', initial: 1.05, min: 1, step: 0.01, max: 1.2 },
  { name: 'Keyboard_arc_origin', caption: 'How deep should keyboard be?', type: 'Vec3', initial: [0, 18.5, 21.25] },
  { name: 'Keyboard_wing_angle', caption: 'How steep keyboard angle should be?', type: 'float', initial: 12.5, min: 0, step: 0.5, max: 45 },
  { name: 'Keyboard_wing_angle_origin_offset', caption: 'Where the angle of keyboard wing should start', type: 'float', initial: -18, min: -20, step: 0.5, max: 20 },
  { name: 'Arc_height_max', type: 'float', initial: 22.5, min: 0, max: 30 },
  { name: 'Arc_width', type: 'float', initial: 160 },

  { name: 'debug', type: 'group', caption: 'Debug' },
  { name: 'Enable_debug', caption: 'Enable all debug methods of showing points', type: 'boolean', initial: true },
  { name: 'Debug_point_base_size', caption: 'How large a base point should be?', type: 'float', initial: 1 }
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