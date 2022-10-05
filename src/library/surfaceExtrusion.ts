import { Vec3 } from '@jscad/modeling/src/maths/vec3'
import { FaceIndices, Surface, SurfacePoint } from './surface'
import { add, normalize, scale } from './vector3'

export interface ExtrudedPointData extends SurfacePoint {
  previousOrigin: Vec3
}

const extrudeSurface = (originalSurface: Surface<SurfacePoint>, extrusionSize: number): Surface<SurfacePoint & ExtrudedPointData> => {
  const moveOriginByExtrusionSize = (point: Vec3, direction: Vec3): Vec3 =>
    add(point, scale(normalize(direction), extrusionSize))

  return {
    faces: originalSurface.faces,
    points: originalSurface.points.map<ExtrudedPointData>(originalPoint => ({
      normal: originalPoint.normal,
      origin: moveOriginByExtrusionSize(originalPoint.origin, originalPoint.normal),
      previousOrigin: originalPoint.origin,
      isEdge: originalPoint.isEdge
    }))
  }
}

export const generateExtrudedSurface = (originalSurface: Surface<SurfacePoint>, extrusion: number): Surface<SurfacePoint | ExtrudedPointData> =>
  concatSurface(originalSurface, extrudeSurface(originalSurface, extrusion))

const concatSurface = (originalSurface: Surface<SurfacePoint>, extrudedSurface: Surface<ExtrudedPointData>): Surface<SurfacePoint | ExtrudedPointData> => {
  const pointsCount = originalSurface.points.length

  const points = ([] as (SurfacePoint | ExtrudedPointData)[]).concat(originalSurface.points, extrudedSurface.points)
  const faces = ([] as FaceIndices[]).concat(
    originalSurface.faces,
    extrudedSurface.faces.map(f => [
        f[0] + pointsCount,
        f[1] + pointsCount,
        f[2] + pointsCount
      ])
      .map(f => [f[2], f[1], f[0]])
  )

  return {
    points,
    faces
  }
}
