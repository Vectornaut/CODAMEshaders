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

vec3 msign(vec3 v) {
    return vec3(
        v.x > 0. ? 1. : -1.,
        v.y > 0. ? 1. : -1.,
        v.z > 0. ? 1. : -1.
    );
}

float argmax(vec3 v) {
   return max(v.x, max(v.y, v.z));
}

aug_dist plane_sdf(vec3 p, vec3 normal, float offset) {
    return aug_dist(
        dot(p, normal) - offset,
        normal,
        poly_color
    );
}

// inspired by Inigo Quilez's box SDF,
//
//   https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
//   https://www.iquilezles.org/www/articles/boxfunctions/boxfunctions.htm
//
// but different. in particular, this one is only a bound
aug_dist cube_sdf(vec3 p_scene, float size) {
    vec3 attitude = vec3(1./(2.+PI), 1./PI, 1./2.) * vec3(time);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    vec3 p_abs = abs(p);
    vec3 normal = msign(p) * vec3(
        p_abs.x >= p_abs.y && p_abs.x >= p_abs.z ? 1. : 0.,
        p_abs.y >= p_abs.z && p_abs.y >= p_abs.x ? 1. : 0.,
        p_abs.z >= p_abs.x && p_abs.z >= p_abs.y ? 1. : 0.
    );
    return aug_dist(
        argmax(p_abs - vec3(size)),
        orient * normal,
        poly_color
    );
}

aug_dist octa_sdf(vec3 p_scene, float size) {
    vec3 attitude = vec3(1./(2.+PI), 1./PI, 1./2.) * vec3(time);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    // take the side normal in the positive orthant
    vec3 normal = vec3(1.) / sqrt(3.);
    
    // reflect it into the orthant of p
    normal *= msign(p);
    
    // now it's the normal of the side closest to p
    aug_dist dist = plane_sdf(p, normal, size);
    dist.normal = orient * dist.normal;
    return dist;
}

const float phi = (1.+sqrt(5.))/2.;

aug_dist dodeca_sdf(vec3 p_scene, float size) {
    vec3 attitude = vec3(1./(2.+PI), 1./PI, 1./2.) * vec3(time);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    // take the side normals in the positive orthant
    vec3 normals [3];
    normals[0] = vec3(0., 1., phi) / sqrt(2.+phi);
    normals[1] = normals[0].zxy;
    normals[2] = normals[1].zxy;
    
    // reflect them into the orthant of p
    for (int k = 0; k < 3; k++) {
        normals[k] *= msign(p);
    }
    
    // now, one of them is the normal of the side closest to p
    aug_dist dist =  plane_sdf(p, normals[0], size);
    dist = max(dist, plane_sdf(p, normals[1], size));
    dist = max(dist, plane_sdf(p, normals[2], size));
    dist.normal = orient * dist.normal;
    return dist;
}

aug_dist icosa_sdf(vec3 p_scene, float size) {
    vec3 attitude = vec3(1./(2.+PI), 1./PI, 1./2.) * vec3(time);
    mat3 orient = euler_rot(attitude);
    vec3 p = p_scene * orient; // = transpose(orient) * p_scene
    
    // take the side normals in the positive orthant
    vec3 normals [4];
    normals[0] = vec3(1.) / sqrt(3.);
    normals[1] = vec3(0., phi-1., phi) / sqrt(3.);
    normals[2] = normals[1].zxy;
    normals[3] = normals[2].zxy;
    
    // reflect them into the orthant of p
    for (int k = 0; k < 4; k++) {
        normals[k] *= msign(p);
    }
    
    // now, one of them is the normal of the side closest to p
    aug_dist dist =  plane_sdf(p, normals[0], size);
    for (int j = 1; j < 4; j++) {
        dist = max(dist, plane_sdf(p, normals[j], size));
    }
    dist.normal = orient * dist.normal;
    return dist;
}

//----------------------CIE Lab----------------------
// from nmz's 3d color space visualization
// https://www.shadertoy.com/view/XddGRN

// map colors from Lab space to RGB space. see explore-lab/explore-lab-l.frag
// to learn more

const vec3 wref =  vec3(.95047, 1.0, 1.08883);

float xyzR(float t){ return mix(t*t*t , 0.1284185*(t - 0.139731), step(t,0.20689655)); }

vec3 lab2rgb(in vec3 c)
{   
    float lg = 1./116.*(c.x + 16.);
    vec3 xyz = vec3(wref.x*xyzR(lg + 0.002*c.y),
                    wref.y*xyzR(lg),
                    wref.z*xyzR(lg - 0.005*c.z));
    vec3 rgb = xyz*mat3( 3.2406, -1.5372,-0.4986,
                        -0.9689,  1.8758, 0.0415,
                         0.0557, -0.2040, 1.0570);
    return rgb;
}

// --- marcher ---

const int steps = 256;
const float eps = 0.001;
const float horizon = 30.0;

float quart(float t) {
    t *= t;
    t *= t;
    return t;
}

float smoothstair(float t, float n) { return t + sin(n*t)/n; }

float triplestair(float t, float n) {
    for (int cnt = 0; cnt < 3; cnt++) {
        t = smoothstair(t, n);
    }
    return t;
}

vec2 cis(float t) { return vec2(cos(t), sin(t)); }

vec3 radiance(aug_dist dist, vec3 sky_color) {
    return mix(sky_color, dist.color, (1.+dot(dist.normal, vec3(1.0)/sqrt(3.0)))/2.);
}

vec3 ray_color(vec3 place, vec3 dir) {
    // easing function
    float t = time*PI2/40.;
    float pop = quart((1. + cos(4.*t)) / 2.);
    vec2 sweep = cis(triplestair(t, 4.));
    
    // at lightness 51, an RGB monitor can display all colors with chroma <=
    // 29.94. you can verify this with the `chromawheel` function in
    // `find-chromasphere.jl`. hat tip to Math.SE user joeytwiddle for the
    // smooth stair function
    //
    //   https://math.stackexchange.com/a/2970318/16063
    //
    vec3 sky_color = lab2rgb(vec3(51., 29.94*sweep));
    
    float r = 0.0;
    for (int step_cnt = 0; step_cnt < steps; step_cnt++) {
        vec3 p_scene = place + r*dir;
        aug_dist poly;
        float selector = mod(time, 40.);
        if (selector < 10.) {
            poly = cube_sdf(p_scene, 1.-pop);
        } else if (selector < 20.) {
            poly = octa_sdf(p_scene, 1.-pop);
        } else if (selector < 30.) {
            poly = dodeca_sdf(p_scene, 1.-pop);
        } else {
            poly = icosa_sdf(p_scene, 1.-pop);
        }
        if (poly.dist < eps) {
            return radiance(poly, sky_color);
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
