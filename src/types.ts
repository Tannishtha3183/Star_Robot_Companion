export type ExpressionType = "neutral" | "happy" | "excited" | "thoughtful" | "surprised" | "gentle";

export type CompanionState = "idle" | "listening" | "thinking" | "responding";

export interface Message {
  id: string;
  sender: "user" | "star";
  text: string;
  expression?: ExpressionType;
  timestamp: string;
}

export interface LightState {
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  autoOrbit: boolean;
  intensity: number; // 0.1 to 1.5
  timeOfDay: "morning" | "noon" | "sunset" | "night";
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}
