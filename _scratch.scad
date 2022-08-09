point_main_size=1;
point_secondary_size=0.25;

module draw_mesh_cloud(cloud) for(point = cloud) translate(point) circle(point_main_size);


sq = [
  [0,0,0],
  [100, 0, 0],
  [100, 100, 0],
  [0, 100, 0]
];


draw_mesh_cloud(sq);
