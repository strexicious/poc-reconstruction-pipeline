import React from "react";
import { ReactComponent as CaptureIcon } from "./icons/capture-circle.svg";
import * as API from "./api";

import "./Controls.css";

function Controls({ onCapture }) {
	const fileInpRef = React.createRef();
	
	function captureImage(event) {
		const inp = fileInpRef.current;
		inp.onchange = e => inp.files[0] && API.uploadImage(inp.files[0]).then(onCapture);
		inp.click();
	}
	
	return (
		<div className="controls-wrapper">
			<input type="file" ref={fileInpRef} accept="image/jpeg,image/png" hidden />
			<CaptureIcon className="capture-button" onClick={captureImage} />
		</div>
	);
}

export default Controls;
