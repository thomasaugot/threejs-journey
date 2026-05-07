varying vec3 vColor;
varying float vAge;

void main()
{
    float distanceToCenter = length(gl_PointCoord - 0.5);

    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);

    gl_FragColor = vec4(vColor, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}