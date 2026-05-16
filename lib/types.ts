export type ExperienceLevel = 'fresher' | '1-2 years' | '3-5 years' | '5+ years';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionCategory = 'technical' | 'hr' | 'system-design' | 'coding' | 'scenario' | 'rapid-fire';
export type SessionType = 'jd' | 'role';

export interface Question {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  realWorldRelevance: string;
  followUpQuestions: string[];
  difficulty: Difficulty;
  category: QuestionCategory;
}

export interface RoleInput {
  role: string;
  experienceLevel: ExperienceLevel;
  techStack: string[];
}

export interface JDInput {
  jobDescription: string;
}

export interface InterviewContent {
  roleSummary: string;
  requiredSkills: string[];
  importantConcepts: string[];
  technicalQuestions: Question[];
  codingQuestions: Question[];
  systemDesignQuestions: Question[];
  hrQuestions: Question[];
  scenarioQuestions: Question[];
  rapidFireQuestions: Question[];
  revisionTopics: string[];
}

export interface InterviewSession {
  id: string;
  title: string;
  session_type: SessionType;
  input_data: RoleInput | JDInput;
  generated_content: InterviewContent | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_text: string;
  job_description: string;
  analysis_result: ResumeAnalysisResult | null;
  ats_score: number;
  created_at: string;
}

export interface ResumeAnalysisResult {
  atsScore: number;
  missingSkills: string[];
  weakAreas: string[];
  suggestions: string[];
  missingKeywords: string[];
  strengths: string[];
  projectRecommendations: string[];
  suggestedSummary: string;
  bulletPointImprovements: BulletPointImprovement[];
  skillsFound: string[];
  overallFeedback: string;
}

export interface BulletPointImprovement {
  original: string;
  improved: string;
  reason: string;
}
