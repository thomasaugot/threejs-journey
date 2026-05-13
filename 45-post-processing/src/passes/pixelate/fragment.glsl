uniform sampler2D tDiffuse;
uniform float uPixelCount;

varying vec2 vUv;

void main() {
    vec2 snapped = floor(vUv * uPixelCount) / uPixelCount;
    gl_FragColor = texture2D(tDiffuse, snapped);
}
