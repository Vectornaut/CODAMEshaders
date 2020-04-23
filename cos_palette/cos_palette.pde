// palette parameters
float[] a = {0.5, 0.5};
float[] b = {0.3, 0.5};
float[] c = {1, log(2)};

// palette color
float t = 0;
float t_step = 1f/8;
float[] last_pt = new float [2];
float[] curr_pt = new float [2];
float[] mid_pt = new float [2];
color mid_color;

// monitor buffers
PGraphics path;
PGraphics palette;

// shape parameters
float margin = 0.1;
final int palStep = 2;
final int palWidth = 720;
final int swatchWidth = 40;

// shape information
int palHeight;
int palHalf;

void setup() {
  // set up window
  size(800, 840, P2D);
  frameRate(48);
  
  // set drawing parameters
  background(0);
  noStroke();
  
  // initialize shape information
  palHeight = (height - width)/2;
  palHalf = palHeight/2;
  
  // set up the color space monitor
  path = createGraphics(width, width);
  path.beginDraw();
  path.strokeWeight(2);
  path.background(0);
  path.endDraw();
  
  // set up the palette monitor
  palette = createGraphics(palWidth, palHeight);
  palette.beginDraw();
  palette.background(0);
  palette.noStroke();
  palette.endDraw();
}

float toWindow(float u) {
  return width*((1-u)*margin + u*(1-margin));
}

void updatePalette() {
  for (int k = 0; k < 2; ++k) {
    last_pt[k] = curr_pt[k];
    curr_pt[k] = a[k] + b[k]*cos(t*c[k]);
    mid_pt[k] = (last_pt[k] + curr_pt[k]) / 2;
  }
  mid_color = color(256*mid_pt[0], 256*mid_pt[1], 128);
  t += t_step;
}

void draw() {
  // update palette
  updatePalette();
  
  // on the first frame, update palette again to initialize `last_p`
  if (frameCount == 1) {
    updatePalette();
  }
  
  // draw on monitors
  showPath();
  showPalette();
  
  // draw monitors to surface
  image(path, 0, 0);
  image(palette, 0, path.height);
  
  // draw swatch
  drawSwatch();
  
  // draw palette point
  fill(255);
  ellipse(toWindow(curr_pt[0]), toWindow(curr_pt[1]), 6, 6);
}

void showPath() {
  path.beginDraw();
  path.stroke(mid_color);
  path.line(
    toWindow(last_pt[0]), toWindow(last_pt[1]),
    toWindow(curr_pt[0]), toWindow(curr_pt[1])
  );
  path.endDraw();
}

void showPalette() {
  palette.beginDraw();
  
  // shift the previous colors to the left
  palette.copy(
    palStep, 0, palette.width, palette.height,
    0, 0, palette.width, palette.height
  );
  
  // append the current color
  palette.fill(mid_color);
  palette.rect(palette.width - palStep, 0, palStep, palette.height);
  
  palette.endDraw();
}

void swatchShape() {
  beginShape();
  vertex(0, 0);
  vertex(-palHalf, palHalf);
  vertex(swatchWidth - palHalf, palHalf);
  vertex(swatchWidth, 0);
  vertex(swatchWidth - palHalf, -palHalf);
  vertex(-palHalf, -palHalf);
  endShape(CLOSE);
}

void drawSwatch() {
  pushMatrix();
  
  // clip end of palette
  translate(palWidth, width + palHalf);
  fill(0);
  swatchShape();
  
  // draw swatch
  translate(palHalf, 0);
  fill(mid_color);
  swatchShape();
  
  popMatrix();
}
