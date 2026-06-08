export interface LegalSubSection {
  title: string;
  paragraphs: string[];
}

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  subsections?: LegalSubSection[];
}

export interface LegalPageData {
  title: string;
  subtitle: string;
  badge?: string;
  sections: LegalSection[];
}
