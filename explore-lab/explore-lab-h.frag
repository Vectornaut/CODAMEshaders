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
                         0.0557,  -0.2040, 1.0570);
    return rgb;
}

//---------------------------------------------------

void main () {
    vec2 unit = vec2(cos(PI2*uvN().x), sin(PI2*uvN().x));
    vec3 color = lab2rgb(vec3(100.0*uvN().y, 128.0*(1.0 - mouse.y)/(2.0*resolution.y)*unit));
    if (
        color.x < 0.0 || color.y < 0.0 || color.z < 0.0 ||
        color.x > 1.0 || color.y > 1.0 || color.z > 1.0
    ) {
        color = vec3(0.4, 0.4, 0.4);
    }
    for (int n = 1; n < 16; n++) {
        float h = uvN().y - float(n)/16.0;
        if (-0.0015 < h && h < 0.0015) {
            color = vec3(0.6, 0.6, 0.6);
        }
    }
    gl_FragColor = vec4(color, 1.0);
}
