import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { FaGithub } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { BrowserRouter as Router, Route, Switch, Link, useHistory } from 'react-router-dom';
import VipPlans from './components/VipPlans';

function Home() {
  const history = useHistory();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  });

  const handleProcess = async () => {
    if (!selectedFile) {
      toast.error('请先选择图片');
      return;
    }

    try {
      setProcessingStatus('处理中...');
      setError(null);

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('style', selectedStyle);
      formData.append('prompt', customPrompt);

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('处理失败');
      }

      setProcessingStatus('处理完成');
      toast.success('处理成功');
    } catch (error) {
      setError(error instanceof Error ? error.message : '处理失败');
      setProcessingStatus('');
      toast.error('处理失败');
    }
  };

  const handleUpgradeClick = () => {
    history.push('/vip');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">weavatar</h1>
        
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="预览"
                className="max-h-64 mx-auto mb-4"
              />
            ) : (
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <p className="text-sm text-gray-600">
              {isDragActive
                ? '放开以上传图片'
                : '拖拽图片到此处，或点击选择图片'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              支持 JPG、PNG、GIF 格式，最大 5MB
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              选择风格
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">请选择风格</option>
              <option value="anime">动漫风格</option>
              <option value="oil">油画风格</option>
              <option value="watercolor">水彩风格</option>
            </select>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              自定义提示词（可选）
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="输入自定义提示词，例如：'make it more vibrant'"
            />
          </div>

          <div className="mt-6">
            <button
              onClick={handleProcess}
              disabled={!selectedFile || processingStatus === '处理中...'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {processingStatus || '开始处理'}
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-center text-red-600">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            今日剩余处理次数：5次
            <button
              onClick={handleUpgradeClick}
              className="ml-2 text-primary-600 hover:text-primary-500"
            >
              升级会员
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <a
            href="https://github.com/handlegpt/weavatar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <FaGithub className="h-5 w-5 mr-2" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  console.log('App component rendered');
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/vip" component={VipPlans} />
      </Switch>
    </Router>
  );
}

export default App;