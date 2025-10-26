export interface AdAnalysis {
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  main_themes: string[];
  target_demographic: string;
}

export interface Persona {
  name: string;
  avatar: string;
}

export interface ChatTurn {
  persona: Persona;
  text: string;
  audioUrl?: string | null;
}