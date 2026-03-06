import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
const { RectAreaLightHelper } = await import('three/examples/jsm/helpers/RectAreaLightHelper.js')

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Lights
 */

// ambient light is applying on every sides uniformly, it doesn't have a direction, it just light up everything
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // first parameter is color, second is intensity
scene.add(ambientLight)

gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)

// directional light is applying on one direction, it has a direction, it light up only the side that is facing the light
const directionalLight = new THREE.DirectionalLight(0x00fffc, 0.3)
directionalLight.position.set(1, 0.25, 0)
scene.add(directionalLight)

gui.add(directionalLight, 'intensity').min(0).max(1).step(0.001)

const hemisphereLight = new THREE.HemisphereLight(0xff0000, 0x0000ff, 0.3) // first parameter is sky color, second is ground color, third is intensity
scene.add(hemisphereLight)

gui.add(hemisphereLight, 'intensity').min(0).max(1).step(0.001)

const pointLight = new THREE.PointLight(0xff9000, 0.5, 10, 2) // first parameter is color, second is intensity, third is distance
pointLight.position.set(1, -0.5, 1)
scene.add(pointLight)

const rectAreaLight = new THREE.RectAreaLight(0x4e00ff, 2, 1, 1) // first parameter is color, second is intensity, third is width, fourth is height
rectAreaLight.position.set(- 1.5, 0, 1.5)
rectAreaLight.lookAt(new THREE.Vector3()) // look at the center of the scene
scene.add(rectAreaLight)

const spotLight = new THREE.SpotLight(0x78ff00, 0.5, 10, Math.PI * 0.1, 0.25, 1) // first parameter is color, second is intensity, third is distance, fourth is angle, fifth is penumbra, sixth is decay
spotLight.position.set(0, 2, 3)
scene.add(spotLight)
spotLight.target.position.x = - 0.75
scene.add(spotLight.target)

gui.add(spotLight, 'intensity').min(0).max(1).step(0.001)
gui.add(spotLight, 'angle').min(0).max(Math.PI * 0.5).step(0.001)
gui.add(spotLight, 'penumbra').min(0).max(1).step(0.001)
gui.add(spotLight, 'decay').min(0).max(2).step(0.001)

// helpers
const hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight, 0.2) // first parameter is the light to be helper, second is the size of the helper
scene.add(hemisphereLightHelper)

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.2) // first parameter is the light to be helper, second is the size of the helper
scene.add(directionalLightHelper)

const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2) // first parameter is the light to be helper, second is the size of the helper
scene.add(pointLightHelper)

const spotLightHelper = new THREE.SpotLightHelper(spotLight) // first parameter is the light to be helper
scene.add(spotLightHelper)


// for this one we need to update it in the animation loop because the spotlight is moving, so we need to update the helper to match the spotlight
window.requestAnimationFrame(() =>
{
    spotLightHelper.update()
})

const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight) // first parameter is the light to be helper
scene.add(rectAreaLightHelper)

/**
 * Objects
 */
// Material
const material = new THREE.MeshStandardMaterial()
material.roughness = 0.4

// Objects
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    material
)
sphere.position.x = - 1.5

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    material
)

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.2, 32, 64),
    material
)
torus.position.x = 1.5

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    material
)
plane.rotation.x = - Math.PI * 0.5
plane.position.y = - 0.65

scene.add(sphere, cube, torus, plane)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update objects
    sphere.rotation.y = 0.1 * elapsedTime
    cube.rotation.y = 0.1 * elapsedTime
    torus.rotation.y = 0.1 * elapsedTime

    sphere.rotation.x = 0.15 * elapsedTime
    cube.rotation.x = 0.15 * elapsedTime
    torus.rotation.x = 0.15 * elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()