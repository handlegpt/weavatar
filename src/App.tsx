import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { FaGithub } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { BrowserRouter as Router, Route, Switch, useHistory } from 'react-router-dom';
import VipPlans from './components/VipPlans';
import LanguageSelector from './components/LanguageSelector';
import { translations } from './i18n/translations';

function Home() {
  const history = useHistory();
  const [currentLanguage, setCurrentLanguage] = useState('zh');
  const t = translations[currentLanguage as keyof typeof translations];
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
      toast.error(t.process.error);
      return;
    }

    try {
      setProcessingStatus(t.process.processing);
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
        throw new Error(t.process.error);
      }

      setProcessingStatus(t.process.success);
      toast.success(t.process.success);
    } catch (error) {
      setError(error instanceof Error ? error.message : t.process.error);
      setProcessingStatus('');
      toast.error(t.process.error);
    }
  };

  const handleUpgradeClick = () => {
    history.push('/vip');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LanguageSelector
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t.title}</h1>
        
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
                alt="Preview"
                className="max-h-64 mx-auto mb-4"
              />
            ) : (
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <p className="text-sm text-gray-600">
              {isDragActive
                ? t.dropzone.dragActive
                : t.dropzone.dragInactive}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t.dropzone.formatHint}
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              {t.style.label}
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">{t.style.placeholder}</option>
              <option value="anime">{t.style.options.anime}</option>
              <option value="oil">{t.style.options.oil}</option>
              <option value="watercolor">{t.style.options.watercolor}</option>
            </select>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              {t.prompt.label}
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder={t.prompt.placeholder}
            />
          </div>

          <div className="mt-6">
            <button
              onClick={handleProcess}
              disabled={!selectedFile || processingStatus === t.process.processing}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {processingStatus || t.process.button}
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-center text-red-600">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            {t.remaining}
            <button
              onClick={handleUpgradeClick}
              className="ml-2 text-primary-600 hover:text-primary-500"
            >
              {t.upgrade}
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
            {t.github}
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