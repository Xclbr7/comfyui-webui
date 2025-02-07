'use client'
import { useEffect, useState } from 'react';
import { setupWebSocket, queuePrompt } from './components/api';

function App() {
  const [wsState, setWsState] = useState(null);  // Changed to wsState to store both ws and clientId
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState(20);

  useEffect(() => {
    const wsConnection = setupWebSocket((message) => {
      console.log("Received message:", message);
      if (message.type === "executed") {
        const imageData = message.data?.output?.images?.[0];
        if (imageData) {
          const imageUrl = `http://127.0.0.1:8188/view?filename=${imageData.filename}&subfolder=${imageData.subfolder || ''}`;
          setGeneratedImage(imageUrl);
          setIsLoading(false);
        }
      }
    });
    
    setWsState(wsConnection);
    
    return () => {
      if (wsConnection.ws) {
        wsConnection.ws.close();
      }
    };
  }, []);

  const handleGenerateImage = async (e) => {

    e.preventDefault();  // Prevent form submission from refreshing the page
  
  if (!wsState?.clientId) {
    console.error("No WebSocket connection");
    return;
  }

  setIsLoading(true);
  setGeneratedImage(null);

  

    // Example workflow
    const workflow = {
      "1": {
        "inputs": {
          "add_noise": "enable",
          "noise_seed": 614966368635923,
          "steps": steps,
          "cfg": 1,
          "sampler_name": "euler",
          "scheduler": "beta",
          "start_at_step": 0,
          "end_at_step": 10000,
          "return_with_leftover_noise": "disable",
          "model": [
            "2",
            0
          ],
          "positive": [
            "3",
            0
          ],
          "negative": [
            "4",
            0
          ],
          "latent_image": [
            "5",
            0
          ]
        },
        "class_type": "KSamplerAdvanced",
        "_meta": {
          "title": "KSampler (Advanced)"
        }
      },
      "2": {
        "inputs": {
          "unet_name": "flux1-dev-Q4_K_S.gguf"
        },
        "class_type": "UnetLoaderGGUF",
        "_meta": {
          "title": "Unet Loader (GGUF)"
        }
      },
      "3": {
        "inputs": {
          "text": prompt,
          "clip": [
            "8",
            0
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "POSITIVE"
        }
      },
      "4": {
        "inputs": {
          "text": "",
          "clip": [
            "8",
            0
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "NEGATIVE"
        }
      },
      "5": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "Empty Latent Image"
        }
      },
      "6": {
        "inputs": {
          "samples": [
            "1",
            0
          ],
          "vae": [
            "10",
            0
          ]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "7": {
        "inputs": {
          "filename_prefix": "ComfyUI",
          "images": [
            "6",
            0
          ]
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "Save Image"
        }
      },
      "8": {
        "inputs": {
          "clip_name1": "clip_l.safetensors",
          "clip_name2": "t5-v1_1-xxl-encoder-Q6_K.gguf",
          "type": "flux"
        },
        "class_type": "DualCLIPLoaderGGUF",
        "_meta": {
          "title": "DualCLIPLoader (GGUF)"
        }
      },
      "10": {
        "inputs": {
          "vae_name": "ae.safetensors"
        },
        "class_type": "VAELoader",
        "_meta": {
          "title": "Load VAE"
        }
      }
    };

    try {
      const result = await queuePrompt(workflow, wsState.clientId);
      console.log("Prompt queued:", result);
    } catch (error) {
      console.error("Error queuing prompt:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full absolute px-48 inset-0 overflow-auto z-[-10] max-h-[100svh]">
      <div className='flex flex-col items-center justify-start w-full h-full absolute px-48 inset-0 bg-black overflow-auto z-[-10] max-h-[100svh] gap-4 pt-20'>
        <form className='flex flex-col items-center gap-4' onSubmit={handleGenerateImage}>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className='text-white bg-gray-800 w-[600px] h-12 rounded-full p-2 px-4'
            type="text"
            placeholder="Enter your prompt here"
          />
          <div>Steps: {steps}</div>
          <input className='slider text-white bg-gray-800 w-[600px] h-12 rounded-full p-2 px-4' type="range" min="5" max="50" value={steps} onChange={(e) => setSteps(e.target.value)} />
          <button 
            className='text-white bg-green-500 w-64 h-12 rounded-full p-2 disabled:opacity-50'
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>

        {isLoading && (
          <div className="mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}

        {generatedImage && (
          <div className="mt-8 max-w-2xl h-[600px] w-auto">
            <img 
              src={generatedImage} 
              alt="Generated artwork"
              className="rounded-lg shadow-lg h-full w-auto object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}


export default App;