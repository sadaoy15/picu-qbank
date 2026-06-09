export interface Question {
  id: number;
  title: string;
  scenario: string;
  choices: Record<string, string>;
  correctAnswer: string | null;
  correctAnswerText: string | null;
  explanation: string | null;
  source: string | null;
  category: string;
  images?: string[];
}
