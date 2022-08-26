// Main

debug=true;
key_padding=4; // [0:6]
key_width=14.75; // [4:0.25:20]
surface_quality = 0.8; // [0:0.1:1]
arc_height=21.25; // [0:30]
arc_height_max=22.5; // [0:30]
keyboard_depth_mult=1.05; // [1:0.01:1.20]
keyboard_depth_shift=18.5; // [0:0.1:20]
proportions_angle=12.5; // [0:0.5:45]
proportions_angle_origin=-18; //[-20:0.5:20]

module __Customizer_Limit__ () {}

// Consts
origin = [0,0];
arc_width=160;
thickness = 0;
cookie_cutter=10;

// Derived
key_margin=key_padding*1.5;
key_small=key_width*0.6;
key_double=key_width*2 + key_padding;
key_standard=[key_width, key_width];
t_surface_quality=0.02 + (0.25-0.02) * (1-surface_quality);
t_key_half_height_shift=key_small+key_padding;
t_keyboard_height=t_key_half_height_shift+key_standard_distance(5) - key_padding + 2*key_margin;

// utilities
function key_standard_distance(i) = i*(key_padding+key_width);
function _place_on_grid(pos) = [origin.x+key_standard_distance(pos.x), origin.y+key_standard_distance(pos.y)];
function slice(table, last_index) = last_index<0 ? [] : [for (t=[0:last_index]) table[t]];
function add(table, index) = len(table)<=0 ? 0 : add(slice(table, index-1), index-1) + table[index];
function map(table, fn) = [for (t=[0:len(table)-1]) fn(table[t])];
_coeff=0.25;
function transpose(origin, translation) = origin + translation;
function _to_bezier_points(p1, p2) = bezier_curve(t_surface_quality, [p1,transpose(p1, (p2-p1) * _coeff),transpose(p2, (p1-p2) * _coeff),p2]);
function _v_offset(points, off) =[ for (x = points) transpose(x, off) ];
function _v_mass_offset(line, offsets) = [for (t=[0:len(offsets)-1]) _v_offset(line, [0, add(offsets, t), 0])];
function mod(value) = value < 0 ? value * -1 : value;
function position_by_angle(pos) = [(pos.y + mod(proportions_angle_origin)) * (tan(proportions_angle)),pos.y, pos.z];

// functional modules
module place_on_grid(pos) translate(_place_on_grid(pos)) children();
module reorient() mirror([0,1,0]) children();
module draw_key(size) linear_extrude(cookie_cutter, center=true) square(size, false);
module key() draw_key(key_standard);
module key_double_width() draw_key([key_double, key_width]);
module key_double_height() translate([-key_padding, 0, 0]) rotate([0,0,90]) key_double_width();
module key_half_height() draw_key([key_width, key_small]);
module shift_by_function_keys() translate([0, t_key_half_height_shift, 0]) children();

module draw_beziered_polyline(points)
{
    circle_size=1.5;
    for(i = [0:1:len(points)-2]) 
    {
        translate(points[i]) circle(circle_size);
        polyline3d(_to_bezier_points(points[i], points[i+1]), 1);
    }
    translate(points[len(points)-1]) circle(circle_size);
}

// modules
module draw_numpad() reorient()
{
  place_on_grid([0,0]) key_half_height();
  place_on_grid([1,0]) key_half_height();
  place_on_grid([2,0]) key_half_height();
  place_on_grid([3,0]) key_half_height();
  
  shift_by_function_keys()
  {
    place_on_grid([0,0]) key();
    place_on_grid([1,0]) key();
    place_on_grid([2,0]) key();
    place_on_grid([3,0]) key();

    place_on_grid([0,1]) key();
    place_on_grid([1,1]) key();
    place_on_grid([2,1]) key();
    place_on_grid([4,1]) key_double_height();

    place_on_grid([0,2]) key();
    place_on_grid([1,2]) key();
    place_on_grid([2,2]) key();

    place_on_grid([0,3]) key();
    place_on_grid([1,3]) key();
    place_on_grid([2,3]) key();
    place_on_grid([4,3]) key_double_height();
      
    place_on_grid([0,4]) key_double_width();
    place_on_grid([2,4]) key();
  }
}

module draw_arrow_block() mirror([0,1,0])
{
  place_on_grid([0,0]) key_half_height();
  place_on_grid([1,0]) key_half_height();
  place_on_grid([2,0]) key_half_height();
  
  shift_by_function_keys()
  {
    place_on_grid([0,0]) key();
    place_on_grid([1,0]) key();
    place_on_grid([2,0]) key();

    place_on_grid([0,1]) key();
    place_on_grid([1,1]) key();
    place_on_grid([2,1]) key();

    place_on_grid([1,3]) key();
      
    place_on_grid([0,4]) key();
    place_on_grid([1,4]) key();
    place_on_grid([2,4]) key();
  }
}

module mesh_cloud(points) {
    for (p = points) translate(p) sphere(radius);
}

module draw_keyboard() mirror([0,1,0])
{

    // top_line=[
    //     [0, keyboard_depth_shift, arc_height],
    //     [8, 18, arc_height],
    //     [27, 14.5, 18],
    //     [64, 7.7, 10.5],
    //     [99, 3.5, 3.75],
    //     [arc_width, 0, 0]
    // ];
    // s=keyboard_depth_shift + (t_keyboard_height*  keyboard_depth_mult) ;
    // echo(s);
    // middle_line=[
    //     top_line.x,
    //     [0,s , arc_height_max ],
    //     [0, s + 67 , 13.5],
    //     [0, s + 67 +23, 0]
    // ];
    // final_line=[
    // middle_line.y,
    // [arc_width, t_keyboard_height, 0]
    // ];
    
    // top_lines=_v_mass_offset(top_line, [
    // 0,
    // key_margin,
    // key_small,
    // key_padding,
    // key_width,
    // key_padding,
    // key_width,
    // key_padding,
    // key_width,
    // key_padding,
    // key_width,
    // key_padding,
    // key_width * keyboard_depth_mult,
    // key_margin,
    // ]);
    
    // for(lines=top_lines) mesh_cloud(lines);
    
}

module draw_top_cover()
{
    draw_keyboard();

    // translate([arc_width + key_padding, 0, 0])
    // {
    //   draw_arrow_block();
    //   place_on_grid([3,0]) draw_numpad();
    // }
}

draw_top_cover();

if(debug) translate()