/**
 * @module OneCLanguageConfig
 * @description Конфигурация языка 1С для Monaco Editor
 */

/**
 * Конфигурация языка 1С:Предприятие 8.3 (BSL - Business Script Language)
 */
export const oneCLanguageConfig = {
  id: 'bsl',
  aliases: ['1c', 'BSL', '1C'],
  
  /**
   * Расширения файлов
   */
  extensions: ['.bsl', '.os'],

  /**
   * Токенизатор для подсветки синтаксиса
   */
  monarchLanguage: {
    defaultToken: '',
    tokenPostfix: '.bsl',
    ignoreCase: true,

    keywords: [
      // Ключевые слова
      'и', 'или', 'не', 'если', 'тогда', 'иначе', 'иначеесли', 'конецесли',
      'для', 'каждого', 'из', 'по', 'пока', 'цикл', 'конеццикла',
      'процедура', 'конецпроцедуры', 'функция', 'конецфункции',
      'возврат', 'продолжить', 'прервать',
      'попытка', 'исключение', 'конецпопытки', 'вызватьисключение',
      'новый', 'выполнить', 'экспорт', 'перем', 'знач',
      
      // English keywords
      'and', 'or', 'not', 'if', 'then', 'else', 'elseif', 'endif',
      'for', 'each', 'in', 'to', 'while', 'do', 'enddo',
      'procedure', 'endprocedure', 'function', 'endfunction',
      'return', 'continue', 'break',
      'try', 'except', 'endtry', 'raise',
      'new', 'execute', 'export', 'var', 'val'
    ],

    typeKeywords: [
      'булево', 'число', 'строка', 'дата', 'неопределено', 'null',
      'boolean', 'number', 'string', 'date', 'undefined'
    ],

    operators: [
      '=', '>', '<', '<=', '>=', '<>', '+', '-', '*', '/', '%'
    ],

    // Символы
    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    // Escape последовательности
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    tokenizer: {
      root: [
        // Идентификаторы и ключевые слова
        [/[а-яёa-z_][\wа-яё]*/i, {
          cases: {
            '@typeKeywords': 'keyword.type',
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],

        // Whitespace
        { include: '@whitespace' },

        // Числа
        [/\d+\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/\d+/, 'number'],

        // Строки
        [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/"/, 'string', '@string'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
        [/'/, 'string', '@string_single'],

        // Даты
        [/'?\d{8}/, 'number.date'],

        // Разделители
        [/[;,.]/, 'delimiter'],
        [/[()[\]]/, '@brackets'],

        // Операторы
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }]
      ],

      whitespace: [
        [/[ \t\r\n]+/, ''],
        [/\/\/.*$/, 'comment'],
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, 'string', '@pop']
      ],

      string_single: [
        [/[^\\']+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/'/, 'string', '@pop']
      ]
    }
  },

  /**
   * Конфигурация языка
   */
  languageConfiguration: {
    comments: {
      lineComment: '//',
    },
    brackets: [
      ['(', ')'],
      ['[', ']']
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    folding: {
      markers: {
        start: new RegExp('^\\s*(процедура|функция|если|для|пока|попытка)', 'i'),
        end: new RegExp('^\\s*(конецпроцедуры|конецфункции|конецесли|конеццикла|конецпопытки)', 'i')
      }
    }
  },

  /**
   * Автодополнение для встроенных функций 1С
   */
  completionItems: [
    // Общие функции
    { label: 'Сообщить', kind: 'Function', insertText: 'Сообщить(${1:Текст});', documentation: 'Вывод сообщения пользователю' },
    { label: 'Предупреждение', kind: 'Function', insertText: 'Предупреждение(${1:Текст});', documentation: 'Вывод предупреждения' },
    { label: 'ВопросДаНет', kind: 'Function', insertText: 'ВопросДаНет(${1:Текст})', documentation: 'Диалог с вопросом Да/Нет' },
    
    // Работа со строками
    { label: 'СтрДлина', kind: 'Function', insertText: 'СтрДлина(${1:Строка})', documentation: 'Длина строки' },
    { label: 'СтрНайти', kind: 'Function', insertText: 'СтрНайти(${1:Строка}, ${2:ПодстрокаПоиска})', documentation: 'Поиск подстроки' },
    { label: 'СтрЗаменить', kind: 'Function', insertText: 'СтрЗаменить(${1:Строка}, ${2:ПодстрокаПоиска}, ${3:ПодстрокаЗамены})', documentation: 'Замена подстроки' },
    { label: 'ВРег', kind: 'Function', insertText: 'ВРег(${1:Строка})', documentation: 'Перевод в верхний регистр' },
    { label: 'НРег', kind: 'Function', insertText: 'НРег(${1:Строка})', documentation: 'Перевод в нижний регистр' },
    { label: 'СокрЛП', kind: 'Function', insertText: 'СокрЛП(${1:Строка})', documentation: 'Удаление пробелов слева и справа' },
    
    // Работа с датами
    { label: 'ТекущаяДата', kind: 'Function', insertText: 'ТекущаяДата()', documentation: 'Текущая дата и время' },
    { label: 'Год', kind: 'Function', insertText: 'Год(${1:Дата})', documentation: 'Год из даты' },
    { label: 'Месяц', kind: 'Function', insertText: 'Месяц(${1:Дата})', documentation: 'Месяц из даты' },
    { label: 'День', kind: 'Function', insertText: 'День(${1:Дата})', documentation: 'День из даты' },
    { label: 'НачалоГода', kind: 'Function', insertText: 'НачалоГода(${1:Дата})', documentation: 'Начало года' },
    { label: 'КонецГода', kind: 'Function', insertText: 'КонецГода(${1:Дата})', documentation: 'Конец года' },
    
    // Работа с типами
    { label: 'ТипЗнч', kind: 'Function', insertText: 'ТипЗнч(${1:Значение})', documentation: 'Получить тип значения' },
    { label: 'Число', kind: 'Function', insertText: 'Число(${1:Значение})', documentation: 'Преобразование в число' },
    { label: 'Строка', kind: 'Function', insertText: 'Строка(${1:Значение})', documentation: 'Преобразование в строку' },
    { label: 'ЗначениеЗаполнено', kind: 'Function', insertText: 'ЗначениеЗаполнено(${1:Значение})', documentation: 'Проверка заполненности значения' },
    
    // Запросы
    { label: 'Запрос.Текст', kind: 'Snippet', insertText: 'Запрос = Новый Запрос;\nЗапрос.Текст =\n"${1:ВЫБРАТЬ}";\n', documentation: 'Создание запроса' },
  ]
};

/**
 * Регистрирует язык 1С (BSL) в Monaco Editor
 * @param {any} monaco - Monaco API
 */
export function register1CLanguage(monaco) {
  // Регистрация языка с алиасами
  monaco.languages.register({ 
    id: oneCLanguageConfig.id,
    aliases: oneCLanguageConfig.aliases,
    extensions: oneCLanguageConfig.extensions
  });

  // Установка токенизатора (подсветка синтаксиса)
  monaco.languages.setMonarchTokensProvider(
    oneCLanguageConfig.id,
    oneCLanguageConfig.monarchLanguage
  );

  // Установка конфигурации языка
  monaco.languages.setLanguageConfiguration(
    oneCLanguageConfig.id,
    oneCLanguageConfig.languageConfiguration
  );

  // Регистрация автодополнения
  monaco.languages.registerCompletionItemProvider(oneCLanguageConfig.id, {
    provideCompletionItems: (model, position) => {
      const suggestions = oneCLanguageConfig.completionItems.map(item => ({
        label: item.label,
        kind: monaco.languages.CompletionItemKind[item.kind],
        insertText: item.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: item.documentation
      }));

      return { suggestions };
    }
  });
}

