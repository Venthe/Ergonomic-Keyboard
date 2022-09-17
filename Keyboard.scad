// use <Quaternions/maths.scad>;
use <library/bezier.scad>
use <library/line.scad>
use <library/math.scad>
use <library/random.scad>

// TODO: Implement RMF normal

/* [Keys] */
// Distance between keys
Key_padding = 4; // [0:6]
// Regular key size
Key_size = 14.75;                // [4:0.25:20]
Keyboard_offset = 6;             // [0:6:8]
Key_small_size_multiplier = 0.6; // [0.5:0.1:1]

/* [Keyboard (Ergonomic)] */
// How deeper should keyboard be in the middle?
Keyboard_depth_mult = 1.05; // [1:0.01:1.20]
// How deep should keyboard be?
Keyboard_arc_origin = [ 0, 18.5, 21.25 ];
// How steep keyboard angle should be?
Keyboard_wing_angle = 12.5; // [0:0.5:45]
// Where the angle of keyboard wing should start
// Keyboard_wing_angle_origin_offset=-18; //[-20:0.5:20]
Arc_height_max = 22.5; // [0:30]
Arc_width = 160;

/* [Other] */

/* [Debug] */
// Enable all debug methods of showing points
Enable_debug = true;
// How large a base point should be?
Debug_point_base_size = 1;

module __Customizer_Limit__() {}

/* [Math] */
function _m_distance(p1, p2) = ((p2.x - p1.x) ^ 2 + (p2.y - p1.y) ^
                                2 + (p2.z - p1.z) ^ 2) ^
                               (1 / 2);

/* [Variables] */
// Origin for the sketch
_v_origin = [ 0, 0, 0 ];
// _v_keyboard_wing_angle_origin=[0, Keyboard_wing_angle_origin_offset, 0];
_v_key_small_size = Key_size * Key_small_size_multiplier;
_v_base_keyboard_height =
    Keyboard_offset * 2 + 5 * Key_size + 5 * Key_padding + _v_key_small_size;

/* [Utilities] */
module construction_line(start, stop, label) if (Enable_debug) {
  _d_debug_construction_line_width = Debug_point_base_size * 0.35;
  _d_debug_construction_line_segment = 2;

  distance = _m_distance(start, stop);
  segments = floor(distance / _d_debug_construction_line_segment);
  single_segment = (stop - start) / segments;
  points = [for (i = [1:1:segments + 1]) start + (single_segment * (i - 1))];
  for (s = [0:1:len(points) - 1])
    if (s % 2 == 0)
      color("darkgray", 0.8) hull() {
        translate(points[s]) sphere(_d_debug_construction_line_width);
        last_point = (s + 1 > (len(points) - 1)) ? len(points) - 1 : s + 1;
        translate(points[last_point]) sphere(_d_debug_construction_line_width);
      }

  midpoint = (stop + start) / 2;
  if (!is_undef(label))
    translate(midpoint) reorient() color("darkgray", 0.8)
        text(label, Debug_point_base_size, halign = "center");
}

module reorient() scale([ 1, -1, 1 ]) translate(_v_origin) children();
module mesh_cloud(points) for (p = points) translate(p)
    sphere(Debug_point_base_size);

/* [Render] */
module draw_top_cover() {
  draw_keyboard();

  translate([ Arc_width + Key_padding, 0, 0 ]) {
    draw_arrow_block();
    place_on_grid([ 3, 0 ]) draw_numpad();
  }
}

module block_keyboard_arc() {
  // Arc origin
  keyboard_arc_end = [ Arc_width, 0, 0 ];
  keyboard_arc_end_2 = [ Arc_width, _v_base_keyboard_height, 0 ];
  keyboard_spine_end = [
    0, _v_base_keyboard_height * Keyboard_depth_mult + Keyboard_arc_origin.y,
    Arc_height_max
  ];
  construction_line(Keyboard_arc_origin, keyboard_arc_end);
  construction_line(Keyboard_arc_origin, keyboard_spine_end);
  construction_line(keyboard_spine_end, keyboard_arc_end_2);
  construction_line(keyboard_arc_end, keyboard_arc_end_2);
}

module block_straight() {
  block_arrow_width = Key_size * 3 + Key_padding * 2;
  construction_line([ 0, 0, 0 ],
                    [ block_arrow_width, 0, 0 ]);
  construction_line([ 0, _v_base_keyboard_height, 0 ],
                    [ block_arrow_width, _v_base_keyboard_height, 0 ]);
  construction_line([ block_arrow_width, 0, 0 ],
                    [ block_arrow_width, _v_base_keyboard_height, 0 ]);
  construction_line([ 0, 0, 0 ],
                    [ 0, _v_base_keyboard_height, 0 ]);

  translate([ block_arrow_width + Key_padding, 0, 0 ]) {
    block_numpad_width = Key_size * 4 + Key_padding * 3;
    construction_line([ 0, 0, 0 ],
                      [ block_numpad_width, 0, 0 ]);
    construction_line([ 0, _v_base_keyboard_height, 0 ],
                      [ block_numpad_width, _v_base_keyboard_height, 0 ]);
    construction_line([ block_numpad_width, 0, 0 ],
                      [ block_numpad_width, _v_base_keyboard_height, 0 ]);
    construction_line([ 0, 0, 0 ],
                      [ 0, _v_base_keyboard_height, 0 ]);
  }
}

module draw_points(points, _color = "gray", last_frames = []) {
  //color("yellow", 0.6) draw_polyline(points, Debug_point_base_size);
  // draw_bezier_control_points(points,1.5);
  frames = frame_bezier3(points, 10, last_frames);
  color(_color) draw_polyline(map_frames_to_points(frames),
                              Debug_point_base_size);
  // color("red") for(frame = frames) draw_line(
  //   get_origin_from_frame(frame),
  //   get_origin_from_frame(frame) + get_normal_from_frame(frame) * 50,
  //   Debug_point_base_size
  // );
  // color("black") for(frame = frames) draw_line(
  //   get_origin_from_frame(frame),
  //   get_origin_from_frame(frame) + get_tangent_from_frame(frame),
  //   Debug_point_base_size
  // );
}

reorient() {
  {
    block_keyboard_arc();
    mirror([ 1, 0, 0 ]) block_keyboard_arc();
  }
  translate([ Arc_width + Key_padding, 0, 0 ]) block_straight();
  {
    middle_point_widest =
        _v_base_keyboard_height * Keyboard_depth_mult + Keyboard_arc_origin.y;
    middle_line_1 = [
      Keyboard_arc_origin,
      [ 0, middle_point_widest * 0.65, Keyboard_arc_origin.z ],
      [ 0, middle_point_widest * 0.85, Arc_height_max * 0.99 ],
      [ 0, middle_point_widest, Arc_height_max ]
    ];
    middle_line_2 = join_bezier_by_tangent(middle_line_1,[
      [ 0, (middle_point_widest + 67) * 0.90, Arc_height_max * 1.02 ],
      [ 0, middle_point_widest + 67, 13.50 ]
    ], 0.8);
    middle_line_3 = join_bezier_by_tangent(middle_line_2,[
      [ 0, middle_line_2[3].y + 21, middle_line_2[3].z * 0.3 ],
      [ 0, middle_line_2[3].y + 23, 0 ]
    ], 0.7);
    draw_points(middle_line_1, "red");
    draw_points(middle_line_2, "blue");
    draw_points(middle_line_3, "blue");

    keyboard_arc_end = [ Arc_width, 0, 0 ];
    keyboard_arc_end_2 = [ Arc_width, _v_base_keyboard_height, 0 ];

    end_line = [
      keyboard_arc_end,
      [ keyboard_arc_end.x, (keyboard_arc_end / 3).y, (keyboard_arc_end / 3).z ],
      [
        keyboard_arc_end.x, (keyboard_arc_end * 2 / 3).y,
        (keyboard_arc_end * 2 / 3).z
      ],
      keyboard_arc_end_2
    ];
    draw_points(end_line, "red");

    back_line_1 = [
      middle_line_1[0],
      [ 2, 18.5, middle_line_1[0].z ],
      [ 5, 18.4, middle_line_1[0].z ],
      [ 8, 18, middle_line_1[0].z ]
    ];
    back_line_2 = join_bezier_by_tangent(back_line_1,[
      [ 35, 13, 17.5 ],
      [ 48.25, 10.5, 14 ]
    ],1);
    back_line_3 = join_bezier_by_tangent(back_line_2,[
      [ 75, 5.7, 8 ],
      [ 85.75, 4.5, 6 ]
    ], 1);
    back_line_4 = join_bezier_by_tangent(back_line_3,[
      [ 110, 2, 2.5 ],
      [ 123.25, 1.2, 1 ]
    ]);
    back_line_5 = join_bezier_by_tangent(back_line_4,[
      [ end_line[0].x - 18, 0, 0 ],
      [end_line[0].x-16, 0,0]
    ], 0.5);
    back_line_6 = join_bezier_by_tangent(back_line_5,[
      [ end_line[0].x - 5, 0, end_line[0].z ],
      end_line[0]
    ]);
    back_lines = [back_line_1, back_line_2, back_line_3, back_line_4, back_line_5, back_line_6];
    for(line = back_lines) draw_points(line, "red");
  }

  // points = [
  //   Keyboard_offset,
  //   Keyboard_offset + _v_key_small_size,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size
  //     + Key_padding,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_s,ize
  //     + Key_padding + Key_size,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size,
  //   Keyboard_offset + _v_key_small_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding + Key_size
  //     + Key_padding
  // ];
  // lines_for_keys = [for(p=points) bezier_get_point_at_unit(middle_line,
  // p)[0]]; keyboard_arc_end=[Arc_width, 0,0]; for(p = lines_for_keys)
  // translate(p) translate(-Keyboard_arc_origin)
  // construction_line(Keyboard_arc_origin, keyboard_arc_end);
  // mesh_cloud(lines_for_keys);

  // _density=3;
  // plane = [for(x=[0:_density:Arc_width])
  // for(z=[0:_density:_v_base_keyboard_height]) [x, z, 0]]; mesh_cloud(plane);
}
