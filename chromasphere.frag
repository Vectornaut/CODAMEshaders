// --- riemann sphere ---

// complex arithmetic on the riemann sphere. the vector (s, t, p, q) represents
// the point with projective coordinates
//   [ s + i*t : p + i*q ].
// streographic projection from the south pole maps that to the point
//   (s + i*t) / (p + i*q)
// in the complex plane.

const vec4 ONE = vec4(1.0, 0.0, 1.0, 0.0);
const vec4 I   = vec4(0.0, 1.0, 1.0, 0.0);

//  the complex conjugate of `z`
vec4 conj(vec4 z) {
    return vec4(z.s, -z.t, z.p, -z.q);
}

// the product of a real number `a` with `z`
vec4 mul(float a, vec4 z) {
    return vec4(a*z.st, z.pq);
}

// the product of `z` and `w`
vec4 mul(vec4 z, vec4 w) {
    vec4 z_conj = conj(z);
    return vec4(
      mat2(z.st, z_conj.ts) * w.st,
      mat2(z.pq, z_conj.qp) * w.pq
    );
}

// the reciprocal of `z`
vec4 rcp(vec4 z) {
    return z.pqst;
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

// --- chromasphere ---
// adapted from endolith's complex_colormap code
// https://github.com/endolith/complex_colormap/tree/master/complex_colormap

// endolith created this palette for phase plots of complex functions, like the
// ones in this article. (the article uses a different palette---possibly based
// on a CMYK color wheel?)
// https://www.ams.org/notices/201106/rtx110600768p.pdf

// at each lightness `l`, we want to use a constant-chroma color wheel with the
// most saturated colors an RGB monitor can display. this function approximates
// the radius of that color wheel using an efficient piecewise-linear formula
float appx_chromawheel(in float l) {
    if (l <= 0.0 || 100.0 <= l) return 0.0;
    float lpts [5];
    float cpts [5];
    lpts[0] =   0.0; lpts[1] =   9.2; lpts[2] =  73.8; lpts[3] =  90.0; lpts[4] = 100.0;
    cpts[0] =   0.0; cpts[1] =  10.8; cpts[2] =  39.9; cpts[3] =  12.5; cpts[4] =   0.0;
    float lbot; float ltop;
    float cbot; float ctop;
    if      (l < lpts[1]) { lbot = lpts[0]; ltop = lpts[1]; cbot = cpts[0]; ctop = cpts[1]; }
    else if (l < lpts[2]) { lbot = lpts[1]; ltop = lpts[2]; cbot = cpts[1]; ctop = cpts[2]; }
    else if (l < lpts[3]) { lbot = lpts[2]; ltop = lpts[3]; cbot = cpts[2]; ctop = cpts[3]; }
    else                  { lbot = lpts[3]; ltop = lpts[4]; cbot = cpts[3]; ctop = cpts[4]; }
    float t = (l - lbot) / (ltop - lbot);
    return (1.0-t)*cbot + t*ctop;
}

// the color of the point `z` on the riemann sphere. its lightness and hue show
// the latitude and longitude of `z`
vec3 chromasphere(vec4 z) {
    // find lengths of projective coordinates
    float r_st = length(z.st);
    float r_pq = length(z.pq);
    
    // find phases of projective coordinates
    vec4 u = z / vec4(r_st, r_st, r_pq, r_pq);
    vec4 u_conj = conj(u);
    
    float l = 100.0*(1.0 - 1.0/(1.0 + 2.0*pow(r_st/r_pq, 0.3)));
    vec2 u_north = mat2(u.st, u_conj.ts) * u_conj.pq; // u.st / u.pq
    return lab2rgb(vec3(l, appx_chromawheel(l)*u_north));
}

// --- main ---

void main() {
    float fade = 1.0 + cos(time/2.0);
    vec4 spin = mul(cos(time), ONE) + mul(sin(time), I);
    vec4 z = mul(fade, mul(spin, vec4(uv(), 1.0, 0.0)));
    gl_FragColor = vec4(chromasphere(rcp(z)), 0.0);
}
