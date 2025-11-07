# Monaco Editor Integration

## Поддержка языка 1С (BSL)

Текущая реализация включает базовую поддержку языка BSL (Business Script Language) с подсветкой синтаксиса и автодополнением.

### Использование готовых расширений

Для расширенной поддержки BSL можно использовать готовые расширения:

#### 1. BSL Language Server

**GitHub**: [1c-syntax/bsl-language-server](https://github.com/1c-syntax/bsl-language-server)

Возможности:
- Полная подсветка синтаксиса
- Автодополнение
- Диагностика ошибок
- Рефакторинг
- Перейти к определению

**Интеграция**:
```javascript
import * as monaco from 'monaco-editor';
import { MonacoServices } from 'monaco-languageclient';

// Настройка Language Server
MonacoServices.install(monaco);
```

#### 2. Monaco BSL Plugin

**GitHub**: [otymko/monaco-bsl](https://github.com/otymko/monaco-bsl)

Легковесное решение с основными возможностями подсветки синтаксиса.

**Интеграция**:
```javascript
import { registerBSL } from 'monaco-bsl';

registerBSL(monaco);
```

### Текущая реализация

Текущая базовая реализация включает:
- ✅ Подсветка ключевых слов (русских и английских)
- ✅ Подсветка строк и чисел
- ✅ Автодополнение встроенных функций
- ✅ Комментарии
- ✅ Поддержка дат
- ✅ Folding для процедур и функций

### Использование

```javascript
import { MonacoCodeEditor } from './MonacoCodeEditor.js';

const editor = new MonacoCodeEditor(container, {
  value: 'Процедура Тест()\n  Сообщить("Hello");\nКонецПроцедуры',
  language: 'bsl', // или '1c'
  theme: 'vs-dark'
});

await editor.initialize();
```

### Поддерживаемые языки

Monaco Editor также поддерживает:
- `bsl` / `1c` - 1С:Предприятие
- `javascript` - JavaScript
- `typescript` - TypeScript  
- `python` - Python
- `sql` - SQL
- `json` - JSON
- `xml` - XML
- `html` - HTML
- `css` - CSS
- И многие другие...

### CDN

По умолчанию Monaco загружается с CDN:
```
https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs
```

Можно изменить URL:
```javascript
monacoLoader.setCdnUrl('https://your-cdn.com/monaco');
```

