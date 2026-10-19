export interface StoryCategory {
  id: string;
  name: string;
  iconName: string;
  items: string[];
}

export interface StoryStyleSelection {
  primary: string | null;
  supporting: string[];
  custom: string;
}

export interface PhotographicStyleSelection {
  selected: string[];
  custom: string;
}

export interface CharacterLocksState {
  facelock: boolean; // /facelock 100%
  bodyshape: boolean; // /bodyshape lock
  outfitlock: boolean; // /outfitlock
  poselock: boolean; // /poselock
  agepreserve: boolean; // /agepreserve
  expressionlock: boolean; // /expressionlock
  hairlock: boolean; // /hairlock
}

export type VariationPreset = 1 | 3 | 5 | 10 | 'custom';

export interface VariationConfig {
  preset: VariationPreset;
  customCount: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'testing';

export interface ApiConfig {
  apiKey: string;
  modelId: string;
}

export interface PromptResult {
  id: string;
  index: number;
  prompt: string;
}

export interface GenerationInput {
  samplePrompt: string;
  keywords: string;
  storyStyle: StoryStyleSelection;
  photographicStyle: PhotographicStyleSelection;
  characterLocks: CharacterLocksState;
  variationCount: number;
}
