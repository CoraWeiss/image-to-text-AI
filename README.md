# Image-to-Text-AI

## ViT Classifier

### Description
This project implements a Vision Transformer (ViT) classifier using TensorFlow and TensorFlow Hub. It can process images using various pre-trained ViT models to either classify images into single word categories ("mask", "cat", etc.) or extract feature vectors for further analysis.

### Features
* Supports multiple ViT model sizes (B_16, B_32, L_16, L_32)
* Can use models pre-trained on ImageNet21k or ImageNet21k+ImageNet2012
* Performs image classification or feature extraction
* Processes individual images or entire directories
* Outputs results in CSV (for classifications) or JSON (for feature extraction)
* Includes logging for tracking progress and errors
* **NEW**: Results Viewer tool for analyzing and converting classification outputs

### Requirements
* TensorFlow
* TensorFlow Hub
* Requests
* Python 3.x
* Pandas (for Results Viewer)
* NumPy (for Results Viewer)

### Installation
1. Clone this repository
2. Install the required packages:
   ```bash
   pip install tensorflow tensorflow-hub requests pandas numpy
   ```

### Usage

#### ViT Classifier
```python
from vit_classifier import ViTClassifier

# Initialize a classifier with default settings (B_16 model, ImageNet21k pre-training)
classifier = ViTClassifier()

# Or customize model size and pre-training
classifier = ViTClassifier(model_size='L_16', pretrained='imagenet21k+imagenet2012')

# Classify a single image
result = classifier.classify_image('path/to/image.jpg')
print(result)  # {'image': 'image.jpg', 'subject': 'tabby cat', 'confidence': 0.92}

# Process an entire directory
output_file = classifier.process_directory('path/to/image_folder', limit=100)
print(f"Results saved to {output_file}")
```

#### NEW: ViT Results Viewer
The Results Viewer allows you to explore and convert classification results.

```bash
# View CSV classification results
python vit-results-viewer.py classifications_20250226_200301.csv

# View JSON feature extraction results 
python vit-results-viewer.py vit_features_20250226_200301.json

# Convert JSON feature vectors to CSV summary
python vit-results-viewer.py vit_features_20250226_200301.json --convert

# Convert with custom output file
python vit-results-viewer.py vit_features_20250226_200301.json --convert --output feature_summary.csv
```

### Results Formats

#### Classification CSV Format
The classification CSV includes:
- `image`: Filename of the processed image
- `subject`: Predicted class/category
- `confidence`: Confidence score (0-1)

#### Feature Extraction JSON Format
The feature extraction JSON stores:
- Image filenames as keys
- Feature vectors as values

#### Feature Summary CSV Format
When converting features to CSV, the summary includes:
- `image`: Filename of the processed image
- `feature_dim`: Dimension of the feature vector
- `min_value`: Minimum value in the feature vector
- `max_value`: Maximum value in the feature vector
- `mean_value`: Mean of all values in the feature vector
- `std_value`: Standard deviation of the feature vector
