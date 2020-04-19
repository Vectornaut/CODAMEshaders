float equalizer(float level) {
    if (uvN().y < level) return 1.0; else return 0.0;
}

// an equalizer that shows the four components of `bands`. try feeding some
// music into the audio input!
void main() {
    vec2 position = uvN();
    vec3 color;
    if (position.x < 0.25) {
        color = equalizer(bands.x)*vec3(1.0, 0.5, 0.3);
    } else if (position.x < 0.5) {
        color = equalizer(bands.y)*vec3(0.8, 0.9, 0.0);
    } else if (position.x < 0.75) {
        color = equalizer(bands.z)*vec3(0.0, 0.8, 0.5);
    } else {
        color = equalizer(bands.w)*vec3(0.6, 0.0, 0.4);
    }
    gl_FragColor = vec4(color, 1.0);
}
