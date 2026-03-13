export type SoundButton = {
  id: string;
  label: string;
  soundUri: string | null;
};

export type Soundboard = {
  id: string;
  name: string;
  createdAt: number;
  buttons: SoundButton[];
};
