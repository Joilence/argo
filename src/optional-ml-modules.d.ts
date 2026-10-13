// The local ML engines stay out of devDependencies: transformers pulls in
// onnxruntime-node, whose install downloads ~225 MB of CUDA binaries on
// linux x64. These stubs let the build type-check without them.
declare module '@huggingface/transformers';
declare module 'kokoro-js';
