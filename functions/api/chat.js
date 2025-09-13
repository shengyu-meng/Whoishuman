// Cloudflare Pages 安全AI代理函数
// 路径：functions/api/chat.js
// 所有AI调用通过此函数代理，API Key不会暴露给前端

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // 获取请求数据
    const requestData = await request.json();
    
    // 验证请求参数
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return new Response(JSON.stringify({
        error: 'INVALID_REQUEST',
        message: '缺少必要的 messages 参数'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 从环境变量获取API Key
    const apiKey = env.DEEPSEEK_API_KEY || env.API_KEY || env.AI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.error('❌ API Key 未配置');
      return new Response(JSON.stringify({
        error: 'API_KEY_NOT_CONFIGURED',
        message: '服务器配置错误，请联系管理员'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 构建AI API请求
    const aiRequest = {
      model: requestData.model || 'deepseek-chat',
      messages: requestData.messages,
      temperature: requestData.temperature || 0.0,
      max_tokens: requestData.max_tokens || 1000,
      stream: false
    };
    
    // 调用DeepSeek API
    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(aiRequest)
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error('❌ AI API 调用失败:', errorData);
      
      return new Response(JSON.stringify({
        error: 'AI_API_ERROR',
        message: 'AI服务暂时不可用',
        details: errorData.error || 'Unknown error'
      }), {
        status: apiResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const aiData = await apiResponse.json();
    
    // 返回AI响应，但不暴露任何敏感信息
    return new Response(JSON.stringify({
      success: true,
      response: aiData.choices[0]?.message?.content || '',
      usage: aiData.usage,
      model: aiData.model
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('❌ 代理函数错误:', error);
    return new Response(JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 处理 CORS 预检请求
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}