import { ClipboardSerializer } from './ClipboardSerializer.js';

export class ClipboardManager {
  /**
   * @param {Object[]} blocks
   */
  async copy(blocks) {
    if (!blocks || blocks.length === 0) {
      throw new Error('No blocks to copy');
    }
    
    const data = ClipboardSerializer.serialize(blocks);
    // Используем простой writeText для надежности
    await navigator.clipboard.writeText(data);
    console.log('ClipboardManager: copied to clipboard:', data.substring(0, 100) + '...');
  }

  /**
   * @returns {Promise<Object[]|null>}
   */
  async paste() {
    try {
      console.log('ClipboardManager: reading clipboard...');
      const text = await navigator.clipboard.readText();
      console.log('ClipboardManager: clipboard text:', text.substring(0, 200) + '...');
      
      const blocks = ClipboardSerializer.deserialize(text);
      if (blocks) {
        console.log('ClipboardManager: deserialized blocks:', blocks.length);
        return blocks;
      }
      
      console.log('ClipboardManager: failed to deserialize clipboard data');
      return null;
    } catch (e) {
      console.error('ClipboardManager: paste error:', e);
      // Возможно, нет разрешения на чтение буфера обмена
      // В этом случае показываем сообщение пользователю
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        console.warn('ClipboardManager: clipboard access denied. User may need to grant permission.');
      }
      return null;
    }
  }
}

