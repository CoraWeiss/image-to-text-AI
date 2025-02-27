# image-to-text-AI
# ViT Classifier

## Description

This project implements a Vision Transformer (ViT) classifier using TensorFlow and TensorFlow Hub. It can process images using various pre-trained ViT models and either classify images or extract features from them.

## Features

- Supports multiple ViT model sizes (B_16, B_32, L_16, L_32)
- Can use models pre-trained on ImageNet21k or ImageNet21k+ImageNet2012
- Performs image classification or feature extraction
- Processes individual images or entire directories
- Outputs results in CSV (for classifications) or JSON (for feature extraction)
- Includes logging for tracking progress and errors

## Requirements

- TensorFlow
- TensorFlow Hub
- Requests
- Python 3.x

## Installation

1. Clone this repository
2. Install the required packages:
