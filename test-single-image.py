#!/usr/bin/env python3

"""
Simple script to test the ViT classifier on a single image.
Usage: python test-single-image.py <image_path>
"""

import sys
import json
from VITClassifier import ViTClassifier

def main():
    if len(sys.argv) < 2:
        print("Usage: python test-single-image.py <image_path>")
        return 1
        
    image_path = sys.argv[1]
    print(f"Testing ViT classifier on image: {image_path}")
    
    # Initialize classifier for classification
    print("\nRunning classification model...")
    classifier = ViTClassifier(model_size='B_16', pretrained='imagenet21k+imagenet2012')
    result = classifier.classify_image(image_path)
    print(f"Classification result:")
    print(f"  Image: {result['image']}")
    print(f"  Subject: {result['subject']}")
    print(f"  Confidence: {result['confidence']:.4f}")
    
    # Initialize classifier for feature extraction
    print("\nRunning feature extraction model...")
    feature_extractor = ViTClassifier(model_size='B_16', pretrained='imagenet21k')
    features = feature_extractor.classify_image(image_path)
    
    # Print feature vector shape
    feature_vector = features['features']
    if isinstance(feature_vector, list):
        feature_shape = (len(feature_vector), len(feature_vector[0]) if feature_vector else 0)
    else:
        feature_shape = "unknown"
    
    print(f"Feature extraction result:")
    print(f"  Image: {features['image']}")
    print(f"  Feature vector shape: {feature_shape}")
    print(f"  First 5 feature values: {feature_vector[0][:5] if feature_vector else 'N/A'}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())