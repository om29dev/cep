const { pipeline, env } = require('@xenova/transformers');
const path = require('path');

// Configure local cache directory
env.cacheDir = path.join(__dirname, 'models');
env.allowLocalModels = true;

async function download() {
    console.log("Starting model download to: " + env.cacheDir);

    console.log("Downloading Zero-Shot Classifier (Xenova/roberta-large-mnli)...");
    // This will trigger the download
    await pipeline('zero-shot-classification', 'Xenova/roberta-large-mnli');
    console.log("Zero-Shot Classifier downloaded/verified.");

    // Sentiment Analyzer removed

    console.log("All models downloaded successfully!");
}

download().catch(console.error);
