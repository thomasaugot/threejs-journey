varying vec2 vUv;

float random(vec2 st)
{
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 random2(vec2 st)
{
    st = vec2(
        dot(st, vec2(127.1, 311.7)),
        dot(st, vec2(269.5, 183.3))
    );

    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

float noise(vec2 st)
{
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = dot(random2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
}

float fbm(vec2 st)
{
    float value = 0.0;
    float amplitude = 0.5;

    for(int i = 0; i < 5; i++)
    {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

float turbulence(vec2 st)
{
    float value = 0.0;
    float amplitude = 0.5;

    for(int i = 0; i < 5; i++)
    {
        value += amplitude * abs(noise(st) * 2.0 - 1.0);
        st *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

float ridge(vec2 st)
{
    float n = noise(st) * 2.0 - 1.0;
    return 1.0 - abs(n);
}

void main()
{
// Pattern 3
// float strength = vUv.x

// Pattern 4
// float strength = vUv.y;

// Pattern 5
// float strength = 1.0 - vUv.y;

// Pattern 6
// float strength = vUv.y * 10.0;

// Pattern 7
// float strength = mod(vUv.y * 10.0, 1.0);

// Pattern 8
// float strength = mod(vUv.y * 10.0, 1.0);
// strength = step(0.8, strength);

// Pattern 9
// float strength = mod(vUv.x * 10.0, 1.0);
// strength = step(0.8, strength);

// Pattern 10
// float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
// strength += step(0.8, mod(vUv.y * 10.0, 1.0));

// Pattern 11
// float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
// strength *= step(0.8, mod(vUv.y * 10.0, 1.0));

// Pattern 12
// float strength = step(0.4, mod(vUv.x * 10.0, 1.0));
// strength *= step(0.8, mod(vUv.y * 10.0, 1.0));

// Pattern 13
// float barX = step(0.4, mod(vUv.x * 10.0, 1.0));
// barX *= step(0.8, mod(vUv.y * 10.0, 1.0));

// float barY = step(0.8, mod(vUv.x * 10.0, 1.0));
// barY *= step(0.4, mod(vUv.y * 10.0, 1.0));

// float strength = barX + barY; 

// Pattern 14
// float barX = step(0.4, mod(vUv.x * 10.0, 1.0));
// barX *= step(0.8, mod(vUv.y * 10.0, 1.0));

// float barY = step(0.8, mod(vUv.x * 10.0 + 0.2, 1.0));
// barY *= step(0.4, mod(vUv.y * 10.0 - 0.2, 1.0));

// float strength = barX + barY; 

// Pattern 15
// float strength = abs(vUv.x - 0.5);

// Pattern 16
// float strength = min(abs(vUv.x - 0.5), abs(vUv.y - 0.5));

// ...

// Pattern 20
// float strength = step(0.4, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));

// Pattern 21
// float strength = floor(vUv.x * 10.0) / 10.0;

// Pattern 22
// float strength = floor(vUv.x * 10.0) / 10.0;
// strength *= floor(vUv.y * 10.0) / 10.0;

// Pattern 23
// float strength = random(vUv);

// Pattern 24
// vec2 gridUv = vec2(
//     floor(vUv.x * 10.0) / 10.0,
//     floor(vUv.y * 10.0) / 10.0
// ); 
// float strength = random(gridUv);

// Pattern 25
// vec2 gridUv = vec2(
//     floor(vUv.x * 10.0) / 10.0,
//     floor(vUv.y * 10.0 + vUv.x * 5.0) / 10.0
// ); 
// float strength = random(gridUv);

// Pattern 26
// float strength = length(vUv - 0.5);

// Pattern 27
// float strength = (vUv.x + vUv.y) * 0.5;

// Pattern 28
// float strength = distance(vUv, vec2(0.5));

// Pattern 29
// float strength = 1.0 - step(0.25, distance(vUv, vec2(0.5)));

// Pattern 30
// float strength = step(0.2, distance(vUv, vec2(0.5)));
// strength *= 1.0 - step(0.25, distance(vUv, vec2(0.5)));

// Pattern 31
// float strength = sin(vUv.x * 20.0);

// Pattern 32
// float strength = sin(vUv.x * 20.0) * 0.5 + 0.5;

// Pattern 33
// float strength = sin(vUv.x * 20.0) * sin(vUv.y * 20.0);
// strength = strength * 0.5 + 0.5;

// Pattern 34
// float x = floor(vUv.x * 10.0);
// float y = floor(vUv.y * 10.0);
// float strength = mod(x + y, 2.0);

// Pattern 35
// float strength = abs(vUv.x - 0.5) + abs(vUv.y - 0.5);

// Pattern 36
// float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
// float strength = sin(angle * 20.0);
// strength = strength * 0.5 + 0.5;

// Pattern 37
// float strength = sin(distance(vUv, vec2(0.5)) * 40.0);
// strength = strength * 0.5 + 0.5;

// Pattern 38
// vec2 gridUv = floor(vUv * 10.0) / 10.0;
// float strength = step(0.8, random(gridUv));

// Pattern 39
// float strength = 1.0 - smoothstep(0.2, 0.25, distance(vUv, vec2(0.5)));

// Pattern 40
// float d = distance(vUv, vec2(0.5));
// float strength = smoothstep(0.2, 0.21, d) - smoothstep(0.25, 0.26, d);

// Pattern 41
// float strength = 1.0 - distance(vUv, vec2(0.5)) * 1.5;

// Pattern 42
// float barX = step(0.45, vUv.x) * (1.0 - step(0.55, vUv.x));
// float barY = step(0.45, vUv.y) * (1.0 - step(0.55, vUv.y));
// float strength = max(barX, barY);

// Pattern 43
// float strength = step(0.48, abs(vUv.x - vUv.y));
// strength = 1.0 - strength;

// Pattern 44
// float strength = mod((vUv.x + vUv.y) * 10.0, 1.0);

// Pattern 45
// vec2 gv = fract(vUv * 10.0) - 0.5;
// float strength = 1.0 - step(0.2, length(gv));

// Pattern 46
// vec2 gv = fract(vUv * 10.0) - 0.5;
// float strength = 1.0 - step(0.25, abs(gv.x) + abs(gv.y));

// Pattern 47
// float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
// float strength = angle / 6.28318530718 + 0.5;

// Pattern 48
// vec2 centeredUv = vUv - 0.5;
// float angle = atan(centeredUv.x, centeredUv.y);
// float radius = length(centeredUv);
// float strength = sin(angle * 10.0 + radius * 40.0);
// strength = strength * 0.5 + 0.5;

// Pattern 49
// vec2 s = abs(vUv - 0.5);
// float strength = step(0.45, max(s.x, s.y)) - step(0.5, max(s.x, s.y));

// Pattern 50
// vec2 p = (vUv - 0.5) * 2.0;
// p.y += 0.25;
// float a = atan(p.x, p.y);
// float r = length(p);
// float h = abs(a);
// float shape = 0.3 + 0.2 * sin(h) + 0.9 * cos(h);
// float strength = 1.0 - step(shape * 0.25, r);

// Pattern 51
// vec2 p = vUv - 0.5;
// float a = atan(p.x, p.y);
// float r = length(p);
// float splash = 0.22 + sin(a * 7.0) * 0.04 + sin(a * 13.0) * 0.02;
// float strength = 1.0 - smoothstep(splash, splash + 0.01, r);

// Pattern 52
// vec2 p = vUv - 0.5;
// float a = atan(p.x, p.y);
// float r = length(p);
// float flower = 0.18 + 0.08 * sin(a * 6.0);
// float strength = 1.0 - smoothstep(flower, flower + 0.01, r);

// Pattern 53
// vec2 p = vUv - 0.5;
// float a = atan(p.x, p.y);
// float r = length(p);
// float burst = sin(a * 24.0) * 0.5 + 0.5;
// float strength = (1.0 - smoothstep(0.2, 0.21, r)) * burst;

// Pattern 54
// vec2 p = vUv - 0.5;
// float r = length(p);
// float wobble = sin(p.x * 25.0) * sin(p.y * 25.0) * 0.02;
// float strength = 1.0 - smoothstep(0.22 + wobble, 0.23 + wobble, r);

// Pattern 55
// vec2 p = vUv - 0.5;
// p.x *= 1.2;
// float head = 1.0 - smoothstep(0.28, 0.29, length(p));
// float eyeLeft = 1.0 - smoothstep(0.03, 0.035, length(p - vec2(-0.1, 0.08)));
// float eyeRight = 1.0 - smoothstep(0.03, 0.035, length(p - vec2(0.1, 0.08)));
// float mouth = smoothstep(0.12, 0.121, length(p - vec2(0.0, -0.02))) - smoothstep(0.16, 0.161, length(p - vec2(0.0, -0.02)));
// mouth *= step(p.y, -0.02);
// float strength = head - eyeLeft - eyeRight - mouth;

// Pattern 56
// vec2 p = vUv - 0.5;
// p *= 2.0;
// float body = 1.0 - smoothstep(0.2, 0.21, length(p));
// float bite = 1.0 - smoothstep(0.12, 0.13, length(p - vec2(0.16, 0.16)));
// float eye = 1.0 - smoothstep(0.03, 0.04, length(p - vec2(-0.05, 0.1)));
// float strength = body - bite - eye;

// Pattern 57
// vec2 p = vUv - 0.5;
// p.y += 0.08;
// float bottom = 1.0 - smoothstep(0.22, 0.23, length(p));
// float topLeft = 1.0 - smoothstep(0.14, 0.15, length(p - vec2(-0.12, 0.12)));
// float topRight = 1.0 - smoothstep(0.14, 0.15, length(p - vec2(0.12, 0.12)));
// float strength = max(bottom, topLeft);
// strength = max(strength, topRight);

// Pattern 58
// vec2 p = vUv - 0.5;
// float a = atan(p.x, p.y);
// float r = length(p);
// float gear = 0.2 + step(0.0, sin(a * 12.0)) * 0.04;
// float strength = smoothstep(gear + 0.01, gear, r);

// Pattern 59
// vec2 p = vUv - 0.5;
// float a = atan(p.x, p.y);
// float r = length(p);
// float shell = a / 6.28318530718 + r * 4.0;
// float strength = sin(shell * 20.0);
// strength = strength * 0.5 + 0.5;

// Pattern 60
// vec2 p = fract(vUv * 6.0) - 0.5;
// float r = length(p);
// float blob = 0.2 + sin((vUv.x + vUv.y) * 20.0) * 0.03;
// float strength = 1.0 - smoothstep(blob, blob + 0.02, r);

// Pattern 61
// vec2 uv = vUv * 4.0;
// float strength = fbm(uv);
// strength = smoothstep(0.35, 0.65, strength);

// Pattern 62
// vec2 uv = vUv * 4.0;
// float strength = noise(uv);

// Pattern 63
// vec2 uv = vUv * 4.0;
// float strength = smoothstep(0.4, 0.6, noise(uv));

// Pattern 64
// vec2 uv = vUv * 4.0;
// float strength = turbulence(uv);

// Pattern 65
// vec2 uv = vUv * 4.0;
// float strength = ridge(uv * 3.0);

// Pattern 66
// vec2 uv = vUv * 4.0;
// vec2 warp = vec2(
//     fbm(uv + vec2(0.0, 2.0)),
//     fbm(uv + vec2(5.2, 1.3))
// );
// float strength = fbm(uv + warp * 2.0);

// Pattern 67
// vec2 uv = vUv * 4.0;
// float base = fbm(uv);
// float strength = smoothstep(0.45, 0.55, sin(base * 20.0));

// Pattern 68
vec2 uv = vUv * 5.0;
float n = fbm(uv);
float lines = fract(n * 12.0);
lines = smoothstep(0.45, 0.5, lines) - smoothstep(0.5, 0.55, lines);

vec3 colorA = vec3(0.05, 0.1, 0.9);
vec3 colorB = vec3(0.7, 0.1, 0.8);
vec3 colorC = vec3(1.0, 0.3, 0.5);
vec3 colorD = vec3(0.7, 1.0, 0.7);

vec3 gradient = mix(colorA, colorB, vUv.x);
gradient = mix(gradient, colorC, vUv.y);
gradient = mix(gradient, colorD, 0.5 * (vUv.x + vUv.y));

vec3 color = gradient * lines;

    gl_FragColor = vec4(color, 1.0);
} 
