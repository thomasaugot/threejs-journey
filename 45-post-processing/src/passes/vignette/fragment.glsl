uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uVignetteIntensity;
uniform float uGrainIntensity;

varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec4 color = texture2D(tDiffuse, vUv);

    // Vignette
    float dist = distance(vUv, vec2(0.5));
    float vignette = smoothstep(0.8, 0.2, dist);
    color.rgb *= mix(1.0 - uVignetteIntensity, 1.0, vignette);

    // Animated film grain
    float grain = random(vUv + fract(uTime)) - 0.5;
    color.rgb += grain * uGrainIntensity;

    gl_FragColor = color;
}
