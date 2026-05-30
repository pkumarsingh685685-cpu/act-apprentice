export interface DocumentItem {
  id: string;
  title: string;
  date: string;
  viewLink: string;
  downloadLink: string;
  isNew: boolean;
  order: number;
}

export interface LinkItem {
  id: string;
  name: string;
  url: string;
  order: number;
}

export interface HeaderConfig {
  mainTitleText: string;
  mainTitleEnabled: boolean;
  railwayHindiText: string;
  railwayHindiEnabled: boolean;
  railwayEnglishText: string;
  railwayEnglishEnabled: boolean;
  divisionHindiText: string;
  divisionHindiEnabled: boolean;
  divisionEnglishText: string;
  divisionEnglishEnabled: boolean;
}

export interface SiteConfig {
  helpline: string;
  email: string;
  address: string;
  marqueeText: string;
  contactMobile: string;
  contactEmail: string;
  contactAddress: string;
}

export interface LogoItem {
  image: string;
  enabled: boolean;
}

export interface NoticeImage {
  image: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface SiteLogos {
  railwayLogo: LogoItem;
  govLogo: LogoItem;
  nationalEmblem: LogoItem;
}

export interface SliderImageItem {
  id: string;
  image: string;
  title: string;
  description: string;
  order: number;
  enabled: boolean;
}

export interface SiteImages {
  railwayLogo: string;
  govLogo: string;
  nationalEmblem: string;
  heroBanner: string;
}

export interface AppState {
  isAdmin: boolean;
  sessionExpiry: number | null;
  lastLoginTime: string | null;
  login: (rememberMe?: boolean) => void;
  logout: () => void;
  checkSession: () => void;

  config: SiteConfig;
  updateConfig: (key: keyof SiteConfig, value: string) => void;

  headerConfig: HeaderConfig;
  updateHeaderConfig: (config: HeaderConfig) => void;

  images: SiteImages; // Legacy
  updateImage: (key: keyof SiteImages, base64: string) => void; // Legacy

  logos: SiteLogos;
  updateLogo: (key: keyof SiteLogos, data: Partial<LogoItem>) => void;

  noticeImage: NoticeImage;
  updateNoticeImage: (data: Partial<NoticeImage>) => void;

  audioAnnouncement: {
    audio: string;
    enabled: boolean;
  };
  updateAudioAnnouncement: (
    data: Partial<{ audio: string; enabled: boolean }>,
  ) => void;

  sliderImages: SliderImageItem[];
  addSliderImage: (image: Omit<SliderImageItem, "id">) => void;
  updateSliderImage: (id: string, image: Partial<SliderImageItem>) => void;
  deleteSliderImage: (id: string) => void;

  notices: DocumentItem[];
  notifications: DocumentItem[];
  meritPanels: DocumentItem[];
  results: DocumentItem[];
  darCirculars: DocumentItem[];
  actCirculars: DocumentItem[];

  links: LinkItem[];
  externalLinks: LinkItem[];
  internalLinks: LinkItem[];

  addDocument: (type: DocumentCategory, doc: Omit<DocumentItem, "id">) => void;
  updateDocument: (
    type: DocumentCategory,
    id: string,
    doc: Partial<DocumentItem>,
  ) => void;
  deleteDocument: (type: DocumentCategory, id: string) => void;

  addLink: (link: Omit<LinkItem, "id">) => void;
  updateLink: (id: string, link: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;

  addExternalLink: (link: Omit<LinkItem, "id">) => void;
  updateExternalLink: (id: string, link: Partial<LinkItem>) => void;
  deleteExternalLink: (id: string) => void;

  addInternalLink: (link: Omit<LinkItem, "id">) => void;
  updateInternalLink: (id: string, link: Partial<LinkItem>) => void;
  deleteInternalLink: (id: string) => void;
}

export type DocumentCategory =
  | "notices"
  | "notifications"
  | "meritPanels"
  | "results"
  | "darCirculars"
  | "actCirculars";
