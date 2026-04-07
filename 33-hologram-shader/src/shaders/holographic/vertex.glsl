uniform float uTime;

varying vec3 vPosition;
varying vec3 vNormal;

#include ../includes/random2D.glsl

void main() {
// position
vec4 modelPosition = modelMatrix * vec4(position, 1.0);

// glitch effect
float glitchTime = uTime - modelPosition.y; // make the glitch move vertically
float glitchStrength = sin(glitchTime) + sin(glitchTime * 3.45) + sin(glitchTime * 8.76); // combine multiple sine waves for a more complex glitch
glitchStrength /= 3.0; // normalize the strength to be between -1 and 1
glitchStrength = smoothstep(0.3, 1.0, glitchStrength);
glitchStrength *= 0.25;
modelPosition.x += (random2D(modelPosition.xz + uTime) - 0.5) * glitchStrength;
modelPosition.z += (random2D(modelPosition.zx + uTime) - 0.5) * glitchStrength;

// final position
gl_Position = projectionMatrix * viewMatrix * modelPosition;

// model normal
vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

// varyings
vPosition = modelPosition.xyz;
vNormal = modelNormal.xyz;
}
