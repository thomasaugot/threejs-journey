uniform float uSize;

varying vec3 vColor;
attribute float scale;
attribute float textureIndex;
varying float vTextureIndex;

void main()
{
    vColor = color;
    vTextureIndex = textureIndex;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * scale * 300.0 / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
}
