import React, { useRef, useState, useEffect } from "react";
import Menu from "./Menu";
import Controls from "./Controls";
import Aligner from "./Aligner";

import { ShotView } from "./map/MapViewer";
import * as MapViewer from "./map/MapViewer";
import * as API from "./api";

import './App.css';

function App() {
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [alignShots, setAlignShots] = useState([]);
  const [aligning, setAligning] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef();

  useEffect(() => {
    MapViewer.init(canvasRef.current, window.innerWidth, window.innerHeight);
	}, [canvasRef]);

  function undo() {
    MapViewer.shots.get(alignShots[0]).removeLastAdjacentShot();
    MapViewer.shots.delete(alignShots[1]);
    MapViewer.updateScene(alignShots[0]);
  }
  
  const menuButtons = [
    {
      action: () => {
        if (alignShots.length) {
          undo();
          setAlignShots([]);
        }
      },
      text: "Undo",
    },
    {
      action: () => {
        if (!aligning && alignShots.length) {
          undo();
          setAligning(true);
        }
      },
      text: "Re-Align",
    },
    {
      // for some reason it gives the correct translation, but inverted,
      // could be due to cheriality check or some other reason. would need
      // to investigate from the backend
      action: () => {
        if (!aligning && alignShots.length) {
          MapViewer.shots.get(alignShots[0]).invertLastAdjacentShot();
          MapViewer.shots.get(alignShots[1]).invertLastAdjacentShot();
          MapViewer.updateScene(alignShots[0]);
        }
      },
      text: "Invert",
    },
  ];

  function onCapture(shotId) {
    if (!MapViewer.getCurrShot()) {      
      MapViewer.shots.set(shotId, new ShotView(API.withBaseUrl(`/images/${shotId}`)));
      MapViewer.updateScene(shotId);
      MapViewer.setCurrShot(shotId);
    } else {
      setAlignShots([MapViewer.getCurrShot(), shotId]);
      setAligning(true);
    }
  }

  function onAlign(currCam, otherCam) {
    setLoading(true);
    API.estimatePose(currCam, otherCam).then(data => {
      let [pos1, pos2] = MapViewer.parsePositions(data["rotation"], data["translation"], currCam.yaw, otherCam.yaw);
      
      MapViewer.shots.set(otherCam.shotId, new ShotView(API.withBaseUrl(`/images/${otherCam.shotId}`)));
      MapViewer.shots.get(otherCam.shotId).addAdjacentShot(currCam.shotId, pos2);

      MapViewer.shots.get(currCam.shotId).addAdjacentShot(otherCam.shotId, pos1);
      MapViewer.updateScene(currCam.shotId);

      setAligning(false);
      setLoading(false);
    });
  }
  
  return (
    <div className="App">
      <canvas ref={canvasRef} className="map-canvas">
        A canvas should be rendered here.
      </canvas>
      <Menu onClick={() => setMenuIsOpen(!menuIsOpen)} isOpen={menuIsOpen} menuButtons={menuButtons} />
      <Controls onCapture={onCapture} />
      <div className={`align-wrapper ${aligning ? "" : "undisplay"} ${loading ? "loading" : ""}`}>
        <Aligner currShotId={alignShots[0]} otherShotId={alignShots[1]} onAlign={onAlign} />
			  <div className="loading-screen"><span>Loading...</span></div>
        <div className="tip-line">Align the two images</div>
      </div>
    </div>
  );
}

export default App;
