import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { TaskStatus, createTask, updateTask, getTask } from './taskManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建路由器而不是应用
const router = express.Router();

// 文件类型验证
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('只允许上传图片文件'), false);
  }
  cb(null, true);
};

// 配置 multer
const upload = multer({ 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// 内容过滤函数
const sanitizePrompt = (prompt) => {
  if (!prompt) return '';
  // 移除 HTML 标签
  let sanitized = prompt.replace(/<[^>]*>/g, '');
  // 移除特殊字符
  sanitized = sanitized.replace(/[<>{}]/g, '');
  // 限制长度
  sanitized = sanitized.slice(0, 200);
  return sanitized;
};

// 错误消息多语言支持
const errorMessages = {
  zh: {
    noFile: '请上传图片',
    noStyleOrPrompt: '请选择风格或输入自定义提示词',
    serverConfigError: '服务器配置错误，请联系管理员',
    serverError: '服务器错误',
    requestFailed: '请求失败',
    invalidResponse: '服务器返回了非预期的响应格式',
    invalidJson: '服务器返回了无效的JSON响应',
    noImageData: '未找到图片数据',
    processingFailed: '图片处理失败，请稍后重试',
    taskNotFound: '任务不存在或已过期',
    processing: '图片正在处理中，请稍候...'
  },
  en: {
    noFile: 'Please upload an image',
    noStyleOrPrompt: 'Please select a style or enter a custom prompt',
    serverConfigError: 'Server configuration error, please contact administrator',
    serverError: 'Server error',
    requestFailed: 'Request failed',
    invalidResponse: 'Server returned unexpected response format',
    invalidJson: 'Server returned invalid JSON response',
    noImageData: 'No image data found',
    processingFailed: 'Image processing failed, please try again later',
    taskNotFound: 'Task not found or expired',
    processing: 'Processing in progress, please wait...'
  },
  ja: {
    noFile: '画像をアップロードしてください',
    noStyleOrPrompt: 'スタイルを選択するか、カスタムプロンプトを入力してください',
    serverConfigError: 'サーバー設定エラー、管理者に連絡してください',
    serverError: 'サーバーエラー',
    requestFailed: 'リクエスト失敗',
    invalidResponse: 'サーバーが予期しないレスポンス形式を返しました',
    invalidJson: 'サーバーが無効なJSONレスポンスを返しました',
    noImageData: '画像データが見つかりません',
    processingFailed: '画像処理に失敗しました。後でもう一度お試しください',
    taskNotFound: 'タスクが見つからないか、期限切れです',
    processing: '処理中です。しばらくお待ちください...'
  }
};

// 获取错误消息
const getErrorMessage = (key, lang = 'en') => {
  return errorMessages[lang]?.[key] || errorMessages.en[key];
};

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // 5 requests per windowMs
  message: { error: '已达到每日免费使用限额' }
});

// Apply rate limiting to image processing endpoint
router.use('/process-image', limiter);

// Image processing endpoint
router.post('/process-image', upload.single('image'), async (req, res) => {
  const taskId = createTask();
  const lang = req.headers['accept-language'] || 'en';
  try {
    console.log('Received request:', {
      file: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      body: req.body
    });

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: getErrorMessage('noFile', lang) });
    }

    const { style, customPrompt } = req.body;
    console.log('Request parameters:', { style, customPrompt });

    if (!style && !customPrompt) {
      console.error('No style or prompt provided');
      return res.status(400).json({ error: getErrorMessage('noStyleOrPrompt', lang) });
    }

    // 过滤和清理提示词
    const sanitizedPrompt = sanitizePrompt(customPrompt);
    const finalPrompt = style || sanitizedPrompt;
    console.log('Final prompt:', finalPrompt);

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    console.log('Image converted to base64, length:', imageBase64.length);

    // Get API configuration from environment variables
    const apiKey = process.env.API_KEY;
    const apiEndpoint = process.env.API_ENDPOINT;
    const apiModel = process.env.API_MODEL;

    console.log('API Configuration:', {
      hasApiKey: !!apiKey,
      apiEndpoint,
      apiModel
    });

    if (!apiKey || !apiEndpoint || !apiModel) {
      console.error('Missing API configuration');
      updateTask(taskId, {
        status: TaskStatus.FAILED,
        error: getErrorMessage('serverConfigError', lang)
      });
      return res.status(500).json({ 
        error: getErrorMessage('serverConfigError', lang),
        taskId: taskId
      });
    }

    // Prepare request payload
    const payload = {
      model: apiModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: finalPrompt || 'Transform this image'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };

    // Set request headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Send initial response with taskId to indicate processing started
    res.json({
      success: true,
      message: getErrorMessage('processing', lang),
      status: 'processing',
      taskId: taskId
    });

    // Process image in background
    (async () => {
      try {
        // Log API request details
        console.log('API Request:', {
          endpoint: apiEndpoint,
          headers: {
            ...headers,
            'Authorization': 'Bearer [REDACTED]'
          },
          payload: {
            ...payload,
            messages: payload.messages.map(msg => ({
              ...msg,
              content: msg.content.map(content => 
                content.type === 'image_url' 
                  ? { ...content, image_url: { url: '[REDACTED]' } }
                  : content
              )
            }))
          }
        });

        // 设置请求超时和重试配置
        const timeout = 15 * 60 * 1000; // 15分钟超时
        const maxRetries = 3;
        let retryCount = 0;

        // 重试函数
        const fetchWithRetry = async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(payload),
              signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            if (error.name === 'AbortError') {
              throw new Error('请求超时');
            }
            throw error;
          }
        };

        // 执行请求，支持重试
        let response;
        while (retryCount < maxRetries) {
          try {
            response = await fetchWithRetry();
            
            // 检查响应内容类型
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
              console.error('Received HTML response instead of JSON:', await response.text());
              throw new Error(getErrorMessage('invalidResponse', lang));
            }
            
            if (response.ok) break;
            
            // 如果是服务器错误，等待后重试
            if (response.status >= 500) {
              retryCount++;
              if (retryCount === maxRetries) {
                updateTask(taskId, {
                  status: TaskStatus.FAILED,
                  error: `${getErrorMessage('serverError', lang)}: ${response.status}`
                });
                throw new Error(`${getErrorMessage('serverError', lang)}: ${response.status}`);
              }
              await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
              continue;
            }
            
            // 如果是客户端错误，直接抛出
            const errorMessage = `${getErrorMessage('requestFailed', lang)}: ${response.status}`;
            updateTask(taskId, {
              status: TaskStatus.FAILED,
              error: errorMessage
            });
            throw new Error(errorMessage);
          } catch (error) {
            console.error(`第${retryCount + 1}次请求失败:`, error);
            retryCount++;
            if (retryCount === maxRetries) {
              updateTask(taskId, {
                status: TaskStatus.FAILED,
                error: error.message || getErrorMessage('processingFailed', lang)
              });
              throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
          }
        }

        console.log('API Response Status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`${getErrorMessage('requestFailed', lang)}: ${response.status}`);
        }

        let result;
        try {
          result = await response.json();
        } catch (error) {
          console.error('Failed to parse API response as JSON:', error);
          throw new Error(getErrorMessage('invalidJson', lang));
        }
        
        // Process the API response and extract the generated image from choices
        let processedImage = null;
        if (result.choices && result.choices.length > 0) {
          const choice = result.choices[0];
          console.log('Processing choice:', JSON.stringify(choice, null, 2));
          
          if (choice.message && choice.message.content) {
            // 解析Markdown格式的内容
            const content = choice.message.content;
            console.log('Content from API:', content);
            
            const lines = content.split('\n');
            console.log('Split content into lines:', lines);
            
            // 查找最后一个图片链接
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i];
              console.log(`Processing line ${i}:`, line);
              
              if (line.startsWith('![') && line.includes('](')) {
                const urlMatch = line.match(/\]\((.*?)\)/);
                if (urlMatch && urlMatch[1]) {
                  processedImage = urlMatch[1];
                  console.log('Found image URL:', processedImage);
                  break;
                }
              }
            }
          } else {
            console.log('No message content found in choice');
          }
        } else {
          console.log('No choices found in API response');
        }
        
        if (!processedImage) {
          console.error('API Response Missing Image Data:', result);
          throw new Error(getErrorMessage('noImageData', lang));
        }

        // Update task status with the processed image
        updateTask(taskId, {
          status: TaskStatus.COMPLETED,
          resultImage: processedImage
        });

      } catch (error) {
        console.error('API request error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        updateTask(taskId, {
          status: TaskStatus.FAILED,
          error: error.message || getErrorMessage('processingFailed', lang)
        });
      }
    })();

    return;

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: getErrorMessage('processingFailed', lang) });
  }
});

// 状态检查API端点
router.get('/process-status/:taskId', (req, res) => {
  const lang = req.headers['accept-language'] || 'en';
  try {
    const { taskId } = req.params;
    const task = getTask(taskId);
    res.json(task);
  } catch (error) {
    res.status(404).json({ error: getErrorMessage('taskNotFound', lang) });
  }
});

// 导出路由器，供主入口文件使用
export default router;