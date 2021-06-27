export const withBaseUrl = path => process.env.REACT_APP_API_BASE + path;

export async function uploadImage(imageFile) {
	const filename = imageFile.name;
	const reqOptions = {
		"method": "POST",
		"body": imageFile,
		"mode": "cors",
	};
	
	await fetch(withBaseUrl(`/images/${filename}`), reqOptions);
	return imageFile.name;
}

export async function estimatePose(currCam, otherCam) {
	const reqOptions = {
		"mode": "cors",
	};

	const { shotId: currShotId, fov: currFov, yaw: currYaw } = currCam;
	const { shotId: otherShotId, fov: otherFov, yaw: otherYaw } = otherCam;

	const queryParams = new URLSearchParams([
		["fov1", currFov],
		["yaw1", currYaw],
		["fov2", otherFov],
		["yaw2", otherYaw],
	]);

	const url = withBaseUrl(`/pose-esimate/${currShotId}/${otherShotId}/?` + queryParams.toString());
	const res = await fetch(url, reqOptions);
	return await res.json();
}
