import { InlineFormatManager } from '../../formatting/InlineFormatManager.js';
import { LinkDialog } from '../../formatting/LinkDialog.js';
import { LinkManager } from '../../formatting/LinkManager.js';
import { ContextMenu } from '../../ui/components/ContextMenu.js';

/**
 * TextBlockInputHandler - обрабатывает ввод в текстовых блоках
 * Поддерживает SlashCommands, MarkdownShortcuts и Inline форматирование
 */
export class TextBlockInputHandler {
    /**
     * @param {Object} options
     * @param {Object} options.slashCommands - экземпляр SlashCommands
     * @param {Object} options.markdownShortcuts - экземпляр MarkdownShortcuts
     * @param {Function} options.onCommand - callback для выполнения команд
     * @param {Function} options.onMarkdown - callback для обработки markdown
     */
    constructor(options) {
        this.slashCommands = options.slashCommands;
        this.markdownShortcuts = options.markdownShortcuts;
        this.onCommand = options.onCommand;
        this.onMarkdown = options.onMarkdown;
        this.slashMenuVisible = false;
        this.currentSlashQuery = '';
        this.slashMenuElement = null;
        this.markdownProcessed = false;
        this.autoLinkEnabled = true; // Автоматическое создание ссылок из URL
        this.linkDialog = null;
        this.singleClickTimeout = null;
        this.contextMenu = null;
    }

    /**
     * Устанавливает обработчики для элемента
     * @param {HTMLElement} element - редактируемый элемент
     * @param {string} blockId - ID блока
     */
    attach(element, blockId) {
        this.element = element;
        this.blockId = blockId;

        element.addEventListener('input', (e) => this.handleInput(e));
        element.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Обработка кликов по ссылкам
        element.addEventListener('click', (e) => {
            // Не обрабатываем клики, если открыт диалог
            if (this.linkDialog && this.linkDialog.overlay) {
                return;
            }

            const linkElement = e.target.closest('a');
            if (!linkElement) return;
            
            // Ctrl+Click или Cmd+Click для редактирования ссылки
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                this.openLinkDialog(element, linkElement);
                return;
            }
            
            // Одинарный клик - переход по ссылке (если не двойной клик)
            if (e.detail === 1) {
                // Используем setTimeout, чтобы проверить, не будет ли двойного клика
                clearTimeout(this.singleClickTimeout);
                this.singleClickTimeout = setTimeout(() => {
                    // Проверяем, что диалог все еще не открыт
                    if (this.linkDialog && this.linkDialog.overlay) {
                        return;
                    }
                    const href = linkElement.getAttribute('href');
                    if (href) {
                        // Для внешних ссылок открываем в новой вкладке
                        if (href.startsWith('http://') || href.startsWith('https://')) {
                            window.open(href, '_blank', 'noopener,noreferrer');
                        } else if (href.startsWith('#')) {
                            // Для якорей прокручиваем к элементу
                            const target = document.querySelector(href);
                            if (target) {
                                target.scrollIntoView({ behavior: 'smooth' });
                            }
                        } else {
                            // Для внутренних ссылок и метаданных - просто переходим
                            window.location.href = href;
                        }
                    }
                }, 300); // Задержка для проверки двойного клика
            }
        });
        
        // Двойной клик по ссылке - редактирование
        element.addEventListener('dblclick', (e) => {
            // Не обрабатываем, если открыт диалог
            if (this.linkDialog && this.linkDialog.overlay) {
                return;
            }

            const linkElement = e.target.closest('a');
            if (linkElement) {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(this.singleClickTimeout); // Отменяем одинарный клик
                this.openLinkDialog(element, linkElement);
            }
        });
        
        // Правый клик по ссылке - контекстное меню
        element.addEventListener('contextmenu', (e) => {
            // Не обрабатываем, если открыт диалог
            if (this.linkDialog && this.linkDialog.overlay) {
                return;
            }

            const linkElement = e.target.closest('a');
            if (linkElement) {
                e.preventDefault();
                e.stopPropagation();
                this.showLinkContextMenu(e, element, linkElement);
            }
        });

        // Обработка blur - закрываем меню только если клик не был по меню или диалогу
        this.blurTimeout = null;
        element.addEventListener('blur', (e) => {
            // Не закрываем меню, если фокус перешел на диалог
            const relatedTarget = e.relatedTarget;
            if (relatedTarget && this.linkDialog && this.linkDialog.overlay) {
                if (this.linkDialog.overlay.contains(relatedTarget)) {
                    return; // Фокус перешел на диалог, не закрываем меню
                }
            }

            // Отложенное закрытие, чтобы клик по меню успел сработать
            this.blurTimeout = setTimeout(() => {
                if (this.slashMenuVisible && this.slashMenuElement) {
                    // Проверяем, не кликнули ли по меню
                    const activeElement = document.activeElement;
                    const clickedOnMenu = this.slashMenuElement.contains(activeElement) ||
                        (activeElement && this.slashMenuElement === activeElement);

                    if (!clickedOnMenu) {
                        this.hideSlashMenu();
                    }
                }
            }, 150);
        });

        // Обработка клика вне меню
        this.documentClickHandler = (e) => {
            if (this.slashMenuVisible && this.slashMenuElement) {
                if (!this.element.contains(e.target) && !this.slashMenuElement.contains(e.target)) {
                    this.hideSlashMenu();
                }
            }
        };
        document.addEventListener('mousedown', this.documentClickHandler);
    }

    /**
     * Обрабатывает ввод текста
     * @param {InputEvent} e
     */
    handleInput(e) {
        const text = e.target.textContent || '';
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        if (!range) return;

        // Вычисляем позицию курсора относительно всего текста элемента
        const rangeToCursor = document.createRange();
        rangeToCursor.setStart(e.target, 0);
        rangeToCursor.setEnd(range.startContainer, range.startOffset);
        const cursorPosition = rangeToCursor.toString().length;

        // Проверяем SlashCommands
        this.checkSlashCommand(text, cursorPosition);

        // НЕ проверяем MarkdownShortcuts при event input, только при Space/Enter
        // Это предотвращает некорректные срабатывания при вставке и вводе
        // this.checkMarkdownShortcut(text, cursorPosition, 'Input');

        // Автоматическое создание ссылок из URL (с задержкой, чтобы не мешать вводу)
        if (this.autoLinkEnabled) {
            clearTimeout(this.autoLinkTimeout);
            this.autoLinkTimeout = setTimeout(() => {
                InlineFormatManager.autoLinkUrls(e.target);
            }, 500); // Задержка 500мс после последнего ввода
        }
    }

    /**
     * Обрабатывает нажатия клавиш
     * @param {KeyboardEvent} e
     */
    handleKeydown(e) {
        // Проверяем, что событие происходит в нашем элементе
        if (!this.element || !this.element.contains(e.target)) {
            return;
        }

        const text = e.target.textContent || '';
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        if (!range) return;

        const cursorPosition = range.startOffset;

        // Обработка клавиатурных сочетаний для форматирования
        if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            // Ctrl+B/I/U (без Shift)
            if (!e.shiftKey) {
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    InlineFormatManager.toggleFormat(e.target, 'bold');
                    return;
                }
                if (e.key === 'i' || e.key === 'I') {
                    e.preventDefault();
                    InlineFormatManager.toggleFormat(e.target, 'italic');
                    return;
                }
                if (e.key === 'u' || e.key === 'U') {
                    e.preventDefault();
                    InlineFormatManager.toggleFormat(e.target, 'underline');
                    return;
                }
                // Ctrl+Q для вставки/редактирования ссылки (используем code для физической клавиши)
                if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
                    e.preventDefault();
                    // Убеждаемся, что элемент имеет фокус
                    if (document.activeElement !== e.target) {
                        e.target.focus();
                    }
                    this.openLinkDialog(e.target);
                    return;
                }
            }
            // Ctrl+Shift+S для Strike
            if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                InlineFormatManager.toggleFormat(e.target, 'strikethrough');
                return;
            }
            // Ctrl+Shift+K для Code
            if (e.shiftKey && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                InlineFormatManager.toggleFormat(e.target, 'code');
                return;
            }
        }

        // Если открыто меню команд
        if (this.slashMenuVisible) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateMenu(1);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateMenu(-1);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                this.executeSlashCommand();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.hideSlashMenu();
                return;
            }
        }

        // Проверяем MarkdownShortcuts при нажатии Space или Enter
        if (e.key === ' ' || e.key === 'Space') {
            // Если меню открыто, закрываем его при нажатии пробела
            if (this.slashMenuVisible) {
                e.preventDefault();
                this.hideSlashMenu();
                return;
            }

            // Проверяем markdown перед вставкой пробела
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const currentText = e.target.textContent || '';

                // Вычисляем позицию курсора относительно всего текста элемента
                const rangeToCursor = document.createRange();
                rangeToCursor.setStart(e.target, 0);
                rangeToCursor.setEnd(range.startContainer, range.startOffset);
                const cursorPos = rangeToCursor.toString().length;

                // Проверяем markdown ДО вставки пробела
                this.checkMarkdownShortcut(currentText, cursorPos, 'Space');

                // Если markdown сработал, предотвращаем вставку пробела
                if (this.markdownProcessed) {
                    e.preventDefault();
                }
            }
        }
        if (e.key === 'Enter' && !this.slashMenuVisible) {
            // Проверяем markdown перед вставкой новой строки
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const currentText = e.target.textContent || '';

                // Вычисляем позицию курсора относительно всего текста элемента
                const rangeToCursor = document.createRange();
                rangeToCursor.setStart(e.target, 0);
                rangeToCursor.setEnd(range.startContainer, range.startOffset);
                const cursorPos = rangeToCursor.toString().length;

                // Проверяем markdown ДО вставки Enter
                this.checkMarkdownShortcut(currentText, cursorPos, 'Enter');

                // Если markdown сработал, предотвращаем вставку Enter
                if (this.markdownProcessed) {
                    e.preventDefault();
                }
            }
        }
    }

    /**
     * Проверяет наличие slash-команды
     * @param {string} text
     * @param {number} cursorPosition
     */
    checkSlashCommand(text, cursorPosition) {
        const beforeCursor = text.substring(0, cursorPosition);

        // Проверяем, начинается ли текст с "/" в начале строки или после пробела
        // Важно: проверяем только прямой слеш "/", игнорируем обратный слеш "\"
        // Игнорируем случаи, когда перед "/" идет обратный слеш (это экранирование)
        // Используем более простую логику: ищем "/" и проверяем, что перед ним не стоит "\"
        const lastSlashIndex = beforeCursor.lastIndexOf('/');

        if (lastSlashIndex === -1) {
            // Нет слеша вообще
            this.hideSlashMenu();
            return;
        }

        // Проверяем, что перед "/" не стоит "\" (не экранирован)
        // Важно: проверяем количество обратных слешей перед "/"
        // Если их четное количество (или 0), то "/" не экранирован
        // Если нечетное - экранирован
        let escapeCount = 0;
        for (let i = lastSlashIndex - 1; i >= 0 && beforeCursor[i] === '\\'; i--) {
            escapeCount++;
        }
        const isEscaped = escapeCount % 2 === 1;

        // Проверяем, что "/" находится в начале строки или после пробела/новой строки
        // Если перед слешем обратный слеш, проверяем, экранирован ли он
        const charBeforeSlash = lastSlashIndex > 0 ? beforeCursor[lastSlashIndex - 1] : null;
        const isAtStart = lastSlashIndex === 0;
        const isAfterSpace = charBeforeSlash === ' ' || charBeforeSlash === '\n' || charBeforeSlash === '\t';

        // Если перед слешем обратный слеш, нужно проверить, что он экранирован (четное количество обратных слешей перед ним)
        // и что перед обратным слешем есть пробел/начало строки
        let isValidPosition = false;
        if (isAtStart) {
            isValidPosition = true;
        } else if (isAfterSpace) {
            isValidPosition = true;
        } else if (charBeforeSlash === '\\') {
            // Если перед слешем обратный слеш, проверяем количество обратных слешей
            // Если четное количество (>= 2), то последний обратный слеш экранирован предыдущим
            // и нужно проверить, что перед первым обратным слешем есть пробел/начало строки
            if (escapeCount >= 2 && escapeCount % 2 === 0) {
                // Четное количество обратных слешей, проверяем что перед первым есть пробел
                const firstBackslashIndex = lastSlashIndex - escapeCount;
                const charBeforeFirstBackslash = firstBackslashIndex > 0 ? beforeCursor[firstBackslashIndex - 1] : null;
                const isFirstBackslashAfterSpace = firstBackslashIndex === 0 ||
                    charBeforeFirstBackslash === ' ' ||
                    charBeforeFirstBackslash === '\n' ||
                    charBeforeFirstBackslash === '\t';
                isValidPosition = isFirstBackslashAfterSpace;
            }
        } else {
            // Если перед "/" не пробел и не обратный слеш, проверяем в DOM
            // Может быть, курсор находится внутри элемента форматирования
            // В этом случае нужно проверить, что перед "/" в DOM есть пробел или начало текста
            try {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const containerNode = range.startContainer;

                    // Если курсор в текстовом узле, проверяем символ перед курсором
                    if (containerNode.nodeType === Node.TEXT_NODE) {
                        const offset = range.startOffset;
                        const nodeText = containerNode.textContent;

                        if (offset > 0) {
                            const charBefore = nodeText[offset - 1];
                            if (charBefore === ' ' || charBefore === '\n' || charBefore === '\t') {
                                isValidPosition = true;
                            } else if (charBefore === '/') {
                                // Если перед курсором "/", значит курсор находится после "/"
                                // Проверяем, что "/" находится в начале текстового узла
                                // и перед этим узлом есть пробел или элемент форматирования
                                if (offset === 1 && nodeText[0] === '/') {
                                    // Курсор сразу после "/" в начале текстового узла
                                    const prevNode = containerNode.previousSibling;
                                    if (!prevNode) {
                                        // Нет предыдущего узла - начало элемента
                                        isValidPosition = true;
                                    } else if (prevNode.nodeType === Node.TEXT_NODE) {
                                        const prevText = prevNode.textContent;
                                        if (prevText.length > 0) {
                                            const lastChar = prevText[prevText.length - 1];
                                            if (lastChar === ' ' || lastChar === '\n' || lastChar === '\t') {
                                                isValidPosition = true;
                                            }
                                        }
                                    } else {
                                        // Предыдущий узел - элемент (например, <strong>)
                                        // Проверяем, что перед этим элементом есть пробел или начало текста
                                        isValidPosition = this._isValidPositionAfterFormattingElement(prevNode);
                                    }
                                }
                            }
                        } else {
                            // Курсор в начале текстового узла, проверяем предыдущий узел
                            const prevNode = containerNode.previousSibling;
                            if (!prevNode) {
                                // Нет предыдущего узла - начало элемента
                                isValidPosition = true;
                            } else if (prevNode.nodeType === Node.TEXT_NODE) {
                                const prevText = prevNode.textContent;
                                if (prevText.length > 0) {
                                    const lastChar = prevText[prevText.length - 1];
                                    if (lastChar === ' ' || lastChar === '\n' || lastChar === '\t') {
                                        isValidPosition = true;
                                    }
                                }
                            } else {
                                // Предыдущий узел - элемент (например, <strong>)
                                // Проверяем, что перед этим элементом есть пробел или начало текста
                                isValidPosition = this._isValidPositionAfterFormattingElement(prevNode);
                            }
                        }
                    } else {
                        // Курсор в элементе (например, внутри <strong>)
                        // Если это элемент форматирования (strong, em, u, s, code), 
                        // нужно проверить, что перед элементом есть пробел или начало текста
                        const tagName = containerNode.tagName ? containerNode.tagName.toLowerCase() : '';
                        const isFormattingElement = ['strong', 'em', 'u', 's', 'code', 'b', 'i'].includes(tagName);

                        if (isFormattingElement) {
                            // Проверяем, что перед элементом форматирования есть пробел или начало текста
                            isValidPosition = this._isValidPositionAfterFormattingElement(containerNode);

                            // Если позиция валидна, но курсор внутри элемента, 
                            // перемещаем курсор после элемента
                            if (isValidPosition && range.startOffset > 0) {
                                try {
                                    // Находим текстовый узел после элемента или создаем его
                                    let nextTextNode = containerNode.nextSibling;
                                    if (!nextTextNode || nextTextNode.nodeType !== Node.TEXT_NODE) {
                                        // Создаем текстовый узел после элемента
                                        nextTextNode = document.createTextNode('');
                                        containerNode.parentNode.insertBefore(nextTextNode, containerNode.nextSibling);
                                    }

                                    // Устанавливаем курсор после элемента
                                    const newRange = document.createRange();
                                    newRange.setStart(nextTextNode, 0);
                                    newRange.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(newRange);
                                } catch (e) {
                                    console.warn('Failed to move cursor outside formatting element:', e);
                                }
                            }
                        } else {
                            // Не элемент форматирования, проверяем начало элемента
                            if (range.startOffset === 0) {
                                isValidPosition = true;
                            }
                        }
                    }
                }
            } catch (e) {
                // Если не удалось проверить в DOM, используем текстовую проверку
                console.warn('Failed to check slash position in DOM:', e);
            }
        }

        if (!isEscaped && isValidPosition) {
            // Извлекаем запрос после "/"
            const afterSlash = beforeCursor.substring(lastSlashIndex + 1);
            // Берем только текст до первого пробела или обратного слеша (это запрос команды)
            // Обратный слеш останавливает запрос, но не закрывает меню
            const queryMatch = afterSlash.match(/^([^\s\\]*)/);
            const query = queryMatch ? queryMatch[1] : '';
            this.currentSlashQuery = query;
            this.showSlashMenu(query);
        } else {
            // Закрываем меню только если это действительно не slash команда
            this.hideSlashMenu();
        }
    }

    /**
     * Проверяет, что позиция после элемента форматирования валидна для slash команды
     * (т.е. перед элементом есть пробел или начало текста)
     * @param {Node} formattingElement
     * @returns {boolean}
     */
    _isValidPositionAfterFormattingElement(formattingElement) {
        // Проверяем, что перед элементом форматирования есть пробел или начало текста
        const prevNode = formattingElement.previousSibling;
        if (!prevNode) {
            // Нет предыдущего узла - начало элемента
            return true;
        }

        if (prevNode.nodeType === Node.TEXT_NODE) {
            const prevText = prevNode.textContent;
            if (prevText.length > 0) {
                const lastChar = prevText[prevText.length - 1];
                if (lastChar === ' ' || lastChar === '\n' || lastChar === '\t') {
                    return true;
                }
            }
        } else {
            // Предыдущий узел - тоже элемент, рекурсивно проверяем
            return this._isValidPositionAfterFormattingElement(prevNode);
        }

        return false;
    }

    /**
     * Получает следующий текстовый узел после указанного узла
     * @param {Node} node
     * @returns {Node|null}
     */
    _getNextTextNode(node) {
        let current = node;
        while (current) {
            if (current.nextSibling) {
                if (current.nextSibling.nodeType === Node.TEXT_NODE) {
                    return current.nextSibling;
                }
                // Ищем текстовый узел внутри следующего элемента
                const walker = document.createTreeWalker(
                    current.nextSibling,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                const textNode = walker.nextNode();
                if (textNode) return textNode;
            }
            current = current.parentNode;
            if (current === this.element) break;
        }
        return null;
    }

    /**
     * Получает текст после указанного узла
     * @param {Node} node
     * @returns {string}
     */
    _getTextAfterNode(node) {
        const nextTextNode = this._getNextTextNode(node);
        if (nextTextNode) {
            return nextTextNode.textContent;
        }
        return '';
    }

    /**
     * Находит паттерн в DOM, идя назад от курсора
     * @param {Node} cursorNode
     * @param {number} cursorOffset
     * @param {string} searchPattern
     * @returns {Object|null}
     */
    _findPatternInDOMBackwards(cursorNode, cursorOffset, searchPattern) {
        // Собираем текст, идя назад от курсора, ограничиваясь разумным количеством
        const maxSearchLength = searchPattern.length * 20;
        let collectedText = '';
        let currentNode = cursorNode;
        let currentOffset = cursorOffset;
        const textNodes = [];

        // Собираем текст от курсора назад
        while (currentNode && currentNode !== this.element.parentNode && collectedText.length < maxSearchLength) {
            if (currentNode.nodeType === Node.TEXT_NODE) {
                const text = currentNode.textContent;
                const startOffset = Math.max(0, currentOffset - (maxSearchLength - collectedText.length));
                const textBefore = text.substring(startOffset, currentOffset);
                collectedText = textBefore + collectedText;
                textNodes.unshift({ node: currentNode, offset: startOffset });
                currentOffset = startOffset;
            }

            // Переходим к предыдущему текстовому узлу
            if (currentOffset === 0) {
                const prevTextNode = this._getPreviousTextNode(currentNode);
                if (prevTextNode) {
                    currentNode = prevTextNode;
                    currentOffset = prevTextNode.textContent.length;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        // Ищем паттерн в собранном тексте (последнее вхождение)
        const patternIndex = collectedText.lastIndexOf(searchPattern);
        if (patternIndex === -1) {
            return null;
        }

        // Находим позицию паттерна в DOM
        // patternIndex - это позиция в собранном тексте от начала
        // Нужно найти, какой текстовый узел и смещение соответствуют этой позиции
        let textPos = 0;
        for (let i = 0; i < textNodes.length; i++) {
            const { node, offset } = textNodes[i];
            const nodeText = node.textContent;
            const nodeStart = offset;
            const nodeLength = nodeText.length - offset;

            if (textPos + nodeLength > patternIndex) {
                // Паттерн начинается в этом узле
                const startOffset = nodeStart + (patternIndex - textPos);
                const endOffset = startOffset + searchPattern.length;

                // Проверяем, не выходит ли за границы узла
                if (endOffset <= nodeStart + nodeText.length) {
                    // Паттерн полностью в одном узле
                    return {
                        startNode: node,
                        startOffset: startOffset,
                        endNode: node,
                        endOffset: endOffset
                    };
                } else {
                    // Паттерн пересекает границы узлов
                    // Находим конечный узел
                    let remaining = searchPattern.length - (nodeText.length - startOffset);
                    let endNode = node;
                    let endNodeOffset = nodeText.length;

                    for (let j = i + 1; j < textNodes.length; j++) {
                        const nextNode = textNodes[j].node;
                        const nextText = nextNode.textContent;
                        if (remaining <= nextText.length) {
                            endNode = nextNode;
                            endNodeOffset = remaining;
                            break;
                        }
                        remaining -= nextText.length;
                    }

                    return {
                        startNode: node,
                        startOffset: startOffset,
                        endNode: endNode,
                        endOffset: endNodeOffset
                    };
                }
            }

            textPos += nodeLength;
        }

        return null;
    }

    /**
     * Получает предыдущий текстовый узел
     * @param {Node} node
     * @returns {Node|null}
     */
    _getPreviousTextNode(node) {
        let current = node;
        while (current) {
            if (current.previousSibling) {
                if (current.previousSibling.nodeType === Node.TEXT_NODE) {
                    return current.previousSibling;
                }
                // Ищем текстовый узел внутри предыдущего элемента
                const walker = document.createTreeWalker(
                    current.previousSibling,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                let lastTextNode = null;
                while (walker.nextNode()) {
                    lastTextNode = walker.currentNode;
                }
                if (lastTextNode) return lastTextNode;
            }
            current = current.parentNode;
            if (current === this.element) break;
        }
        return null;
    }

    /**
     * Получает последний текстовый узел внутри элемента
     * @param {Node} node
     * @returns {Node|null}
     */
    _getLastTextNode(node) {
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        let lastTextNode = null;
        while (walker.nextNode()) {
            lastTextNode = walker.currentNode;
        }
        return lastTextNode;
    }

    /**
     * Получает позицию текста перед курсором
     * @param {Node} cursorNode
     * @param {number} cursorOffset
     * @returns {number}
     */
    _getTextPositionBeforeCursor(cursorNode, cursorOffset) {
        const range = document.createRange();
        range.setStart(this.element, 0);
        range.setEnd(cursorNode, cursorOffset);
        return range.toString().length;
    }

    /**
     * Находит паттерн в DOM по позициям в тексте
     * @param {number} textStart
     * @param {number} textEnd
     * @returns {Object|null}
     */
    _findPatternInDOMByTextPosition(textStart, textEnd) {
        const walker = document.createTreeWalker(
            this.element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentPos = 0;
        let startNode = null;
        let startOffset = 0;
        let endNode = null;
        let endOffset = 0;

        let node;
        while (node = walker.nextNode()) {
            const nodeLength = node.textContent.length;
            const nodeEnd = currentPos + nodeLength;

            // Находим начальный узел и смещение
            if (!startNode && nodeEnd > textStart) {
                startNode = node;
                startOffset = textStart - currentPos;
            }

            // Находим конечный узел и смещение
            if (!endNode && nodeEnd >= textEnd) {
                endNode = node;
                endOffset = textEnd - currentPos;
                break;
            }

            currentPos += nodeLength;
        }

        if (startNode && endNode) {
            return { startNode, startOffset, endNode, endOffset };
        }

        return null;
    }

    /**
     * Применяет форматирование к диапазону в DOM
     * @param {Node} startNode
     * @param {number} startOffset
     * @param {Node} endNode
     * @param {number} endOffset
     * @param {string} textToFormat
     * @param {string} formatTag
     */
    _applyFormatToRange(startNode, startOffset, endNode, endOffset, textToFormat, formatTag) {
        const selection = window.getSelection();
        const range = document.createRange();

        // Выделяем паттерн с текстом: **текст**
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        // Удаляем выделенное содержимое
        range.deleteContents();

        // Создаем элемент форматирования с текстом
        const formatElement = document.createElement(formatTag);
        formatElement.textContent = textToFormat;

        // Вставляем элемент
        range.insertNode(formatElement);

        // Создаем пробел после элемента
        const spaceNode = document.createTextNode(' ');
        formatElement.parentNode.insertBefore(spaceNode, formatElement.nextSibling);

        // Устанавливаем курсор после пробела
        range.setStart(spaceNode, 1);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        // Блокируем вставку пробела браузером
        // markdownProcessed остается true
    }

    /**
     * Показывает меню slash-команд
     * @param {string} query
     */
    showSlashMenu(query) {
        if (!this.slashCommands) return;

        const results = this.slashCommands.search(query);

        if (results.length === 0) {
            this.hideSlashMenu();
            return;
        }

        this.slashMenuVisible = true;

        // Создаем или обновляем меню
        if (!this.slashMenuElement) {
            this.slashMenuElement = document.createElement('div');
            this.slashMenuElement.className = 'slash-menu';
            this.slashMenuElement.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #cbd5e0;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        min-width: 250px;
      `;
            document.body.appendChild(this.slashMenuElement);
        }

        // Обновляем содержимое меню
        this.slashMenuElement.innerHTML = results.map((result, index) => {
            const isSelected = index === 0 ? 'selected' : '';
            return `
        <div class="slash-menu-item ${isSelected}" data-command="${result.command}" data-index="${index}">
          <div class="slash-menu-item-label">${result.config.label}</div>
          <div class="slash-menu-item-description">${result.config.description || ''}</div>
        </div>
      `;
        }).join('');

        // Добавляем обработчики кликов
        this.slashMenuElement.querySelectorAll('.slash-menu-item').forEach((item, index) => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Предотвращаем blur элемента
                e.stopPropagation();

                // Отменяем отложенное закрытие меню
                if (this.blurTimeout) {
                    clearTimeout(this.blurTimeout);
                    this.blurTimeout = null;
                }
            });

            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Убираем выделение с других элементов
                this.slashMenuElement.querySelectorAll('.slash-menu-item').forEach(el => {
                    el.classList.remove('selected');
                });
                // Выделяем выбранный
                item.classList.add('selected');

                // Выполняем команду сразу
                this.executeSlashCommand();
            });

            item.addEventListener('mouseenter', () => {
                // Убираем выделение с других элементов
                this.slashMenuElement.querySelectorAll('.slash-menu-item').forEach(el => {
                    el.classList.remove('selected');
                });
                // Выделяем наведенный
                item.classList.add('selected');
            });
        });

        // Позиционируем меню
        this.updateSlashMenuPosition();
    }

    /**
     * Обновляет позицию меню команд
     */
    updateSlashMenuPosition() {
        if (!this.slashMenuElement || !this.element) return;

        try {
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            this.slashMenuElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
            this.slashMenuElement.style.left = `${rect.left + window.scrollX}px`;
        } catch (e) {
            // Fallback: позиционируем относительно элемента
            const rect = this.element.getBoundingClientRect();
            this.slashMenuElement.style.top = `${rect.bottom + window.scrollY + 5}px`;
            this.slashMenuElement.style.left = `${rect.left + window.scrollX}px`;
        }
    }

    /**
     * Навигация по меню стрелками
     * @param {number} direction - 1 для вниз, -1 для вверх
     */
    navigateMenu(direction) {
        if (!this.slashMenuElement) return;

        const items = Array.from(this.slashMenuElement.querySelectorAll('.slash-menu-item'));
        if (items.length === 0) return;

        const currentIndex = items.findIndex(item => item.classList.contains('selected'));
        let newIndex = currentIndex + direction;

        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;

        // Убираем выделение со всех элементов
        items.forEach(item => item.classList.remove('selected'));

        // Выделяем новый элемент
        items[newIndex].classList.add('selected');

        // Прокручиваем к выбранному элементу
        items[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /**
     * Скрывает меню команд
     */
    hideSlashMenu() {
        this.slashMenuVisible = false;
        if (this.slashMenuElement) {
            this.slashMenuElement.remove();
            this.slashMenuElement = null;
        }
        this.currentSlashQuery = '';
    }

    /**
     * Выполняет выбранную slash-команду
     */
    executeSlashCommand() {
        if (!this.slashMenuElement || !this.onCommand || !this.slashCommands) return;

        let selectedItem = this.slashMenuElement.querySelector('.selected');
        if (!selectedItem) {
            // Если ничего не выбрано, берем первый элемент
            const firstItem = this.slashMenuElement.querySelector('.slash-menu-item');
            if (!firstItem) return;
            selectedItem = firstItem;
        }

        const command = selectedItem.dataset.command;
        if (!command) return;

        const config = this.slashCommands.get(command);

        if (config && this.onCommand) {
            // Удаляем "/команда" из текста
            try {
                const text = this.element.textContent || '';
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);

                    // Вычисляем позицию курсора относительно всего текста элемента
                    const rangeToCursor = document.createRange();
                    rangeToCursor.setStart(this.element, 0);
                    rangeToCursor.setEnd(range.startContainer, range.startOffset);
                    const cursorPos = rangeToCursor.toString().length;

                    const beforeCursor = text.substring(0, cursorPos);

                    // Используем ту же логику, что и в checkSlashCommand
                    const lastSlashIndex = beforeCursor.lastIndexOf('/');

                    if (lastSlashIndex !== -1) {
                        // Проверяем экранирование так же, как в checkSlashCommand
                        let escapeCount = 0;
                        for (let i = lastSlashIndex - 1; i >= 0 && beforeCursor[i] === '\\'; i--) {
                            escapeCount++;
                        }
                        const isEscaped = escapeCount % 2 === 1;

                        const charBeforeSlash = lastSlashIndex > 0 ? beforeCursor[lastSlashIndex - 1] : null;
                        const isAtStart = lastSlashIndex === 0;
                        const isAfterSpace = charBeforeSlash === ' ' || charBeforeSlash === '\n' || charBeforeSlash === '\t';

                        if (!isEscaped && (isAtStart || isAfterSpace)) {
                            // Находим конец команды (до пробела или обратного слеша)
                            const afterSlash = beforeCursor.substring(lastSlashIndex + 1);
                            const queryMatch = afterSlash.match(/^([^\s\\]*)/);
                            const queryLength = queryMatch ? queryMatch[0].length : 0;
                            const commandLength = 1 + queryLength; // "/" + запрос

                            // Находим позицию начала команды в DOM
                            const startTextPos = cursorPos - commandLength;
                            const endTextPos = cursorPos;

                            // Находим узлы в DOM для удаления
                            const found = this._findPatternInDOMByTextPosition(startTextPos, endTextPos);

                            if (found) {
                                const deleteRange = document.createRange();
                                deleteRange.setStart(found.startNode, found.startOffset);
                                deleteRange.setEnd(found.endNode, found.endOffset);
                                deleteRange.deleteContents();

                                // Обновляем курсор на место удаления
                                const newRange = document.createRange();
                                newRange.setStart(found.startNode, found.startOffset);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                            }
                        }
                    }
                }
            } catch (e) {
                // Если не удалось удалить текст, продолжаем выполнение команды
                console.warn('Failed to remove slash command text:', e);
            }

            this.hideSlashMenu();
            this.onCommand(config, this.blockId);
        }
    }

    /**
     * Проверяет наличие markdown-паттерна
     * @param {string} text
     * @param {number} cursorPosition
     * @param {string} trigger
     */
    checkMarkdownShortcut(text, cursorPosition, trigger) {
        if (!this.markdownShortcuts) {
            this.markdownProcessed = false;
            return;
        }

        // Для Space и Enter проверяем текущую позицию (символ еще не вставлен)
        const match = this.markdownShortcuts.match(text, cursorPosition, trigger);

        if (match) {
            this.markdownProcessed = true;

            // Обрабатываем форматирование напрямую, если это формат
            if (match.action.type === 'format' && match.action.wrap) {
                // Для wrap-форматирования (bold, italic) применяем форматирование к тексту между маркерами
                try {
                    const patternLength = match.pattern.length;
                    const textStart = match.start + patternLength;
                    const textEnd = match.end - patternLength;

                    if (textStart < textEnd) {
                        const textToFormat = text.substring(textStart, textEnd);

                        // Определяем тег для форматирования
                        const formatTag = match.action.format === 'bold' ? 'strong' : 'em';

                        // Используем DOM API для замены вместо работы со строкой HTML
                        // Это избежит проблем с &nbsp; и другими HTML-сущностями

                        try {
                            // Ищем паттерн в DOM, начиная с текущей позиции курсора
                            // Это важно, потому что после первого форматирования DOM изменился
                            const selection = window.getSelection();
                            if (selection.rangeCount === 0) {
                                this.markdownProcessed = false;
                                return;
                            }

                            const currentRange = selection.getRangeAt(0);
                            const cursorNode = currentRange.startContainer;
                            const cursorOffset = currentRange.startOffset;

                            // Ищем паттерн в DOM, начиная с текущей позиции курсора
                            // Паттерн должен быть: pattern + textToFormat + pattern
                            const searchPattern = match.pattern + textToFormat + match.pattern;

                            // Получаем текст от начала элемента до курсора
                            const rangeToCursor = document.createRange();
                            rangeToCursor.setStart(this.element, 0);
                            rangeToCursor.setEnd(cursorNode, cursorOffset);
                            const textBeforeCursor = rangeToCursor.toString();

                            // Ищем паттерн в тексте перед курсором (последнее вхождение)
                            const patternIndex = textBeforeCursor.lastIndexOf(searchPattern);

                            if (patternIndex !== -1) {
                                // Нашли паттерн в тексте, теперь находим его в DOM
                                const found = this._findPatternInDOMByTextPosition(patternIndex, patternIndex + searchPattern.length);
                                if (found) {
                                    this._applyFormatToRange(found.startNode, found.startOffset, found.endNode, found.endOffset, textToFormat, formatTag);
                                } else {
                                    this.markdownProcessed = false;
                                }
                            } else {
                                // Паттерн не найден в тексте - возможно, DOM изменился после предыдущего форматирования
                                // Ищем паттерн напрямую в DOM, идя назад от курсора
                                const found = this._findPatternInDOMBackwards(cursorNode, cursorOffset, searchPattern);
                                if (found) {
                                    this._applyFormatToRange(found.startNode, found.startOffset, found.endNode, found.endOffset, textToFormat, formatTag);
                                } else {
                                    this.markdownProcessed = false;
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to apply DOM format:', e);
                            this.markdownProcessed = false;
                        }
                    } else {
                        // Если нет текста между маркерами, разрешаем вставку пробела
                        this.markdownProcessed = false;
                    }
                } catch (e) {
                    console.warn('Failed to apply markdown format:', e);
                    // При ошибке разрешаем вставку пробела
                    this.markdownProcessed = false;
                }
            } else {
                // Для других типов (section, block) используем callback
                if (this.onMarkdown) {
                    // Удаляем паттерн из текста
                    try {
                        if (this.element.firstChild) {
                            const range = document.createRange();
                            const startPos = Math.max(0, match.start);
                            const endPos = match.end;

                            range.setStart(this.element.firstChild, startPos);
                            range.setEnd(this.element.firstChild, endPos);
                            range.deleteContents();

                            // Обновляем курсор
                            const selection = window.getSelection();
                            const newRange = document.createRange();
                            newRange.setStart(this.element.firstChild, startPos);
                            newRange.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                        }
                    } catch (e) {
                        console.warn('Failed to remove markdown pattern:', e);
                    }

                    this.onMarkdown(match, this.blockId);
                }
            }
        } else {
            this.markdownProcessed = false;
        }
    }

    /**
     * Открывает диалог для вставки/редактирования ссылки
     * @param {HTMLElement} element - contentEditable элемент
     * @param {HTMLAnchorElement} [linkElement] - существующая ссылка для редактирования
     */
    openLinkDialog(element, linkElement = null) {
        // Проверяем, есть ли уже открытый диалог
        if (this.linkDialog && this.linkDialog.overlay) {
            return;
        }

        // Сохраняем selection перед открытием диалога (для вставки новой ссылки)
        const selection = window.getSelection();
        let savedRange = null;
        if (selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0).cloneRange();
        }

        // Если ссылка не передана, проверяем, находится ли курсор внутри ссылки
        if (!linkElement) {
            linkElement = LinkManager.getLinkAtCursor(element);
        }

        // Получаем данные ссылки, если редактируем
        let initialData = null;
        if (linkElement) {
            const linkInfo = LinkManager.getLinkInfo(linkElement);
            if (linkInfo) {
                initialData = {
                    ...linkInfo,
                    linkElement: linkElement
                };
            }
        } else {
            // Если есть выделение, используем его как текст ссылки
            if (savedRange && !savedRange.collapsed) {
                const selectedText = savedRange.toString().trim();
                if (selectedText) {
                    initialData = {
                        text: selectedText,
                        href: '',
                        type: 'external'
                    };
                }
            }
        }

        // Создаем диалог
        this.linkDialog = new LinkDialog({
            initialData: initialData,
            onInsert: (text, href, type) => {
                // Восстанавливаем selection перед вставкой
                if (savedRange) {
                    const currentSelection = window.getSelection();
                    currentSelection.removeAllRanges();
                    currentSelection.addRange(savedRange);
                }
                
                LinkManager.insertLink(element, text, href, type);
                
                // Восстанавливаем фокус на элемент после вставки
                setTimeout(() => {
                    element.focus();
                }, 100);
                this.linkDialog = null;
            },
            onUpdate: (linkEl, text, href, type) => {
                // Сохраняем позицию ссылки перед обновлением
                const parent = linkEl.parentNode;
                const nextSibling = linkEl.nextSibling;
                
                LinkManager.updateLink(linkEl, text, href, type);
                
                // После обновления ссылка остается в DOM, но может измениться
                // Восстанавливаем фокус на элемент и устанавливаем курсор после ссылки
                setTimeout(() => {
                    element.focus();
                    // Устанавливаем курсор после обновленной ссылки
                    if (linkEl && linkEl.parentNode) {
                        const range = document.createRange();
                        range.setStartAfter(linkEl);
                        range.collapse(true);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }, 100);
                this.linkDialog = null;
            }
        });

        this.linkDialog.show();
    }

    /**
     * Показывает контекстное меню для ссылки
     * @param {MouseEvent} e - событие клика
     * @param {HTMLElement} element - contentEditable элемент
     * @param {HTMLAnchorElement} linkElement - элемент ссылки
     */
    showLinkContextMenu(e, element, linkElement) {
        // Закрываем предыдущее меню, если есть
        if (this.contextMenu) {
            this.contextMenu.hide();
        }

        const linkInfo = LinkManager.getLinkInfo(linkElement);
        const href = linkElement.getAttribute('href') || '';

        const menuItems = [
            {
                label: 'Редактировать',
                onClick: () => {
                    this.openLinkDialog(element, linkElement);
                }
            },
            {
                label: 'Перейти',
                onClick: () => {
                    if (href.startsWith('http://') || href.startsWith('https://')) {
                        window.open(href, '_blank', 'noopener,noreferrer');
                    } else if (href.startsWith('#')) {
                        const target = document.querySelector(href);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                        }
                    } else {
                        window.location.href = href;
                    }
                }
            },
            {
                label: 'Копировать ссылку',
                onClick: () => {
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(href);
                    } else {
                        // Fallback для старых браузеров
                        const textArea = document.createElement('textarea');
                        textArea.value = href;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                            document.execCommand('copy');
                        } catch (err) {
                            console.warn('Failed to copy link:', err);
                        }
                        document.body.removeChild(textArea);
                    }
                }
            },
            {
                label: 'Удалить ссылку',
                onClick: () => {
                    // Заменяем ссылку на её текстовое содержимое
                    const text = linkElement.textContent;
                    const textNode = document.createTextNode(text);
                    linkElement.parentNode.replaceChild(textNode, linkElement);
                }
            }
        ];

        this.contextMenu = new ContextMenu(menuItems);
        this.contextMenu.show(e.clientX, e.clientY);
    }

    /**
     * Экранирует HTML специальные символы
     * @param {string} text
     * @returns {string}
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Отсоединяет обработчики
     */
    detach() {
        this.hideSlashMenu();
        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
            this.blurTimeout = null;
        }
        if (this.autoLinkTimeout) {
            clearTimeout(this.autoLinkTimeout);
            this.autoLinkTimeout = null;
        }
        if (this.singleClickTimeout) {
            clearTimeout(this.singleClickTimeout);
            this.singleClickTimeout = null;
        }
        if (this.contextMenu) {
            this.contextMenu.hide();
            this.contextMenu = null;
        }
        if (this.documentClickHandler) {
            document.removeEventListener('mousedown', this.documentClickHandler);
            this.documentClickHandler = null;
        }
        if (this.element) {
            this.element.removeEventListener('input', this.handleInput);
            this.element.removeEventListener('keydown', this.handleKeydown);
        }
    }
}

