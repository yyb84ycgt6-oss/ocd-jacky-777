import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search, Check, Loader2, Sparkles, FolderDown, Terminal,
  ExternalLink, Hammer, Laptop, ShieldCheck, Database, Sliders, Box, Code
} from "lucide-react";

export interface ToolItem {
  id: number;
  name: string;
  desc: string;
  url: string;
}

export interface ToolCategory {
  category: string;
  icon: string;
  tools: ToolItem[];
}

// Complete organized list of 250 tools from the request
const TOOLBOX_DATA: ToolCategory[] = [
  {
    category: "Core Languages & Fundamental Libraries",
    icon: "💻",
    tools: [
      { id: 1, name: "Python", desc: "The primary AI glue language.", url: "https://www.python.org/" },
      { id: 2, name: "R", desc: "Statistical computing for data analysis.", url: "https://www.r-project.org/" },
      { id: 3, name: "Julia", desc: "High-performance numerical computing.", url: "https://julialang.org/" },
      { id: 4, name: "Node.js / TypeScript", desc: "For web-based AI apps and tooling.", url: "https://nodejs.org/" },
      { id: 5, name: "Rust", desc: "Systems programming, safety, and performance.", url: "https://www.rust-lang.org/" },
      { id: 6, name: "Go", desc: "Concurrency and backend services.", url: "https://go.dev/" },
      { id: 7, name: "NumPy", desc: "Array computing.", url: "https://numpy.org/" },
      { id: 8, name: "SciPy", desc: "Scientific algorithms.", url: "https://scipy.org/" },
      { id: 9, name: "Pandas", desc: "Data manipulation.", url: "https://pandas.pydata.org/" },
      { id: 10, name: "Polars", desc: "Fast dataframe library.", url: "https://pola.rs/" },
      { id: 11, name: "Apache Arrow", desc: "In-memory columnar data format.", url: "https://arrow.apache.org/" }
    ]
  },
  {
    category: "AI Development Environments & Notebooks",
    icon: "📓",
    tools: [
      { id: 12, name: "Jupyter Lab", desc: "Interactive notebooks.", url: "https://jupyter.org/" },
      { id: 13, name: "Jupyter Notebook", desc: "Classic notebook interface.", url: "https://jupyter.org/" },
      { id: 14, name: "VS Code", desc: "Primary code editor with AI extensions.", url: "https://code.visualstudio.com/" },
      { id: 15, name: "Google Colab (local)", desc: "GPU-backed notebooks connecting to local runtime.", url: "https://colab.research.google.com/" },
      { id: 16, name: "JetBrains PyCharm", desc: "Python IDE with AI plugins.", url: "https://www.jetbrains.com/pycharm/" },
      { id: 17, name: "Zed", desc: "Fast collaborative editor.", url: "https://zed.dev/" },
      { id: 18, name: "RStudio", desc: "For R-based data science.", url: "https://posit.co/download/rstudio-desktop/" }
    ]
  },
  {
    category: "Deep Learning Frameworks",
    icon: "🧠",
    tools: [
      { id: 19, name: "PyTorch", desc: "Core deep learning framework.", url: "https://pytorch.org/" },
      { id: 20, name: "TensorFlow", desc: "Mature DL framework.", url: "https://www.tensorflow.org/" },
      { id: 21, name: "JAX", desc: "High-performance numerical computing with autograd.", url: "https://github.com/google/jax" },
      { id: 22, name: "Keras", desc: "High-level neural networks API.", url: "https://keras.io/" },
      { id: 23, name: "MXNet", desc: "Scalable deep learning.", url: "https://mxnet.apache.org/" },
      { id: 24, name: "ONNX Runtime", desc: "Cross-platform inference engine.", url: "https://onnxruntime.ai/" },
      { id: 25, name: "OpenVINO", desc: "Intel’s optimized inference.", url: "https://www.intel.com/content/www/us/en/developer/tools/openvino-toolkit/overview.html" },
      { id: 26, name: "TensorRT", desc: "NVIDIA inference optimization.", url: "https://developer.nvidia.com/tensorrt" }
    ]
  },
  {
    category: "Model Training & Fine-Tuning",
    icon: "🏋️",
    tools: [
      { id: 27, name: "Transformers", desc: "Hugging Face library for pretrained models.", url: "https://huggingface.co/docs/transformers/index" },
      { id: 28, name: "PEFT (LoRA, QLoRA)", desc: "Parameter-efficient fine-tuning library.", url: "https://github.com/huggingface/peft" },
      { id: 29, name: "Accelerate", desc: "Hugging Face training on multi-GPU/TPU.", url: "https://github.com/huggingface/accelerate" },
      { id: 30, name: "DeepSpeed", desc: "Microsoft’s training optimization.", url: "https://www.deepspeed.ai/" },
      { id: 31, name: "Megatron-LM", desc: "NVIDIA’s large-scale training framework.", url: "https://github.com/NVIDIA/Megatron-LM" },
      { id: 32, name: "Lightning Fabric", desc: "High-performance training without boilerplate.", url: "https://lightning.ai/docs/fabric" },
      { id: 33, name: "Unsloth", desc: "Fast LLM fine-tuning engine.", url: "https://github.com/unslothai/unsloth" },
      { id: 34, name: "Axolotl", desc: "LLM fine-tuner repository.", url: "https://github.com/OpenAccess-AI-Collective/axolotl" },
      { id: 35, name: "LLaMA-Factory", desc: "Web UI for LLM fine-tuning.", url: "https://github.com/hiyouga/LLaMA-Factory" },
      { id: 36, name: "TRL", desc: "Transformer Reinforcement Learning.", url: "https://github.com/huggingface/trl" },
      { id: 37, name: "PyTorch Lightning", desc: "Trainer abstraction layer.", url: "https://lightning.ai/" },
      { id: 38, name: "Ray Train", desc: "Distributed training library.", url: "https://docs.ray.io/en/latest/train/train.html" }
    ]
  },
  {
    category: "Data Processing & Engineering",
    icon: "⚙️",
    tools: [
      { id: 39, name: "Apache Spark", desc: "Large-scale data processing.", url: "https://spark.apache.org/" },
      { id: 40, name: "Dask", desc: "Parallel computing with Pandas.", url: "https://www.dask.org/" },
      { id: 41, name: "DuckDB", desc: "Embedded analytical SQL engine.", url: "https://duckdb.org/" },
      { id: 42, name: "Ray Data", desc: "Distributed data loading and transformation.", url: "https://docs.ray.io/en/latest/data/data.html" },
      { id: 43, name: "Fugue", desc: "Unified interface for distributed computing.", url: "https://github.com/fugue-project/fugue" },
      { id: 44, name: "dbt", desc: "Data transformation tool.", url: "https://www.getdbt.com/" },
      { id: 45, name: "Airflow", desc: "Workflow orchestration tool.", url: "https://airflow.apache.org/" },
      { id: 46, name: "Prefect", desc: "Modern workflow engine.", url: "https://www.prefect.io/" },
      { id: 47, name: "Mage", desc: "Data pipeline tool.", url: "https://www.mage.ai/" },
      { id: 48, name: "Kedro", desc: "Data pipeline framework.", url: "https://kedro.org/" },
      { id: 49, name: "Delta Lake", desc: "Open-source storage layer.", url: "https://delta.io/" },
      { id: 50, name: "Apache Iceberg", desc: "Table format for large datasets.", url: "https://iceberg.apache.org/" },
      { id: 51, name: "Great Expectations", desc: "Data validation framework.", url: "https://greatexpectations.io/" },
      { id: 52, name: "Soda", desc: "Data quality validation.", url: "https://www.soda.io/" },
      { id: 53, name: "Apache Kafka", desc: "Real-time data streaming.", url: "https://kafka.apache.org/" }
    ]
  },
  {
    category: "Vector Databases & Similarity Search",
    icon: "🗄️",
    tools: [
      { id: 54, name: "FAISS", desc: "Meta’s efficient vector search.", url: "https://github.com/facebookresearch/faiss" },
      { id: 55, name: "Chroma", desc: "Open-source embedding database.", url: "https://www.trychroma.com/" },
      { id: 56, name: "Qdrant", desc: "Vector similarity search database.", url: "https://qdrant.tech/" },
      { id: 57, name: "Weaviate", desc: "Vector database with GraphQL support.", url: "https://weaviate.io/" },
      { id: 58, name: "Milvus", desc: "Highly scalable vector DB.", url: "https://milvus.io/" },
      { id: 59, name: "LanceDB", desc: "Serverless vector DB.", url: "https://github.com/lancedb/lancedb" },
      { id: 60, name: "pgvector", desc: "PostgreSQL extension for vectors.", url: "https://github.com/pgvector/pgvector" },
      { id: 61, name: "RedisSearch", desc: "Vector search in Redis.", url: "https://redis.io/docs/interact/search-query/" },
      { id: 62, name: "Elasticsearch", desc: "Text + vector search.", url: "https://www.elastic.co/" },
      { id: 63, name: "OpenSearch", desc: "Fork of Elasticsearch.", url: "https://opensearch.org/" },
      { id: 64, name: "Annoy", desc: "Spotify’s approximate nearest neighbors.", url: "https://github.com/spotify/annoy" },
      { id: 65, name: "ScaNN", desc: "Google’s efficient similarity search.", url: "https://github.com/google-research/google-research/tree/master/scann" },
      { id: 66, name: "NMSLib", desc: "Non-metric space library.", url: "https://github.com/nmslib/nmslib" },
      { id: 67, name: "HNSWlib", desc: "Hierarchical navigable small world library.", url: "https://github.com/nmslib/hnswlib" }
    ]
  },
  {
    category: "LLM Serving & Local Inference",
    icon: "🚀",
    tools: [
      { id: 68, name: "Ollama", desc: "Local LLM runner.", url: "https://ollama.com/" },
      { id: 69, name: "llama.cpp", desc: "C++ inference engine.", url: "https://github.com/ggerganov/llama.cpp" },
      { id: 70, name: "LM Studio", desc: "Desktop app for local models.", url: "https://lmstudio.ai/" },
      { id: 71, name: "GPT4All", desc: "Local LLM ecosystem.", url: "https://gpt4all.io/" },
      { id: 72, name: "vLLM", desc: "High-throughput serving.", url: "https://github.com/vllm-project/vllm" },
      { id: 73, name: "Text Generation Inference (TGI)", desc: "Hugging Face’s production server.", url: "https://github.com/huggingface/text-generation-inference" },
      { id: 74, name: "Ray Serve", desc: "Scalable model serving.", url: "https://docs.ray.io/en/latest/serve/index.html" },
      { id: 75, name: "Triton Inference Server", desc: "NVIDIA’s multi-framework serving.", url: "https://developer.nvidia.com/nvidia-triton-inference-server" },
      { id: 76, name: "LocalAI", desc: "Drop-in replacement for OpenAI API.", url: "https://github.com/mudler/LocalAI" },
      { id: 77, name: "Open WebUI", desc: "Local chat interface.", url: "https://github.com/open-webui/open-webui" },
      { id: 78, name: "Jan.ai", desc: "Offline desktop LLM app.", url: "https://jan.ai/" },
      { id: 79, name: "Mistral.rs", desc: "Rust inference engine.", url: "https://github.com/eric-mitchell/mistral.rs" },
      { id: 80, name: "Candle", desc: "Minimalist ML in Rust.", url: "https://github.com/huggingface/candle" },
      { id: 81, name: "ctransformers", desc: "C++ bindings for Transformer models.", url: "https://github.com/marella/ctransformers" },
      { id: 82, name: "MLC LLM", desc: "Machine learning compilation for LLMs.", url: "https://github.com/mlc-ai/mlc-llm" }
    ]
  },
  {
    category: "RAG, Agents & Orchestration",
    icon: "🕷️",
    tools: [
      { id: 83, name: "LangChain", desc: "LLM application framework.", url: "https://github.com/langchain-ai/langchain" },
      { id: 84, name: "LlamaIndex", desc: "Data framework for LLMs.", url: "https://www.llamaindex.ai/" },
      { id: 85, name: "Haystack", desc: "NLP pipeline framework.", url: "https://haystack.deepset.ai/" },
      { id: 86, name: "DSPy", desc: "Declarative AI programming framework.", url: "https://github.com/stanfordnlp/dspy" },
      { id: 87, name: "AutoGen", desc: "Microsoft’s multi-agent conversations.", url: "https://github.com/microsoft/autogen" },
      { id: 88, name: "CrewAI", desc: "Multi-agent collaboration engine.", url: "https://www.crewai.com/" },
      { id: 89, name: "MetaGPT", desc: "Multi-agent meta-programming.", url: "https://github.com/geekan/MetaGPT" },
      { id: 90, name: "Flowise", desc: "Low-code LLM apps.", url: "https://flowiseai.com/" },
      { id: 91, name: "LangFlow", desc: "GUI for LangChain pipelines.", url: "https://github.com/langflow-ai/langflow" },
      { id: 92, name: "Voyager", desc: "Open-ended embodied agent in Minecraft.", url: "https://github.com/MineDojo/Voyager" },
      { id: 93, name: "BabyAGI", desc: "Autonomous task manager agent.", url: "https://github.com/yoheinakajima/babyagi" },
      { id: 94, name: "SuperAGI", desc: "Open-source autonomous AI agent.", url: "https://superagi.com/" },
      { id: 95, name: "Smolagents", desc: "Hugging Face agent orchestration.", url: "https://github.com/huggingface/smolagents" },
      { id: 96, name: "Griptape", desc: "Enterprise AI framework.", url: "https://github.com/griptape-ai/griptape" },
      { id: 97, name: "TaskWeaver", desc: "Code-first agent framework.", url: "https://github.com/microsoft/TaskWeaver" },
      { id: 98, name: "Semantic Kernel", desc: "Microsoft’s AI orchestration.", url: "https://github.com/microsoft/semantic-kernel" }
    ]
  },
  {
    category: "Prompt Engineering & Optimization",
    icon: "✏️",
    tools: [
      { id: 99, name: "DSPy Optimizer", desc: "Prompt and model compiler.", url: "https://github.com/stanfordnlp/dspy" },
      { id: 100, name: "PromptSource", desc: "Toolkit for creating prompts.", url: "https://github.com/bigscience-project/promptsource" },
      { id: 101, name: "Promptify", desc: "Structured prompting toolkit.", url: "https://github.com/promptslab/Promptify" },
      { id: 102, name: "Guidance", desc: "Microsoft’s templating language.", url: "https://github.com/guidance-ai/guidance" },
      { id: 103, name: "Outlines", desc: "Guided and structured generation.", url: "https://github.com/outlines-dev/outlines" },
      { id: 104, name: "LMQL", desc: "Language model query language.", url: "https://lmql.ai/" },
      { id: 105, name: "TextSynth", desc: "Text generation playground.", url: "https://textsynth.com/" },
      { id: 106, name: "BetterPrompt", desc: "Prompt improvement toolkit.", url: "https://github.com/sjones6/betterprompt" }
    ]
  },
  {
    category: "Model Optimization & Quantization",
    icon: "📦",
    tools: [
      { id: 107, name: "bitsandbytes", desc: "4/8-bit quantization libraries.", url: "https://github.com/TimDettmers/bitsandbytes" },
      { id: 108, name: "GPTQ", desc: "Post-training quantization.", url: "https://github.com/IST-DASLab/gptq" },
      { id: 109, name: "AutoGPTQ", desc: "Easy post-training quantization.", url: "https://github.com/AutoGPTQ/AutoGPTQ" },
      { id: 110, name: "AWQ", desc: "Activation-aware weight quantization.", url: "https://github.com/mit-han-lab/llm-awq" },
      { id: 111, name: "llama.cpp (quantize)", desc: "GGUF format quantization tool.", url: "https://github.com/ggerganov/llama.cpp/blob/master/examples/quantize" },
      { id: 112, name: "PyTorch Mobile", desc: "Model optimization for mobile.", url: "https://pytorch.org/mobile/home/" },
      { id: 113, name: "TensorFlow Lite", desc: "On-device machine learning.", url: "https://www.tensorflow.org/lite" },
      { id: 114, name: "OpenVINO (Optim)", desc: "Intel optimizations library.", url: "https://github.com/openvinotoolkit/openvino" },
      { id: 115, name: "ONNX Runtime (Optim)", desc: "Model runtime optimizer.", url: "https://onnxruntime.ai/docs/performance/" },
      { id: 116, name: "Neural Magic", desc: "Sparsification and quantization engine.", url: "https://neuralmagic.com/" },
      { id: 117, name: "SparseML", desc: "Sparsification toolkit for ML.", url: "https://github.com/neuralmagic/sparseml" },
      { id: 118, name: "DeepSparse", desc: "CPU-optimized inference engine.", url: "https://github.com/neuralmagic/deepsparse" }
    ]
  },
  {
    category: "Experiment Tracking & Monitoring",
    icon: "📊",
    tools: [
      { id: 119, name: "MLflow", desc: "Lifecycle and model management.", url: "https://mlflow.org/" },
      { id: 120, name: "Weights & Biases", desc: "Experiment tracking (free tier).", url: "https://wandb.ai/" },
      { id: 121, name: "ClearML", desc: "MLOps tracking and scheduling.", url: "https://clear.ml/" },
      { id: 122, name: "TensorBoard", desc: "Visualizations for TensorFlow and PyTorch.", url: "https://www.tensorflow.org/tensorboard" },
      { id: 123, name: "Aim", desc: "Open-source experiment tracker.", url: "https://github.com/aimhubio/aim" },
      { id: 124, name: "Neptune.ai", desc: "Experiment management (free tier).", url: "https://neptune.ai/" },
      { id: 125, name: "Guild AI", desc: "Open-source experiment tracking.", url: "https://guild.ai/" },
      { id: 126, name: "Langfuse", desc: "LLM observability and analytics.", url: "https://langfuse.com/" },
      { id: 127, name: "Helicone", desc: "LLM monitoring and proxy.", url: "https://www.helicone.ai/" },
      { id: 128, name: "WhyLabs", desc: "AI observability and data drift monitor.", url: "https://whylabs.ai/" }
    ]
  },
  {
    category: "Security, Privacy & Encryption",
    icon: "🛡️",
    tools: [
      { id: 129, name: "libsodium", desc: "Encryption, secure memory algorithms.", url: "https://github.com/jedisct1/libsodium" },
      { id: 130, name: "PyNaCl", desc: "Python binding to libsodium.", url: "https://github.com/pyca/pynacl" },
      { id: 131, name: "cryptography", desc: "Core Python cryptographic recipes.", url: "https://github.com/pyca/cryptography" },
      { id: 132, name: "Fernet", desc: "Symmetric encryption recipes.", url: "https://cryptography.io/en/latest/fernet/" },
      { id: 133, name: "JWT", desc: "JSON Web Tokens encoding/decoding.", url: "https://jwt.io/" },
      { id: 134, name: "OAuthLib", desc: "OAuth implementation framework.", url: "https://github.com/oauthlib/oauthlib" },
      { id: 135, name: "Pangea", desc: "Security APIs for AI safety.", url: "https://pangea.cloud/" },
      { id: 136, name: "Guardrails AI", desc: "Guardrails for validation of LLM outputs.", url: "https://www.guardrailsai.com/" },
      { id: 137, name: "LLM-Guard", desc: "Input/output sanitization for LLMs.", url: "https://github.com/protectai/llm-guard" },
      { id: 138, name: "Presidio", desc: "Data anonymization engine.", url: "https://microsoft.github.io/presidio/" }
    ]
  },
  {
    category: "Infrastructure & MLOps",
    icon: "⚙️",
    tools: [
      { id: 139, name: "Docker", desc: "Containerization.", url: "https://www.docker.com/" },
      { id: 140, name: "Kubernetes", desc: "Orchestration.", url: "https://kubernetes.io/" },
      { id: 141, name: "Terraform", desc: "Infrastructure as code.", url: "https://www.terraform.io/" },
      { id: 142, name: "Ansible", desc: "Configuration management.", url: "https://www.ansible.com/" },
      { id: 143, name: "Jenkins", desc: "Continuous Integration / CD.", url: "https://www.jenkins.io/" },
      { id: 144, name: "GitHub Actions", desc: "CI/CD directly on GitHub.", url: "https://github.com/features/actions" },
      { id: 145, name: "GitLab CI", desc: "GitLab-powered automation.", url: "https://docs.gitlab.com/ee/ci/" },
      { id: 146, name: "Ray Serve (Infra)", desc: "Distributed computing scheduler.", url: "https://github.com/ray-project/ray" },
      { id: 147, name: "Dask (Infra)", desc: "Distributed parallel graph builder.", url: "https://github.com/dask/dask" },
      { id: 148, name: "Kubeflow", desc: "MLOps platform on top of Kubernetes.", url: "https://www.kubeflow.org/" },
      { id: 149, name: "MLRun", desc: "Open-source MLOps orchestrator.", url: "https://github.com/mlrun/mlrun" },
      { id: 150, name: "ZenML", desc: "Unified MLOps pipeline model.", url: "https://zenml.io/" },
      { id: 151, name: "Metaflow", desc: "Netflix’s ML infrastructure framework.", url: "https://metaflow.org/" },
      { id: 152, name: "Flyte", desc: "Scalable ML work states.", url: "https://flyte.org/" }
    ]
  },
  {
    category: "Data Annotation & Labeling",
    icon: "🏷️",
    tools: [
      { id: 153, name: "Label Studio", desc: "Data labeling and annotation.", url: "https://labelstud.io/" },
      { id: 154, name: "Prodigy Concept", desc: "Scriptable annotation concept tool.", url: "https://prodi.gy/" },
      { id: 155, name: "Doccano", desc: "Text annotation tool.", url: "https://github.com/doccano/doccano" },
      { id: 156, name: "CVAT", desc: "Computer vision annotation tool.", url: "https://github.com/opencv/cvat" },
      { id: 157, name: "SuperAnnotate", desc: "AI-assisted annotation framework.", url: "https://www.superannotate.com/" },
      { id: 158, name: "Labelme", desc: "Image polygonal annotation tool.", url: "https://github.com/wkentaro/labelme" }
    ]
  },
  {
    category: "Specialized AI Libraries by Domain",
    icon: "🔬",
    tools: [
      { id: 159, name: "spaCy", desc: "Industrial NLP toolkit.", url: "https://spacy.io/" },
      { id: 160, name: "NLTK", desc: "Natural Language Toolkit.", url: "https://www.nltk.org/" },
      { id: 161, name: "TextBlob", desc: "Simplified text processing.", url: "https://textblob.readthedocs.io/" },
      { id: 162, name: "fastText", desc: "Word embeddings library.", url: "https://fasttext.cc/" },
      { id: 163, name: "Gensim", desc: "Topic modeling tool.", url: "https://radimrehurek.com/gensim/" },
      { id: 164, name: "Stanza", desc: "Stanford NLP group toolkit.", url: "https://stanfordnlp.github.io/stanza/" },
      { id: 165, name: "OpenNLP", desc: "Apache NLP library.", url: "https://opennlp.apache.org/" },
      { id: 166, name: "Polyglot", desc: "Multilingual NLP helper.", url: "https://github.com/aboSamoor/polyglot" },
      { id: 167, name: "OpenCV", desc: "Core CV library.", url: "https://opencv.org/" },
      { id: 168, name: "Detectron2", desc: "Meta's object detection.", url: "https://github.com/facebookresearch/detectron2" },
      { id: 169, name: "MMDetection", desc: "OpenMMLab detection toolkit.", url: "https://github.com/open-mmlab/mmdetection" },
      { id: 170, name: "YOLOv8", desc: "Ultralytics real-time detection.", url: "https://github.com/ultralytics/ultralytics" },
      { id: 171, name: "ImageAI", desc: "Simplified vision detection.", url: "https://github.com/OlafenwaMoses/ImageAI" },
      { id: 172, name: "scikit-image", desc: "Image processing algorithms.", url: "https://scikit-image.org/" },
      { id: 173, name: "SimpleCV", desc: "Easy CV framework.", url: "http://simplecv.org/" },
      { id: 174, name: "Albumentations", desc: "Data augmentation library.", url: "https://albumentations.ai/" },
      { id: 175, name: "Whisper", desc: "Speech recognition library.", url: "https://github.com/openai/whisper" },
      { id: 176, name: "Kaldi", desc: "Speech recognition toolkit.", url: "https://kaldi-asr.org/" },
      { id: 177, name: "SpeechBrain", desc: "All-in-one speech framework.", url: "https://speechbrain.github.io/" },
      { id: 178, name: "Coqui TTS", desc: "Text-to-speech engine.", url: "https://github.com/coqui-ai/TTS" },
      { id: 179, name: "ESPnet", desc: "End-to-end speech processing.", url: "https://github.com/espnet/espnet" },
      { id: 180, name: "pyAudioAnalysis", desc: "Audio analysis features.", url: "https://github.com/tyiannak/pyAudioAnalysis" },
      { id: 181, name: "Stable-Baselines3", desc: "Reliable reinforcement learning.", url: "https://github.com/DLR-RM/stable-baselines3" },
      { id: 182, name: "Gymnasium", desc: "Reinforcement learning environments.", url: "https://gymnasium.farama.org/" },
      { id: 183, name: "Dopamine", desc: "Google’s RL framework.", url: "https://github.com/google/dopamine" },
      { id: 184, name: "RLlib", desc: "Scalable reinforcement learning.", url: "https://docs.ray.io/en/latest/rllib/index.html" },
      { id: 185, name: "TF-Agents", desc: "TensorFlow RL agents.", url: "https://github.com/tensorflow/agents" },
      { id: 186, name: "PyTorch Geometric", desc: "GNN library.", url: "https://pytorch-geometric.readthedocs.io/" },
      { id: 187, name: "DGL", desc: "Deep Graph Library.", url: "https://www.dgl.ai/" },
      { id: 188, name: "Spektral", desc: "GNN for TensorFlow.", url: "https://graphneural.network/" }
    ]
  },
  {
    category: "UI & Frontend for AI Apps",
    icon: "🎨",
    tools: [
      { id: 189, name: "Streamlit", desc: "Rapidly prototype data apps.", url: "https://streamlit.io/" },
      { id: 190, name: "Gradio", desc: "Machine learning demo UI.", url: "https://www.gradio.app/" },
      { id: 191, name: "Chainlit", desc: "Chat UI for LLM applications.", url: "https://chainlit.io/" },
      { id: 192, name: "Next.js", desc: "React framework for web.", url: "https://nextjs.org/" },
      { id: 193, name: "Vue.js", desc: "Progressive frontend framework.", url: "https://vuejs.org/" },
      { id: 194, name: "FastAPI", desc: "High performance API building.", url: "https://fastapi.tiangolo.com/" },
      { id: 195, name: "Flask", desc: "Micro web framework.", url: "https://flask.palletsprojects.com/" },
      { id: 196, name: "NiceGUI", desc: "UI for Python.", url: "https://nicegui.io/" },
      { id: 197, name: "Reflex", desc: "Pure Python web apps.", url: "https://reflex.dev/" },
      { id: 198, name: "Mesop", desc: "Google’s Python UI engine.", url: "https://google.github.io/mesop/" }
    ]
  },
  {
    category: "Data Visualization & BI",
    icon: "📊",
    tools: [
      { id: 199, name: "Matplotlib", desc: "Core Python plotting.", url: "https://matplotlib.org/" },
      { id: 200, name: "Seaborn", desc: "Statistical visualization builder.", url: "https://seaborn.pydata.org/" },
      { id: 201, name: "Plotly", desc: "Interactive charts.", url: "https://plotly.com/" },
      { id: 202, name: "Bokeh", desc: "Interactive web visualizations.", url: "https://bokeh.org/" },
      { id: 203, name: "Apache Superset", desc: "Business Intelligence and exploration.", url: "https://superset.apache.org/" },
      { id: 204, name: "Grafana", desc: "System observability dashboards.", url: "https://grafana.com/" }
    ]
  },
  {
    category: "Testing & Quality",
    icon: "🧪",
    tools: [
      { id: 205, name: "pytest", desc: "Testing framework.", url: "https://docs.pytest.org/" },
      { id: 206, name: "unittest", desc: "Built-in testing library.", url: "https://docs.python.org/3/library/unittest.html" },
      { id: 207, name: "Hypothesis", desc: "Property-based testing.", url: "https://hypothesis.works/" },
      { id: 208, name: "Deepchecks", desc: "Testing for ML models.", url: "https://deepchecks.com/" },
      { id: 209, name: "TruLens", desc: "Evaluation and tracking.", url: "https://www.trulens.org/" },
      { id: 210, name: "Great Expectations (Eval)", desc: "Automated data validation.", url: "https://greatexpectations.io/" }
    ]
  },
  {
    category: "Knowledge Management & Note-taking",
    icon: "📓",
    tools: [
      { id: 211, name: "Obsidian", desc: "Local-first note vault.", url: "https://obsidian.md/" },
      { id: 212, name: "Logseq", desc: "Open-source knowledge base.", url: "https://logseq.com/" },
      { id: 213, name: "Joplin", desc: "Notes with encryption.", url: "https://joplinapp.org/" },
      { id: 214, name: "Zettlr", desc: "Academic Markdown editor.", url: "https://www.zettlr.com/" },
      { id: 215, name: "Foam", desc: "Roam-like knowledge graph for VS Code.", url: "https://foambubble.github.io/foam/" }
    ]
  },
  {
    category: "Hardware & Acceleration",
    icon: "🔌",
    tools: [
      { id: 216, name: "CUDA Toolkit", desc: "NVIDIA GPU programming.", url: "https://developer.nvidia.com/cuda-toolkit" },
      { id: 217, name: "cuDNN", desc: "Deep neural network library.", url: "https://developer.nvidia.com/cudnn" },
      { id: 218, name: "ROCm", desc: "AMD GPU acceleration.", url: "https://www.amd.com/en/developer/resources/rocm.html" },
      { id: 219, name: "Intel oneAPI", desc: "CPU/GPU/FPGA acceleration.", url: "https://www.intel.com/content/www/us/en/developer/tools/oneapi/overview.html" },
      { id: 220, name: "OpenCL", desc: "Heterogeneous computing standard.", url: "https://www.khronos.org/opencl/" },
      { id: 221, name: "Vulkan", desc: "Low-overhead graphics and compute.", url: "https://www.vulkan.org/" },
      { id: 222, name: "DirectML", desc: "Windows ML acceleration.", url: "https://learn.microsoft.com/en-us/windows/ai/directml/dml" }
    ]
  },
  {
    category: "Repositories & Model Hubs",
    icon: "🏗️",
    tools: [
      { id: 223, name: "Hugging Face Hub", desc: "Central model repo.", url: "https://huggingface.co/" },
      { id: 224, name: "Ollama Library", desc: "Curated GGUF models.", url: "https://ollama.com/library" },
      { id: 225, name: "PyPI", desc: "Python packages repository.", url: "https://pypi.org/" },
      { id: 226, name: "Conda-Forge", desc: "Community-led Conda packages.", url: "https://conda-forge.org/" },
      { id: 227, name: "GitHub", desc: "Code and model hosting.", url: "https://github.com/" },
      { id: 228, name: "GitLab", desc: "Alternative code workspace.", url: "https://about.gitlab.com/" },
      { id: 229, name: "Docker Hub", desc: "Container images registry.", url: "https://hub.docker.com/" }
    ]
  },
  {
    category: "Autonomous Agent Stacks",
    icon: "🕷️",
    tools: [
      { id: 230, name: "Aider", desc: "AI pair programming in terminal.", url: "https://aider.chat/" },
      { id: 231, name: "Continue.dev", desc: "Open-source AI code assistant.", url: "https://www.continue.dev/" },
      { id: 232, name: "Cody", desc: "Sourcegraph code AI.", url: "https://sourcegraph.com/cody" },
      { id: 233, name: "Tabby", desc: "Self-hosted AI coding assistant.", url: "https://tabby.tabbyml.com/" },
      { id: 234, name: "Open Interpreter", desc: "Code execution via LLM.", url: "https://openinterpreter.com/" },
      { id: 235, name: "Devika", desc: "Open-source autonomous developer agent.", url: "https://github.com/stitionai/devika" },
      { id: 236, name: "SWE-agent", desc: "Software engineering agent.", url: "https://github.com/princeton-nlp/SWE-agent" }
    ]
  },
  {
    category: "Terminal & Shell AI Utilities",
    icon: "🐚",
    tools: [
      { id: 237, name: "fabric", desc: "Pattern-based AI workflow template.", url: "https://github.com/danielmiessler/fabric" },
      { id: 238, name: "Shell-Gen", desc: "AI shell commands builder.", url: "https://github.com/ricklamers/shell-gen" },
      { id: 239, name: "tfew", desc: "Terminal AI tool.", url: "https://github.com/ajacks/tfew" },
      { id: 240, name: "Warp", desc: "AI integrated modern terminal.", url: "https://www.warp.dev/" },
      { id: 241, name: "Fig", desc: "Autocomplete with AI.", url: "https://fig.io/" },
      { id: 242, name: "Starship", desc: "Customizable cross-shell prompt.", url: "https://starship.rs/" },
      { id: 243, name: "Zsh + plugins", desc: "Highly productive terminal.", url: "https://www.zsh.org/" }
    ]
  },
  {
    category: "Additional Essentials",
    icon: "🛠️",
    tools: [
      { id: 244, name: "pipx", desc: "Install Python CLI tools safely in isolated envs.", url: "https://github.com/pypa/pipx" },
      { id: 245, name: "poetry", desc: "Python dependency management & packaging.", url: "https://python-poetry.org/" },
      { id: 246, name: "conda", desc: "Package and environment manager.", url: "https://docs.conda.io/" },
      { id: 247, name: "mamba", desc: "Fast C++ reimplementation of conda.", url: "https://github.com/mamba-org/mamba" },
      { id: 248, name: "tmux", desc: "Terminal multiplexer.", url: "https://github.com/tmux/tmux" },
      { id: 249, name: "htop", desc: "Interactive system monitor.", url: "https://htop.dev/" },
      { id: 250, name: "ncdu", desc: "Disk usage analyzer.", url: "https://dev.yorhel.nl/ncdu" }
    ]
  }
];

interface GeneralToolboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GeneralToolbox({ isOpen, onClose }: GeneralToolboxProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [downloads, setDownloads] = useState<Record<number, "idle" | "downloading" | "installed">>({});

  // Trigger simulated tool download/install action
  const handleDownload = (tool: ToolItem) => {
    if (downloads[tool.id] === "downloading") return;

    setDownloads(prev => ({ ...prev, [tool.id]: "downloading" }));
    toast.info(`Fetching ${tool.name}...`);

    setTimeout(() => {
      setDownloads(prev => ({ ...prev, [tool.id]: "installed" }));
      toast.success(`🎉 ${tool.name} successfully loaded to local workstation environment!`);
    }, 1200);
  };

  const handleDownloadAllScript = () => {
    const header = `#!/usr/bin/env bash
# ==============================================================================
#            MASTER ACQUISITION & SETUP CATALOG: 250 AI WORKSTATION TOOLS
# ==============================================================================
# This catalog contains all 250 essential tools, languages, and frameworks.
# Run this script to view, check, or acquire individual packages locally.
# ==============================================================================

echo "======================================================================"
echo "          250 ESSENTIAL AI WORKSTATION TOOLBOX SETUP CATALOG          "
echo "======================================================================"
echo "This catalog indexes all 250 open-source AI tools. To acquire/install"
echo "any tool, visit the link listed or use your system package manager."
echo "======================================================================"
echo ""
`;

    const body = TOOLBOX_DATA.map(c => {
      const categoryHeader = `echo "--- [CATEGORY] ${c.category} ---"`;
      const toolLines = c.tools.map(t => {
        return `echo "  [#\${t.id}] ${t.name} - ${t.desc}"\necho "        Acquisition URL: ${t.url}"\necho ""`;
      }).join("\n");
      return `${categoryHeader}\n${toolLines}`;
    }).join("\n\n");

    const fullScript = `${header}\n${body}\n\necho "All 250 tool entries listed successfully!"`;
    const blob = new Blob([fullScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "setup_250_toolbox.sh";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Master installation bash script dispatched!");
  };

  // Filter tools based on search and selected tab
  const filteredCategories = useMemo(() => {
    return TOOLBOX_DATA.map(cat => {
      const filteredTools = cat.tools.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === "All" || cat.category === activeTab;
        return matchesSearch && matchesTab;
      });

      return {
        ...cat,
        tools: filteredTools
      };
    }).filter(cat => cat.tools.length > 0);
  }, [search, activeTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[11000] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />

          {/* Sliding panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-2xl h-full bg-card border-l border-border/50 shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-secondary/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hammer className="text-indigo-400 animate-pulse" size={18} />
                  <span className="font-mono text-sm font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
                    250 AI WORKSTATION TOOLBOX
                  </span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 font-mono text-[9px] font-semibold tracking-widest uppercase">
                    Free / Public
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                A massive index of 250 essential tools, frameworks, databases, and environments.
                Download tools individually or dispatch the master shell setup script directly to your local system.
              </p>

              {/* Search and Action */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-muted-foreground/60" size={14} />
                  <input
                    type="text"
                    placeholder="Search 250 tools by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-background border border-border/50 rounded-md font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <button
                  onClick={handleDownloadAllScript}
                  className="px-3 py-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 text-white font-mono text-xs font-bold rounded-md flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 shrink-0"
                >
                  <FolderDown size={14} />
                  <span>Get Master Setup .sh</span>
                </button>
              </div>
            </div>

            {/* Quick tabs */}
            <div className="flex border-b border-border/30 overflow-x-auto bg-secondary/5 scrollbar-thin">
              <button
                onClick={() => setActiveTab("All")}
                className={`px-3 py-2 font-mono text-[9px] uppercase font-bold tracking-wider shrink-0 border-b-2 transition-colors ${
                  activeTab === "All"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                All categories
              </button>
              {TOOLBOX_DATA.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setActiveTab(cat.category)}
                  className={`px-3 py-2 font-mono text-[9px] uppercase font-bold tracking-wider shrink-0 border-b-2 transition-colors ${
                    activeTab === cat.category
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Content Scroll area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-secondary/5">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <span className="text-2xl">🔍</span>
                  <p className="text-xs font-mono text-muted-foreground">No matching tools found.</p>
                </div>
              ) : (
                filteredCategories.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-1">
                      <span>{cat.icon}</span>
                      <span>{cat.category}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.tools.map((tool) => {
                        const status = downloads[tool.id] || "idle";
                        return (
                          <div
                            key={tool.id}
                            className="rounded border border-border/40 p-3 bg-card hover:border-border transition-all flex flex-col justify-between gap-2.5 font-mono text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-foreground flex items-center gap-1">
                                  <span className="text-muted-foreground text-[9px]">#{tool.id}</span>
                                  {tool.name}
                                </span>
                                <a
                                  href={tool.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                  title="Official Website"
                                >
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-normal">
                                {tool.desc}
                              </p>
                            </div>

                            {/* Download Action */}
                            <button
                              onClick={() => handleDownload(tool)}
                              disabled={status === "downloading"}
                              className={`w-full py-1 rounded text-[9px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 ${
                                status === "installed"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : status === "downloading"
                                  ? "bg-secondary text-muted-foreground cursor-wait"
                                  : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                              }`}
                            >
                              {status === "installed" ? (
                                <><Check size={10} /> Active</>
                              ) : status === "downloading" ? (
                                <><Loader2 size={10} className="animate-spin" /> Fetching...</>
                              ) : (
                                "Download"
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border/50 bg-secondary/30 flex items-center justify-between text-[9px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Laptop size={12} />
                <span>Local Autonomous Workstation Kit</span>
              </span>
              <span>Total Indexed: 250 Tools</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
