module draw_line(a, b, size=1) hull() {
    translate(a) sphere(size*0.5);
    translate(b) sphere(size*0.5);
}

module draw_polyline(points, size=1)
    for (p = [0:1:len(points)-2])
        draw_line(points[p], points[p+1], size);