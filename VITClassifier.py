import tensorflow as tf
import tensorflow_hub as hub
import os
import csv
import time
import json
from datetime import datetime
import requests
import logging

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.FileHandler("vit_classifier.log"), logging.StreamHandler()])
logger = logging.getLogger(__name__)

class ViTClassifier:
    def __init__(self, model_size='B_16', pretrained='imagenet21k'):
        logger.info(f"Initializing ViT: {model_size}, {pretrained}")
        model_urls = {
            'B_16': {'imagenet21k': 'https://tfhub.dev/google/vit/b16/1',
                     'imagenet21k+imagenet2012': 'https://tfhub.dev/google/vit/b16/classification/1'},
            'B_32': {'imagenet21k': 'https://tfhub.dev/google/vit/b32/1',
                     'imagenet21k+imagenet2012': 'https://tfhub.dev/google/vit/b32/classification/1'},
            'L_16': {'imagenet21k': 'https://tfhub.dev/google/vit/l16/1',
                     'imagenet21k+imagenet2012': 'https://tfhub.dev/google/vit/l16/classification/1'},
            'L_32': {'imagenet21k': 'https://tfhub.dev/google/vit/l32/1',
                     'imagenet21k+imagenet2012': 'https://tfhub.dev/google/vit/l32/classification/1'}
        }
        self.model_size = model_size
        self.pretrained = pretrained
        self.feature_extractor = 'imagenet21k' in pretrained and '+' not in pretrained
        self.img_size = int(model_size.split('_')[1])
        self.model_url = model_urls[model_size][pretrained]
        self.labels = self._get_imagenet_labels() if not self.feature_extractor else None
        self.model = hub.load(self.model_url)
        logger.info(f"ViT model loaded from: {self.model_url}")

    def _get_imagenet_labels(self):
        labels_path = 'imagenet_labels.txt'
        if not os.path.exists(labels_path):
            try:
                url = "https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt"
                response = requests.get(url)
                response.raise_for_status()
                with open(labels_path, 'w') as f:
                    f.write('\n'.join(response.text.splitlines()))
                return [line.strip() for line in response.text.splitlines()]
            except Exception as e:
                logger.error(f"Error downloading labels: {e}, using fallback list.")
                return [f"class_{i}" for i in range(1001)]
        with open(labels_path, 'r') as f:
            return [line.strip() for line in f]

    def preprocess_image(self, image_path):
        try:
            img = tf.io.read_file(image_path)
            img = tf.image.decode_image(img, channels=3, expand_animations=False)
            img = tf.expand_dims(img, axis=0)
            img = tf.image.resize(img, (self.img_size, self.img_size))
            img = tf.cast(img, tf.float32) / 255.0
            mean = tf.constant([0.485, 0.456, 0.406])
            std = tf.constant([0.229, 0.224, 0.225])
            img = (img - mean) / std
            return img
        except Exception as e:
            logger.error(f"Error preprocessing {image_path}: {e}")
            return tf.zeros([1, self.img_size, self.img_size, 3], dtype=tf.float32)

    def classify_image(self, image_path):
        try:
            img = self.preprocess_image(image_path)
            predictions = self.model(img)
            if self.feature_extractor:
                return {'image': os.path.basename(image_path), 'features': predictions.numpy().tolist()}
            else:
                predicted_class_idx = tf.argmax(predictions[0]).numpy()
                confidence = tf.nn.softmax(predictions[0])[predicted_class_idx].numpy()
                class_name = self.labels[predicted_class_idx]
                return {'image': os.path.basename(image_path), 'subject': class_name, 'confidence': float(confidence)}
        except Exception as e:
            logger.error(f"Error classifying {image_path}: {e}")
            return {'image': os.path.basename(image_path), 'subject': 'error', 'confidence': 0.0}

    def process_directory(self, directory_path='.', output_file=None, limit=None):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_file or (f"vit_features_{timestamp}.json" if self.feature_extractor else f"vit_classifications_{timestamp}.csv")
        image_files = [os.path.join(directory_path, f) for f in os.listdir(directory_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'))]
        if limit:
            image_files = image_files[:limit]
        logger.info(f"Processing {len(image_files)} images from {directory_path}")

        results = []
        start_time = time.time()
        for i, image_path in enumerate(image_files):
            try:
                result = self.classify_image(image_path)
                results.append(result)
                elapsed = time.time() - start_time
                logger.info(f"Processed {i+1}/{len(image_files)} images, {elapsed:.2f}s elapsed")
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")

        if self.feature_extractor:
            with open(output_file, 'w') as f:
                json.dump({r['image']: {'features': r['features']} for r in results}, f)
        else:
            with open(output_file, 'w', newline='') as csvfile:
                fieldnames = ['image', 'subject', 'confidence']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(results)
        logger.info(f"Results saved to {output_file}")
        return output_file

