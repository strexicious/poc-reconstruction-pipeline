import { useEffect, useRef, useState } from "react";
import YawZoomController from "./map/YawZoomController";
import * as API from "./api";
import { ReactComponent as DoneIcon } from "./icons/done.svg";
import { ReactComponent as ResetIcon } from "./icons/rotate-cw.svg";

import "./Aligner.css";

function usePerspView(shotId) {
	const canvasRef = useRef();
	const controllerRef = useRef();

	useEffect(() => {
		controllerRef.current = new YawZoomController(canvasRef.current);
		if (shotId) {
			controllerRef.current.setShot(API.withBaseUrl(`/images/${shotId}`));
		}
	}, [canvasRef]);
	
	if (controllerRef.current && shotId) {
		controllerRef.current.setShot(API.withBaseUrl(`/images/${shotId}`));
	}
	
	return [
		<canvas ref={canvasRef} width={256} height={256}>
			A perspective view should be rendered here.
		</canvas>,
		controllerRef.current
	];
}

export default function Aligner({ currShotId, otherShotId, onAlign }) {
	const [currView, currController] = usePerspView(currShotId);
	const [otherView, otherController] = usePerspView(otherShotId);
	
	function onDone(event) {
		const currCam = {
			shotId: currShotId,
			fov: currController.fov,
			yaw: -currController.yaw,
		};

		const otherCam = {
			shotId: otherShotId,
			fov: otherController.fov,
			yaw: -otherController.yaw,
		};
		
		onAlign(currCam, otherCam);
	}
	
	function onReset(event) {
		currController.resetView();
		otherController.resetView();
	}
	
	return (
		<div className="aligner">
			{currView}
			{otherView}
			<DoneIcon className="done-button" onClick={onDone} />
			<ResetIcon className="reset-button" onClick={onReset} />
		</div>
	)
}
