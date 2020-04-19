// window shape
float margin = 0.1;

// palette parameters
float[] a = {0.5, 0.5};
float[] b = {0.3, 0.5};
float[] c = {1, log(2)};

// palette color
float t = 0;
float t_step = 1f/8;
float[] last_p = new float [2];
float[] curr_p = new float [2];
float[] mid_p = new float [2];

void setup() {
  // set up window
  size(800, 800, P2D);
  frameRate(48);
  
  strokeWeight(2);
  background(0);
}

float to_window(float u) {
  return width*((1-u)*margin + u*(1-margin));
}

void set_palette() {
  for (int k = 0; k < 2; ++k) {
    last_p[k] = curr_p[k];
    curr_p[k] = a[k] + b[k]*cos(t*c[k]);
    mid_p[k] = (last_p[k] + curr_p[k]) / 2;
  }
  t += t_step;
}

void draw() {
  /*checkKeys();*/
  set_palette();
  
  // on the first frame, run `set_palette` again to initialize `last_p`
  if (frameCount == 0) {
    set_palette();
  }
  
  // pick color
  stroke(256*mid_p[0], 256*mid_p[1], 128);
  
  // draw path
  line(
    to_window(last_p[0]), to_window(last_p[1]),
    to_window(curr_p[0]), to_window(curr_p[1])
  );
}
