# The implementation of the functions in this module has been chosen through
# experimental results obtained througout the research. The results show that
# these implementations give good enough matches, but could be further refined.

import cv2

def compute_features(img, extractor, **kwargs):
	"""
	
	Parameters
	----------
	img : ndarray

	extractor : string, ["SIFT", "ORB", "ASIFT"]
		For "SIFT" and "ASIFT" also needs the `nfeatures` kwarg.
	"""

	sift = cv2.SIFT_create(nfeatures=int(kwargs["nfeatures"]),
						   nOctaveLayers=5,
						   contrastThreshold=0.001,
						   edgeThreshold=10,
						   sigma=1.6)
	orb = cv2.ORB_create()

	if extractor == "SIFT":
		detector = sift
	elif extractor == "ORB":
		detector = orb
	elif extractor == "ASIFT":
		detector = cv2.AffineFeature_create(sift)
	else:
		raise NotImplementedError("Feature method not implemented.")

	keypoints, descriptors = detector.detectAndCompute(img, None)

	return keypoints, descriptors

def match_features(desc1, desc2):
	"""

	Parameters
	----------

	desc1, desc2 : list of descriptors
	"""

    # FLANN_INDEX_KDTREE = 1
	index_params = dict(algorithm=1, trees=8)
    
	# FLANN_INDEX_KMEANS = 2
	# index_params = dict(algorithm=2, branching=8, iterations=10)
	
	# OpenSfM has 20 checks
	search_params = dict(checks=50)
	
	flann = cv2.FlannBasedMatcher(index_params, search_params)

	# compute two-way 2NN matches
	matches1 = flann.knnMatch(desc1, desc2, 2)
	matches2 = flann.knnMatch(desc2, desc1, 2)

	# with 2NN matches filter map them using ratio test
	# according to OpenSfM since distances of matches for
	# SIFT are L2_NORM, so should be the ratio value squared
	ratio_test = lambda m: m[0].distance < 0.8 * m[1].distance
	
	matches1 = map(lambda m: (m[0].queryIdx, m[0].trainIdx), filter(ratio_test, matches1))
	matches2 = map(lambda m: (m[0].trainIdx, m[0].queryIdx), filter(ratio_test, matches2))
	
	# then we take only the two-way consistent matches
	matches = set(matches1).intersection(matches2)

	return list(matches)
