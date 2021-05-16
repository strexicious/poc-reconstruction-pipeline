import os
import subprocess
import shutil

from flask import Flask, send_from_directory, request, Response
from flask_cors import CORS
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from reconstruction import pipeline

app = Flask(__name__)
CORS(app)

@app.route("/images/<shot_name>", methods=("GET", "POST"))
def shot_image(shot_name):
	secure_name = secure_filename(shot_name)
	if request.method == "POST":
		im = FileStorage(request.stream)
		im.save(os.path.join("./images/", secure_name))
		return "OK", 201
	
	if request.method == "GET":
		return send_from_directory(f"./images/", filename=secure_name)

@app.route("/pose-esimate/<shot_name1>/<shot_name2>/")
def pose_esimation(shot_name1, shot_name2):
	equi_path1 = os.path.join("./images/", secure_filename(shot_name1))
	equi_path2 = os.path.join("./images/", secure_filename(shot_name2))
	
	data = request.args
	cam1 = pipeline.Camera(equi_path1, float(data.get("fov1", 120)), float(data.get("yaw1", 0)))
	cam2 = pipeline.Camera(equi_path2, float(data.get("fov2", 120)), float(data.get("yaw2", 0)))

	R, t = pipeline.find_pose(cam1, cam2)
	return {
		"rotation": R.T.ravel().tolist(),
		"translation": t.ravel().tolist(),
	}
