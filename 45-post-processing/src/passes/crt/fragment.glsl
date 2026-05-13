uniform sampler2D tDiffuse;
uniform float uScanlineCount;
uniform float uScanlineIntensity;
uniform float uCurvature;

varying vec2 vUv;

vec2 curveUv(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(6.0 / uCurvature, 4.0 / uCurvature);
    uv = uv + uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
}

void main() {
    vec2 uv = curveUv(vUv);

    // Black outside the curved screen
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec4 color = texture2D(tDiffuse, uv);

    // Scanlines
    float scanline = sin(uv.y * uScanlineCount) * 0.5 + 0.5;
    color.rgb *= mix(1.0, scanline, uScanlineIntensity);

    // Subtle vignette to sell the CRT look
    float vignette = smoothstep(0.8, 0.2, distance(uv, vec2(0.5)));
    color.rgb *= mix(0.6, 1.0, vignette);

    gl_FragColor = color;
}
