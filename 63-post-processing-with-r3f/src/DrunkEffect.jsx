import { Effect } from "postprocessing";
import { forwardRef, useMemo } from "react";
import { Uniform } from "three";

const fragmentShader = `
  uniform float uTime;
  uniform float uAmplitude;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 newUv = uv;

    // slow full-screen sway on both axes
    newUv.x += sin(uTime * 0.4) * uAmplitude * 0.6;
    newUv.y += cos(uTime * 0.3) * uAmplitude * 0.4;

    // breathing zoom pulse
    vec2 centered = newUv - 0.5;
    float zoom = 1.0 + sin(uTime * 0.5) * uAmplitude * 0.3;
    newUv = centered / zoom + 0.5;

    // chromatic aberration — RGB split outward from center
    vec2 dir = normalize(centered + 0.0001) * uAmplitude * 0.02;
    float r = texture(inputBuffer, newUv + dir).r;
    float g = texture(inputBuffer, newUv).g;
    float b = texture(inputBuffer, newUv - dir).b;

    // ghost double vision
    vec4 ghost = texture(inputBuffer, newUv + vec2(sin(uTime * 0.35) * uAmplitude * 0.04, 0.0));

    outputColor = mix(vec4(r, g, b, 1.0), ghost, 0.15);
  }
`;

class DrunkEffectImpl extends Effect {
  constructor({ amplitude = 0.1 } = {}) {
    super("DrunkEffect", fragmentShader, {
      uniforms: new Map([
        ["uTime", new Uniform(0)],
        ["uAmplitude", new Uniform(amplitude)],
      ]),
    });
  }

  update(_renderer, _inputBuffer, deltaTime) {
    this.uniforms.get("uTime").value += deltaTime;
  }
}

export const Drunk = forwardRef(function Drunk({ amplitude = 0.1 }, ref) {
  const effect = useMemo(() => new DrunkEffectImpl({ amplitude }), [amplitude]);
  return <primitive ref={ref} object={effect} />;
});
