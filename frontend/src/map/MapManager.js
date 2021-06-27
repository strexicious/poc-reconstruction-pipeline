let idCounter = 0;

export let hotspots = new Map();

export function addHotspot(coords, imgUrl) {
	hotspots.set(idCounter++, {
		coords,
		imgUrl
	});
}

export function allHotspots() {
	return hotspots.entries();
}

addHotspot({ x: 0, y: 0 });
addHotspot({ x: 100, y: 100 });
addHotspot({ x: 70, y: 10 });
