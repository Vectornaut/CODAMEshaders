// --- euler angles ---

mat3 rot_xy(float t) {
    return mat3(
         cos(t), sin(t), 0.0,
        -sin(t), cos(t), 0.0,
            0.0,    0.0, 1.0
    );
}

mat3 rot_yz(float t) {
    return mat3(
        1.0,     0.0,    0.0,
        0.0,  cos(t), sin(t),
        0.0, -sin(t), cos(t)
    );
}

// attitude = vec3(precession, nutation spin)
mat3 euler_rot(vec3 attitude) {
    return rot_xy(attitude[0]) * rot_yz(attitude[1]) * rot_xy(attitude[2]);
}

// --- augmented signed distances ---

struct aug_dist {
    float dist;
    vec3 normal;
    vec3 color;
};

aug_dist max(aug_dist a, aug_dist b) {
    if (a.dist > b.dist) return a; else return b;
}

// --- polyhedra ---

const vec3 poly_color = vec3(1.0);

aug_dist plane_sdf(vec3 p, vec3 normal, float offset) {
    return aug_dist(
        dot(p, normal) - offset,
        normal,
        poly_color
    );
}

aug_dist octa_sdf(vec3 p_scene) {
    /*vec3 attitude = vec3(0.231597640013215, 0.312798310678372, 0.5) * vec3(time);*/
    vec3 attitude = vec3(0.0);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    vec3 normal = vec3(1., 1., 1.);
    normal /= length(normal);
    for (int k = 0; k < 3; k++) {
        if (p[k] < 0.) normal[k] = -normal[k];
    }
    aug_dist dist = plane_sdf(p, normal, 1.);
    dist.normal = orient * dist.normal;
    return dist;
}

aug_dist alt_octa_sdf(vec3 p_scene) {
    /*vec3 attitude = vec3(0.231597640013215, 0.312798310678372, 0.5) * vec3(time);*/
    vec3 attitude = vec3(0.0);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    aug_dist dist = aug_dist(-1e2, vec3(0.), vec3(1., 0., 0.));
    vec3 normal = vec3(1., 1., 1.);
    normal /= length(normal);
    for (int sgn_x = 0; sgn_x < 2; sgn_x++) {
        for (int sgn_y = 0; sgn_y < 2; sgn_y++) {
            for (int sgn_z = 0; sgn_z < 2; sgn_z++) {
                dist = max(dist, plane_sdf(p, normal, 1.0));
                normal.z = -normal.z;
            }
            normal.y = -normal.y;
        }
        normal.x = -normal.x;
    }
    dist.normal = orient * dist.normal;
    return dist;
}

// 1.618... is the golden ratio
// dividing by 1.902... gives a unit vector
const vec3 n00 = vec3(0,  1.0,  1.618033988749895) / 1.902113032590307;
const vec3 n01 = vec3(0,  1.0, -1.618033988749895) / 1.902113032590307;
const vec3 n10 = vec3(0, -1.0,  1.618033988749895) / 1.902113032590307;
const vec3 n11 = vec3(0, -1.0, -1.618033988749895) / 1.902113032590307;

aug_dist dodeca_sdf(vec3 p_scene) {
    vec3 attitude = vec3(0.231597640013215, 0.312798310678372, 0.5) * vec3(time);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    // yz rectangle
    aug_dist dist =  plane_sdf(p, n00, 1.0);
    dist = max(dist, plane_sdf(p, n01, 1.0));
    dist = max(dist, plane_sdf(p, n10, 1.0));
    dist = max(dist, plane_sdf(p, n11, 1.0));
    
    // xy rectangle
    dist = max(dist, plane_sdf(p, n00.yzx, 1.0));
    dist = max(dist, plane_sdf(p, n01.yzx, 1.0));
    dist = max(dist, plane_sdf(p, n10.yzx, 1.0));
    dist = max(dist, plane_sdf(p, n11.yzx, 1.0));
    
    // zx rectangle
    dist = max(dist, plane_sdf(p, n00.zxy, 1.0));
    dist = max(dist, plane_sdf(p, n01.zxy, 1.0));
    dist = max(dist, plane_sdf(p, n10.zxy, 1.0));
    dist = max(dist, plane_sdf(p, n11.zxy, 1.0));
    
    dist.normal = orient * dist.normal;
    return dist;
}

const float phi = 1.618033988749895;

aug_dist alt_dodeca_sdf(vec3 p_scene) {
    vec3 attitude = vec3(0.231597640013215, 0.312798310678372, 0.5) * vec3(time);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    aug_dist dist = aug_dist(-1e2, vec3(0.), vec3(1., 0., 0.));
    vec3 normal = vec3(0, 1.0, phi);
    normal /= length(normal);
    for (int sgn_y = 0; sgn_y < 2; sgn_y++) {
        for (int sgn_z = 0; sgn_z < 2; sgn_z++) {
            for (int cyc = 0; cyc < 3; cyc++) {
                dist = max(dist, plane_sdf(p, normal, 1.0));
                normal = normal.yzx;
            }
            normal.z = -normal.z;
        }
        normal.y = -normal.y;
    }
    dist.normal = orient * dist.normal;
    return dist;
}

// --- marcher ---

const int steps = 256;
const float eps = 0.001;
const float horizon = 30.0;

const vec3 sky_color = vec3(0.3, 0.5, 0.6);

vec3 radiance(aug_dist dist) {
    return (0.5 + 0.5*dot(dist.normal, vec3(1.0)/sqrt(3.0))) * dist.color;
}

vec3 ray_color(vec3 place, vec3 dir) {
    float r = 0.0;
    for (int step_cnt = 0; step_cnt < steps; step_cnt++) {
        aug_dist poly = alt_dodeca_sdf(place + r*dir);
        if (poly.dist < eps) {
            return radiance(poly);
        } else if (r > horizon) {
            return sky_color;
        } else {
            r += poly.dist;
        }
    }
    return sky_color;
}

// --- main ---

const vec3 place = vec3(0.0, 0.0, 6.0);

void main() {
    vec2 jiggle = vec2(0.5/resolution.y);
    vec3 color_sum = vec3(0.);
    for (int sgn_x = 0; sgn_x < 2; sgn_x++) {
        for (int sgn_y = 0; sgn_y < 2; sgn_y++) {
            vec3 dir = vec3(uv() + jiggle, -3.5);
            dir /= length(dir);
            color_sum += ray_color(place, dir);
            jiggle.y = -jiggle.y;
        }
        jiggle.x = -jiggle.x;
    }
    gl_FragColor = vec4(color_sum/4., 1.);
}
