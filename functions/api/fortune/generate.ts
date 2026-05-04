import { GoogleGenerativeAI } from '@google/generative-ai';
import { Env, getSetting, initDatabase } from '../utils';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  await initDatabase(env.DB);
  
  try {
    const { prompt } = await request.json() as { prompt: string };
    const customKey = await getSetting(env.DB, 'custom_api_key', '');
    let apiKey = customKey || env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "服务器未配置 API Key" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const modelsToTry = ["gemini-3-flash-preview", "gemini-1.5-flash", "gemini-2.0-flash"];
    
    let lastError: any = null;
    let responseText = "";

    async function tryGenerate(targetKey: string) {
      const genAI = new GoogleGenerativeAI(targetKey);
      for (const modelId of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelId });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          if (text) {
            let processedText = text.trim();
            // Clean markdown blocks first
            processedText = processedText
              .replace(/^```json\s*/i, '')
              .replace(/\s*```$/i, '')
              .replace(/^```\s*/, '')
              .replace(/\s*```$/, '')
              .trim();
            
            // If it still doesn't look like JSON, try extracting the first { to the last }
            if (!processedText.startsWith('{')) {
              const match = processedText.match(/\{[\s\S]*\}/);
              if (match) processedText = match[0];
            }
            return processedText;
          }
        } catch (err: any) {
          lastError = err;
          // If it's a model-not-found error or other retryable errors, continue to next model
          if (err.message && (err.message.includes('API key not valid') || err.message.includes('API_KEY_INVALID'))) {
            throw err;
          }
        }
      }
      return null;
    }

    try {
      responseText = await tryGenerate(apiKey) || "";
    } catch (err: any) {
      // If custom key failed AND we have a fallback key, try the fallback
      const isAuthError = err.message?.includes('API key not valid') || err.message?.includes('API_KEY_INVALID');
      const isQuotaError = err.message?.includes('quota') || err.status === 429;
      
      if (customKey && env.GEMINI_API_KEY && (isAuthError || isQuotaError)) {
        console.warn(`Gemini API Error with custom key (${isAuthError ? 'Auth' : 'Quota'}), falling back to system key`);
        responseText = await tryGenerate(env.GEMINI_API_KEY) || "";
      } else {
        throw err;
      }
    }

    if (lastError && !responseText) {
      throw lastError;
    }

    return new Response(JSON.stringify({ result: responseText }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    let errorMessage = err.message || 'AI 生成失败';
    
    if (errorMessage.includes('Rate exceeded') || errorMessage.includes('Unexpected token \'R\'')) {
      errorMessage = '官方 AI 接口请求频率过高，请稍后重试。';
    } else if (errorMessage.includes('API key')) {
      errorMessage = 'AI 接口认证失败，请检查配置。';
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
