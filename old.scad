
// // utilities
// function key_standard_distance(i) = i*(Key_padding+Key_size);
// function _place_on_grid(pos) = [_c_origin.x+key_standard_distance(pos.x), _c_origin.y+key_standard_distance(pos.y)];
// function slice(table, last_index) = last_index<0 ? [] : [for (t=[0:last_index]) table[t]];
// function add(table, index) = len(table)<=0 ? 0 : add(slice(table, index-1), index-1) + table[index];
// //function map(table, fn) = [for (t=[0:len(table)-1]) fn(table[t])];
// _coeff=0.25;
// function transpose(_c_origin, translation) = _c_origin + translation;
// function _to_bezier_points(p1, p2) = bezier_curve(_d_Surface_quality, [p1,transpose(p1, (p2-p1) * _coeff),transpose(p2, (p1-p2) * _coeff),p2]);
// function _v_offset(points, off) =[ for (x = points) transpose(x, off) ];
// function _v_mass_offset(line, offsets) = [for (t=[0:len(offsets)-1]) _v_offset(line, [0, add(offsets, t), 0])];
// //function mod(value) = value < 0 ? value * -1 : value;
// //function position_by_angle(pos) = [(pos.y + mod(Keyboard_wing_angle_origin)) * (tan(Keyboard_wing_angle)),pos.y, pos.z];

// // functional modules
// module place_on_grid(pos) translate(_place_on_grid(pos)) children();
// //module reorient() mirror([0,1,0]) children();
// module draw_key(size) linear_extrude(_c_cookie_cutter, center=true) square(size, false);
// module key() draw_key(_d_key_standard);
// module key_double_width() draw_key([_d_key_double, Key_size]);
// module key_double_height() translate([-Key_padding, 0, 0]) rotate([0,0,90]) key_double_width();
// module key_half_height() draw_key([Key_size, _d_key_small]);
// module shift_by_function_keys() translate([0, _d_key_half_height_shift, 0]) children();

// module draw_beziered_polyline(points)
// {
//     circle_size=1.5;
//     for(i = [0:1:len(points)-2]) 
//     {
//         translate(points[i]) circle(circle_size);
//         polyline3d(_to_bezier_points(points[i], points[i+1]), 1);
//     }
//     translate(points[len(points)-1]) circle(circle_size);
// }

// // modules
// module draw_numpad()
// {
//   place_on_grid([0,0]) key_half_height();
//   place_on_grid([1,0]) key_half_height();
//   place_on_grid([2,0]) key_half_height();
//   place_on_grid([3,0]) key_half_height();
  
//   shift_by_function_keys()
//   {
//     place_on_grid([0,0]) key();
//     place_on_grid([1,0]) key();
//     place_on_grid([2,0]) key();
//     place_on_grid([3,0]) key();

//     place_on_grid([0,1]) key();
//     place_on_grid([1,1]) key();
//     place_on_grid([2,1]) key();
//     place_on_grid([4,1]) key_double_height();

//     place_on_grid([0,2]) key();
//     place_on_grid([1,2]) key();
//     place_on_grid([2,2]) key();

//     place_on_grid([0,3]) key();
//     place_on_grid([1,3]) key();
//     place_on_grid([2,3]) key();
//     place_on_grid([4,3]) key_double_height();
      
//     place_on_grid([0,4]) key_double_width();
//     place_on_grid([2,4]) key();
//   }
// }

// module draw_arrow_block()
// {
//   place_on_grid([0,0]) key_half_height();
//   place_on_grid([1,0]) key_half_height();
//   place_on_grid([2,0]) key_half_height();
  
//   shift_by_function_keys()
//   {
//     place_on_grid([0,0]) key();
//     place_on_grid([1,0]) key();
//     place_on_grid([2,0]) key();

//     place_on_grid([0,1]) key();
//     place_on_grid([1,1]) key();
//     place_on_grid([2,1]) key();

//     place_on_grid([1,3]) key();
      
//     place_on_grid([0,4]) key();
//     place_on_grid([1,4]) key();
//     place_on_grid([2,4]) key();
//   }
// }

// module draw_keyboard()
// {
//     // top_line=[
//     //     [0, Keyboard_depth, Arc_height],
//     //     [8, 18, Arc_height],
//     //     [27, 14.5, 18],
//     //     [64, 7.7, 10.5],
//     //     [99, 3.5, 3.75],
//     //     [_c_arc_width, 0, 0]
//     // ];
//     // s=Keyboard_depth + (_d_keyboard_height*  Keyboard_depth_mult) ;
//     // echo(s);
//     // middle_line=[
//     //     top_line.x,
//     //     [0,s , Arc_height_max ],
//     //     [0, s + 67 , 13.5],
//     //     [0, s + 67 +23, 0]
//     // ];
//     // final_line=[
//     // middle_line.y,
//     // [_c_arc_width, _d_keyboard_height, 0]
//     // ];
    
//     // top_lines=_v_mass_offset(top_line, [
//     // 0,
//     // _d_key_margin,
//     // _d_key_small,
//     // Key_padding,
//     // Key_size,
//     // Key_padding,
//     // Key_size,
//     // Key_padding,
//     // Key_size,
//     // Key_padding,
//     // Key_size,
//     // Key_padding,
//     // Key_size * Keyboard_depth_mult,
//     // _d_key_margin,
//     // ]);
    
//     // for(lines=top_lines) mesh_cloud(lines);
    
// }



_d_Surface_quality=0.02 + (0.25-0.02) * (1-Surface_quality);
// Surface quality
Surface_quality = 0.8; // [0:0.1:1]


// _d_key_margin=Key_padding*1.5;
// _d_key_small=Key_size*0.6;
// _d_key_double=Key_size*2 + Key_padding;
//_d_key_standard=[Key_size, Key_size];
//_d_key_half_height_shift=_d_key_small+Key_padding;
//_d_keyboard_height=_d_key_half_height_shift+key_standard_distance(5) - Key_padding + 2*_d_key_margin;
