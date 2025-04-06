import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import VipPlans from './components/VipPlans';
import Login from './components/Login';
import { translations } from './i18n/translations';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';

const App: React.FC = () => {
  console.log('App component rendered');
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-center" />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/vip" component={VipPlans} />
            <Route path="/login" component={Login} />
          </Switch>
        </div>
      </Router>
    </LanguageProvider>
  );
};

const Home: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage as keyof typeof translations];

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [waitingForStyle, setWaitingForStyle] = useState(false);

  const processImage = async (formData: FormData) => {
    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.errors.processFailed);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.status === 'processing') {
        toast.success(t.success.processing);
        // 开始轮询任务状态
        const taskId = data.taskId;
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/task-status/${taskId}`);
            if (!statusResponse.ok) {
              throw new Error(t.errors.processFailed);
            }
            const statusData = await statusResponse.json();
            console.log('Task status:', statusData);

            if (statusData.status === 'completed' && statusData.resultImage) {
              clearInterval(pollInterval);
              setResultImage(statusData.resultImage);
              toast.success(t.success.processComplete);
            } else if (statusData.status === 'failed') {
              clearInterval(pollInterval);
              throw new Error(statusData.error || t.errors.processFailed);
            }
          } catch (error: unknown) {
            clearInterval(pollInterval);
            console.error('Error polling task status:', error);
            const errorMessage = error instanceof Error ? error.message : t.errors.processFailed;
            toast.error(errorMessage);
          }
        }, 5000); // 每5秒轮询一次

        // 设置超时
        setTimeout(() => {
          clearInterval(pollInterval);
          toast.error(t.errors.processTimeout);
        }, 5 * 60 * 1000); // 5分钟超时
      } else {
        throw new Error(t.errors.processFailed);
      }
    } catch (error: unknown) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : t.errors.processFailed;
      toast.error(errorMessage);
    }
  };

  const handleStyleSelect = async (style: string) => {
    setSelectedStyle(style);
    setCustomPrompt('');
    
    // 如果已经上传了图片，开始处理
    if (selectedImage) {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('style', style);
      await processImage(formData);
    }
  };
  
  const handleCustomPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果已经上传了图片，开始处理
    if (selectedImage) {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('customPrompt', customPrompt);
      await processImage(formData);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResultImage(null);
        setWaitingForStyle(true); // 立即显示风格选择界面
        
        // 创建FormData对象
        const formData = new FormData();
        formData.append('image', file);
        
        // 如果已经选择了风格或输入了提示词，直接开始处理
        if (selectedStyle || customPrompt) {
          if (selectedStyle) formData.append('style', selectedStyle);
          if (customPrompt) formData.append('customPrompt', customPrompt);
          await processImage(formData);
        } else {
          // 显示提示消息
          toast.success(t.success.selectStyleOrPrompt);
        }
      }
    }, [selectedStyle, customPrompt, t, processImage])
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">WeAvatar</h1>
          <div className="flex items-center space-x-4">
            <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={() => {}} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="w-full max-w-3xl">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-gray-600">
                    {isDragActive ? (
                      <p>{t.dropzone.dragActive}</p>
                    ) : (
                      <p>{t.dropzone.dragInactive}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {previewUrl && (
              <div className="w-full max-w-3xl">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">预览</h3>
                    <div className="relative aspect-square">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {waitingForStyle && (
              <div className="w-full max-w-3xl">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t.style.label}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(t.style.options).map(([id, name]) => (
                        <button
                          key={id}
                          onClick={() => handleStyleSelect(id)}
                          className={`p-4 border rounded-lg text-center transition-colors ${
                            selectedStyle === id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className="block font-medium">{name}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{t.prompt.label}</h3>
                      <form onSubmit={handleCustomPromptSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700">
                            {t.prompt.label}
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="customPrompt"
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder={t.prompt.placeholder}
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={!customPrompt.trim()}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {t.process.button}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {resultImage && (
              <div className="w-full max-w-3xl">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">结果</h3>
                    <div className="relative aspect-square">
                      <img
                        src={resultImage}
                        alt="Result"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resultImage;
                          link.download = 'avatar.png';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        下载
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;