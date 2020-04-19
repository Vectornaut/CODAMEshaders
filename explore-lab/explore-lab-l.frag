//----------------------CIE Lab----------------------
// from nmz's 3d color space visualization
// https://www.shadertoy.com/view/XddGRN

// map colors from Lab space to RGB space. we want to do this because RGB is a
// color space for machines, and Lab is a color space for humans.
//   https://en.wikipedia.org/wiki/CIELAB_color_space
// the R, G, B coordinates represent the brightnesses of the three tiny lamps
// inside a pixel. the L, a, b coordinates approximate three dimensions of human
// color perception: the black-white, green-red, and blue-yellow "opponent
// processes"
//   http://www.huevaluechroma.com/073.php

// the mapping formulas nmz uses can be found at
//   https://en.wikipedia.org/wiki/CIELAB_color_space#Reverse_transformation
//   https://en.wikipedia.org/wiki/CIE_1931_color_space#Construction_of_the_CIE_XYZ_color_space_from_the_Wright%E2%80%93Guild_data
// the RGB --> XYZ map is non-linear, and the XYZ --> RGB map is linear

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

// --- main ---

// show all the colors in Lab space that an RGB monitor can display. the a and b
// axes are horizontal and vertical. pure grays, at (a, b) = (0, 0), are in the
// center of the screen. moving the mouse up and down scrubs through L slices
void main () {
    vec2 uvC = 2.0*uvN() - 1.0;
    vec3 color = lab2rgb(vec3(100.0*(1.0 - mouse.y/(2.0*resolution.y)), 128.0*uvC));
    if (
        color.x < 0.0 || color.y < 0.0 || color.z < 0.0 ||
        color.x > 1.0 || color.y > 1.0 || color.z > 1.0
    ) {
        color = vec3(0.5, 0.5, 0.5);
    }
    gl_FragColor = vec4(color, 1.0);
}
