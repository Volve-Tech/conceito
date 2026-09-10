import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

import { publicHref, resolvePageHref } from './hrefs';
import { escapeHtml } from './sanitize';
import type { AssetFields, EntryRef, LayoutProps, RichTextDocument, RichTextField } from './types';

const GUTTERLESS_PARENTS = new Set([
  'quote',
  'product-table',
  'info-block',
  'duplex',
  'product-description',
  'card-person',
  'category',
  'cta-subline',
  'hero-banner-body',
  'post-intro',
  'service',
]);

export interface RichTextRenderContext {
  locale: string;
  layout: LayoutProps;
  className?: string;
  renderEmbeddedEntry: (entry: EntryRef) => string;
  renderAsset: (asset: AssetFields) => string;
}

function marksToHtml(text: string, marks: Array<{ type: string }> = []): string {
  return marks.reduce((acc, mark) => {
    if (mark.type === MARKS.BOLD) return `<strong>${acc}</strong>`;
    if (mark.type === MARKS.ITALIC) return `<em>${acc}</em>`;
    if (mark.type === MARKS.UNDERLINE) return `<u>${acc}</u>`;
    if (mark.type === MARKS.CODE) return `<code>${acc}</code>`;
    return acc;
  }, escapeHtml(text).replaceAll('\n', '<br />'));
}

function headingTag(nodeType: string): string {
  switch (nodeType) {
    case BLOCKS.HEADING_1:
      return 'h2';
    case BLOCKS.HEADING_2:
      return 'h2';
    case BLOCKS.HEADING_3:
      return 'h2';
    case BLOCKS.HEADING_4:
      return 'h2';
    case BLOCKS.HEADING_5:
      return 'h2';
    case BLOCKS.HEADING_6:
      return 'h2';
    default:
      return 'p';
  }
}

function headingClass(nodeType: string): string {
  switch (nodeType) {
    case BLOCKS.HEADING_1:
      return 'rt-h1';
    case BLOCKS.HEADING_2:
      return 'rt-h2';
    case BLOCKS.HEADING_3:
      return 'rt-h3';
    case BLOCKS.HEADING_4:
      return 'rt-h4';
    case BLOCKS.HEADING_5:
      return 'rt-h5';
    case BLOCKS.HEADING_6:
      return 'rt-h6';
    default:
      return 'rt-p';
  }
}

function wrapBlock(html: string, layout: LayoutProps, extraClass = ''): string {
  const gutterless = GUTTERLESS_PARENTS.has(layout.parent);
  const style = gutterless
    ? ''
    : `style="max-width:${layout.containerWidth / 10}rem;margin-left:auto;margin-right:auto;padding-left:1.6rem;padding-right:1.6rem"`;
  return `<div class="rt-block ${extraClass}" ${style}>${html}</div>`;
}

function findEntry(links: RichTextField['links'], id: string): EntryRef | undefined {
  const all = [
    ...(links?.entries?.block || []),
    ...(links?.entries?.hyperlink || []),
    ...(links?.entries?.inline || []),
  ];
  return all.find((entry) => entry?.sys.id === id) || undefined;
}

function findAsset(links: RichTextField['links'], id: string): AssetFields | undefined {
  const all = [...(links?.assets?.block || []), ...(links?.assets?.hyperlink || [])];
  return all.find((asset) => asset?.sys?.id === id) || undefined;
}

function renderNode(
  node: RichTextDocument,
  field: RichTextField,
  ctx: RichTextRenderContext,
): string {
  const children = (node.content || []).map((child) => renderNode(child, field, ctx)).join('');

  if (node.nodeType === 'text') {
    return marksToHtml(node.value || '', node.marks);
  }

  if (node.nodeType === INLINES.HYPERLINK) {
    const uri = String(node.data?.uri || '#');
    const external = uri.startsWith('http');
    return `<a href="${escapeHtml(uri)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${children}</a>`;
  }

  if (node.nodeType === 'entry-hyperlink' || node.nodeType === INLINES.ENTRY_HYPERLINK) {
    const id = (node.data?.target as { sys?: { id?: string } } | undefined)?.sys?.id;
    const entry = id ? findEntry(field.links, id) : undefined;
    if (entry && 'slug' in entry && entry.slug) {
      return `<a href="${resolvePageHref(String(entry.slug), ctx.locale)}">${children}</a>`;
    }
    return children;
  }

  if (node.nodeType === INLINES.ASSET_HYPERLINK) {
    const id = (node.data?.target as { sys?: { id?: string } } | undefined)?.sys?.id;
    const asset = id ? findAsset(field.links, id) : undefined;
    const href = publicHref(asset?.url || '#');
    return `<a href="${escapeHtml(href)}">${children}</a>`;
  }

  if (node.nodeType === INLINES.EMBEDDED_ENTRY) {
    const typename = (node.data?.target as { __typename?: string } | undefined)?.__typename;
    if (typename === 'NtMergetag') return '';
    return children;
  }

  if (node.nodeType === BLOCKS.EMBEDDED_ENTRY) {
    const id = (node.data?.target as { sys?: { id?: string } } | undefined)?.sys?.id;
    const entry = id ? findEntry(field.links, id) : undefined;
    if (!entry) return '';
    return `<div class="rt-embedded">${ctx.renderEmbeddedEntry(entry)}</div>`;
  }

  if (node.nodeType === BLOCKS.EMBEDDED_ASSET) {
    const id = (node.data?.target as { sys?: { id?: string } } | undefined)?.sys?.id;
    const asset = id ? findAsset(field.links, id) : undefined;
    if (!asset) return '';
    return wrapBlock(ctx.renderAsset(asset), ctx.layout);
  }

  if (node.nodeType === BLOCKS.PARAGRAPH) {
    return wrapBlock(`<p class="rt-p">${children}</p>`, ctx.layout);
  }

  if (
    node.nodeType === BLOCKS.HEADING_1 ||
    node.nodeType === BLOCKS.HEADING_2 ||
    node.nodeType === BLOCKS.HEADING_3 ||
    node.nodeType === BLOCKS.HEADING_4 ||
    node.nodeType === BLOCKS.HEADING_5 ||
    node.nodeType === BLOCKS.HEADING_6
  ) {
    const tag = headingTag(node.nodeType);
    return wrapBlock(`<${tag} class="${headingClass(node.nodeType)}">${children}</${tag}>`, ctx.layout);
  }

  if (node.nodeType === BLOCKS.QUOTE) {
    return wrapBlock(`<blockquote class="rt-quote">${children}</blockquote>`, ctx.layout);
  }

  if (node.nodeType === BLOCKS.HR) {
    return wrapBlock('<hr class="rt-hr" />', ctx.layout);
  }

  if (node.nodeType === BLOCKS.UL_LIST) {
    return `<ul class="rt-ul">${children}</ul>`;
  }

  if (node.nodeType === BLOCKS.OL_LIST) {
    return `<ol class="rt-ol">${children}</ol>`;
  }

  if (node.nodeType === BLOCKS.LIST_ITEM) {
    return `<li class="rt-li">${children}</li>`;
  }

  if (node.nodeType === BLOCKS.TABLE) {
    return wrapBlock(`<div class="rt-table-wrap"><table class="rt-table">${children}</table></div>`, ctx.layout);
  }

  if (node.nodeType === BLOCKS.TABLE_ROW) return `<tr>${children}</tr>`;
  if (node.nodeType === BLOCKS.TABLE_HEADER_CELL) return `<th>${children}</th>`;
  if (node.nodeType === BLOCKS.TABLE_CELL) return `<td>${children}</td>`;

  if (node.nodeType === 'document') return children;

  return children;
}

/**
 * Render a Contentful rich-text document to HTML using snapshot links.
 */
export function renderRichText(field: RichTextField | null | undefined, ctx: RichTextRenderContext): string {
  if (!field?.json) return '';
  return `<div class="rt-root ${ctx.className || ''}">${renderNode(field.json, field, ctx)}</div>`;
}

export type RichTextSegment =
  | { type: 'html'; html: string }
  | { type: 'entry'; entry: EntryRef }
  | { type: 'asset'; asset: AssetFields };

/**
 * Split a document into HTML stretches and embed nodes so Astro can resolve entries.
 */
export function renderRichTextSegments(
  field: RichTextField | null | undefined,
  ctx: Omit<RichTextRenderContext, 'renderEmbeddedEntry' | 'renderAsset'>,
): RichTextSegment[] {
  if (!field?.json?.content) return [];
  const segments: RichTextSegment[] = [];
  const htmlCtx: RichTextRenderContext = {
    ...ctx,
    renderEmbeddedEntry: () => '',
    renderAsset: () => '',
  };

  for (const node of field.json.content) {
    if (node.nodeType === BLOCKS.EMBEDDED_ENTRY) {
      const id = (node.data?.target as { sys?: { id?: string } } | undefined)?.sys?.id;
      const entry = id ? findEntry(field.links, id) : undefined;
      if (entry) segments.push({ type: 'entry', entry });
      continue;
    }
    if (node.nodeType === BLOCKS.EMBEDDED_ASSET) {
      const id = (node.data?.target as { sys?: { id?: string } } | undefined)?.sys?.id;
      const asset = id ? findAsset(field.links, id) : undefined;
      if (asset) segments.push({ type: 'asset', asset });
      continue;
    }
    segments.push({ type: 'html', html: renderNode(node, field, htmlCtx) });
  }
  return segments;
}
