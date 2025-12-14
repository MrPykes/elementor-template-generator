const cheerio = require('cheerio');

function uid(prefix='id'){
  return prefix + '_' + Math.random().toString(36).slice(2,10);
}

function createContainer(children = [], settings = {}, isInner = false){
  return {
    id: uid('container'),
    elType: 'container',
    settings: settings || {},
    elements: children,
    isInner: isInner
  };
}

function createWidget(widgetType, settings = {}){
  return {
    id: uid('widget'),
    elType: 'widget',
    widgetType: widgetType,
    settings: settings || {},
    elements: []
  };
}

function textWidgetFromHtml(html){
  // Keep `editor` and add minimal typography defaults similar to exports
  return createWidget('text-editor', {
    editor: html,
    typography_typography: 'custom',
    typography_font_family: 'Poppins',
    typography_font_size: { unit: 'px', size: 18, sizes: [] },
    typography_font_weight: '400'
  });
}

function headingWidget(text, level){
  // Map to Elementor heading keys seen in export: `title` and `header_size` (plus basic typography)
  const sizeMap = {1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6'};
  const fontSize = level === 1 ? 40 : level === 2 ? 28 : 20;
  return createWidget('heading', {
    title: text,
    header_size: sizeMap[level] || 'h2',
    typography_typography: 'custom',
    typography_font_family: 'Poppins',
    typography_font_size: { unit: 'px', size: fontSize, sizes: [] },
    typography_font_weight: '600'
  });
}

function imageWidget(src, alt){
  // Match export `image` structure with `url`, `id`, and `image_size`
  return createWidget('image', {
    image: { url: src || 'https://via.placeholder.com/600x400', id: '', size: '', alt: alt||'', source: 'library' },
    image_size: 'full',
    align: 'left'
  });
}

function buttonWidget(text, href){
  // Use a common addon button key `button_text` to increase compatibility with both core and addon buttons
  return createWidget('ucaddon_creative_buttons', {
    button_text: text || 'Button',
    styles: 'uc_btn-5',
    link: { url: href || '#' },
    button_padding: { unit: 'px', top: 20, right: 48, bottom: 20, left: 48, isLinked: false },
    button_typography_typography: 'custom',
    button_typography_font_family: 'Poppins',
    button_typography_font_size: { unit: 'px', size: 18, sizes: [] },
    __globals__: {}
  });
}

function isBlockTag(tag){
  return ['div','p','section','header','article','aside','main','figure','ul','ol','li'].includes(tag);
}

function childrenElements($el){
  return $el.children().toArray().filter(n => n.type === 'tag' || (n.type === 'text' && n.data && n.data.trim()));
}

function convertNode(node, $){
  if(node.type === 'text'){
    const t = node.data.trim();
    if(!t) return [];
    return [ textWidgetFromHtml(t) ];
  }

  const tag = node.tagName && node.tagName.toLowerCase();

  if(tag === 'section'){
    const $n = $(node);
    const kids = childrenElements($n);

    // If section contains a single div that is a columns wrapper, detect columns
    if(kids.length === 1 && (kids[0].tagName || '').toLowerCase() === 'div'){
      const inner = childrenElements($(kids[0]));
      const isColumns = inner.length >= 2 && inner.every(i => (i.tagName||'').toLowerCase() === 'div');
      if(isColumns){
        const cols = inner.map(ch => {
          const widgets = childrenElements($(ch)).flatMap(c => convertNode(c, $));
          return createContainer(widgets, { width: Math.floor(100 / inner.length) + '%' }, true);
        });
        return [ createContainer(cols, { flex_direction: 'row' }, false) ];
      }
    }

    // Fallback: collect widgets and wrap in single container
    const widgets = kids.flatMap(k => convertNode(k, $));
    return [ createContainer([ createContainer(widgets, {}, true) ], {}, false) ];
  }

  if(tag === 'div'){
    const $n = $(node);
    const kids = childrenElements($n);

    // If div contains multiple div children, treat as columns inside a section
    const isColumns = kids.length >= 2 && kids.every(k => (k.tagName||'').toLowerCase() === 'div');
    if(isColumns){
      const cols = kids.map(ch => {
        const widgets = childrenElements($(ch)).flatMap(c => convertNode(c, $));
        return createContainer(widgets, { width: Math.floor(100 / kids.length) + '%' }, true);
      });
      return [ createContainer(cols, { flex_direction: 'row' }, false) ];
    }

    // Otherwise treat as simple grouping -> container with single inner container
    const widgets = kids.flatMap(k => convertNode(k, $));
    return [ createContainer([ createContainer(widgets, {}, true) ], {}, false) ];
  }

  if(/^h[1-6]$/.test(tag)){
    const level = parseInt(tag[1],10);
    const text = $(node).text().trim();
    return [ headingWidget(text, level) ];
  }

  if(tag === 'p'){
    const html = $(node).html();
    return [ textWidgetFromHtml(html) ];
  }

  if(tag === 'img'){
    const src = $(node).attr('src') || '';
    const alt = $(node).attr('alt') || '';
    return [ imageWidget(src, alt) ];
  }

  if(tag === 'a'){
    const href = $(node).attr('href') || '#';
    const txt = $(node).text().trim();
    // Simple heuristic: treat as button if short text or contains block children
    if(txt.length <= 30){
      return [ buttonWidget(txt, href) ];
    }
    // otherwise fall back to text
    return [ textWidgetFromHtml($.html(node)) ];
  }

  // Unsupported tags: recurse into children
  if(node.children && node.children.length){
    return node.children.flatMap(ch => convertNode(ch, $));
  }

  return [];
}

function convertHtmlToElementor(html, title = 'Converted Template'){
  const $ = cheerio.load(html);

  // Prefer explicit <section> elements; otherwise group body children into containers
  const bodyChildren = $('body').length ? $('body').children().toArray() : $.root().children().toArray();

  const elements = bodyChildren.flatMap(node => {
    if(node.type === 'text' && (!node.data || !node.data.trim())) return [];
    return convertNode(node, $);
  });

  return {
    content: elements,
    page_settings: {},
    version: '0.4',
    title: title || 'converted',
    type: 'page'
  };
}

module.exports = { convertHtmlToElementor };
