/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import { Vec3 } from '@jscad/modeling/src/maths/types'
import { sphere } from '@jscad/modeling/src/primitives'
import { hulls } from '@jscad/modeling/src'
import { Geometry } from '@jscad/modeling/src/geometries/types'
import { ExtendedParams } from '../keyboardTypes'
import RecursiveArray from '@jscad/modeling/src/utils/recursiveArray'
import * as vec3 from '@jscad/modeling/src/maths/vec3'
import { range } from './collections'
import { colorize } from '@jscad/modeling/src/colors'

export function constructionLine ({ start, stop, label }: { start: Vec3, stop: Vec3, label?: string }, params: ExtendedParams): RecursiveArray<Geometry> | Geometry {
  if (!params.Enable_debug) {
    return []
  }

  const constructionLineWidth = params.Debug_point_base_size * 0.35
  const constructionLineSegmentLength = 2
  const distance = vec3.distance(start, stop)
  const segments = Math.floor(distance / constructionLineSegmentLength)
  const singleSegment = vec3.scale([0, 0, 0], (vec3.subtract([0, 0, 0], stop, start)), 1 / segments)

  const points: Vec3[] = range(segments)
    .map(i => vec3.scale([0, 0, 0], singleSegment, i))
    .map(segment => vec3.add([0, 0, 0], segment, start))

  // console.log(points)

  const geometry = []

  for (let s = 0; s < points.length; s++) {
    if (s % 2 !== 0) {
      continue
    }

    const lastPoint = (s + 1 > (points.length - 1)) ? points.length - 1 : s + 1
    geometry.push(
      hulls.hull(
        sphere({ center: points[s], radius: constructionLineWidth }),
        sphere({ center: points[lastPoint], radius: constructionLineWidth })
      )
    )
  }

  // // TODO: Do text
  // //  midpoint = (stop + start) / 2;
  // //  if (!is_undef(label))
  // //      translate(midpoint) reorient() color("darkgray", 0.8)
  // //  text(label, Debug_point_base_size, halign = "center");

  return colorize([0, 0, 0, 0.8], geometry)
}

export const meshCloud = (points: Vec3[], params: ExtendedParams): Geometry[] =>
  points.map(p => sphere({ center: p, radius: params.Debug_point_base_size }))
