// another study copy of Char's ray-marching example. calculate normals and ink
// edges

// --- scene ---

const vec3 sphere_pos = vec3(0.0, 0.0, -3.0);

const vec3 sphere_color = vec3(1.0, 0.0, 0.0);

float sphere_sdf(vec3 pos) {
    return length(pos - sphere_pos) - 1.0;
}

const vec3 ground_color = vec3(1.0);

vec3 sphere_normal(vec3 pos) {
    return normalize(pos - sphere_pos);
}

float ground_sdf(vec3 pos) {
    return 1. + pos.y + sin(5.*pos.x) / 10.
                      + cos(5.*pos.z) / 10.;
}

vec3 ground_normal(vec3 pos) {
    return normalize(vec3(
        cos(5.*pos.x) / 2.,
        1.,
        -sin(5.*pos.z) / 2.
    ));
}

// --- marcher ---

const int steps = 256;
const float eps = 0.001;
const float horizon = 30.0;

const vec3 sky_color = vec3(0.3, 0.5, 0.6);

vec3 attenuate(vec3 color, float r) {
    float b = exp(-r/10.);
    return mix(sky_color, color, b);
}

bool is_edge(float cos_angle, float r) {
    return abs(cos_angle) < 0.2*(1. - 1./r);
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
                if (is_edge(dot(sphere_normal(pos), dir), r)) {
                    return vec3(sky_color);
                } else {
                    return attenuate(sphere_color, r);
                }
            } else {
                if (is_edge(dot(ground_normal(pos), dir), r)) {
                    return vec3(sky_color);
                } else {
                    return attenuate(ground_color, r);
                }
            }
        } else if (r > horizon) {
            return sky_color;
        } else {
            r += dist;
        }
    }
    return vec3(sky_color);
}

// --- main ---

void main() {
    vec3 dir = normalize(vec3(uv(), -1.0));
    gl_FragColor = vec4(ray_color(dir), 1.0);
}
