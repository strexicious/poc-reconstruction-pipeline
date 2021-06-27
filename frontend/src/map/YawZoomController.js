import * as THREE from "./three.module";

const toRad = deg => deg * Math.PI / 180;

export default class YawZoomController {	
	constructor(canvas) {
		this.yaw = 0;
		this.fov = 90;

		this.sphereGeometry = new THREE.SphereGeometry(1, 50, 50);
		this.material = new THREE.MeshBasicMaterial({ map: null, side: THREE.BackSide });
		this.sphere = new THREE.Mesh(this.sphereGeometry, this.material);
		this.scene = new THREE.Scene();
		this.scene.add(this.sphere);
		
		this.sphere.rotateY(-Math.PI/2);
		this.sphere.scale.x = -1;

		this.renderer = new THREE.WebGLRenderer({ canvas });
		this.camera = new THREE.PerspectiveCamera(this.fov);

		this.dragging = false;

		canvas.addEventListener("mousedown", this.mouseDown.bind(this));
		canvas.addEventListener("mouseup", this.mouseUp.bind(this));
		canvas.addEventListener("mousemove", this.mouseMove.bind(this));
		canvas.addEventListener("wheel", this.wheel.bind(this));

		this.animate.call(this);
	}

	mouseDown(event) {
		this.dragging = true;
	}

	mouseUp(event) {
		this.dragging = false;
	}

	mouseMove(event) {
		if (this.dragging) {
			this.yaw = (this.yaw - event.movementX) % 360;
			this.camera.rotateY(toRad(-event.movementX));
		}
	}

	wheel(event) {
		this.fov = Math.min(Math.max(this.fov+event.deltaY/10, 40), 120);
		this.camera.fov = this.fov;
		this.camera.updateProjectionMatrix();
	}

	setShot(shotURL) {
		this.material.map = new THREE.TextureLoader().load(shotURL);
		this.material.needsUpdate = true;
	}
	
	animate() {
		requestAnimationFrame(this.animate.bind(this));
		this.renderer.render(this.scene, this.camera);
	}

	resetView() {
		this.camera.rotateY(toRad(-this.yaw));
		this.yaw = 0;
		this.fov = 90;
		this.camera.fov = this.fov;
		this.camera.updateProjectionMatrix();
	}
}
