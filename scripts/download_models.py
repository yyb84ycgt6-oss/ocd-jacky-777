#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import shutil

try:
    from huggingface_hub import hf_hub_download, snapshot_download, HfApi
    from huggingface_hub.utils import LocalTokenNotFoundError
except ImportError:
    print("Warning: huggingface_hub is not installed. Installing it now...")
    subprocess.run([sys.executable, "-m", "pip", "install", "huggingface_hub"])
    from huggingface_hub import hf_hub_download, snapshot_download, HfApi

# Categorized list of all 100+ requested models with metadata
MODELS = {
    "Ultra-Tiny (under 20 MB)": [
        {"id": "roneneldan/TinyStories-1M", "size_mb": 1.2, "type": "LLM"},
        {"id": "roneneldan/TinyStories-3M", "size_mb": 3.5, "type": "LLM"},
        {"id": "roneneldan/TinyStories-8M", "size_mb": 9.0, "type": "LLM"},
        {"id": "roneneldan/TinyStories-28M", "size_mb": 33.0, "type": "LLM"},
        {"id": "roneneldan/TinyStories-33M", "size_mb": 38.0, "type": "LLM"},
        {"id": "google/bert_uncased_L-2_H-128_A-2", "size_mb": 4.0, "type": "Embedding"},
        {"id": "google/bert_uncased_L-2_H-256_A-4", "size_mb": 8.0, "type": "Embedding"},
        {"id": "TaylorAI/bge-micro-v2", "size_mb": 10.0, "type": "Embedding"},
        {"id": "sentence-transformers/paraphrase-MiniLM-L3-v2", "size_mb": 9.0, "type": "Embedding"},
        {"id": "sentence-transformers/all-MiniLM-L6-v2", "size_mb": 11.0, "type": "Embedding"},
        {"id": "sentence-transformers/multi-qa-MiniLM-L6-cos-v1", "size_mb": 11.0, "type": "Embedding"},
        {"id": "BAAI/bge-small-en-v1.5", "size_mb": 12.0, "type": "Embedding"},
        {"id": "thenlper/gte-small", "size_mb": 12.0, "type": "Embedding"},
        {"id": "intfloat/e5-small-v2", "size_mb": 12.0, "type": "Embedding"},
        {"id": "huawei-noah/TinyBERT_General_4L_312D", "size_mb": 14.0, "type": "Embedding"},
        {"id": "distilbert/distilbert-base-uncased", "size_mb": 15.0, "type": "Embedding"},
        {"id": "google/bert_uncased_L-4_H-256_A-4", "size_mb": 5.0, "type": "Embedding"},  # bert-mini
        {"id": "prajjwal1/bert-tiny", "size_mb": 4.0, "type": "Embedding"},
        {"id": "albert/albert-base-v2", "size_mb": 5.0, "type": "Embedding"}
    ],
    "Small Language Models (20-200 MB)": [
        {"id": "HuggingFaceTB/SmolLM-135M", "size_mb": 40.0, "type": "LLM", "ollama": "smollm:135m"},
        {"id": "HuggingFaceTB/SmolLM-360M", "size_mb": 100.0, "type": "LLM", "ollama": "smollm:360m"},
        {"id": "EleutherAI/pythia-70m", "size_mb": 30.0, "type": "LLM"},
        {"id": "EleutherAI/pythia-160m", "size_mb": 60.0, "type": "LLM"},
        {"id": "facebook/opt-125m", "size_mb": 45.0, "type": "LLM"},
        {"id": "facebook/opt-350m", "size_mb": 120.0, "type": "LLM"},
        {"id": "openai-community/gpt2", "size_mb": 60.0, "type": "LLM"},
        {"id": "distilbert/distilgpt2", "size_mb": 40.0, "type": "LLM"},
        {"id": "cerebras/Cerebras-GPT-111M", "size_mb": 35.0, "type": "LLM"},
        {"id": "cerebras/Cerebras-GPT-256M", "size_mb": 80.0, "type": "LLM"},
        {"id": "cerebras/Cerebras-GPT-590M", "size_mb": 180.0, "type": "LLM"},
        {"id": "bigscience/bloomz-560m", "size_mb": 180.0, "type": "LLM"},
        {"id": "facebook/xglm-564M", "size_mb": 200.0, "type": "LLM"},
        {"id": "state-spaces/mamba-130m", "size_mb": 40.0, "type": "LLM"},
        {"id": "state-spaces/mamba-370m", "size_mb": 120.0, "type": "LLM"},
        {"id": "RWKV/rwkv-4-169m-pile", "size_mb": 50.0, "type": "LLM"},
        {"id": "RWKV/rwkv-4-430m-pile", "size_mb": 130.0, "type": "LLM"},
        {"id": "facebook/MobileLLM-125M", "size_mb": 40.0, "type": "LLM"},
        {"id": "facebook/MobileLLM-350M", "size_mb": 120.0, "type": "LLM"},
        {"id": "facebook/MobileLLM-600M", "size_mb": 200.0, "type": "LLM"},
        {"id": "EleutherAI/gpt-neo-125m", "size_mb": 60.0, "type": "LLM"}
    ],
    "Lightweight LLMs (200-500 MB)": [
        {"id": "Qwen/Qwen2.5-0.5B-Instruct", "size_mb": 350.0, "type": "LLM", "ollama": "qwen2.5:0.5b"},
        {"id": "h2oai/h2o-danube3-500m-chat", "size_mb": 250.0, "type": "LLM", "ollama": "h2o-danube3:500m"},
        {"id": "TinyLlama/TinyLlama-1.1B-Chat-v1.0", "size_mb": 550.0, "type": "LLM", "ollama": "tinyllama"},
        {"id": "meta-llama/Llama-3.2-1B-Instruct", "size_mb": 650.0, "type": "LLM", "ollama": "llama3.2:1b", "auth_required": True},
        {"id": "Qwen/Qwen2-0.5B", "size_mb": 350.0, "type": "LLM", "ollama": "qwen2:0.5b"},
        {"id": "tiiuae/falcon-rw-1b", "size_mb": 450.0, "type": "LLM"},
        {"id": "bigscience/bloomz-1b1", "size_mb": 400.0, "type": "LLM"},
        {"id": "facebook/xglm-1.7B", "size_mb": 700.0, "type": "LLM"},
        {"id": "cerebras/Cerebras-GPT-1.3B", "size_mb": 450.0, "type": "LLM"},
        {"id": "RWKV/rwkv-4-1b5-world", "size_mb": 500.0, "type": "LLM"},
        {"id": "state-spaces/mamba-1.4b", "size_mb": 470.0, "type": "LLM"},
        {"id": "EleutherAI/gpt-neo-1.3B", "size_mb": 450.0, "type": "LLM"},
        {"id": "EleutherAI/pythia-1.4b", "size_mb": 500.0, "type": "LLM"},
        {"id": "EleutherAI/pythia-1b", "size_mb": 350.0, "type": "LLM"},
        {"id": "Salesforce/codegen-350M-mono", "size_mb": 120.0, "type": "LLM"}
    ],
    "Mid-size LLMs (500 MB - 1 GB)": [
        {"id": "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B", "size_mb": 700.0, "type": "LLM", "ollama": "deepseek-r1:1.5b"},
        {"id": "Qwen/Qwen2.5-1.5B-Instruct", "size_mb": 700.0, "type": "LLM", "ollama": "qwen2.5:1.5b"},
        {"id": "Qwen/Qwen2.5-Coder-1.5B-Instruct", "size_mb": 700.0, "type": "LLM", "ollama": "qwen2.5-coder:1.5b"},
        {"id": "HuggingFaceTB/SmolLM2-1.7B-Instruct", "size_mb": 900.0, "type": "LLM", "ollama": "smollm2:1.7b"},
        {"id": "stabilityai/stablelm-2-1.6b", "size_mb": 700.0, "type": "LLM"},
        {"id": "h2oai/h2o-danube2-1.8b-chat", "size_mb": 800.0, "type": "LLM"},
        {"id": "google/gemma-2-2b-it", "size_mb": 1300.0, "type": "LLM", "ollama": "gemma2:2b", "auth_required": True},
        {"id": "google/gemma-1.1-2b-it", "size_mb": 1100.0, "type": "LLM", "auth_required": True},
        {"id": "allenai/OLMo-1B", "size_mb": 400.0, "type": "LLM"},
        {"id": "state-spaces/mamba-2.8b-slimpj", "size_mb": 950.0, "type": "LLM"},
        {"id": "cerebras/Cerebras-GPT-2.7B", "size_mb": 1100.0, "type": "LLM"},
        {"id": "microsoft/phi-2", "size_mb": 1600.0, "type": "LLM", "ollama": "phi2"}
    ],
    "Audio / Speech Models": [
        {"id": "openai/whisper-tiny", "size_mb": 39.0, "type": "Audio"},
        {"id": "openai/whisper-base", "size_mb": 74.0, "type": "Audio"},
        {"id": "openai/whisper-small", "size_mb": 244.0, "type": "Audio"},
        {"id": "openai/whisper-medium", "size_mb": 769.0, "type": "Audio"},
        {"id": "distil-whisper/distil-medium.en", "size_mb": 400.0, "type": "Audio"},
        {"id": "facebook/wav2vec2-base-960h", "size_mb": 95.0, "type": "Audio"},
        {"id": "facebook/hubert-base-ls960", "size_mb": 95.0, "type": "Audio"},
        {"id": "microsoft/unispeech-sat-base", "size_mb": 95.0, "type": "Audio"},
        {"id": "speechbrain/spkrec-ecapa-voxceleb", "size_mb": 13.0, "type": "Audio"},
        {"id": "rhasspy/piper-voices", "size_mb": 15.0, "type": "Audio"},
        {"id": "facebook/musicgen-small", "size_mb": 1000.0, "type": "Audio"},
        {"id": "laion/clap-htsat-unfused", "size_mb": 300.0, "type": "Audio"}
    ],
    "Vision Models": [
        {"id": "google/mobilenet_v2_1.0_224", "size_mb": 5.0, "type": "Vision"},
        {"id": "google/efficientnet-b0", "size_mb": 5.0, "type": "Vision"},
        {"id": "microsoft/resnet-18", "size_mb": 11.0, "type": "Vision"},
        {"id": "microsoft/resnet-50", "size_mb": 25.0, "type": "Vision"},
        {"id": "google/vit-base-patch16-224", "size_mb": 86.0, "type": "Vision"},
        {"id": "timm/vit_tiny_patch16_224.augreg_in21k", "size_mb": 5.0, "type": "Vision"},
        {"id": "facebook/convnext-tiny-224", "size_mb": 28.0, "type": "Vision"},
        {"id": "ultralytics/yolov5n", "size_mb": 4.0, "type": "Vision"},
        {"id": "ultralytics/yolov8n", "size_mb": 6.0, "type": "Vision"},
        {"id": "facebook/sam-vit-base", "size_mb": 375.0, "type": "Vision"},
        {"id": "openai/clip-vit-base-patch32", "size_mb": 150.0, "type": "Vision"},
        {"id": "google/siglip-base-patch16-224", "size_mb": 150.0, "type": "Vision"},
        {"id": "Salesforce/blip-base", "size_mb": 200.0, "type": "Vision"},
        {"id": "microsoft/Florence-2-small", "size_mb": 200.0, "type": "Vision"},
        {"id": "vikhyatk/moondream2", "size_mb": 800.0, "type": "Vision"},
        {"id": "stabilityai/sd-turbo", "size_mb": 500.0, "type": "Vision"},
        {"id": "segmind/SSD-1B", "size_mb": 700.0, "type": "Vision"},
        {"id": "segmind/tiny-sd", "size_mb": 30.0, "type": "Vision"},
        {"id": "lllyasviel/sd-controlnet-depth", "size_mb": 300.0, "type": "Vision"},
        {"id": "depth-anything/Depth-Anything-Small", "size_mb": 24.0, "type": "Vision"},
        {"id": "Intel/dpt-hybrid-midas", "size_mb": 126.0, "type": "Vision"}
    ],
    "Embedding Models": [
        {"id": "BAAI/bge-base-en-v1.5", "size_mb": 109.0, "type": "Embedding"},
        {"id": "intfloat/e5-base-v2", "size_mb": 109.0, "type": "Embedding"},
        {"id": "thenlper/gte-base", "size_mb": 109.0, "type": "Embedding"},
        {"id": "jinaai/jina-embeddings-v2-small", "size_mb": 66.0, "type": "Embedding"},
        {"id": "nomic-ai/nomic-embed-text-v1.5", "size_mb": 137.0, "type": "Embedding"},
        {"id": "mixedbread-ai/mxbai-embed-large-v1", "size_mb": 335.0, "type": "Embedding"}
    ],
    "Others / Misc": [
        {"id": "sentence-transformers/msmarco-distilbert-base-v3", "size_mb": 66.0, "type": "Misc"},
        {"id": "BAAI/bge-m3", "size_mb": 568.0, "type": "Embedding"},
        {"id": "intfloat/multilingual-e5-large", "size_mb": 560.0, "type": "Embedding"},
        {"id": "facebook/dinov2-small", "size_mb": 86.0, "type": "Vision"},
        {"id": "google/t5-small", "size_mb": 60.0, "type": "Misc"},
        {"id": "google/flan-t5-small", "size_mb": 60.0, "type": "Misc"},
        {"id": "EleutherAI/gpt-neo-2.7B", "size_mb": 1600.0, "type": "LLM"}
    ]
}

def is_ollama_available():
    return shutil.which("ollama") is not None

def check_ollama_model(model_name):
    try:
        res = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        return model_name in res.stdout
    except Exception:
        return False

def pull_ollama_model(model_name):
    print(f"-> Pulling '{model_name}' via Ollama...")
    try:
        subprocess.run(["ollama", "pull", model_name], check=True)
        print(f"Successfully pulled '{model_name}'")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error pulling '{model_name}': {e}")
        return False

def login_hf_auth():
    print("This model requires Hugging Face authentication.")
    print("Please login using your Hugging Face CLI Token.")
    try:
        subprocess.run(["huggingface-cli", "login"], check=True)
        return True
    except Exception:
        print("Failed to run login CLI. Setting token manually.")
        token = input("Enter your Hugging Face token: ").strip()
        if token:
            os.environ["HF_TOKEN"] = token
            return True
        return False

def download_hf_model(repo_id, output_dir, max_size_gb):
    print(f"-> Investigating Hugging Face Repository: {repo_id}")
    api = HfApi()
    try:
        # Search for .gguf files
        files = api.list_repo_files(repo_id)
        gguf_files = [f for f in files if f.endswith(".gguf")]
    except Exception as e:
        print(f"Warning: Could not list files for {repo_id}: {e}")
        gguf_files = []

    os.makedirs(output_dir, exist_ok=True)
    target_dir = os.path.join(output_dir, repo_id.replace("/", "_"))

    if gguf_files:
        # Find the smallest q4_k_m or smallest gguf
        q4_files = [f for f in gguf_files if "q4_k_m" in f.lower() or "q4" in f.lower()]
        selected_file = q4_files[0] if q4_files else gguf_files[0]
        print(f"Found GGUF format! Selected file: {selected_file}")
        try:
            path = hf_hub_download(
                repo_id=repo_id,
                filename=selected_file,
                local_dir=target_dir,
                resume_download=True
            )
            print(f"Successfully downloaded GGUF file to: {path}")
            return True
        except Exception as e:
            print(f"Error downloading GGUF file {selected_file}: {e}")
            return False
    else:
        # Fallback: snapshot download of the entire repo
        print(f"No GGUF file found. Downloading full repository snapshot...")
        try:
            path = snapshot_download(
                repo_id=repo_id,
                local_dir=target_dir,
                resume_download=True,
                max_workers=4
            )
            print(f"Successfully downloaded repository snapshot to: {path}")
            return True
        except Exception as e:
            print(f"Error downloading repository snapshot: {e}")
            return False

def main():
    parser = argparse.ArgumentParser(description="Universal Free AI Model Downloader")
    parser.add_argument("--output-dir", default="./models", help="Directory where models are downloaded")
    parser.add_argument("--max-size-gb", type=float, default=5.0, help="Skip models exceeding this size in GB")
    parser.add_argument("--category", choices=list(MODELS.keys()) + ["All"], default="All", help="Download a specific category of models")
    args = parser.parse_args()

    print("=========================================")
    print("   UNIVERSAL FREE AI MODEL DOWNLOADER    ")
    print("=========================================")
    print(f"Output Directory : {args.output_dir}")
    print(f"Max Size Limit   : {args.max_size_gb} GB")
    print(f"Target Category  : {args.category}")
    print("=========================================")

    # Collect models to download
    to_download = []
    for cat, items in MODELS.items():
        if args.category == "All" or args.category == cat:
            for item in items:
                item["category"] = cat
                to_download.append(item)

    print(f"Total models loaded: {len(to_download)}")
    success_count = 0
    skipped_count = 0
    error_count = 0

    for idx, model in enumerate(to_download, 1):
        name = model["id"]
        size_gb = model["size_mb"] / 1024.0
        print(f"\n[{idx}/{len(to_download)}] Processing {name} ({model['size_mb']} MB)")

        if size_gb > args.max_size_gb:
            print(f"Skipped: Exceeds max size limit of {args.max_size_gb} GB")
            skipped_count += 1
            continue

        # Ollama check and pull
        ollama_name = model.get("ollama")
        if ollama_name and is_ollama_available():
            if check_ollama_model(ollama_name):
                print(f"Ollama model '{ollama_name}' is already available locally.")
                success_count += 1
                continue
            else:
                if pull_ollama_model(ollama_name):
                    success_count += 1
                    continue

        # Hugging Face auth check
        if model.get("auth_required", False):
            print(f"Authentication required for {name}.")
            # Check if token exists in environment
            if not os.environ.get("HF_TOKEN") and not os.path.exists(os.path.expanduser("~/.cache/huggingface/token")):
                if not login_hf_auth():
                    print("Skipping model due to lack of authentication.")
                    error_count += 1
                    continue

        # Hugging Face download
        if download_hf_model(name, args.output_dir, args.max_size_gb):
            success_count += 1
        else:
            print(f"Failed to download {name}")
            error_count += 1

    print("\n=========================================")
    print("           DOWNLOAD SUMMARY              ")
    print("=========================================")
    print(f"Successful: {success_count}")
    print(f"Skipped   : {skipped_count}")
    print(f"Errors    : {error_count}")
    print("=========================================")

if __name__ == "__main__":
    main()
