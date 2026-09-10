export interface SysRef {
  id: string;
}

export interface EntryRef {
  __typename: string;
  sys: SysRef;
}

export interface AssetFields {
  __typename?: 'Asset';
  sys?: SysRef;
  contentType?: string | null;
  title?: string | null;
  description?: string | null;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  localPath?: string | null;
  fileName?: string | null;
}

export interface PageLinkFields {
  __typename?: 'Page';
  sys: SysRef;
  slug?: string | null;
  pageName?: string | null;
}

export interface RichTextDocument {
  nodeType: string;
  content?: RichTextDocument[];
  value?: string;
  marks?: { type: string }[];
  data?: Record<string, unknown>;
}

export interface RichTextField {
  json?: RichTextDocument | null;
  links?: {
    assets?: {
      block?: Array<AssetFields | null>;
      hyperlink?: Array<AssetFields | null>;
    };
    entries?: {
      block?: Array<EntryRef | null>;
      hyperlink?: Array<(EntryRef & Partial<PageLinkFields>) | null>;
      inline?: Array<EntryRef | null>;
    };
  };
}

export interface SeoFields {
  title?: string | null;
  description?: string | null;
  image?: AssetFields | null;
  noIndex?: boolean | null;
  noFollow?: boolean | null;
}

export interface PageShell {
  __typename: 'Page';
  sys: SysRef;
  pageName?: string | null;
  slug: string;
  seo?: SeoFields | null;
  topSection: EntryRef[];
  pageContent: EntryRef | null;
  extraSection: EntryRef[];
}

export interface SnapshotManifest {
  schemaVersion: number;
  generatedAt: string;
  locales: string[];
  pages: Array<{ locale: string; slug: string; path: string }>;
  entryCount: number;
  assetCount: number;
  externalUrls: string[];
}

export interface MenuChild {
  __typename?: string;
  sys: SysRef;
  slug?: string | null;
  pageName?: string | null;
  categoryName?: string | null;
  postName?: string | null;
}

export interface MenuGroup {
  __typename?: string;
  sys: SysRef;
  groupName?: string | null;
  featured?: boolean | null;
  link?: PageLinkFields | null;
  children?: { items?: Array<MenuChild | null> | null } | null;
  featuredPagesCollection?: { items?: Array<MenuChild | null> | null } | null;
}

export interface NavigationData {
  items: Array<{
    menuItemsCollection?: { items?: Array<MenuGroup | null> | null } | null;
  } | null>;
}

export interface FooterData {
  items: Array<{
    sys?: SysRef;
    menuItemsCollection?: { items?: Array<MenuGroup | null> | null } | null;
    legalLinks?: {
      featuredPagesCollection?: { items?: Array<MenuChild | null> | null } | null;
    } | null;
    twitterLink?: string | null;
    facebookLink?: string | null;
    linkedinLink?: string | null;
    instagramLink?: string | null;
  } | null>;
}

export interface LayoutProps {
  containerWidth: number;
  parent: string;
}
