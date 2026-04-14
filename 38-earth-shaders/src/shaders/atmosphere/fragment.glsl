varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // Sun orientation
    float sunOrientation = dot(uSunDirection, normal);

    // Atmosphere
    float atmosphereDayMix = smoothstep(- 0.5, 1.0, sunOrientation); 
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);

    color += atmosphereColor; // combine atmosphere to color

    // Alpha
    float edgeAlpha = dot(viewDirection, normal); // fade out at the edges
    edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha); // smooth the fade

    float dayAlpha = smoothstep(-0.5, 0.0, sunOrientation); // fade out at night

    float alpha = edgeAlpha * dayAlpha; // combine edge and day alpha
    color = vec3(alpha); // apply alpha to color

    // Final color
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}