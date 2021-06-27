import * as THREE from './three.module.js';
import DragControls from './DragControls.js';

export function parsePositions(rotationArr, translationArr, from_yaw, to_yaw) {
	let rotation = new THREE.Matrix3().fromArray(rotationArr).transpose();
	let translation = new THREE.Vector3().fromArray(translationArr);

	let position = new THREE.Vector3().copy(translation).applyMatrix3(rotation).negate();
	position.applyAxisAngle(new THREE.Vector3(0, 1, 0), from_yaw * Math.PI / 180);
	// because the reconstruction, due to OpenCV,
	// has positive z in-front and positive y downwards
	position.y = -position.y;
	position.z = -position.z;

	let corrected_translation = new THREE.Vector3().copy(translation);
	corrected_translation.applyAxisAngle(new THREE.Vector3(0, 1, 0), to_yaw * Math.PI / 180);
	corrected_translation.y = -corrected_translation.y;
	corrected_translation.z = -corrected_translation.z;
	
	return [position, corrected_translation];
}

const shape = new THREE.Shape();
shape.lineTo(0.5, -0.5);
shape.lineTo(1.5, -0.5);
shape.lineTo(0, 1);
shape.lineTo(-1.5, -0.5);
shape.lineTo(-0.5, -0.5);

export class ShotView {

	static sphereGeometry = new THREE.SphereGeometry(1, 50, 50);
	static material = new THREE.MeshBasicMaterial({ map: null, side: THREE.BackSide });
	static sphere = new THREE.Mesh(ShotView.sphereGeometry, ShotView.material);

	static circleGeometry = new THREE.ShapeGeometry(shape).scale(0.01, 0.01, 0.01);
	static markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, depthFunc: THREE.AlwaysDepth });

	constructor(shotURL) {
		this.shotURL = shotURL;
		this.adjacents = [];
	}
	
	addAdjacentShot(shotId, position) {
		if (position instanceof Array) {
			position = new THREE.Vector3().fromArray(position).normalize();
		}
		
		this.adjacents.push([shotId, position]);
	}

	removeLastAdjacentShot() {
		this.adjacents.pop();
	}

	invertLastAdjacentShot() {
		this.adjacents[this.adjacents.length-1][1].negate();
	}
}
ShotView.sphere.renderOrder = -1;
ShotView.sphere.rotateY(Math.PI/2);
ShotView.sphere.scale.x = -1;

let renderer, controls;
const camera = new THREE.PerspectiveCamera(90, undefined, 0.01);
const scene = new THREE.Scene();

export const shots = new Map();

let currShot = null;

export function getCurrShot() {
	return currShot;
}

export function setCurrShot(shotId) {
	currShot = shotId;
}

const texture_cache = new Map();
const textureLoader = new THREE.TextureLoader();

let animationInterval = null;
let clock = new THREE.Clock(true);

export function updateScene(shotId) {
	scene.clear();
	
	let shot = shots.get(shotId);
	
	let texture;
	if (!texture_cache.has(shotId)) {
		texture = textureLoader.load(shot.shotURL);
		texture_cache.set(shotId, texture);
	} else {
		texture = texture_cache.get(shotId);
	}
	ShotView.material.map = texture;

	let markers = shot.adjacents.map(([shotId, position]) => {
		let marker = new THREE.Mesh(ShotView.circleGeometry, ShotView.markerMaterial);
		marker.rotateX(Math.PI / 2);
		marker.rotateZ(Math.atan2(position.z, position.x) - Math.PI / 2);
		marker.position.set(position.x, -1, position.z);
		marker.shotId = shotId;
		return marker;
	});

	clearInterval(animationInterval);
	animationInterval = setInterval(() => {
		markers.forEach((m, i) => {
			let scale = 0.02*Math.sin(5*clock.getElapsedTime())/2 + 0.1;
			let newPosition = new THREE.Vector3(-scale*Math.sin(m.rotation.z), -0.08, scale*Math.cos(m.rotation.z));
			m.position.copy(newPosition);
		});
	}, 16);
	
	markers.forEach(sm => scene.add(sm));
	controls.setRaycastTargets(markers);

	scene.add(ShotView.sphere);
	setCurrShot(shotId);
};

export function init(canvas, width, height) {
	if (!renderer) {
		renderer = new THREE.WebGLRenderer({ canvas });
		renderer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		controls = new DragControls(camera, renderer.domElement);
	}
}

// render loop
(function animate() {
	requestAnimationFrame(animate);
	
	if (renderer) {
		let intersections = controls.latestIntersections();
		if (intersections) {
			let marker = intersections[0].object;
			updateScene(marker.shotId);	
			currShot = marker.shotId;
		}

		renderer.render(scene, camera);
	}
})();
