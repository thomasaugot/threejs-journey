varying vec3 vColor;
varying float vTextureIndex;

uniform float uTime;
uniform float uBrightness;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uTexture3;
uniform sampler2D uTexture4;

vec2 rotate(vec2 uv, float angle)
{
    float s = sin(angle);
    float c = cos(angle);
    mat2 rotation = mat2(c, -s, s, c);

    return rotation * (uv - 0.5) + 0.5;
}

void main()
{
    vec2 centeredCoord = gl_PointCoord - vec2(0.5);
    float distanceToCenter = length(centeredCoord);

    if(distanceToCenter > 0.5)
    {
        discard;
    }

    float angle = uTime * (0.08 + vTextureIndex * 0.03) + vTextureIndex;
    vec2 rotatedCoord = rotate(gl_PointCoord, angle);

    vec4 textureColor;

    if(vTextureIndex < 0.5)
    {
        textureColor = texture2D(uTexture1, rotatedCoord);
    }
    else if(vTextureIndex < 1.5)
    {
        textureColor = texture2D(uTexture2, rotatedCoord);
    }
    else if(vTextureIndex < 2.5)
    {
        textureColor = texture2D(uTexture3, rotatedCoord);
    }
    else
    {
        textureColor = texture2D(uTexture4, rotatedCoord);
    }

    vec2 sphereUv = gl_PointCoord * 2.0 - 1.0;
    float z = sqrt(max(0.0, 1.0 - dot(sphereUv, sphereUv)));
    vec3 normal = normalize(vec3(sphereUv, z));
    vec3 lightDirection = normalize(vec3(-0.4, 0.6, 1.0));
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float atmosphere = smoothstep(0.5, 0.18, distanceToCenter);
    float edgeGlow = smoothstep(0.52, 0.34, distanceToCenter) * 0.45;

    vec3 baseColor = mix(textureColor.rgb, textureColor.rgb * vColor, 0.18);
    vec3 litColor = baseColor * (0.45 + diffuse * 0.95);
    vec3 glowColor = mix(vColor, vec3(1.0), 0.5) * edgeGlow;
    vec3 finalColor = (litColor + glowColor) * uBrightness;

    gl_FragColor = vec4(finalColor, atmosphere);
}
