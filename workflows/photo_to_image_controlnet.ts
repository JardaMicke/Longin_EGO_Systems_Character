export const CONTROLNET_WORKFLOW = {
  "3": {
    "inputs": {
      "seed": 0,
      "steps": 25,
      "cfg": 7,
      "sampler_name": "dpmpp_2m",
      "scheduler": "karras",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["11", 0],
      "negative": ["7", 0],
      "latent_image": ["13", 0]
    },
    "class_type": "KSampler",
    "_meta": { "title": "KSampler" }
  },
  "4": {
    "inputs": { "ckpt_name": "sd_xl_base_1.0.safetensors" },
    "class_type": "CheckpointLoaderSimple",
    "_meta": { "title": "Load Checkpoint" }
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
    "inputs": { "filename_prefix": "CompanionAI_ControlNet", "images": ["8", 0] },
    "class_type": "SaveImage",
    "_meta": { "title": "Save Image" }
  },
  "10": {
    "inputs": { "image": "reference.jpg", "upload": "image" },
    "class_type": "LoadImage",
    "_meta": { "title": "Load Image (Reference)" }
  },
  "11": {
    "inputs": {
      "strength": 0.8,
      "start_percent": 0,
      "end_percent": 1,
      "positive": ["6", 0],
      "negative": ["7", 0],
      "control_net": ["12", 0],
      "image": ["14", 0]
    },
    "class_type": "ControlNetApplyAdvanced",
    "_meta": { "title": "Apply ControlNet" }
  },
  "12": {
    "inputs": { "control_net_name": "sai_xl_canny_256lora.safetensors" },
    "class_type": "ControlNetLoader",
    "_meta": { "title": "Load ControlNet Model" }
  },
  "13": {
    "inputs": {
      "pixels": ["10", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEEncode",
    "_meta": { "title": "VAE Encode (for img2img)" }
  },
  "14": {
    "inputs": {
      "low_threshold": 100,
      "high_threshold": 200,
      "image": ["10", 0]
    },
    "class_type": "Canny",
    "_meta": { "title": "Canny Edge Preprocessor" }
  }
};
