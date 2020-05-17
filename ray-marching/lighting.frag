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

const int steps = 512;
const float horizon = 60.;
const float dust_horizon = 30.;

vec3 sky_color = vec3(0.0, 0.2, 0.3);
vec3 sun_color = vec3(1.);
vec3 sun_dir = normalize(vec3(cos(time/2.), -0.5, sin(time/2.)));

float dotplus(vec3 a, vec3 b) { return max(dot(a, b), 0.); }

vec3 skylight(vec3 dir) {
    float sun_cos = dotplus(dir, -sun_dir);
    if (sun_cos > 0.99999) {
        return sun_color;
    } else {
        return mix(sky_color, sun_color, 0.3*exp(5.*(sun_cos*sun_cos - 1.)));
    }
}

vec3 radiance(vec3 color, vec3 normal, vec3 view_dir) {
    vec3 ambient = color * sky_color;
    vec3 diffuse = color * sun_color * dotplus(-normal, sun_dir);
    
    // `spec_dir` is the viewing direction with the strongest specular highlight
    vec3 spec_dir = -reflect(sun_dir, normal);
    vec3 specular = sun_color * pow(dotplus(view_dir, spec_dir), 32.);
    
    return ambient + diffuse + specular;
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
            vec3 rad = radiance(vec3(1.0, 0.4, 0.5), normal, dir);
            
            // this is a kludgy way to deal with the fact that the spheres cover
            // the whole sky. the idea is that faraway spheres act like dust
            // that contributes to atmospheric perspective, rather than distinct
            // objects that block out the sky. the implementation probably isn't
            // very physical; i just picked something that looked all right
            vec3 atm_color;
            if (r < dust_horizon) {
                atm_color = sky_color;
            } else {
                atm_color = mix(skylight(dir), sky_color, exp(-0.05*(r-dust_horizon)));
            }
            return mix(atm_color, rad, exp(-0.2*r));
        } else if (r > horizon) {
            return skylight(dir);
        } else {
            r += dist;
        }
    }
    
    // if you see lime green, we ran out of steps
    return vec3(0., 1., 0.);
}

void main() {
    vec3 dir = normalize(vec3(uv(), -1.));
    vec3 eye = vec3(0., 0., -0.5*time);
    vec3 color = vec3(ray_color(eye, dir));
    gl_FragColor = vec4(color, 0.);
}
