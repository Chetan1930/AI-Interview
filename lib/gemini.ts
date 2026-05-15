import { GoogleGenerativeAI } from '@google/generative-ai';
import type { InterviewContent, ResumeAnalysisResult, RoleInput, MockInterviewMessage } from './types';

/** Stable model for generateContent; 1.5 short names are often retired from v1beta (404). */
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function getGeminiModel(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    process.env.NEXT_PUBLIC_GEMINI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL
  );
}

function getClient() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenerativeAI(apiKey);
}

async function generateJSON<T>(prompt: string): Promise<T> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModel() });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

export async function generateInterviewFromJD(jobDescription: string): Promise<InterviewContent> {
  const prompt = `You are an expert technical interviewer. Analyze this job description and generate comprehensive interview preparation content.

Job Description:
${jobDescription}

Return a JSON object with this exact structure:
{
  "roleSummary": "2-3 sentence summary of the role",
  "requiredSkills": ["skill1", "skill2"],
  "importantConcepts": ["concept1", "concept2"],
  "technicalQuestions": [
    {
      "id": "unique_id",
      "question": "question text",
      "answer": "detailed answer",
      "explanation": "deep technical explanation",
      "realWorldRelevance": "how this is used in real projects",
      "followUpQuestions": ["follow-up 1", "follow-up 2"],
      "difficulty": "easy|medium|hard",
      "category": "technical"
    }
  ],
  "codingQuestions": [...same structure with category: "coding"],
  "systemDesignQuestions": [...same structure with category: "system-design"],
  "hrQuestions": [...same structure with category: "hr"],
  "scenarioQuestions": [...same structure with category: "scenario"],
  "rapidFireQuestions": [...same structure with category: "rapid-fire"],
  "revisionTopics": ["topic1", "topic2"]
}

Generate:
- 8-10 technical questions (mix of easy/medium/hard)
- 5-6 coding questions (mix of easy/medium/hard)
- 4-5 system design questions (medium/hard)
- 6-8 HR questions (easy/medium)
- 4-5 scenario questions (medium/hard)
- 10-15 rapid fire questions (easy/medium)
- 10-12 revision topics

Return ONLY the JSON, no markdown.`;

  return generateJSON<InterviewContent>(prompt);
}

export async function generateInterviewFromRole(input: RoleInput): Promise<InterviewContent> {
  const prompt = `You are an expert technical interviewer. Generate comprehensive interview preparation content for this profile.

Role: ${input.role}
Experience Level: ${input.experienceLevel}
Tech Stack: ${input.techStack.join(', ')}

Return a JSON object with this exact structure:
{
  "roleSummary": "2-3 sentence summary of what this role entails",
  "requiredSkills": ["skill1", "skill2"],
  "importantConcepts": ["concept1", "concept2"],
  "technicalQuestions": [
    {
      "id": "tech_1",
      "question": "question text",
      "answer": "detailed answer",
      "explanation": "deep technical explanation with examples",
      "realWorldRelevance": "how this is used in real production systems",
      "followUpQuestions": ["follow-up 1", "follow-up 2"],
      "difficulty": "easy",
      "category": "technical"
    }
  ],
  "codingQuestions": [...same structure, category: "coding"],
  "systemDesignQuestions": [...same structure, category: "system-design"],
  "hrQuestions": [...same structure, category: "hr"],
  "scenarioQuestions": [...same structure, category: "scenario"],
  "rapidFireQuestions": [...same structure, category: "rapid-fire"],
  "revisionTopics": ["topic1", "topic2"]
}

Calibrate question difficulty to experience level: ${input.experienceLevel}
Focus heavily on: ${input.techStack.join(', ')}

Generate:
- 8-10 technical questions
- 5-6 coding questions
- 4-5 system design questions
- 6-8 HR questions
- 4-5 scenario questions
- 10-15 rapid fire questions
- 10-12 revision topics

Return ONLY valid JSON, no markdown.`;

  return generateJSON<InterviewContent>(prompt);
}

export async function analyzeResumeVsJD(
  resumeText: string,
  jobDescription: string
): Promise<ResumeAnalysisResult> {
  const prompt = `You are an expert ATS system and technical recruiter. Analyze this resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return a JSON object with this exact structure:
{
  "atsScore": 75,
  "skillsFound": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "weakAreas": ["area1", "area2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "strengths": ["strength1", "strength2"],
  "projectRecommendations": ["recommendation1", "recommendation2"],
  "suggestedSummary": "A compelling 3-4 sentence professional summary tailored to this JD",
  "bulletPointImprovements": [
    {
      "original": "original bullet from resume",
      "improved": "improved version with metrics and impact",
      "reason": "why this improvement helps"
    }
  ],
  "overallFeedback": "2-3 sentence overall assessment"
}

ATS score should be 0-100 based on keyword match, skill alignment, experience match, and format.
Provide at least 3-5 items in each array. Be specific and actionable.

Return ONLY valid JSON, no markdown.`;

  return generateJSON<ResumeAnalysisResult>(prompt);
}

export async function evaluateMockAnswer(
  question: string,
  answer: string,
  context: string
): Promise<NonNullable<MockInterviewMessage['evaluation']>> {
  const prompt = `You are a technical interviewer evaluating a candidate's answer.

Question: ${question}
Context: ${context}
Candidate's Answer: ${answer}

Return a JSON object:
{
  "correctness": 85,
  "confidence": 70,
  "missingPoints": ["point1", "point2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Return ONLY valid JSON.`;

  return generateJSON<NonNullable<MockInterviewMessage['evaluation']>>(prompt);
}

export async function getNextMockQuestion(
  sessionContext: string,
  previousMessages: MockInterviewMessage[]
): Promise<string> {
  const conversationHistory = previousMessages
    .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a technical interviewer conducting a mock interview.

Context: ${sessionContext}
Conversation so far:
${conversationHistory}

Ask the next interview question. Make it feel natural and conversational.
If this is the start, introduce yourself briefly and ask the first question.
Return ONLY the question text, no JSON, no extra formatting.`;

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModel() });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
