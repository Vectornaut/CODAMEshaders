// a study copy of Char Stiles's ray-marching example from the May 2 CODAME
// workshop.
//   https://gist.github.com/CharStiles/2e5889a660b8c7cbf8d1e0b5ff4bf1e4
// i switched to an atmospheric perspective function that didn't depend on the
// horizon so i could turn up the horizon distance without washing out the
// colors

// --- scene ---

const vec3 sphere_pos = vec3(0.0, 0.0, -3.0);

float scene_sdf(vec3 pos) {
    // sphere
    float sphere_dist = length(pos - sphere_pos) - 1.0;
    
    // ground
    float ground_dist = 1. + pos.y + sin(10.*pos.x) / 10. 
                                   + cos(10.*pos.z) / 10.;
    
    return min(sphere_dist, ground_dist);
}

// --- marcher ---

const int steps = 256;
const float eps = 0.001;
const float horizon = 30.0;

float haze(float r) {
    return 1.0/(1.0 + 0.2*r);
}

float ray_color(vec3 dir) {
    float r = 0.0;
    for (int step_cnt = 0; step_cnt < steps; step_cnt++) {
        float dist = scene_sdf(r*dir);
        if (dist < eps) {
            return haze(r);
        } else if (r > horizon) {
            return 0.0;
        } else {
            r += dist;
        }
    }
    return 0.0;
}

// --- main ---

void main() {
    vec3 dir = vec3(uv(), -1.0);
    dir /= length(dir);
    gl_FragColor = vec4(vec3(ray_color(dir)), 1.0);
}
