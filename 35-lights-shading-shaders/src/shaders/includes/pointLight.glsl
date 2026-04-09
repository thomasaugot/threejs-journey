vec3 pointLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower, vec3 fragmentPosition, float lightDecay) {
    vec3 lightDelta = lightPosition - fragmentPosition;
    float distance = length(lightDelta);
    vec3 lightDirection = normalize(lightDelta);
    vec3 lightReflection = reflect(- lightDirection, normal);

    //shading
    float shading = dot(normal, lightDirection);
    shading = max(shading, 0.0); // clamp the shading to be between 0 and 1 to avoid negative values  

    // specular
    float specular = dot(lightReflection, viewDirection);
    specular = max(0.0, specular); // clamp the specular to be between 0 and 1 to avoid negative values
    specular = pow(specular, specularPower); // shininess 

    // decay
    float decay = 1.0 / (1.0 + lightDecay * distance * distance); // quadratic decay

    return lightColor * lightIntensity * decay * (shading + specular);
}