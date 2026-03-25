uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uWaveAmplitude;

attribute vec3 position;
attribute vec2 uv;

varying float vElevation;
varying vec2 vUv;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float elevation = sin(modelPosition.x * uWaveFrequency - uTime * uWaveSpeed) * uWaveAmplitude;
    elevation += sin(modelPosition.y * uWaveFrequency * 0.5 - uTime * uWaveSpeed * 0.7) * uWaveAmplitude * 0.25;
    modelPosition.z += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vElevation = elevation;
    vUv = uv;
}
