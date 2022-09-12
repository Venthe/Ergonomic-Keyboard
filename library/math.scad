function factorial(n) = n == 0 ? 1 : factorial(n - 1) * n;
function add(v, i = 0, r = 0) = i < len(v) ? add(v, i + 1, r + v[i]) : r;
function distance(vector) = (vector.x^2 + vector.y^2 + vector.z^2)^(1/2);
function distanceAB(v1, v2) = distance(v2-v1);
function polyline_length(points) = abs(add([for(i = [0:1:len(points)-2]) distanceAB(points[i], points[i+1])]));
