uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;

varying vec2 vUv;

void main() {
    vec2 newUv = vec2(
        vUv.x + sin(vUv.y * uFrequency + uTime) * uAmplitude,
        vUv.y + sin(vUv.x * uFrequency + uTime * 0.8) * uAmplitude
    );

    gl_FragColor = texture2D(tDiffuse, newUv);
}
