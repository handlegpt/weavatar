import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { FaGithub } from 'react-icons/fa';
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
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const t = translations[currentLanguage as keyof typeof translations];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        toast.error(t.errors.invalidFile);
        return;
      }

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('image', file);
      
      // 获取风格和提示词
      const styleSelect = document.getElementById('style') as HTMLSelectElement;
      const promptInput = document.getElementById('prompt') as HTMLInputElement;
      const style = styleSelect.value;
      const customPrompt = promptInput.value;
      
      if (style) {
        formData.append('style', style);
      }
      if (customPrompt) {
        formData.append('customPrompt', customPrompt);
      }

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
                // 下载处理后的图片
                const a = document.createElement('a');
                a.href = statusData.resultImage;
                a.download = `processed-${file.name}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(statusData.resultImage);
                document.body.removeChild(a);
                toast.success(t.success.processComplete);
              } else if (statusData.status === 'failed') {
                clearInterval(pollInterval);
                throw new Error(statusData.error || t.errors.processFailed);
              }
            } catch (error) {
              clearInterval(pollInterval);
              console.error('Error polling task status:', error);
              toast.error(error.message || t.errors.processFailed);
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
      } catch (error) {
        console.error('Error:', error);
        toast.error(error.message || t.errors.processFailed);
      }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <div className="flex items-center space-x-4">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
            <a
              href="https://github.com/handlegpt/weavatar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700"
            >
              <FaGithub className="h-6 w-6" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div
              {...getRootProps()}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
                isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
              }`}
            >
              <div className="space-y-1 text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <input {...getInputProps()} />
                  <p className="pl-1">{isDragActive ? t.dropzone.dragActive : t.dropzone.dragInactive}</p>
                </div>
                <p className="text-xs text-gray-500">{t.dropzone.formatHint}</p>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="style" className="block text-sm font-medium text-gray-700">
                {t.style.label}
              </label>
              <select
                id="style"
                name="style"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">{t.style.placeholder}</option>
                <option value="anime">{t.style.options.anime}</option>
                <option value="oil">{t.style.options.oil}</option>
                <option value="watercolor">{t.style.options.watercolor}</option>
              </select>
            </div>

            <div className="mt-6">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                {t.prompt.label}
              </label>
              <input
                type="text"
                name="prompt"
                id="prompt"
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder={t.prompt.placeholder}
              />
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t.process.button}
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              {t.remaining}
              <button
                onClick={() => window.location.href = '/vip'}
                className="ml-2 text-primary-600 hover:text-primary-500"
              >
                {t.upgrade}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;