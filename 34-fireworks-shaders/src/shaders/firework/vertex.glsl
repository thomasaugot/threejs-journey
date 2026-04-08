uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress;

attribute float aSize;
attribute float aTimeMultiplier;

#include ../includes/remap.glsl

void main() {
    float progress = uProgress * aTimeMultiplier;
    vec3 newPosition = position;

    // exploding
    float explodingProgress = remap(progress, 0.0, 0.1, 0.0, 1.0);
    explodingProgress = clamp(explodingProgress, 0.0, 1.0);
    explodingProgress = 1.0 - pow(1.0 - explodingProgress, 3.0);
    newPosition *= explodingProgress;

    // falling
    float fallingProgress = remap(progress, 0.1, 1.0, 0.0, 1.0);
    fallingProgress = clamp(fallingProgress, 0.0, 1.0);
    fallingProgress = 1.0 - pow(1.0 - fallingProgress, 3.0);
    newPosition.y -= fallingProgress * 0.2;

    // scaling (start large, then shrink)
    float sizeProgress = 1.0 - progress;
    sizeProgress = clamp(sizeProgress, 0.0, 1.0);
    sizeProgress = pow(sizeProgress, 0.9);

    // twinkling
    float twinkleProgress = remap(progress, 0.2, 0.8, 0.0, 1.0);
    twinkleProgress = clamp(twinkleProgress, 0.0, 1.0);
    float sizetwinkle = sin(progress * 30.0) * 0.5 + 0.5;
    sizetwinkle = 1.0 - sizetwinkle * twinkleProgress;

    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    // Final point size
    gl_PointSize = uSize * uResolution.y * aSize * sizeProgress * sizetwinkle;
    gl_PointSize *= (1.0 / - viewPosition.z);

    if (gl_PointSize < 1.0) {
        gl_Position = vec4(9999.0);
    }
}
