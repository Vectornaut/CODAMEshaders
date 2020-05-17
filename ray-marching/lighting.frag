float sphere(vec3 p) {
    return length(mod(p, vec3(2.)) - vec3(1., 1., 1.)) - 0.2;
}

float ground(vec3 p) {
    return p.y + 1.;
}

float scene(vec3 p) {
    return min(sphere(p), ground(p));
}

const float eps = 0.001;

vec3 scene_grad(vec3 p) {
    vec2 step = vec2(eps, 0.);
    return vec3(
        scene(p + step.stt) - scene(p - step.stt),
        scene(p + step.tst) - scene(p - step.tst),
        scene(p + step.tts) - scene(p - step.tts)
    );
}

const int steps = 256;
const float horizon = 30.;

vec3 sky_color = vec3(0.0, 0.2, 0.3);

vec3 radiance(vec3 color, vec3 normal) {
    return mix(sky_color, color, (1.+dot(normal, vec3(1.0)/sqrt(3.0)))/2.);
}

vec3 ray_color(vec3 eye, vec3 dir) {
    float r = 0.;
    for (int cnt = 0; cnt < steps; cnt++) {
        // find ray position
        vec3 p = eye + r*dir;
        
        // find scene distance
        float dist = scene(p);
        
        // march
        if (dist < eps) {
            vec3 normal = normalize(scene_grad(p));
            vec3 rad = radiance(vec3(1.), normal);
            return mix(sky_color, rad, exp(-0.2*r));
        } else if (r > horizon) {
            return sky_color;
        } else {
            r += dist;
        }
    }
    return vec3(0.);
}

void main() {
    vec3 dir = normalize(vec3(uv(), -1.));
    vec3 eye = vec3(0., 0., 1. - time);
    vec3 color = vec3(ray_color(eye, dir));
    gl_FragColor = vec4(color, 0.);
}
