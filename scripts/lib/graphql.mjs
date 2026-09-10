const ASSET_FIELDS = `
  __typename
  sys { id }
  contentType
  title
  description
  width
  height
  url
  fileName
`;

const PAGE_LINK = `
  ... on Page {
    __typename
    sys { id }
    slug
    pageName
  }
`;

const RICH_TEXT = `
  json
  links {
    assets {
      block { ${ASSET_FIELDS} }
      hyperlink { ${ASSET_FIELDS} }
    }
    entries {
      block { __typename sys { id } }
      hyperlink { __typename sys { id } ${PAGE_LINK} }
      inline { __typename sys { id } }
    }
  }
`;

export const PAGES_QUERY = `
query SnapshotPages($locale: String, $limit: Int!, $skip: Int!) {
  pageCollection(locale: $locale, limit: $limit, skip: $skip) {
    total
    items {
      __typename
      sys { id }
      pageName
      slug
      seo {
        title
        description
        noIndex
        noFollow
        image { ${ASSET_FIELDS} }
      }
      topSectionCollection(limit: 20) {
        items { ... on Entry { __typename sys { id } } }
      }
      pageContent { ... on Entry { __typename sys { id } } }
      extraSectionCollection(limit: 20) {
        items { ... on Entry { __typename sys { id } } }
      }
    }
  }
}
`;

export const NAV_QUERY = `
query SnapshotNav($locale: String) {
  navigationMenuCollection(locale: $locale, limit: 1) {
    items {
      __typename
      sys { id }
      menuItemsCollection(limit: 20) {
        items {
          __typename
          sys { id }
          groupName
          featured
          link: groupLink { ${PAGE_LINK} }
          children: featuredPagesCollection(limit: 20) {
            items { ${PAGE_LINK} }
          }
        }
      }
    }
  }
}
`;

export const FOOTER_QUERY = `
query SnapshotFooter($locale: String) {
  footerMenuCollection(locale: $locale, limit: 1) {
    items {
      __typename
      sys { id }
      menuItemsCollection(limit: 20) {
        items {
          __typename
          sys { id }
          groupName
          featuredPagesCollection(limit: 20) {
            items { ${PAGE_LINK} }
          }
        }
      }
      legalLinks {
        featuredPagesCollection(limit: 20) {
          items { ${PAGE_LINK} }
        }
      }
      twitterLink
      facebookLink
      linkedinLink
      instagramLink
    }
  }
}
`;

const ENTRY_FIELDS_BY_TYPE = {
  Page: `
    pageName
    slug
    seo {
      title
      description
      noIndex
      noFollow
      image { ${ASSET_FIELDS} }
    }
  `,
  ComponentCta: `
    headline
    subline { ${RICH_TEXT} }
    ctaText
    targetPage { ${PAGE_LINK} }
    urlParameters
    colorPalette
  `,
  ComponentDuplex: `
    title
    containerLayout
    headline
    bodyText { ${RICH_TEXT} }
    ctaText
    targetPage { ${PAGE_LINK} }
    image { ${ASSET_FIELDS} }
    imageStyle
    colorPalette
  `,
  ComponentHeroBanner: `
    headline
    bodyText { ${RICH_TEXT} }
    ctaText
    targetPage { ${PAGE_LINK} }
    image { ${ASSET_FIELDS} }
    imageStyle
    heroSize
    colorPalette
  `,
  ComponentInfoBlock: `
    headline
    subline
    block1Image { ${ASSET_FIELDS} }
    block1Body { ${RICH_TEXT} }
    block2Image { ${ASSET_FIELDS} }
    block2Body { ${RICH_TEXT} }
    block3Image { ${ASSET_FIELDS} }
    block3Body { ${RICH_TEXT} }
    colorPalette
  `,
  ComponentQuote: `
    quote { ${RICH_TEXT} }
    quoteAlignment
    image { ${ASSET_FIELDS} }
    imagePosition
    colorPalette
  `,
  ComponentTextBlock: `
    headline
    subline
    body { ${RICH_TEXT} }
    colorPalette
  `,
  ComponentProductTable: `
    headline
    subline
    productsCollection(limit: 10) {
      items { __typename sys { id } }
    }
  `,
  ContactSection: `
    title
    targetEmail
  `,
  Locations: `
    name
    address
    phone
    url
  `,
  LocationsGroup: `
    label
    locationsCollection(limit: 20) {
      items { __typename sys { id } }
    }
  `,
  ServiceComponent: `
    containerLayout
    headline
    bodyText { ${RICH_TEXT} }
    ctaText
    targetPage { ${PAGE_LINK} }
    image { ${ASSET_FIELDS} }
    servicesCollection(limit: 20) {
      items { __typename sys { id } }
    }
    imageStyle
    colorPalette
  `,
  ServiceItem: `
    name
    description { ${RICH_TEXT} }
    targetPage { ${PAGE_LINK} }
  `,
  Testimonials: `
    headline
    testimonialsCollection(limit: 20) {
      items { __typename sys { id } }
    }
  `,
  Testimonial: `
    company
    brand { ${ASSET_FIELDS} }
    position
    fullname
    body { ${RICH_TEXT} }
    video { ${ASSET_FIELDS} }
    youtube
  `,
  TopicBusinessInfo: `
    name
    isDark
    shortDescription
    featuredImage { ${ASSET_FIELDS} }
    media { ${ASSET_FIELDS} }
    body { ${RICH_TEXT} }
    youtube
  `,
  TopicPerson: `
    name
    bio { ${RICH_TEXT} }
    avatar { ${ASSET_FIELDS} }
    website
    location
    cardStyle
  `,
  TopicProduct: `
    name
    featuredImage { ${ASSET_FIELDS} }
    description { ${RICH_TEXT} }
    price
    featuresCollection(limit: 30) {
      items { __typename sys { id } }
    }
  `,
  TopicProductFeature: `
    name
    longDescription { ${RICH_TEXT} }
    shortDescription { ${RICH_TEXT} }
  `,
  MenuGroup: `
    groupName
    featured
    groupLink { ${PAGE_LINK} }
    featuredPagesCollection(limit: 20) {
      items { ${PAGE_LINK} }
    }
  `,
  Seo: `
    title
    description
    noIndex
    noFollow
    image { ${ASSET_FIELDS} }
  `,
};

const ROOT_FIELD_BY_TYPE = {
  Page: 'page',
  ComponentCta: 'componentCta',
  ComponentDuplex: 'componentDuplex',
  ComponentHeroBanner: 'componentHeroBanner',
  ComponentInfoBlock: 'componentInfoBlock',
  ComponentQuote: 'componentQuote',
  ComponentTextBlock: 'componentTextBlock',
  ComponentProductTable: 'componentProductTable',
  ContactSection: 'contactSection',
  Locations: 'locations',
  LocationsGroup: 'locationsGroup',
  ServiceComponent: 'serviceComponent',
  ServiceItem: 'serviceItem',
  Testimonials: 'testimonials',
  Testimonial: 'testimonial',
  TopicBusinessInfo: 'topicBusinessInfo',
  TopicPerson: 'topicPerson',
  TopicProduct: 'topicProduct',
  TopicProductFeature: 'topicProductFeature',
  MenuGroup: 'menuGroup',
  Seo: 'seo',
  NavigationMenu: 'navigationMenu',
  FooterMenu: 'footerMenu',
};

/**
 * Build a type-specific GraphQL query for a known Contentful entry.
 * @param {string} typename
 */
export function buildEntryQuery(typename) {
  const root = ROOT_FIELD_BY_TYPE[typename];
  const fields = ENTRY_FIELDS_BY_TYPE[typename] || '';
  if (!root) return null;
  return `
    query SnapshotEntry($id: String!, $locale: String) {
      ${root}(id: $id, locale: $locale) {
        __typename
        sys { id }
        ${fields}
      }
    }
  `;
}

export const GENERIC_ENTRY_QUERY = `
query SnapshotGenericEntry($id: String!, $locale: String) {
  entryCollection(where: { sys: { id: $id } }, locale: $locale, limit: 1) {
    items {
      __typename
      sys { id }
    }
  }
}
`;

export { ASSET_FIELDS, PAGE_LINK, RICH_TEXT, ROOT_FIELD_BY_TYPE };
