
uniform float uTime;
uniform sampler2D uPerlinTexture;
varying vec2 vUv;

void main() {
    // scale and animate
    vec2 smokeUv = vUv;
    smokeUv.x *= 0.5; // scale the uv coordinates to make the smoke pattern larger
    smokeUv.y *= 0.3;
    smokeUv.y -= uTime * 0.03; // animate the smoke

    // smoke is a texture that contains the perlin noise, we sample it using the uv coordinates
    float smoke = texture2D(uPerlinTexture, smokeUv).r;

    smoke = smoothstep(0.4, 1.0, smoke); // we use smoothstep to create a smoother transition between the transparent and opaque parts of the smoke

    // edges on both sides of plane are too defiend, we use smoothstep to create a smoother transition between the transparent and opaque parts of the smoke
    smoke *= smoothstep(0.0, 0.1, vUv.x); // left edge
    smoke *= smoothstep(1.0, 0.9, vUv.x); // right edge
    smoke *= smoothstep(0.0, 0.1, vUv.y); // bottom edge
    smoke *= smoothstep(1.0, 0.4, vUv.y); // top edge

    // we use the red channel of the texture as the alpha value of the smoke, and we set the color to white
    gl_FragColor = vec4(0.6, 0.3, 0.2, smoke);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
