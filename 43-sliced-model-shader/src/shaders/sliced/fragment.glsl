uniform float uSliceStart;
uniform float uSliceArc;

varying vec3 vPosition;

void main() {
    float angle = atan(vPosition.y, vPosition.x);
    angle -= uSliceStart;
    angle = mod(angle + 2.0 * 3.14159265359, 2.0 * 3.14159265359);

    if (angle < uSliceArc) {
        discard;
    }

    float csm_Slice;
}
