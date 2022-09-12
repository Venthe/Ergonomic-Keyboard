use <math.scad>;

// function bezier(n,t, weights) = add([for (k=[0:1:n])
//       factorial(n)/(factorial(k)*factorial((n-k))) * (1-t)^(n-k) * t^(k)
//     ]);

module draw_bezier(points, size = 1) {
  translate(points[0]) color("green") sphere(size);
  translate(points[1]) color("red") sphere(size *0.6);
  translate(points[2]) color("red") sphere(size *0.6);
  translate(points[3]) color("green") sphere(size);
}

function bezier3(t, w) =
      1 * w[0] * (1-t)^3
    + 3 * w[1] * (1-t)^2 * t
    + 3 * w[2] * (1-t)   * t^2
    + 1 * w[3]           * t^3;
function normalized_vector(vector) = distance(vector) == 0 ? [0,0,0] : vector / distance(vector);

function derivative1_bezier(t, w) =
    - 3 * w[0] * (1-t)^2 //      1 * w[0] * ((-3) * (1-t)^2)
    - 2 * w[1] * (1-t)   //    + 3 * w[1] * ((-2) * (1-t))
    - 6 * w[2] * t       //    + 3 * w[2] * -1   * 2 * t
    + 3 * w[3] * t^2;    //    + 1 * w[3]           * 3 * t^2;
function derivative2_bezier(t, w) =
    + 6 * w[0] * (1-t)
    + 2 * w[1]
    - 6 * w[2]
    + 7 * w[3] * t;

function frenet_a(t, bezier) = normalized_vector(derivative1_bezier(t, bezier));
function frenet_b(t, bezier) = normalized_vector(frenet_a(t, bezier) + derivative2_bezier(t, bezier));
function frenet_r(t, bezier) = normalized_vector(cross(frenet_a(t, bezier), frenet_b(t, bezier)));
function normal_bezier3(t, bezier) = normalized_vector(cross(frenet_r(t, bezier), frenet_a(t, bezier)));

function calculate_bezier_point_with_normal(t, points) = [bezier3(t, points), normal_bezier3(t, points)];
function segment_bezier3(points, segments) = [for(i=[0:1/segments:1]) calculate_bezier_point_with_normal(i, points)];
function get_bezier_points(segment_bezier3) = [for(p = segment_bezier3) p[0]];

function bezier_get_point_at_unit(points, distance, segments=20) = calculate_bezier_point_with_normal(distance/polyline_length(get_bezier_points(segment_bezier3(points, segments))), points);