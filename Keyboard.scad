use <Quaternions/maths.scad>;
use <library/line.scad>;
use <library/math.scad>;
use <library/bezier.scad>;

// TODO: Implement RMF normal

/* [Keys] */
// Distance between keys
Key_padding=4; // [0:6]
// Regular key size
Key_size=14.75; // [4:0.25:20]
Keyboard_offset=6; // [0:6:8]
Key_small_size_multiplier=0.6; // [0.5:0.1:1]

/* [Keyboard (Ergonomic)] */
// How deeper should keyboard be in the middle?
Keyboard_depth_mult=1.05; // [1:0.01:1.20]
// How deep should keyboard be?
Keyboard_arc_origin=[0, 21.25, 18.5];
// How steep keyboard angle should be?
Keyboard_wing_angle=12.5; // [0:0.5:45]
// Where the angle of keyboard wing should start
// Keyboard_wing_angle_origin_offset=-18; //[-20:0.5:20]
Arc_height_max=22.5; // [0:30]
Arc_width=160;

/* [Other] */

/* [Debug] */
// Enable all debug methods of showing points
Enable_debug=true;
// How large a base point should be?
Debug_point_base_size=1;

module __Customizer_Limit__ () {}

/* [Math] */
function _m_distance(p1, p2) = ((p2.x-p1.x)^2+(p2.y-p1.y)^2+(p2.z-p1.z)^2)^(1/2);

/* [Variables] */
// Origin for the sketch
_v_origin=[0,0,0];
// _v_keyboard_wing_angle_origin=[0, Keyboard_wing_angle_origin_offset, 0];
_v_key_small_size=Key_size*Key_small_size_multiplier;
_v_base_keyboard_height=Keyboard_offset*2+5*Key_size+5*Key_padding+_v_key_small_size;

/* [Utilities] */
module construction_line(start, stop, label) if(Enable_debug) {
  _d_debug_construction_line_width=Debug_point_base_size*0.35;
  _d_debug_construction_line_segment=2;

  distance = _m_distance(start, stop);
  segments = floor(distance / _d_debug_construction_line_segment);
  single_segment = (stop-start)/segments;
  points = [for(i = [1:1:segments+1]) start + (single_segment * (i-1))];
  for(s = [0:1:len(points)-1])
    if(s%2==0) color("darkgray", 0.8)
      hull() {
        translate(points[s]) sphere(_d_debug_construction_line_width);
        last_point = (s+1 > (len(points)-1)) ? len(points) - 1: s+1;
        translate(points[last_point]) sphere(_d_debug_construction_line_width);
      }

  midpoint = (stop + start)/2;
  if(!is_undef(label)) translate(midpoint) reorient()
    color("darkgray", 0.8) text(label, Debug_point_base_size, halign="center");
}

module reorient() scale([1, -1, 1]) translate(_v_origin) children();
module mesh_cloud(points) for (p = points) translate(p) sphere(Debug_point_base_size);

/* [Render] */
module draw_top_cover()
{
    draw_keyboard();

    translate([Arc_width + Key_padding, 0, 0])
    {
      draw_arrow_block();
      place_on_grid([3,0]) draw_numpad();
    }
}

module block_keyboard_arc() {
  // Arc origin
  keyboard_arc_end=[Arc_width, 0,0];
  keyboard_spine_end=[0, _v_base_keyboard_height*Keyboard_depth_mult+Keyboard_arc_origin.y,Arc_height_max];
  keyboard_arc_end_2=[Arc_width, _v_base_keyboard_height, 0];
  construction_line(Keyboard_arc_origin, keyboard_arc_end);
  construction_line(Keyboard_arc_origin, keyboard_spine_end);
  construction_line(keyboard_spine_end, keyboard_arc_end_2);
  construction_line(keyboard_arc_end, keyboard_arc_end_2);
}

module block_straight() {
  block_arrow_width=Key_size*3 + Key_padding * 2;
  construction_line([0,0,0],[block_arrow_width,0,0]);
  construction_line([0,_v_base_keyboard_height,0],[block_arrow_width,_v_base_keyboard_height,0]);
  construction_line([block_arrow_width,0,0],[block_arrow_width,_v_base_keyboard_height,0]);
  construction_line([0,0,0],[0,_v_base_keyboard_height,0]);

  
  translate([block_arrow_width+Key_padding, 0,0]) {
    block_numpad_width=Key_size*4 + Key_padding * 3;
    construction_line([0,0,0],[block_numpad_width,0,0]);
    construction_line([0,_v_base_keyboard_height,0],[block_numpad_width,_v_base_keyboard_height,0]);
    construction_line([block_numpad_width,0,0],[block_numpad_width,_v_base_keyboard_height,0]);
    construction_line([0,0,0],[0,_v_base_keyboard_height,0]);
  }
}

reorient() {
  block_keyboard_arc();
  mirror([1, 0, 0]) block_keyboard_arc();
  translate([Arc_width+Key_padding,0,0]) block_straight();

  bezier = [Keyboard_arc_origin,[0,30,30],[0,100,50],[0, _v_base_keyboard_height*Keyboard_depth_mult+Keyboard_arc_origin.y,Arc_height_max]];
  segment_bezier_w_normals = segment_bezier3(bezier, 100);
  just_points = get_bezier_points(segment_bezier_w_normals);
  color("gray") draw_polyline(just_points, Debug_point_base_size);
  // color("red") for(p = segment_bezier_w_normals) draw_line(p[0], p[0]+(p[1]*10), Debug_point_base_size);
  // color("yellow", 0.6) draw_polyline(bezier, Debug_point_base_size);

  draw_bezier(bezier);
  points = [
    Keyboard_offset,
    Keyboard_offset + _v_key_small_size,
    Keyboard_offset + _v_key_small_size
      + Key_padding,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size
      + Key_padding,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size
      + Key_padding + Key_size,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding + Key_size,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding + Key_size,
    Keyboard_offset + _v_key_small_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding + Key_size
      + Key_padding
  ];
  lines_for_keys = [for(p=points) bezier_get_point_at_unit(bezier, p)[0]];
  keyboard_arc_end=[Arc_width, 0,0];
  for(p = lines_for_keys) translate(p) translate(-Keyboard_arc_origin) construction_line(Keyboard_arc_origin, keyboard_arc_end);
  // mesh_cloud(lines_for_keys);
  
  // _density=3;
  // plane = [for(x=[0:_density:Arc_width]) for(z=[0:_density:_v_base_keyboard_height]) [x, z, 0]];
  // mesh_cloud(plane);

}
