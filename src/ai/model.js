import * as tmImage from '@teachablemachine/image';

const DEFAULT_MODEL_PATH = '/coralimagemodel/model.json';
const DEFAULT_METADATA_PATH = '/coralimagemodel/metadata.json';

export async function loadDefaultModel() {
  return tmImage.load(DEFAULT_MODEL_PATH, DEFAULT_METADATA_PATH);
}

export async function loadModelFromFiles(modelFile, weightsFile, metadataFile) {
  return tmImage.loadFromFiles(modelFile, weightsFile, metadataFile);
}

export async function predict(model, input) {
  const predictions = await model.predict(input, false);
  return predictions
    .map((item) => ({
      className: item.className,
      probability: Number(item.probability),
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function modelClassCount(model) {
  return typeof model?.getTotalClasses === 'function' ? model.getTotalClasses() : 0;
}
