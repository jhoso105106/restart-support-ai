import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createInterviewSession,
  getInterviewSessions,
  getInterviewSessionById,
  createMoodLog,
  getMoodLogs,
  getSupportResources,
  createLearningLog,
  getLearningLogs,
  completeLearningLog,
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  createMenstrualCycle,
  getMenstrualCycles,
  getMenstrualCycleById,
  updateMenstrualCycle,
  deleteMenstrualCycle,
  createWomensCareerSupport,
  getWomensCareerSupport,
  getWomensCareersupportByCategory,
} from "./db";
import { invokeLLM } from "./_core/llm";

/**
 * Self-PR generation router
 */
export const selfPRRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        experience: z.string(),
        skills: z.string(),
        achievements: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `
あなたは50代以上の求職者を支援するプロのキャリアアドバイザーです。
以下の情報を元に、応募企業に響く魅力的な自己PR文を作成してください。

【職務経歴】
${input.experience}

【スキル・専門知識】
${input.skills}

【実績・成果】
${input.achievements || "特になし"}

作成時のポイント：
- 50代ならではの「経験の深さ」「安定感」「責任感」を強調する。
- 若手にはない、問題解決能力や後進育成の視点を含める。
- 謙虚でありながらも、即戦力として貢献できる自信を感じさせるトーンにする。
- 箇条書きなどを使い、読みやすい構成（【自己PR】【強み】【実績】【今後の展望】など）にする。
- 約400〜600文字程度で構成する。

出力は自己PR本文のみを返してください。
`;

      try {
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0]?.message.content;
        if (!content || typeof content !== "string")
          throw new Error("No response from LLM");

        return { success: true, prText: content };
      } catch (error) {
        console.error("Error generating self-PR:", error);
        return { success: false, error: "自己PRの生成に失敗しました" };
      }
    }),
});

// Development mode flag for demo data
const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

// Sample interview questions for demo mode
const SAMPLE_INTERVIEW_QUESTIONS = [
  {
    id: 1,
    question: "あなたが最後の職場を退職してから現在までの間、何をしていましたか？そして、なぜこの職種に応募しようと思ったのですか？",
    tips: "ブランク期間をポジティブに説明し、再挑戦への強い動機を示すことが重要です。スキルアップや家族のための判断など、建設的な理由を述べましょう。",
  },
  {
    id: 2,
    question: "50代での転職によって、当社にはどのようなメリットがあると思いますか？",
    tips: "経験、信頼性、責任感、人間関係スキルなど、年代特有の強みを具体的に説明してください。単なる経験年数ではなく、それをどう活かすかを述べましょう。",
  },
  {
    id: 3,
    question: "新しいテクノロジーやツールを学ぶ必要が生じた場合、どのように対応しますか？",
    tips: "年代による学習能力への不安を払拭することが重要です。過去の学習経験や、継続的に新しいことに取り組む姿勢を示してください。",
  },
  {
    id: 4,
    question: "チーム内で年下の同僚や上司と働く場合、どのようにコミュニケーションを取りますか？",
    tips: "世代間のコミュニケーション能力をアピールしましょう。謙虚さ、柔軟性、そして自分の経験を押し付けない姿勢を示してください。",
  },
  {
    id: 5,
    question: "あなたの職歴の中で、最も困難だった状況とその対処方法を教えてください。",
    tips: "具体的な例を挙げ、問題解決能力と経験の豊かさをアピールしてください。50代だからこそ対応できた問題解決の例があると良いでしょう。",
  },
];

// Sample feedback for demo mode
const generateSampleFeedback = () => ({
  specificity: {
    score: 4,
    feedback: "具体的な例を挙げていることが良いです。さらに数字や期間を加えるとより説得力が増します。",
  },
  strengthCommunication: {
    score: 3,
    feedback: "経験を述べていますが、その経験がこの職種でどう活かせるかを明確に説明する必要があります。",
  },
  ageAdvantage: {
    score: 4,
    feedback: "経験豊富さをうまく伝えています。さらに、その経験から得た洞察や視点を加えると、50代の価値がより引き立ちます。",
  },
  improvementExample:
    "改善例：『20年の営業経験と3つのプロジェクト管理経験から、複雑な顧客ニーズを見極める能力が身につきました。これにより、貴社では初期段階での顧客課題を正確に理解し、対応できると確信しています。』",
});

/**
 * Interview feature router
 */
export const interviewRouter = router({
  /**
   * Generate interview questions based on job title
   */
  generateQuestions: protectedProcedure
    .input(
      z.object({
        jobTitle: z.string(),
        jobDescription: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Development mode: return sample questions
      if (DEV_MODE) {
        return { success: true, questions: SAMPLE_INTERVIEW_QUESTIONS };
      }

      const prompt = `
You are an expert career coach specializing in helping people in their 50s prepare for job interviews.
Generate 5-7 realistic interview questions for the following position:

Job Title: ${input.jobTitle}
${input.jobDescription ? `Job Description: ${input.jobDescription}` : ""}

For each question, consider:
- Common challenges for 50+ candidates (experience gaps, technology skills, career transitions)
- How to highlight decades of experience as a strength
- Addressing potential age bias concerns

Return the questions as a JSON array with this structure:
[
  { "id": 1, "question": "...", "tips": "..." },
  { "id": 2, "question": "...", "tips": "..." }
]

Only return the JSON array, no other text.
`;

      try {
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0]?.message.content;
        if (!content || typeof content !== "string")
          throw new Error("No response from LLM");

        const questions = JSON.parse(content);
        return { success: true, questions };
      } catch (error) {
        console.error("Error generating questions:", error);
        return {
          success: false,
          error: "Failed to generate interview questions",
        };
      }
    }),

  /**
   * Generate feedback for interview answer
   */
  generateFeedback: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
     // Development mode: return sample feedback
     if (DEV_MODE) {
       return { success: true, feedback: generateSampleFeedback() };
     }

     const prompt = `
You are an expert interview coach for 50+ job seekers.
Evaluate the following interview answer and provide constructive feedback.

Question: ${input.question}
Answer: ${input.answer}

Analyze the answer across these dimensions:
1. Specificity: Does the answer include concrete examples and details?
2. Strength Communication: Does it effectively convey relevant skills and experience?
3. Age Advantage: Does it position experience as a strength?

Provide feedback in this JSON format:
{
  "specificity": {
   "score": 1-5,
   "feedback": "..."
  },
  "strengthCommunication": {
   "score": 1-5,
   "feedback": "..."
  },
  "ageAdvantage": {
   "score": 1-5,
   "feedback": "..."
  },
  "improvementExample": "Here's a stronger version of your answer: ..."
}

Only return the JSON, no other text.
`;

     try {
       const response = await invokeLLM({
         messages: [{ role: "user", content: prompt }],
       });

       const content = response.choices[0]?.message.content;
       if (!content || typeof content !== "string")
         throw new Error("No response from LLM");

       const feedback = JSON.parse(content);
       return { success: true, feedback };
     } catch (error) {
       console.error("Error generating feedback:", error);
       return { success: false, error: "Failed to generate feedback" };
     }
   }),

  /**
   * Save interview session
   */
  saveSession: protectedProcedure
    .input(
      z.object({
        jobTitle: z.string(),
        jobDescription: z.string().optional(),
        questions: z.string(),
        answers: z.string(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await createInterviewSession(
          ctx.user.id,
          input.jobTitle,
          input.jobDescription || null,
          input.questions,
          input.answers,
          input.feedback || null
        );

        // Create learning log
        await createLearningLog(
          ctx.user.id,
          "interview_practice",
          `${input.jobTitle}の面接練習`,
          `職種: ${input.jobTitle}`,
          "面接練習を完了しました"
        );

        return { success: true };
      } catch (error) {
        console.error("Error saving interview session:", error);
        return { success: false, error: "Failed to save session" };
      }
    }),

  /**
   * Get interview sessions
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sessions = await getInterviewSessions(ctx.user.id);
      return { success: true, sessions };
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return { success: false, error: "Failed to fetch sessions", sessions: [] };
    }
  }),

  /**
   * Get single interview session
   */
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const session = await getInterviewSessionById(input.sessionId, ctx.user.id);
        if (!session) {
          return { success: false, error: "Session not found" };
        }
        return { success: true, session };
      } catch (error) {
        console.error("Error fetching session:", error);
        return { success: false, error: "Failed to fetch session" };
      }
    }),
});

/**
 * Mood and emotional support router
 */
export const moodRouter = router({
  /**
   * Check mood and get AI support
   */
  checkMood: protectedProcedure
    .input(
      z.object({
        moodLevel: z.number().min(1).max(5),
        moodText: z.string().optional(),
        context: z.string().optional(),
        situation: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check for crisis indicators
      const crisisKeywords = [
        "自殺",
        "死",
        "消えたい",
        "終わりにしたい",
        "自傷",
        "傷つけたい",
      ];
      const isCrisis = crisisKeywords.some((keyword) =>
        input.situation.includes(keyword)
      );

      if (isCrisis) {
        // Return crisis response without AI processing
        const crisisResponse = {
          crisisDetected: true,
          message: "あなたの安全が最優先です。以下の窓口にすぐにご相談ください。",
          resources: [
            {
              name: "厚生労働省 相談窓口",
              phone: "0570-064-556",
              hours: "24時間",
            },
            {
              name: "よりそいホットライン",
              phone: "0120-279-556",
              hours: "24時間",
            },
            {
              name: "いのちの電話",
              phone: "0570-783-556",
              hours: "24時間",
            },
          ],
        };

        // Log crisis flag
        await createMoodLog(
          ctx.user.id,
          input.moodLevel,
          input.moodText || null,
          input.context || null,
          input.situation,
          crisisResponse.message,
          "crisis_support",
          1
        );

        return crisisResponse;
      }

      // Generate empathetic AI response
      const prompt = `
You are a compassionate career coach supporting someone in their 50s going through job search challenges.
Respond with empathy and understanding to their current emotional state.

Current mood level (1-5): ${input.moodLevel}
Mood description: ${input.moodText || "Not specified"}
Context: ${input.context || "Daily check"}
Situation: ${input.situation}

Provide:
1. Empathetic acknowledgment of their feelings
2. Reframe their situation positively (without dismissing concerns)
3. Suggest a next action (interview practice, consult window, community activity, rest)

Keep response warm, genuine, and under 200 words.
`;

      try {
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0]?.message.content;
        const aiResponse = typeof content === "string" ? content : "";

        // Determine suggested action based on mood
        let suggestedAction = "rest";
        if (input.moodLevel >= 4) {
          suggestedAction = "practice_interview";
        } else if (input.moodLevel === 3) {
          suggestedAction = "consult_window";
        } else if (input.moodLevel <= 2) {
          suggestedAction = "community_activity";
        }

        // Save mood log
        await createMoodLog(
          ctx.user.id,
          input.moodLevel,
          input.moodText || null,
          input.context || null,
          input.situation,
          aiResponse,
          suggestedAction,
          0
        );

        return {
          success: true,
          crisisDetected: false,
          aiResponse,
          suggestedAction,
        };
      } catch (error) {
        console.error("Error generating mood response:", error);
        return {
          success: false,
          error: "Failed to process mood check",
        };
      }
    }),

  /**
   * Get mood logs
   */
  getLogs: protectedProcedure.query(async ({ ctx }) => {
    try {
      const logs = await getMoodLogs(ctx.user.id);
      return { success: true, logs };
    } catch (error) {
      console.error("Error fetching mood logs:", error);
      return { success: false, error: "Failed to fetch logs", logs: [] };
    }
  }),
});

/**
 * Support resources router
 */
export const supportRouter = router({
  /**
   * Get support resources by category and area
   */
  getResources: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        targetArea: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const resources = await getSupportResources(
          input.category,
          input.targetArea
        );
        return { success: true, resources };
      } catch (error) {
        console.error("Error fetching resources:", error);
        return {
          success: false,
          error: "Failed to fetch resources",
          resources: [],
        };
      }
    }),
});

/**
 * Learning router
 */
export const learningRouter = router({
  /**
   * Get learning logs
   */
  getLogs: protectedProcedure.query(async ({ ctx }) => {
    try {
      const logs = await getLearningLogs(ctx.user.id);
      return { success: true, logs };
    } catch (error) {
      console.error("Error fetching learning logs:", error);
      return { success: false, error: "Failed to fetch logs", logs: [] };
    }
  }),

  /**
   * Complete learning activity
   */
  complete: protectedProcedure
    .input(z.object({ logId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await completeLearningLog(input.logId);
        return { success: true };
      } catch (error) {
        console.error("Error completing learning log:", error);
        return { success: false, error: "Failed to complete activity" };
      }
    }),
});

/**
 * User profile router
 */
export const profileRouter = router({
  /**
   * Get or create user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      let profile = await getUserProfile(ctx.user.id);

      if (!profile) {
        await createUserProfile(ctx.user.id);
        profile = await getUserProfile(ctx.user.id);
      }

      return { success: true, profile };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return { success: false, error: "Failed to fetch profile" };
    }
  }),

  /**
   * Update user profile
   */
  update: protectedProcedure
    .input(
      z.object({
        bio: z.string().optional(),
        targetJobTitle: z.string().optional(),
        yearsOfExperience: z.number().optional(),
        skills: z.array(z.string()).optional(),
        preferredArea: z.string().optional(),
        prefectureCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const updates: Record<string, unknown> = {};
        if (input.bio !== undefined) updates.bio = input.bio;
        if (input.targetJobTitle !== undefined)
          updates.targetJobTitle = input.targetJobTitle;
        if (input.yearsOfExperience !== undefined)
          updates.yearsOfExperience = input.yearsOfExperience;
        if (input.skills !== undefined)
          updates.skills = JSON.stringify(input.skills);
        if (input.preferredArea !== undefined)
          updates.preferredArea = input.preferredArea;
        if (input.prefectureCode !== undefined)
          updates.prefectureCode = input.prefectureCode;

        await updateUserProfile(ctx.user.id, updates);
        return { success: true };
      } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile" };
      }
    }),
});

/**
 * Femtech router - Women's health and career support
 */
export const femtechRouter = router({
  /**
   * Create menstrual cycle record
   */
  createMenstrualCycle: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date().optional(),
        symptoms: z.array(z.string()).optional(),
        flow: z.enum(["light", "moderate", "heavy"]).optional(),
        mood: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await createMenstrualCycle(
          ctx.user.id,
          input.startDate,
          input.endDate || null,
          input.symptoms || null,
          input.flow || null,
          input.mood || null,
          input.notes || null
        );
        return { success: true };
      } catch (error) {
        console.error("Error creating menstrual cycle:", error);
        return { success: false, error: "Failed to create menstrual cycle" };
      }
    }),

  /**
   * Get menstrual cycles
   */
  getMenstrualCycles: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cycles = await getMenstrualCycles(ctx.user.id);
      return { success: true, cycles };
    } catch (error) {
      console.error("Error fetching menstrual cycles:", error);
      return { success: false, error: "Failed to fetch cycles", cycles: [] };
    }
  }),

  /**
   * Update menstrual cycle
   */
  updateMenstrualCycle: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        endDate: z.date().optional(),
        symptoms: z.array(z.string()).optional(),
        flow: z.enum(["light", "moderate", "heavy"]).optional(),
        mood: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const updates: Record<string, unknown> = {};
        if (input.endDate !== undefined) updates.endDate = input.endDate;
        if (input.symptoms !== undefined)
          updates.symptoms = JSON.stringify(input.symptoms);
        if (input.flow !== undefined) updates.flow = input.flow;
        if (input.mood !== undefined) updates.mood = input.mood;
        if (input.notes !== undefined) updates.notes = input.notes;

        await updateMenstrualCycle(input.id, ctx.user.id, updates);
        return { success: true };
      } catch (error) {
        console.error("Error updating menstrual cycle:", error);
        return { success: false, error: "Failed to update cycle" };
      }
    }),

  /**
   * Delete menstrual cycle
   */
  deleteMenstrualCycle: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await deleteMenstrualCycle(input.id, ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("Error deleting menstrual cycle:", error);
        return { success: false, error: "Failed to delete cycle" };
      }
    }),

  /**
   * Get women's career support
   */
  getCareerSupport: protectedProcedure.query(async ({ ctx }) => {
    try {
      const support = await getWomensCareerSupport(ctx.user.id);
      return { success: true, support };
    } catch (error) {
      console.error("Error fetching career support:", error);
      return {
        success: false,
        error: "Failed to fetch career support",
        support: [],
      };
    }
  }),

  /**
   * Get women's career support by category
   */
  getCareerSupportByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const support = await getWomensCareersupportByCategory(
          ctx.user.id,
          input.category
        );
        return { success: true, support };
      } catch (error) {
        console.error("Error fetching career support by category:", error);
        return { success: false, error: "Failed to fetch support" };
      }
    }),

  /**
   * Generate women's career support advice
   */
  generateCareerAdvice: protectedProcedure
    .input(
      z.object({
        category: z.enum([
          "child_rearing",
          "career_resume",
          "work_life_balance",
          "interview_for_mothers",
        ]),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const categoryPrompts: Record<string, string> = {
        child_rearing: `You are a career coach specializing in supporting working mothers and parents in their 50s.
Provide compassionate, practical advice on balancing childcare responsibilities with career ambitions.
Consider: flexible work arrangements, negotiation strategies, time management, and building support networks.
Keep the response warm, actionable, and under 300 words.`,

        career_resume: `You are a career coach helping women return to the workforce after career breaks (e.g., raising children).
Provide practical advice on re-entering the job market, updating skills, addressing employment gaps in interviews.
Focus on: highlighting transferable skills, addressing concerns positively, and building confidence.
Keep the response encouraging and practical, under 300 words.`,

        work_life_balance: `You are a career coach specializing in work-life balance for women in their 50s.
Provide advice on maintaining health, relationships, and career goals while managing multiple responsibilities.
Cover: setting boundaries, prioritizing self-care, managing stress, and communicating with employers.
Keep the response supportive and actionable, under 300 words.`,

        interview_for_mothers: `You are an interview coach helping mothers and caregivers prepare for job interviews.
Provide tips on addressing employment gaps, discussing flexibility needs, and positioning caregiving experience as a strength.
Focus on: confidence-building, honest communication, and showing how caregiving skills apply to the job.
Keep the response practical and encouraging, under 300 words.`,
      };

      const prompt = `${categoryPrompts[input.category]}
${input.context ? `\nAdditional context: ${input.context}` : ""}
Provide your response as supportive, practical advice.`;

      try {
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0]?.message.content;
        const advice =
          typeof content === "string"
            ? content
            : "Failed to generate advice";

        // Save the advice
        await createWomensCareerSupport(ctx.user.id, input.category, advice);

        return { success: true, advice };
      } catch (error) {
        console.error("Error generating career advice:", error);
        return {
          success: false,
          error: "Failed to generate career advice",
        };
      }
    }),
});
