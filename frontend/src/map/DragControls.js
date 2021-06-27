import * as THREE from './three.module.js';

export default class DragControls {
	
	// To avoid numerical errors and going crazy otherwise
	static pitchBound = 80;
	
	constructor(camera, canvas) {
		this.dragging = false;
		this.camera = camera;
		this.raycaster = new THREE.Raycaster();
		this.width = canvas.width;
		this.height = canvas.height;
		this.intersections = null;

		this.pitch = 0;
		this.yaw = 0;
		this.offsetX = undefined;
		this.offsetY = undefined;

		canvas.addEventListener("mousedown", this.mouseDown.bind(this));
		canvas.addEventListener("mouseup", this.mouseUp.bind(this));
		canvas.addEventListener("mousemove", this.mouseMove.bind(this));
		document.addEventListener("keydown", this.keyDown.bind(this));
	}

	mouseDown(event) {
		this.dragging = true;
	}

	mouseUp(event) {
		this.dragging = false;
	}

	mouseMove(event) {
		const toRad = deg => deg * Math.PI / 180;

		this.offsetX = event.offsetX;
		this.offsetY = event.offsetY;
		
		let coords = new THREE.Vector2(this.offsetX / this.width * 2 - 1, -this.offsetY / this.height * 2 + 1);
		this.raycaster.setFromCamera(coords, this.camera);

		if (this.dragging) {
			this.pitch = Math.min(Math.max(this.pitch - event.movementY, -DragControls.pitchBound), DragControls.pitchBound);
			let yawAxis = new THREE.Vector3(0, Math.cos(toRad(this.pitch)), -Math.sin(toRad(this.pitch)));
			this.yaw = (this.yaw - event.movementX) % 360;

			this.camera.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), toRad(this.pitch));
			// ok, this is a bit weird. rotateOnAxis I think increments the current angle.
			// but it seems like it is replacing the current angle.
			// the theory here is that setRotationFromAxisAngle is resetting the orientation to only pitch,
			// and then we can rotateOnAxis to incrementally add yaw rotation to the pitch
			this.camera.rotateOnAxis(yawAxis, toRad(this.yaw));
		}
	}

	keyDown(event) {
		switch (event.key) {
		case "j":
			this.intersections = this.raycaster.intersectObjects(this.raycastTargets, false);
			if (this.intersections.length === 0) this.intersections = null;
			break;
		default:
			break;
		}
	}

	setRaycastTargets(targets) {
		this.raycastTargets = targets;
	}

	latestIntersections() {
		let res = this.intersections;
		this.intersections = null;
		return res;
	}
}