// Cloudflare Pages 调试配置函数
// 路径：functions/api/debug.js
// 专门用于获取调试模式配置

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // 获取调试模式环境变量
    const debugEnabled = env.DEBUG === 'true' || 
                        env.DEBUG_MODE === 'true' || 
                        env.ENABLE_DEBUG === 'true';
    
    // 获取调试功能配置
    const showSkipButton = env.DEBUG_SHOW_SKIP === 'true' || debugEnabled;
    const showEndGameButton = env.DEBUG_SHOW_END === 'true' || debugEnabled;
    const showConsoleLogs = env.DEBUG_CONSOLE === 'true' || debugEnabled;
    const autoSaveLogs = env.DEBUG_AUTO_SAVE === 'true' || debugEnabled;
    
    const debugConfig = {
      enabled: debugEnabled,
      source: 'environment',
      features: {
        showSkipButton,
        showEndGameButton,
        showConsoleLogs,
        autoSaveLogs
      },
      // 调试信息（仅在调试模式下返回）
      ...(debugEnabled && {
        environmentVariables: {
          DEBUG: env.DEBUG,
          DEBUG_MODE: env.DEBUG_MODE,
          ENABLE_DEBUG: env.ENABLE_DEBUG,
          DEBUG_SHOW_SKIP: env.DEBUG_SHOW_SKIP,
          DEBUG_SHOW_END: env.DEBUG_SHOW_END,
          DEBUG_CONSOLE: env.DEBUG_CONSOLE,
          DEBUG_AUTO_SAVE: env.DEBUG_AUTO_SAVE
        }
      })
    };
    
    return new Response(JSON.stringify(debugConfig), {
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
      message: error.message,
      debugConfig: {
        enabled: false,
        source: 'error'
      }
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