declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

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
  developerCreditText?: string;
  cloudinaryName?: string;
  cloudinaryPreset?: string;
  candidateDataCsvUrl?: string;
  sfPasscode?: string;
  sfSessionDuration?: string;
  showSfPdfPreview?: string;
  srDpoNameEn?: string;
  srDpoNameHi?: string;
  srDpoDesignationEn?: string;
  srDpoDesignationHi?: string;
  importantMessageText?: string;
  importantMessageEnabled?: string;
  ta_rate_l1_l5?: string;
  ta_rate_l6_l8?: string;
  ta_rate_l9_l11?: string;
  ta_rate_l12_l13?: string;
  ta_rate_l14_l18?: string;
  enableContingentSection?: string;
  enablePrintMetadata?: string;
}

export interface LogoItem {
  image: string;
  enabled: boolean;
  customHeight?: number;
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
  ministryLogo?: LogoItem;
  favicon?: LogoItem;
  namePlate?: LogoItem;
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

export interface WarningConfig {
  text: string;
  enabled: boolean;
}

export interface VideoConfig {
  url: string;
  enabled: boolean;
}

export interface IssuedSF {
  id: string;
  sfType: string;
  employeeName: string;
  designation: string;
  issuedDate: string;
  isFinalised: boolean;
  trackStatus?: "untracked" | "issued" | "not_issued" | "paused";
  pausedUntil?: number | null;
  memorandumNo?: string;
  nameOfDa?: string;
  designationOfDa?: string;
  charges?: string;
  printedAt?: number;
  signatureName?: string;
  authorityDesignation?: string;
  salutation?: string;
  workingUnder?: string;
  railway?: string;
  placeOfIssue?: string;
  additionalCopies?: string[];
}

export interface ApoWorkAllotment {
  id: string;
  name: string;
  designation: string;
  departments: string[];
  contactEmail?: string;
  contactPhone?: string;
  order: number;
}

export interface AppState {
  isAdmin: boolean;
  sessionExpiry: number | null;
  lastLoginTime: string | null;
  login: (rememberMe?: boolean) => void;
  logout: () => void;
  checkSession: () => void;
  
  isSfAuthenticated: boolean;
  sfAuthenticatedAt: string | null;
  sfLogin: () => void;
  sfLogout: () => void;

  config: SiteConfig;
  updateConfig: (key: keyof SiteConfig, value: string) => void;

  translations: { en: Record<string, string>; hi: Record<string, string> };
  updateTranslation: (lang: 'en' | 'hi', key: string, value: string) => void;
  updateTranslationsBatch: (lang: 'en' | 'hi', updates: Record<string, string>) => void;

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

  warningConfig: WarningConfig;
  updateWarningConfig: (data: Partial<WarningConfig>) => void;

  videoConfig: VideoConfig;
  updateVideoConfig: (data: Partial<VideoConfig>) => void;

  notices: DocumentItem[];
  notifications: DocumentItem[];
  meritPanels: DocumentItem[];
  results: DocumentItem[];
  darCirculars: DocumentItem[];
  actCirculars: DocumentItem[];

  links: LinkItem[];
  externalLinks: LinkItem[];
  internalLinks: LinkItem[];

  sfDescriptions: Record<string, string>;
  updateSFDescription: (id: string, description: string) => void;

  sfFixedTexts?: Record<string, Record<string, string>>;
  updateSFFixedText?: (sfType: string, key: string, value: string) => void;

  issuedSFs: IssuedSF[];
  addIssuedSF: (sf: Omit<IssuedSF, "id">) => void;
  updateIssuedSF: (id: string, updates: Partial<IssuedSF>) => void;
  toggleIssuedSFFinalised: (id: string) => void;
  deleteIssuedSF: (id: string) => void;

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

  apoWorkAllotments: ApoWorkAllotment[];
  addApoAllotment: (allotment: Omit<ApoWorkAllotment, "id">) => void;
  updateApoAllotment: (id: string, allotment: Partial<ApoWorkAllotment>) => void;
  deleteApoAllotment: (id: string) => void;
  pending_sf4_drafts?: any[];

  part2Template: Part2Field[];
  addPart2TemplateField: (field: Omit<Part2Field, "choice" | "value">) => void;
  updatePart2TemplateField: (id: string, updates: Partial<Part2Field>) => void;
  deletePart2TemplateField: (id: string) => void;
  reorderPart2TemplateFields: (orderedFields: Part2Field[]) => void;
}

export interface Part2Field {
  id: string;
  label: string;
  choice: "Yes" | "No" | "N/A" | "MAJOR" | "MINOR" | "Superannuation" | "";
  value: string;
  isSubField?: boolean;
  order?: number;
}

export type DocumentCategory =
  | "notices"
  | "notifications"
  | "meritPanels"
  | "results"
  | "darCirculars"
  | "actCirculars";
