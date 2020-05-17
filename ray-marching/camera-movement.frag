float sphere(vec3 p) {
    return length(mod(p, vec3(2.)) - vec3(1., 1., 1.)) - 0.2;
}

float ground(vec3 p) {
    return p.y + 1.;
}

float scene(vec3 p) {
    return min(sphere(p), ground(p));
}

const int steps = 256;
const float eps = 0.001;
const float horizon = 30.;

vec3 sky_color = vec3(0.0, 0.2, 0.3);

vec3 ray_color(vec3 eye, vec3 dir) {
    float r = 0.;
    for (int cnt = 0; cnt < steps; cnt++) {
        // find ray position
        vec3 p = eye + r*dir;
        
        // find scene distance
        float dist = scene(p);
        
        // march
        if (dist < eps) {
            return mix(sky_color, vec3(1.), exp(-0.2*r));
        } else if (r > horizon) {
            return sky_color;
        } else {
            r += dist;
        }
    }
    return vec3(0.);
}

vec3 cam_pos(float t) {
    return vec3(
        4.5*(sin(t) + 2.*sin(2.*t)),
        1. + sin(3.*t),
        4.5*(-cos(t) + 2.*cos(2.*t))
    );
}

vec3 cam_vel(float t) {
    return vec3(
        4.5*(cos(t) + 4.*cos(2.*t)),
        1. + 3.*cos(3.*t),
        4.5*(sin(t) - 4.*sin(2.*t))
    );
}

vec3 cam_accel(float t) {
    return vec3(
        4.5*(-sin(t) - 8.*sin(2.*t)),
        1. + 9.*cos(3.*t),
        4.5*(cos(t) - 8.*cos(2.*t))
    );
}

vec3 ray_dir(vec2 screen_pt, float t) {
    // let's pretend the camera's on an airplane. roll to put the thrust + lift
    // vector in the span of the yaw and roll axes for a perfect banked turn
    const vec3 gravity = vec3(0., -120., 0.);
    vec3 roll_ax = normalize(cam_vel(t));
    vec3 accel = cam_accel(t);
    vec3 tras_accel = accel - dot(roll_ax, accel)*roll_ax;
    vec3 yaw_ax = normalize(tras_accel - gravity);
    vec3 pitch_ax = cross(roll_ax, yaw_ax);
    
    vec3 screen_dir = normalize(vec3(uv(), -1.));
    return mat3(pitch_ax, yaw_ax, -roll_ax) * screen_dir;
}

void main() {
    vec3 screen_dir = normalize(vec3(uv(), -1.));
    vec3 pos = cam_pos(time/8.);
    vec3 dir = ray_dir(uv(), time/8.);
    vec3 color = ray_color(pos, dir);
    gl_FragColor = vec4(color, 0.);
}
