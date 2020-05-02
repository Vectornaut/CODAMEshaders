// --- scene ---

float scene_dist(vec3 pos) {
    // sphere
    vec3 sphere_pos = vec3(0.0, 0.0, -3.0);
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
        float dist = scene_dist(r*dir);
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
