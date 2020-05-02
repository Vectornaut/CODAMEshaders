// another study copy of Char's ray-marching example. i gave `ray_color` access
// to the individual object SDFs so it could see what it had hit

// --- scene ---

const vec3 sphere_pos = vec3(0.0, 0.0, -3.0);

float sphere_sdf(vec3 pos) {
    return length(pos - sphere_pos) - 1.0;
}

float ground_sdf(vec3 pos) {
    return 1. + pos.y + sin(10.*pos.x) / 10.
                      + cos(10.*pos.z) / 10.;
}

// --- marcher ---

const int steps = 256;
const float eps = 0.001;
const float horizon = 30.0;

float haze(float r) {
    return 1.0/(1.0 + 0.2*r);
}

vec3 ray_color(vec3 dir) {
    float r = 0.0;
    for (int step_cnt = 0; step_cnt < steps; step_cnt++) {
        // find position
        vec3 pos = r*dir;
        
        // find object distances
        float sphere_dist = sphere_sdf(pos);
        float ground_dist = ground_sdf(pos);
        float dist = min(sphere_dist, ground_dist);
        
        // march
        if (dist < eps) {
            if (sphere_dist < eps) {
                return vec3(1.0, 0.0, 0.0) * haze(r);
            } else {
                return vec3(haze(r));
            }
        } else if (r > horizon) {
            return vec3(0.0);
        } else {
            r += dist;
        }
    }
    return vec3(0.0);
}

// --- main ---

void main() {
    vec3 dir = vec3(uv(), -1.0);
    dir /= length(dir);
    gl_FragColor = vec4(ray_color(dir), 1.0);
}
