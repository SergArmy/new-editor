/**
 * @module PlantUMLLanguageConfig
 * @description Конфигурация языка PlantUML для Monaco Editor
 */

/**
 * Базовая конфигурация для подсветки PlantUML.
 * Использует Monarch tokenizer с типовыми ключевыми словами.
 */
export const plantUmlLanguageConfig = {
  id: 'plantuml',
  aliases: ['puml', 'plant-uml'],
  extensions: ['.puml', '.plantuml', '.iuml'],
  mimetypes: ['text/x-plantuml'],
  monarchLanguage: {
    defaultToken: '',
    ignoreCase: true,
    tokenPostfix: '.puml',
    keywords: [
      '@startuml', '@enduml', '@startmindmap', '@endmindmap',
      '@startgantt', '@endgantt', '@startdfd', '@enddfd',
      'actor', 'participant', 'boundary', 'control', 'entity', 'database',
      'collections', 'queue', 'cloud', 'rectangle', 'node', 'folder', 'frame',
      'package', 'component', 'interface', 'enum', 'abstract', 'class',
      'object', 'state', 'usecase', 'artifact'
    ],
    directives: [
      '!include', '!includeurl', '!define', '!undef', '!if', '!ifdef', '!ifndef',
      '!else', '!endif', '!while', '!endwhile', '!for', '!endfor',
      '!set', '!unset', '!import', '!theme'
    ],
    colors: [
      'Aqua', 'Black', 'Blue', 'Fuchsia', 'Gray', 'Green', 'Lime',
      'Maroon', 'Navy', 'Olive', 'Purple', 'Red', 'Silver', 'Teal', 'White', 'Yellow'
    ],
    operators: [
      '<|--', '<|..', '<|==', '<|..', '-->', '..>', '==>', '--', '..', '==',
      '<--', '<..', '<==', '::', '->', '=>', ':', '..|>', '..>', '-[#'
    ],
    symbols: /[:=><!~?&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        // Directives
        [/![_a-zA-Z][\w-]*/, { cases: { '@directives': 'keyword.directive', '@default': 'keyword' } }],
        // Keywords (start/end markers, actors, etc.)
        [/@?[a-zA-Z][\w-]*/, {
          cases: {
            '@keywords': 'keyword',
            '@colors': 'constant.predefined',
            '@default': 'identifier'
          }
        }],
        // Arrow operators and connectors
        [/(<-|->|--|\.\.|==|::|\\|\/|\*\*|\|\|)+/, 'operator'],
        // Strings single/double quoted
        { include: '@strings' },
        // Numbers
        [/\d*\.\d+/, 'number.float'],
        [/\d+/, 'number'],
        // Comments
        { include: '@comments' },
        // Brackets
        [/[{}()\[\]]/, '@brackets'],
        // Separators
        [/,/, 'delimiter'],
        // Anything else
        [/@symbols/, 'operator']
      ],
      comments: [
        [/'.*$/, 'comment'],
        [/\/'$/, 'comment', '@commentBlock'],
        [/\/'/, 'comment', '@commentBlock'],
        [/\/\/.*$/, 'comment']
      ],
      commentBlock: [
        [/[^']+/, 'comment'],
        [/''/, 'comment'],
        [/'\//, 'comment', '@pop'],
        [/'/, 'comment']
      ],
      strings: [
        [/"/, 'string', '@doubleQuotedString'],
        [/'/, 'string', '@singleQuotedString']
      ],
      doubleQuotedString: [
        [/[^"\\]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, 'string', '@pop']
      ],
      singleQuotedString: [
        [/[^'\\]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/'/, 'string', '@pop']
      ]
    }
  },
  languageConfiguration: {
    comments: {
      lineComment: "'",
      blockComment: ["/'", "'/"]
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  }
};

/**
 * Регистрирует язык PlantUML в Monaco Editor
 * @param {any} monaco
 */
export function registerPlantUmlLanguage(monaco) {
  monaco.languages.register({
    id: plantUmlLanguageConfig.id,
    aliases: plantUmlLanguageConfig.aliases,
    extensions: plantUmlLanguageConfig.extensions,
    mimetypes: plantUmlLanguageConfig.mimetypes
  });

  monaco.languages.setMonarchTokensProvider(
    plantUmlLanguageConfig.id,
    plantUmlLanguageConfig.monarchLanguage
  );

  monaco.languages.setLanguageConfiguration(
    plantUmlLanguageConfig.id,
    plantUmlLanguageConfig.languageConfiguration
  );
}


