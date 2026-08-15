export const ANIMATEDIFF_WORKFLOW = {
  "3": {
    "inputs": {
      "seed": 0,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["14", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler",
    "_meta": { "title": "KSampler" }
  },
  "4": {
    "inputs": { "ckpt_name": "v1-5-pruned-emaonly.safetensors" },
    "class_type": "CheckpointLoaderSimple",
    "_meta": { "title": "Load Checkpoint (SD 1.5)" }
  },
  "5": {
    "inputs": { "width": 512, "height": 512, "batch_size": 16 }, // 16 frames
    "class_type": "EmptyLatentImage",
    "_meta": { "title": "Empty Latent Image (Video Frames)" }
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
  "14": {
    "inputs": { 
      "model_name": "mm_sd_v15_v3.safetensors",
      "beta_schedule": "sqrt_linear",
      "motion_scale": 1,
      "apply_v2_models_properly": false,
      "model": ["4", 0] 
    },
    "class_type": "AnimateDiffLoaderV1",
    "_meta": { "title": "AnimateDiff Loader" }
  },
  "15": {
    "inputs": { 
      "filename_prefix": "CompanionAI_Video", 
      "fps": 8, 
      "lossless": false, 
      "quality": 85, 
      "method": "default",
      "images": ["8", 0] 
    },
    "class_type": "SaveAnimatedWEBP",
    "_meta": { "title": "Save Animated WEBP" }
  }
};
