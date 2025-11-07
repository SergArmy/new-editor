export class VirtualScroller {
  constructor({ container, itemCount, itemHeight, renderItem, buffer = 10 }) {
    this.container = container;
    this.itemCount = itemCount;
    this.itemHeight = itemHeight; // fixed height for MVP
    this.renderItem = renderItem;
    this.buffer = buffer;
    this.viewport = document.createElement('div');
    this.content = document.createElement('div');
    this.viewport.style.overflow = 'auto';
    this.viewport.style.height = '100%';
    this.content.style.position = 'relative';
    this.viewport.appendChild(this.content);
    container.appendChild(this.viewport);
    this.viewport.addEventListener('scroll', () => this._update());
    this._update();
  }

  _update() {
    const totalHeight = this.itemCount * this.itemHeight;
    this.content.style.height = totalHeight + 'px';
    const scrollTop = this.viewport.scrollTop;
    const height = this.viewport.clientHeight || 0;
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(this.itemCount - 1, Math.ceil((scrollTop + height) / this.itemHeight) + this.buffer);
    this._renderRange(startIndex, endIndex);
  }

  _renderRange(start, end) {
    this.content.innerHTML = '';
    for (let i = start; i <= end; i++) {
      const el = this.renderItem(i);
      el.style.position = 'absolute';
      el.style.top = (i * this.itemHeight) + 'px';
      el.style.height = this.itemHeight + 'px';
      el.style.left = '0';
      el.style.right = '0';
      this.content.appendChild(el);
    }
  }
}


