uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

#include ../includes/rotate2D.glsl

void main()
{
    vec3 newPosition = position;

    float twistPerlin = texture(uPerlinTexture, vec2(0.5, uv.y * 0.2 - uTime * 0.01)).r; // we sample the perlin texture using the x and z coordinates of the vertex to create a twist effect that is different for each vertex
    float angle = twistPerlin * 10.0; // we use the y position of the vertex to create a different angle for each vertex, and we animate it using the time uniform
    newPosition.xz = rotate2D(newPosition.xz, angle);

    // wind
    vec2 windOffset = vec2(texture(uPerlinTexture, vec2(0.25, uTime * 0.01)).r - 0.5, texture(uPerlinTexture, vec2(0.75, uTime * 0.01)).r - 0.5); 
    windOffset *= pow(uv.y, 3.0) * 10.0; // we sample the perlin texture to create a wind effect that moves the smoke in the x direction, and we animate it using the time uniform
    newPosition.xz += windOffset;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

    vUv = uv;
}