import * as vec3 from '@jscad/modeling/src/maths/vec3'
import { Vec3 } from '@jscad/modeling/src/maths/vec3'

export const scale = (a: Vec3, s: number): Vec3 => vec3.scale([0, 0, 0], a, s)
export const subtract = (a: Vec3, b: Vec3): Vec3 => vec3.subtract([0, 0, 0], a, b)
export const multiply = (a: Vec3, b: Vec3): Vec3 => vec3.multiply([0, 0, 0], a, b)
export const divide = (a: Vec3, b: Vec3): Vec3 => vec3.divide([0, 0, 0], a, b)
export const add = (a: Vec3, b: Vec3): Vec3 => vec3.add([0, 0, 0], a, b)
export const normalize = (v1: Vec3): Vec3 => vec3.normalize([0, 0, 0], v1)
export const cross = (v1: Vec3, v2: Vec3): Vec3 => vec3.cross([0, 0, 0], v1, v2)
export const unit = (v1: Vec3): Vec3 => scale(v1, 1/vec3.length(v1))

export const dot = (v1: Vec3, v2: Vec3): number => vec3.dot(v1, v2)
export const distance = vec3.distance
