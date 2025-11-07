/**
 * PlantUML encoder для генерации URL диаграмм.
 * Использует алгоритм кодирования PlantUML (deflate + base64 с модификациями).
 * 
 * @see https://plantuml.com/text-encoding
 */

let pakoLoaded = false;
let pakoLoadPromise = null;

/**
 * Загружает библиотеку pako для deflate-сжатия
 * @private
 */
async function loadPako() {
  if (pakoLoaded && typeof pako !== 'undefined') {
    return;
  }
  
  if (pakoLoadPromise) {
    return pakoLoadPromise;
  }
  
  pakoLoadPromise = new Promise((resolve, reject) => {
    if (typeof pako !== 'undefined') {
      pakoLoaded = true;
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js';
    script.async = true;
    
    script.onload = () => {
      pakoLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load pako library'));
    };
    
    document.head.appendChild(script);
  });
  
  return pakoLoadPromise;
}

/**
 * Кодирует PlantUML исходник в формат для URL
 * @param {string} source - PlantUML код диаграммы
 * @returns {Promise<string>} - закодированная строка для URL
 */
export async function encodePlantUML(source) {
  await loadPako();
  
  if (typeof pako === 'undefined') {
    throw new Error('Pako library is not available');
  }
  
  const utf8Bytes = new TextEncoder().encode(source);
  const compressed = pako.deflateRaw(utf8Bytes, { level: 9 });
  return encode64(compressed);
}

/**
 * Генерирует URL для рендеринга PlantUML диаграммы
 * @param {string} source - PlantUML код
 * @param {Object} options
 * @param {string} [options.serverUrl='https://www.plantuml.com/plantuml'] - URL сервера
 * @param {string} [options.format='svg'] - формат (svg, png, txt)
 * @returns {Promise<string>} - полный URL для изображения
 */
export async function generatePlantUMLUrl(source, options = {}) {
  const serverUrl = options.serverUrl || 'https://www.plantuml.com/plantuml';
  const format = options.format || 'svg';
  
  if (!source || !source.trim()) {
    return '';
  }
  
  const encoded = await encodePlantUML(source);
  return `${serverUrl}/${format}/${encoded}`;
}

/**
 * PlantUML-специфичное base64 кодирование
 * @private
 */
function encode64(data) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  let r = '';
  
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data[i] & 0xFF;
    const b2 = i + 1 < data.length ? data[i + 1] & 0xFF : 0;
    const b3 = i + 2 < data.length ? data[i + 2] & 0xFF : 0;
    
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3F;
    
    r += alphabet.charAt(c1) + alphabet.charAt(c2) + 
         alphabet.charAt(c3) + alphabet.charAt(c4);
  }
  
  return r;
}

