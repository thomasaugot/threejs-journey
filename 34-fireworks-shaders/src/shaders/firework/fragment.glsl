uniform sampler2D uTexture;
uniform vec3 uColor;
uniform float uBrightness;

void main() {
    float textureAlpha = texture(uTexture, gl_PointCoord).r;
    textureAlpha = pow(textureAlpha, 0.45);

    // Final position
    gl_FragColor = vec4(uColor * uBrightness, textureAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}