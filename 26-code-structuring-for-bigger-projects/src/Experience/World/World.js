import * as THREE from "three";
import Experience from "../Experience";
import Environment from "./Environment";
import Fox from "./Fox";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.resources = this.experience.resources;

    this.resources.on("ready", () => {
      this.environment = new Environment();
      this.setFloor();
      this.fox = new Fox();
    });
  }

  setFloor() {
    this.scene = this.experience.scene;

    const floorColorTexture = this.resources.items.floorColorTexture;
    floorColorTexture.colorSpace = THREE.SRGBColorSpace;
    floorColorTexture.repeat.set(1.5, 1.5);
    floorColorTexture.wrapS = THREE.RepeatWrapping;
    floorColorTexture.wrapT = THREE.RepeatWrapping;

    const floorNormalTexture = this.resources.items.floorNormalTexture;
    floorNormalTexture.repeat.set(1.5, 1.5);
    floorNormalTexture.wrapS = THREE.RepeatWrapping;
    floorNormalTexture.wrapT = THREE.RepeatWrapping;

    const floorGeometry = new THREE.CircleGeometry(5, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorColorTexture,
      normalMap: floorNormalTexture,
    });

    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI * 0.5;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
  }

  update() {
    if (this.fox) {
      this.fox.update();
    }
  }
}
