import cv2
import numpy as np

class EquiSplit:
	"""Upon instantiation exposes a `cubic` field containing: front, right,
	back, left splits indexed by integers."""

	def __init__(self, equi_img, size, fov):
		self._img = equi_img
		self._height, self._width, _ = self._img.shape
		self.cubic = [
			self._GetPerspective(fov, 0, 0, size, size),
			self._GetPerspective(fov, 90, 0, size, size),
			self._GetPerspective(fov, 180, 0, size, size),
			self._GetPerspective(fov, 270, 0, size, size),
			self._GetPerspective(fov, 0, 90, size, size),
			self._GetPerspective(fov, 0, -90, size, size),
		]
	
	def _GetPerspective(self, FOV, THETA, PHI, height, width):
		"""Dunno, the code is copied from link below.

		https://github.com/timy90022/Perspective-and-Equirectangular/blob/bb27c5066e033d3874712574cdb5ef242be16f29/lib/Equirec2Perspec.py
		"""

		#
		# THETA is left/right angle, PHI is up/down angle, both in degree
		#

		equ_h = self._height
		equ_w = self._width
		equ_cx = (equ_w - 1) / 2.0
		equ_cy = (equ_h - 1) / 2.0

		wFOV = FOV
		hFOV = float(height) / width * wFOV

		w_len = np.tan(np.radians(wFOV / 2.0))
		h_len = np.tan(np.radians(hFOV / 2.0))


		x_map = np.ones([height, width], np.float32)
		y_map = np.tile(np.linspace(-w_len, w_len,width), [height,1])
		z_map = -np.tile(np.linspace(-h_len, h_len,height), [width,1]).T

		D = np.sqrt(x_map**2 + y_map**2 + z_map**2)
		xyz = np.stack((x_map,y_map,z_map),axis=2)/np.repeat(D[:, :, np.newaxis], 3, axis=2)

		y_axis = np.array([0.0, 1.0, 0.0], np.float32)
		z_axis = np.array([0.0, 0.0, 1.0], np.float32)
		[R1, _] = cv2.Rodrigues(z_axis * np.radians(THETA))
		[R2, _] = cv2.Rodrigues(np.dot(R1, y_axis) * np.radians(-PHI))

		xyz = xyz.reshape([height * width, 3]).T
		xyz = np.dot(R1, xyz)
		xyz = np.dot(R2, xyz).T
		lat = np.arcsin(xyz[:, 2])
		lon = np.arctan2(xyz[:, 1] , xyz[:, 0])

		lon = lon.reshape([height, width]) / np.pi * 180
		lat = -lat.reshape([height, width]) / np.pi * 180

		lon = lon / 180 * equ_cx + equ_cx
		lat = lat / 90  * equ_cy + equ_cy
			
		persp = cv2.remap(self._img, lon.astype(np.float32), lat.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP)

		return persp


class EquiPersView(EquiSplit):

	def __init__(self, equi_img, size, fov, rot):
		super().__init__(equi_img, size, fov)
		self._view = self._GetPerspective(fov, rot, 0, size, size)
	
	def view(self):
		return self._view
