import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// Animated noise portal: swirling green energy with a hot core and soft edge.
const PortalMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorCore: new THREE.Color("#d8ff9e"),
    uColorEdge: new THREE.Color("#3a7a16"),
  },
  // vertex
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColorCore;
    uniform vec3 uColorEdge;

    // --- 2D simplex noise (Ashima / Stefan Gustavson) ---
    vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0))
                              + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                              dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // Center the UVs and work in polar coords for a swirl.
      vec2 p = vUv - 0.5;
      float r = length(p) * 2.0;          // 0 at center, ~1 at edge
      float angle = atan(p.y, p.x);

      // Swirl the sampling coords + flow inward over time.
      float swirl = angle + (1.0 - r) * 3.0 + uTime * 0.6;
      vec2 sp = vec2(cos(swirl), sin(swirl)) * r;

      // Layered noise for churning energy.
      float n = snoise(sp * 3.0 + uTime * 0.4);
      n += 0.5 * snoise(sp * 6.0 - uTime * 0.7);
      n = n * 0.5 + 0.5;

      // Hotter toward the center, fade out past the rim.
      float core = smoothstep(1.0, 0.0, r);
      float edge = smoothstep(1.05, 0.7, r);   // soft circular mask
      vec3 col = mix(uColorEdge, uColorCore, core * (0.4 + 0.6 * n));

      // Brighten with the noise so it shimmers, then mask to a disc.
      col *= 0.7 + n * 0.9;
      float alpha = edge;

      gl_FragColor = vec4(col, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
);

extend({ PortalMaterial });

export default PortalMaterial;
