varying vec3 vNormal;
varying vec3 vPosition;

void main()
{
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Normal
    vNormal = normalize(normalMatrix * normal);

    // Position
    vPosition = modelPosition.xyz;
}
