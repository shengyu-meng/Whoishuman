// Cloudflare Pages 函数，用于安全地提供环境变量
// 路径：functions/api/config.js

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // 检查是否有必要的环境变量
    const apiKey = env.DEEPSEEK_API_KEY || env.API_KEY || env.AI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return new Response(JSON.stringify({
        error: 'API_KEY_NOT_CONFIGURED',
        message: '环境变量未配置，请在 Cloudflare Pages 设置中添加 DEEPSEEK_API_KEY'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // 返回配置信息（Cloudflare环境下不返回任何API Key信息）
    const config = {
      hasApiKey: true,
      environment: 'cloudflare-pages',
      useProxy: true, // 标识使用代理模式
      proxyEndpoint: '/api/chat',
      model: 'deepseek-chat',
      requestConfig: {
        temperature: 0.0,
        maxTokens: 1000,
        timeout: 30000
      }
    };
    
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理 CORS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}