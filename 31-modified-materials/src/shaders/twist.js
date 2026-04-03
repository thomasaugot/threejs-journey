const twistParsVertex = `
  #include <common>

  uniform float uTime;

  mat2 get2dRotateMatrix(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  }
`;

const twistMainVertex = `
  #include <begin_vertex>

  float angle = (position.y + uTime) * 0.5;
  mat2 rotateMatrix = get2dRotateMatrix(angle);

  transformed.xz = rotateMatrix * transformed.xz;
`;

export const injectTwist = (shader, customUniforms) => {
  shader.uniforms.uTime = customUniforms.uTime;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    twistParsVertex,
  );
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    twistMainVertex,
  );
};
