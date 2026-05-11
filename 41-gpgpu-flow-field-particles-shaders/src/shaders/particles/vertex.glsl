uniform vec2 uResolution;
uniform float uSize;
uniform sampler2D uParticlesTexture;
uniform vec3 uColor;

attribute vec2 aParticlesUv;
attribute vec3 aColor;
attribute float aSize;

varying vec3 vColor;
varying float vAge;

void main()
{
    // Get particle data
    vec4 particle = texture(uParticlesTexture, aParticlesUv);
    vec3 position = particle.xyz;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    float sizeIn = smoothstep(0.0, 1.0, particle.a);
    float sizeOut = 1.0 - smoothstep(0.7, 1.0, particle.a);
    float size = min(sizeIn, sizeOut);

    gl_PointSize = size * aSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    vColor = length(aColor) > 0.001 ? aColor : uColor;
    vAge = particle.a;
}