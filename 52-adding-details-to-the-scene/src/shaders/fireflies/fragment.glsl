void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = smoothstep(0.5, 0.0, distanceToCenter);

    gl_FragColor = vec4(1.0, 1.0, 1.0, strength);
}
