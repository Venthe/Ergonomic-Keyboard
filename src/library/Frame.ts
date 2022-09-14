import { Vec3 } from '@jscad/modeling/src/maths/types'
import { scale, subtract, add, dot, cross, normalize } from './vector3'
import { BezierControlPoints, bezier3 } from './bezier'

export class Frame {
  /**
  *
  * @param origin Origin of all vectors, i.e. the on-curve point
  * @param tangent tangent vector
  * @param rotationalAxis rotational axis vector
  * @param normal normal vector
  */
  public constructor (readonly origin: Vec3, readonly tangent: Vec3, readonly rotationalAxis: Vec3, readonly normal: Vec3, readonly step: number) { }

  public generateNextRotationMinimizingFrame (stepIncrement: number, controlPoints: BezierControlPoints): Frame {
    const nextStep: number = this.step + stepIncrement
    const newFrameOrigin: Vec3 = bezier3(nextStep, controlPoints)
    const newFrameTangent: Vec3 = Frame.frenetTangent(nextStep, controlPoints)
    const v1: Vec3 = subtract(newFrameOrigin, this.origin)
    const c1: number = dot(v1, v1)
    const previousFrameRotationalAxis: Vec3 = this.rotationalAxis
    const previousFrameTangent: Vec3 = this.tangent
    const riL: Vec3 = subtract(previousFrameRotationalAxis, scale(v1, (2 / c1) * dot(v1, previousFrameRotationalAxis)))
    const tiL: Vec3 = subtract(previousFrameTangent, scale(v1, (2 / c1) * dot(v1, previousFrameTangent)))
    const v2: Vec3 = subtract(newFrameTangent, tiL)
    const c2: number = dot(v2, v2)
    const newFrameRotationalAxis: Vec3 = subtract(riL, scale(v2, 2 / c2 * dot(v2, riL)))
    const newFrameNormal: Vec3 = cross(newFrameRotationalAxis, newFrameTangent)

    return new Frame(
      newFrameOrigin,
      newFrameTangent,
      newFrameRotationalAxis,
      newFrameNormal,
      nextStep
    )
  }

  public static generateFrenetFrame (step: number, controlPoints: BezierControlPoints): Frame {
    const origin = bezier3(step, controlPoints)
    const tangent = Frame.frenetTangent(step, controlPoints)
    const rotationalAxis = Frame.frenetRotationalAxis(step, controlPoints)
    const normal = Frame.frenetNormal(step, controlPoints)

    return new Frame(origin, tangent, rotationalAxis, normal, step)
  }

  /**
    * - 3 * cP[0] * (1 - step) ^ 2
    * + 3 * cP[1] * (3 * step ^ 2 - 4 * step + 1)
    * + 3 * cP[2] * (2 - 3 * step) * step
    * + 3 * cP[3] * step ^ 2
    */
  private static firstDerivative (step: number, controlPoints: BezierControlPoints): Vec3 {
    return add(
      add(
        add(
          scale(controlPoints[0], -3 * Math.pow((1 - step), 2)),
          scale(controlPoints[1], 3 * (3 * Math.pow(step, 2) - 4 * step + 1))
        ),
        scale(controlPoints[2], 3 * (2 - 3 * step) * step)
      ),
      scale(controlPoints[3], 3 * Math.pow(step, 2))
    )
  }

  /**
    * + 6 * cP[0] * (1 - step)
    * + 6 * cP[1] * (3 * step - 2)
    * + 6 * cP[2] * (1 - 3 * step)
    * + 6 * cP[3] * step
    */
  private static secondDerivative (step: number, controlPoints: BezierControlPoints): Vec3 {
    return add(
      add(
        add(
          scale(controlPoints[0], 6 * (1 - step)),
          scale(controlPoints[1], 6 * (3 * step - 2))
        ),
        scale(controlPoints[2], 6 * (1 - 3 * step))
      ),
      scale(controlPoints[3], 6 * step)
    )
  }

  private static frenetTangent (step: number, controlPoints: BezierControlPoints): Vec3 {
    return normalize(Frame.firstDerivative(step, controlPoints))
  }

  private static frenetB (step: number, controlPoints: BezierControlPoints): Vec3 {
    const tangent = Frame.frenetTangent(step, controlPoints)
    const secondDerivative = Frame.secondDerivative(step, controlPoints)
    return normalize(add(tangent, secondDerivative))
  }

  private static frenetRotationalAxis (step: number, controlPoints: BezierControlPoints): Vec3 {
    return normalize(cross(Frame.frenetTangent(step, controlPoints), Frame.frenetB(step, controlPoints)))
  }

  private static frenetNormal (step: number, controlPoints: BezierControlPoints): Vec3 {
    return normalize(cross(Frame.frenetRotationalAxis(step, controlPoints), Frame.frenetTangent(step, controlPoints)))
  }

  public static generateFramesForBezier (controlPoints: BezierControlPoints, steps: number): Frame[] {
    const firstFrame = Frame.generateFrenetFrame(0, controlPoints)
    const frames = [firstFrame]
    const singleStep = 1 / steps

    for (let i = 1; i < steps + 1; i += 1) {
      const previousFrame = frames[i - 1]
      frames.push(previousFrame.generateNextRotationMinimizingFrame(singleStep, controlPoints))
    }

    return frames
  }
}
