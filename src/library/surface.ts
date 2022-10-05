import { Vec3 } from "@jscad/modeling/src/maths/vec3"
import { BezierControlPoints } from "./bezier"

export type BezierSurfaceControlPoints = [BezierControlPoints, BezierControlPoints, BezierControlPoints, BezierControlPoints]
export type FaceIndices = [number, number, number]

export interface SurfacePoint {
    origin: Vec3
    normal: Vec3
    isEdge: boolean
}

export interface Surface<T extends SurfacePoint> {
    points: T[]
    faces: FaceIndices[]
}