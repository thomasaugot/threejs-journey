
precision mediump float;

varying float vElevation;
varying vec2 vUv;

uniform sampler2D uTexture;

void main()
{
    vec3 color = texture2D(uTexture, vUv).rgb;
    color += vElevation * 1.5;
    gl_FragColor = vec4(color, 1.0);
}
