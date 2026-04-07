uniform float uTime;
uniform vec3 uColor;

varying vec3 vPosition;
varying vec3 vNormal;

void main(){
    // normal
    vec3 normal = normalize(vNormal);
    if(gl_FrontFacing == false){
        normal *= -1.0;
    }

    // stripes
    float stripes = mod((vPosition.y + uTime * 0.02) * 20.0, 1.0);
    stripes = pow(stripes, 3.0); // make the stripes sharper

    // Fresnel effect
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0; // from 0 to 2
    fresnel = pow(fresnel, 2.0); // make the effect stronger

    // falloff
    float falloff = smoothstep(0.8, 0.0, fresnel);

    // holographic
    float holographic = stripes * fresnel;
    holographic += fresnel * 1.25;

    // final color
    gl_FragColor = vec4(uColor, holographic * falloff);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}