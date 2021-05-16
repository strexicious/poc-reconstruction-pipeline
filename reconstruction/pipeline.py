import math
import cv2
import numpy as np

from reconstruction import features
from reconstruction.split import EquiSplit, EquiPersView

class Camera:

    def __init__(self, equi_path, fov, yaw):
        """Represents a perspective view of a spherical shot.

        Parameters
        ----------
        equi_path : str
            Path to the equirectangular image file.
        fov : int, degrees
            Horizontal field of view.
        yaw : int, degrees
            Yaw offset in the spherical shot from the center.
        """
        self.equi_path = equi_path
        self.fov = fov
        self.yaw = yaw
    
    def img(self, size):
        equi_img = cv2.imread(self.equi_path)
        return EquiPersView(equi_img, size, self.fov, self.yaw).view()
    
def find_pose(cam1, cam2):
    SIZE = 1024
    K = np.matrix([[512,   0, 0],
                   [  0, 512, 0],
                   [  0,   0, 1]])

    view_img1 = cam1.img(SIZE)
    view_img2 = cam2.img(SIZE)

    # Start pipeline for a pair of perspective images
    kps1, desc1 = features.compute_features(view_img1, "ASIFT", nfeatures=500)
    kps2, desc2 = features.compute_features(view_img2, "ASIFT", nfeatures=500)

    matches = features.match_features(desc1, desc2)
    src_pts = np.array([kps1[m[0]].pt for m in matches])
    dst_pts = np.array([kps2[m[1]].pt for m in matches])

    FOCAL1_r = math.tan(math.radians(cam1.fov/2))
    FOCAL2_r = math.tan(math.radians(cam2.fov/2))
    src_pts = FOCAL1_r*(src_pts-512)
    dst_pts = FOCAL2_r*(dst_pts-512)

    E, Emask = cv2.findEssentialMat(src_pts,
                                    dst_pts,
                                    method=cv2.RANSAC,
                                    cameraMatrix=K,
                                    threshold=1.0,
                                    prob=0.999)
    _, R, t, _ = cv2.recoverPose(E, src_pts, dst_pts, mask=Emask)
    
    return R, t
