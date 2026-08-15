export const SDXL_CONSISTENT_CHARACTER = {
  "3": {
    "inputs": {
      "seed": 0,
      "steps": 25,
      "cfg": 7,
      "sampler_name": "dpmpp_2m",
      "scheduler": "karras",
      "denoise": 1,
      "model": ["15", 0], // Gets model from IPAdapter Body
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler",
    "_meta": { "title": "KSampler" }
  },
  "4": {
    "inputs": { "ckpt_name": "sd_xl_base_1.0.safetensors" },
    "class_type": "CheckpointLoaderSimple",
    "_meta": { "title": "Load Checkpoint" }
  },
  "5": {
    "inputs": { "width": 1024, "height": 1024, "batch_size": 1 },
    "class_type": "EmptyLatentImage",
    "_meta": { "title": "Empty Latent Image" }
  },
  "6": {
    "inputs": { "text": "positive prompt", "clip": ["4", 1] },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "CLIP Text Encode (Pos)" }
  },
  "7": {
    "inputs": { "text": "text, watermark, deformed, blurry, bad anatomy", "clip": ["4", 1] },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "CLIP Text Encode (Neg)" }
  },
  "8": {
    "inputs": { "samples": ["3", 0], "vae": ["4", 2] },
    "class_type": "VAEDecode",
    "_meta": { "title": "VAE Decode" }
  },
  "9": {
    "inputs": { "filename_prefix": "CompanionAI_Consistent", "images": ["8", 0] },
    "class_type": "SaveImage",
    "_meta": { "title": "Save Image" }
  },
  "10": {
    "inputs": { "image": "face_ref.jpg", "upload": "image" },
    "class_type": "LoadImage",
    "_meta": { "title": "Load Face Reference" }
  },
  "11": {
    "inputs": { "image": "body_ref.jpg", "upload": "image" },
    "class_type": "LoadImage",
    "_meta": { "title": "Load Body Reference" }
  },
  "12": {
    "inputs": { "preset": "FACEID" },
    "class_type": "IPAdapterUnifiedLoader",
    "_meta": { "title": "IPAdapter Loader (Face)" }
  },
  "13": {
    "inputs": { "preset": "PLUS (high strength)" },
    "class_type": "IPAdapterUnifiedLoader",
    "_meta": { "title": "IPAdapter Loader (Body)" }
  },
  "14": {
    "inputs": {
      "weight": 0.85,
      "weight_type": "linear",
      "combine_embeds": "concat",
      "start_at": 0,
      "end_at": 1,
      "embeds_scaling": "V only",
      "model": ["4", 0],
      "ipadapter": ["12", 0],
      "image": ["10", 0]
    },
    "class_type": "IPAdapterAdvanced",
    "_meta": { "title": "Apply IPAdapter (Face)" }
  },
  "15": {
    "inputs": {
      "weight": 0.70,
      "weight_type": "linear",
      "combine_embeds": "concat",
      "start_at": 0,
      "end_at": 0.8,
      "embeds_scaling": "V only",
      "model": ["14", 0],
      "ipadapter": ["13", 0],
      "image": ["11", 0]
    },
    "class_type": "IPAdapterAdvanced",
    "_meta": { "title": "Apply IPAdapter (Body)" }
  }
};
