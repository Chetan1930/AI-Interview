import type { RoleInput, MockInterviewMessage } from './types';

export function buildInterviewFromJDPrompt(jobDescription: string): string {
  return `You are an expert technical interviewer. Analyze this job description and generate comprehensive interview preparation content.

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
}

export function buildInterviewFromRolePrompt(input: RoleInput): string {
  return `You are an expert technical interviewer. Generate comprehensive interview preparation content for this profile.

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
}

export function buildResumeAnalysisPrompt(resumeText: string, jobDescription: string): string {
  return `You are an expert ATS system and technical recruiter. Analyze this resume against the job description.

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
}

export function buildMockEvaluationPrompt(
  question: string,
  answer: string,
  context: string
): string {
  return `You are a technical interviewer evaluating a candidate's answer.

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
}

export function buildNextMockQuestionPrompt(
  sessionContext: string,
  previousMessages: MockInterviewMessage[]
): string {
  const conversationHistory = previousMessages
    .map(m => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n');

  return `You are a technical interviewer conducting a mock interview.

Context: ${sessionContext}
Conversation so far:
${conversationHistory}

Ask the next interview question. Make it feel natural and conversational.
If this is the start, introduce yourself briefly and ask the first question.
Return ONLY the question text, no JSON, no extra formatting.`;
}
