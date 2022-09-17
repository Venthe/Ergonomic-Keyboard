use <math.scad>;

/* [General] */
function _bezier3(step, control_points) =
      1 * control_points[0] * (1-step)^3
    + 3 * control_points[1] * (1-step)^2 * step
    + 3 * control_points[2] * (1-step)   * step^2
    + 1 * control_points[3]              * step^3;

function _derivative1_bezier(step, control_points) =
    - 3 * control_points[0] * (1-step)^2
    + 3 * control_points[1] * (3*step^2 - 4*step + 1)
    + 3 * control_points[2] * (2-3*step)*step
    + 3 * control_points[3] * step^2;

function _derivative2_bezier(step, control_points) =
    + 6 * control_points[0] * (1-step)
    + 6 * control_points[1] * (3*step - 2)
    + 6 * control_points[2] * (1-3*step)
    + 6 * control_points[3] * step;
/* [General end] */

/* [DTO] */
function _frame(origin, tangent, rotational_axis, normal) = [
  // Origin of all vectors, i.e. the on-curve point
  origin,
  // tangent vector
  tangent,
  // rotational axis vector
  rotational_axis,
  // normal vector
  normal
];
/* [DTO end] */

/* [Frenet] */
function _frenet_tangent(step, control_points) = _unit_vector(_derivative1_bezier(step, control_points));
function _frenet_b(step, control_points) = _unit_vector(_frenet_tangent(step, control_points) + _derivative2_bezier(step, control_points));
function _frenet_rotational_axis(step, control_points) = _unit_vector(cross(_frenet_tangent(step, control_points), _frenet_b(step, control_points)));
function _frenet_normal(step, control_points) = _unit_vector(cross(_frenet_rotational_axis(step, control_points), _frenet_tangent(step, control_points)));

function _generate_frenet_frame(step, control_points) = _frame(
  origin = _bezier3(step, control_points), 
  tangent = _frenet_tangent(step, control_points),
  rotational_axis = _frenet_rotational_axis(step, control_points),
  normal = _frenet_normal(step, control_points)
);
/* [Frenet end] */

/* [Steps] */
function _steps(max_steps) = 1 / max_steps;
function _calculate_next_step(current_step, step) = current_step + step;
/* [Steps end] */

/* [RMS functionally] */

function _last_frame_from_accumulator(accumulator)
 = accumulator[len(accumulator) - 1];

function _generate_new_frame(last_frame, next_step, curve) =
  (function(new_frame_origin, new_frame_tangent)
    (function(v1)
      (function(c1)
        (function(rotational_axis_from_last_frame, tangent_from_last_frame)
          (function(riL)
              (function(tiL)
                (function(v2)
                  (function(c2)
                    (function(new_frame_rotational_axis)
                      (function(new_frame_normal)
                        _frame(
                          origin = new_frame_origin,
                          tangent = new_frame_tangent,
                          rotational_axis = new_frame_rotational_axis,
                          normal = new_frame_normal
                        )
                      )(cross(new_frame_rotational_axis, new_frame_tangent))
                    )(riL - v2 * 2/c2 * _dot(v2, riL))
                  )(_dot(v2, v2))
                )(new_frame_tangent - tiL)
              )(tangent_from_last_frame - v1 * (2/c1) * _dot(v1, tangent_from_last_frame))
          )(rotational_axis_from_last_frame - v1 * (2/c1) * _dot(v1, rotational_axis_from_last_frame))
        )(get_rotational_axis_from_frame(last_frame), get_tangent_from_frame(last_frame))
      )(_dot(v1, v1))
    )(new_frame_origin - get_origin_from_frame(last_frame))
  )(_bezier3(next_step, curve), _frenet_tangent(next_step, curve));

function _iteratively_generate_rms_frames(current_step, step,control_points, accumulator = []) =
  // 0.9999999999 Y THO
  current_step < 0.9999999999
  ? (function(next_step) _iteratively_generate_rms_frames(
    next_step,
    step,
    control_points,
    concat(
      accumulator,
      [
        _generate_new_frame(
          _last_frame_from_accumulator(accumulator),
          next_step,
          control_points
        )
      ]
    )
  ))(_calculate_next_step(current_step, step))
  : accumulator;

function _generate_rotation_minimizing_frames(control_points, max_steps, accumulator = []) = _iteratively_generate_rms_frames(0, _steps(max_steps),control_points, len(accumulator) == 0 ? [_generate_frenet_frame(0, control_points)] : accumulator);

/* [Public] */
function _BLANK_VECTOR_TO_BE_SUBSTITUTED_BY_TANGENT() = [];
function join_bezier_by_tangent(original_bezier, target_bezier, scale = 1) =
  [
    original_bezier[3], 
    (original_bezier[2] - original_bezier[3]) * -1 * scale + original_bezier[3],
    target_bezier[0],
    target_bezier[1]
  ];
// function continous_tangent_bezier(origin_control_points, rest_control_points, scale = 1) = (function(accumulator)
//   [
//     for(l = [0:1:len(rest_control_points)]) concat(accumulator, join_bezier_by_tangent(accumulator(l), rest_control_points[l-1][0]))

//   ]
//   )([origin_control_points]);

module draw_bezier_control_points(points, size = 1) {
  translate(points[0]) color("green") sphere(size);
  translate(points[1]) color("red") sphere(size *0.6);
  translate(points[2]) color("red") sphere(size *0.6);
  translate(points[3]) color("green") sphere(size);
}

function frame_bezier3_old(control_points, steps) = [for(step=[0:1/steps:1]) _generate_frenet_frame(step, control_points)];
function frame_bezier3(control_points, steps, accumulator = []) = _generate_rotation_minimizing_frames(control_points, steps);
function get_origin_from_frame(frame) = frame[0];
function get_tangent_from_frame(frame) = frame[1];
function get_rotational_axis_from_frame(frame) = frame[2];
function get_normal_from_frame(frame) = frame[3];
function map_frames_to_points(frames) = [for(frame=frames) get_origin_from_frame(frame)];

// function bezier_get_point_at_unit(points, distance, segments=20) = calculate_bezier_point_with_normal(distance/polyline_length(get_bezier_points(segment_bezier3(points, segments))), points);