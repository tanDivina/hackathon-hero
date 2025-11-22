import { geminiService } from './geminiService';

export interface ParsedRulesData {
  deadline: string;
  sponsors: string[];
  judgingCriteria: string[];
  prizes: string[];
}

export interface OptimizedPromptData {
  prompt: string;
  wordCount: number;
}

export interface PitchScriptData {
  problem: string;
  solution: string;
  traction: string;
  fullScript: string;
}

export interface DemoScriptData {
  problem: string;
  solution: string;
  traction: string;
  requirements: string;
  tools: string;
  realworld_use: string;
  fullScript: string;
}

export interface GeneratedIdeaData {
  idea: string;
  category: string;
  reasoning: string;
  sponsorAlignment: string;
}

export interface IntroPitchData {
  who: string;
  what: string;
  why: string;
  fullScript: string;
}

export const aiService = {
  async fetchUrlContent(url: string): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-hackathon-rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL content');
    }

    const data = await response.json();
    return data.text;
  },

  async parseRules(rulesText: string): Promise<ParsedRulesData> {
    const prompt = `Analyze the following hackathon rules and extract key information. Return ONLY a JSON object with this exact structure:

{
  "deadline": "exact deadline text or 'No specific deadline found'",
  "sponsors": ["sponsor1", "sponsor2", ...] or ["No sponsors identified"],
  "judgingCriteria": ["criterion1", "criterion2", ...] or ["No criteria identified"],
  "prizes": ["prize1 description", "prize2 description", ...] or ["No prizes identified"]
}

Rules to analyze:
${rulesText}

Important:
- Extract the complete deadline information including date and time
- SPONSORS: Look for companies, organizations, platforms, or brands explicitly mentioned as sponsors, partners, or providing prizes/tracks. Include any company names mentioned in prize categories or special tracks (e.g., "Best use of X API" means X is a sponsor). Do NOT include general terms.
- List all judging criteria or evaluation points
- PRIZES: List all prizes with amounts and descriptions (e.g., "1st Place: $5000", "Best Use of AI: $1000"). Include both overall prizes and sponsor-specific prizes/tracks.
- Return valid JSON only, no additional text`;

    try {
      const result = await geminiService.parseJSON<ParsedRulesData>(prompt);
      return result;
    } catch (error) {
      console.error('Failed to parse rules with Gemini:', error);
      return {
        deadline: 'Failed to parse deadline',
        sponsors: ['Error parsing sponsors'],
        judgingCriteria: ['Error parsing criteria'],
        prizes: ['Error parsing prizes'],
      };
    }
  },

  async generateIdea(rulesData: { deadline: string; sponsors: string[]; judgingCriteria: string[] }): Promise<GeneratedIdeaData> {
    const hasRealSponsors = rulesData.sponsors.length > 0 &&
                            !rulesData.sponsors.some(s => s.toLowerCase().includes('no sponsor') || s.toLowerCase().includes('not identified'));

    // Build sponsor context with explicit clarifications
    const sponsorContext = hasRealSponsors ? `
SPONSORS: ${rulesData.sponsors.join(', ')}

CRITICAL INSTRUCTION ON SPONSORS:
Do not hallucinate APIs or user bases that do not exist.

1. Analyze each sponsor name in the context of a "Developer Hackathon"
2. SPONSOR TYPE CLASSIFICATION:
   - INFRASTRUCTURE SPONSORS (Database, Hosting, Framework, Builder): The idea is BUILT ON this platform
     Examples: Supabase, Vercel, Railway, Bolt.new
   - API/FEATURE SPONSORS (Services, APIs): The idea USES this API for a specific feature
     Examples: OpenAI, Stripe, Twilio, SendGrid
   - CONSUMER BRAND SPONSORS: Usually event sponsors only, may not have developer tools
     Examples: Coca-Cola, Nike (only mention if they have relevant APIs)

3. SPECIAL CASE - "Bolt":
   - If "Bolt" is mentioned, it refers to "Bolt.new" (StackBlitz's AI-Powered Web App Builder), NOT Bolt checkout/payments
   - DO NOT mention: "Bolt Shoppers", "Bolt Loyalty Programs", "Bolt Checkout", "Bolt Payment Gateway"
   - CORRECT usage: "Built using Bolt.new's full-stack development environment"
   - The app is BUILT ON Bolt, not ABOUT Bolt

4. INTEGRATION RULES:
   - Infrastructure Sponsors: Mention as part of the tech stack ("Built on [Platform]")
   - API Sponsors: Mention as a feature implementation ("Uses [API] for [specific function]")
   - If a sponsor has no relevant developer tools, DO NOT force them into the idea`
    : `
SPONSORS: None identified

Focus purely on the judging criteria and solving real problems with appropriate technology.`;

    const prompt = `You are an expert Hackathon Strategy Coach. Generate a high-potential winning project idea based on specific hackathon rules and sponsors.

HACKATHON DETAILS:
${sponsorContext}

JUDGING CRITERIA:
${rulesData.judgingCriteria.join('\n')}

DEADLINE: ${rulesData.deadline}

TASK - GENERATE AN IDEA THAT:
1. Solves a real, specific problem (NOT a meta-hackathon preparation tool)
2. Directly addresses the judging criteria listed above
3. Is technically feasible within the deadline
4. Is innovative and stands out from typical submissions
5. Has clear practical value for real users
6. Properly integrates sponsor technology (if applicable) according to the rules above

CRITICAL RULES:
- Be creative and specific
- Focus on solving real-world problems for real user groups
- Do not make up fake user groups, fake APIs, or non-existent products
- Do not force sponsor integration where it doesn't make sense
- If a sponsor is infrastructure, mention it's built on that platform
- If a sponsor is an API, mention specific features that use it

OUTPUT FORMAT (JSON only):
{
  "idea": "Specific project description addressing a real problem (2-3 sentences)",
  "category": "Project category aligned with hackathon theme",
  "reasoning": "Explain how this directly meets each judging criterion (2-3 sentences)",
  "sponsorAlignment": "Technical stack and sponsor integration specifics (2-3 sentences)"
}

Return valid JSON only, no additional text.`;

    try {
      const result = await geminiService.parseJSON<GeneratedIdeaData>(prompt);
      return result;
    } catch (error) {
      console.error('Failed to generate idea with Gemini:', error);
      return {
        idea: 'A smart task prioritization app that helps users manage their daily activities by analyzing deadlines, importance, and energy levels to suggest the optimal order of tasks.',
        category: 'Productivity Tool',
        reasoning: 'Addresses time management and decision fatigue by providing intelligent recommendations based on personal patterns and constraints.',
        sponsorAlignment: 'Built with modern web technologies including React, TypeScript, and a backend database for storing user preferences and task history.',
      };
    }
  },

  async optimizePrompt(idea: string): Promise<OptimizedPromptData> {
    const systemInstruction = `You are an expert at creating detailed technical specifications for hackathon projects. Generate comprehensive, actionable prompts that include specific technology choices, architecture decisions, and implementation details.`;

    const userPrompt = `Create a detailed technical prompt for building this hackathon project: "${idea}"

The prompt should include:
- Specific technology stack (React, TypeScript, Tailwind CSS, Supabase)
- Architecture and component structure
- Database schema design
- Key features and functionality
- UX/UI considerations
- Code quality requirements
- Deployment considerations

Make it actionable and comprehensive for a developer to implement. The prompt should be at least 250 words.`;

    try {
      const optimizedPrompt = await geminiService.generateContent(userPrompt, systemInstruction);
      const wordCount = optimizedPrompt.split(/\s+/).length;

      return {
        prompt: optimizedPrompt,
        wordCount,
      };
    } catch (error) {
      console.error('Failed to optimize prompt with Gemini:', error);
      const fallbackPrompt = `Build a production-ready hackathon submission for: ${idea}

Use React with TypeScript and Tailwind CSS for the frontend. Integrate Supabase for database and authentication. Create a modular architecture with reusable components. Implement proper error handling and loading states. Design an intuitive UI with smooth animations. Ensure responsive design across all devices. Follow React best practices and TypeScript conventions.`;

      return {
        prompt: fallbackPrompt,
        wordCount: fallbackPrompt.split(/\s+/).length,
      };
    }
  },

  async generateIntroPitch(idea: string, yourName?: string): Promise<IntroPitchData> {
    const prompt = `Create a 20-second intro pitch for this project: "${idea}"

The pitch must answer three questions in 20 seconds total:
- Who you are (introduce yourself/team)
- What you're building (project description)
- Why you're building it (motivation/problem)

${yourName ? `User's name: ${yourName}` : ''}

Return ONLY a JSON object with this exact structure:

{
  "who": "6-7 second introduction",
  "what": "6-7 second project description",
  "why": "6-7 second motivation"
}

Guidelines:
- Each section should be ONE concise sentence
- Total should be speakable in 20 seconds
- Be direct and impactful
- Use first person ("I'm", "We're", "I'm building")
- Make it conversational and energetic
- Return valid JSON only`;

    try {
      const result = await geminiService.parseJSON<{who: string; what: string; why: string}>(prompt);
      const fullScript = `WHO YOU ARE (6-7s):\n${result.who}\n\nWHAT YOU'RE BUILDING (6-7s):\n${result.what}\n\nWHY YOU'RE BUILDING IT (6-7s):\n${result.why}`;

      return {
        ...result,
        fullScript,
      };
    } catch (error) {
      console.error('Failed to generate intro pitch with Gemini:', error);
      return {
        who: `Hi, I'm ${yourName || 'a developer'} passionate about helping hackathon participants succeed.`,
        what: "I'm building an AI-powered platform that helps teams prepare winning hackathon submissions.",
        why: "Because too many great projects lose simply because teams don't know how to present effectively.",
        fullScript: `WHO YOU ARE (6-7s):\nHi, I'm ${yourName || 'a developer'} passionate about helping hackathon participants succeed.\n\nWHAT YOU'RE BUILDING (6-7s):\nI'm building an AI-powered platform that helps teams prepare winning hackathon submissions.\n\nWHY YOU'RE BUILDING IT (6-7s):\nBecause too many great projects lose simply because teams don't know how to present effectively.`,
      };
    }
  },

  async generatePitchScript(idea: string): Promise<PitchScriptData> {
    const prompt = `Create a 3-minute elevator pitch script for this project: "${idea}"

Structure the pitch using the Problem-Solution-Traction framework. Return ONLY a JSON object with this exact structure:

{
  "problem": "60-second problem description",
  "solution": "90-second solution description",
  "traction": "30-second traction description"
}

Guidelines:
- PROBLEM (60s): Describe the pain point clearly and emotionally. Make it relatable.
- SOLUTION (90s): Explain your solution, key features, and how it works. Be specific.
- TRACTION (30s): Share validation, metrics, market size, and business model.
- Use conversational language suitable for a pitch
- Be compelling and concise
- Return valid JSON only`;

    try {
      const result = await geminiService.parseJSON<{problem: string; solution: string; traction: string}>(prompt);
      const fullScript = `PROBLEM (60 seconds):\n${result.problem}\n\nSOLUTION (90 seconds):\n${result.solution}\n\nTRACTION (30 seconds):\n${result.traction}`;

      return {
        ...result,
        fullScript,
      };
    } catch (error) {
      console.error('Failed to generate pitch script with Gemini:', error);
      return {
        problem: 'Many hackathon participants build great projects but struggle to communicate their value effectively, resulting in missed opportunities.',
        solution: `Our platform helps participants create professional presentations by providing AI-powered tools for rules parsing, idea generation, and script writing.`,
        traction: 'Early testing shows increased confidence and better organization. We are targeting the growing hackathon market with a freemium model.',
        fullScript: 'PROBLEM (60s):\nMany hackathon participants build great projects but struggle to communicate their value effectively.\n\nSOLUTION (90s):\nOur platform helps with AI-powered preparation tools.\n\nTRACTION (30s):\nEarly validation with freemium model.',
      };
    }
  },

  async chatWithRules(question: string, rulesContext: string): Promise<string> {
    const prompt = `You are a hackathon strategy advisor. Answer the user's question about their hackathon based on the complete rules document provided below.

${rulesContext}

USER QUESTION:
${question}

Provide a helpful, concise answer that:
- Directly addresses the question using information from the full rules document
- References specific rules, prizes, sponsors, criteria, or other details when relevant
- Offers strategic advice where appropriate
- Keeps responses under 150 words unless more detail is needed to fully answer

Return only your answer as plain text, no JSON.`;

    try {
      const result = await geminiService.generateContent(prompt);
      return result;
    } catch (error) {
      console.error('Failed to chat with rules:', error);
      return 'Sorry, I encountered an error processing your question. Please try again.';
    }
  },

  async generateDemoScript(idea: string, rulesData?: { deadline: string; sponsors: string[]; judgingCriteria: string[] }, githubUrl?: string): Promise<DemoScriptData> {
    const contextInfo = rulesData ? `
Hackathon Context:
- Deadline: ${rulesData.deadline}
- Sponsors: ${rulesData.sponsors.join(', ')}
- Judging Criteria: ${rulesData.judgingCriteria.join(', ')}
${githubUrl ? `- GitHub: ${githubUrl}` : ''}
` : '';

    const prompt = `Create a 3-minute demo video script for this project: "${idea}"

${contextInfo}

Structure as a demo video with 6 sections. Return ONLY a JSON object with this exact structure:

{
  "problem": "45-second problem statement",
  "requirements": "30-second hackathon requirements alignment",
  "solution": "60-second solution and features demonstration",
  "tools": "30-second technical stack description",
  "realworld_use": "30-second real-world use cases",
  "traction": "15-second validation and traction"
}

Guidelines:
- PROBLEM (45s): Explain the problem this project solves
- REQUIREMENTS (30s): Show how it meets hackathon judging criteria${rulesData ? ' and uses sponsor technologies' : ''}
- SOLUTION (60s): Demonstrate key features and how they work
- TOOLS (30s): Describe the tech stack${githubUrl ? ' and mention the GitHub repo' : ''}
- REAL-WORLD USE (30s): Explain who benefits and how
- TRACTION (15s): Share metrics, validation, market opportunity
- Use demo-appropriate language (present tense, show features)
- Return valid JSON only`;

    try {
      const result = await geminiService.parseJSON<{
        problem: string;
        requirements: string;
        solution: string;
        tools: string;
        realworld_use: string;
        traction: string;
      }>(prompt);

      const fullScript = `PROBLEM (45 seconds):\n${result.problem}\n\nREQUIREMENTS (30 seconds):\n${result.requirements}\n\nSOLUTION (60 seconds):\n${result.solution}\n\nTOOLS & TECH STACK (30 seconds):\n${result.tools}\n\nREAL-WORLD USE (30 seconds):\n${result.realworld_use}\n\nTRACTION (15 seconds):\n${result.traction}`;

      return {
        ...result,
        fullScript,
      };
    } catch (error) {
      console.error('Failed to generate demo script with Gemini:', error);
      return {
        problem: 'Many developers build great hackathon projects but struggle with effective demonstrations.',
        requirements: 'This project addresses the hackathon criteria with innovative features and sponsor technology integration.',
        solution: 'Our platform provides tools for rules parsing, idea generation, script writing, and video creation.',
        tools: 'Built with React, TypeScript, Tailwind CSS, and Supabase for a modern, scalable stack.',
        realworld_use: 'Helps participants save time, increase confidence, and create professional submissions.',
        traction: 'Early validation shows increased success rates with freemium model targeting the hackathon market.',
        fullScript: 'PROBLEM (45s):\nMany developers struggle with demos.\n\nREQUIREMENTS (30s):\nMeets hackathon criteria.\n\nSOLUTION (60s):\nProvides preparation tools.\n\nTOOLS (30s):\nReact, TypeScript, Supabase.\n\nREAL-WORLD USE (30s):\nSaves time, builds confidence.\n\nTRACTION (15s):\nEarly validation, freemium model.',
      };
    }
  },

  async generateAlternativeSections(
    sectionType: 'problem' | 'solution' | 'traction' | 'requirements' | 'tools' | 'realworld_use',
    originalContent: string,
    context: { idea: string; scriptType: 'pitch' | 'demo' }
  ): Promise<string[]> {
    const prompt = `Generate 3 alternative versions for the "${sectionType}" section of a ${context.scriptType} script.

Project: ${context.idea}

Current ${sectionType} section:
"${originalContent}"

Create 3 different variations that:
- Maintain the same core message
- Use different phrasing and examples
- Keep approximately the same length
- Sound natural and compelling

Return ONLY a JSON array of 3 strings: ["alternative 1", "alternative 2", "alternative 3"]`;

    try {
      const alternatives = await geminiService.parseJSON<string[]>(prompt);
      return alternatives.slice(0, 3);
    } catch (error) {
      console.error('Failed to generate alternatives with Gemini:', error);

      const fallbackAlternatives: Record<string, string[]> = {
      problem: [
        `Current solutions in this space are fragmented, leaving users to juggle multiple tools and platforms to accomplish what should be a streamlined workflow. This fragmentation creates friction, increases cognitive load, and often results in incomplete execution. Users spend more time managing their tools than actually making progress on their goals. The lack of integration between different platforms means data doesn't flow smoothly, leading to duplicate work and potential errors. Without a unified approach, users miss opportunities to leverage insights across different stages of their process, ultimately hampering their effectiveness and outcomes.`,
        `Teams and individuals face a significant challenge: they know what they want to achieve but struggle with the execution details. The gap between vision and implementation is wide, especially for those without extensive experience in this domain. Existing resources are either too basic to be useful or too advanced to be accessible, leaving a crucial middle ground underserved. This knowledge gap leads to suboptimal decisions, wasted effort, and missed opportunities. Users need guided support that adapts to their skill level while helping them achieve professional-quality results without years of trial and error.`,
        `The current approach to this problem is reactive rather than proactive, forcing users to address issues only after they arise. This reactive mindset creates stress, wastes time, and often leads to rushed, lower-quality outputs. Users lack the strategic framework and tools to plan effectively from the start, resulting in constant course corrections and rework. The absence of best practices and proven templates means everyone is reinventing the wheel, learning the same lessons the hard way. A more strategic, proactive solution would save significant time and improve outcomes dramatically.`,
      ],
      solution: [
        `Our platform tackles this problem through an intelligent, integrated approach that combines automation with human guidance. We provide a comprehensive toolkit that covers the entire workflow from initial planning through final execution. The system learns from successful patterns and applies those insights to help users make better decisions at every step. Key features include smart templates that adapt to specific needs, automated quality checks that catch issues early, and seamless integrations that connect all necessary tools in one unified interface. Users experience a dramatic reduction in friction and a corresponding increase in both speed and quality.`,
        `We solve this by providing structured guidance combined with powerful automation. Our solution breaks down complex processes into manageable steps, offering clear direction while maintaining flexibility for customization. The platform includes intelligent recommendation engines that suggest best practices based on the user's specific context and goals. Real-time feedback helps users understand what's working and what needs adjustment before investing too much time in the wrong direction. The result is a system that makes professional-grade work accessible to everyone, regardless of their experience level, while still offering depth for advanced users.`,
        `Our approach centers on proactive intelligence that anticipates user needs and automates repetitive tasks. The platform provides strategic frameworks based on proven methodologies, giving users a clear roadmap from start to finish. We've integrated AI-powered assistants that offer contextual suggestions and catch potential issues before they become problems. The system includes comprehensive analytics that help users understand their progress and optimize their approach over time. By combining strategic planning tools with tactical execution features, we enable users to work smarter, not harder, achieving better results in less time.`,
      ],
      traction: [
        `Early validation from our target users has been overwhelmingly positive. Beta testers report measurable improvements in efficiency and output quality, with many describing the platform as essential to their workflow. We've achieved strong engagement metrics with users returning consistently and recommending the solution to peers. The technology foundation is robust and scalable, built using modern, production-ready infrastructure. Our go-to-market strategy targets a substantial addressable market with clear monetization paths through freemium conversion and enterprise offerings.`,
        `We've demonstrated product-market fit through extensive user testing and validation. Our pilot program showed that users achieve their goals significantly faster while maintaining or improving quality. The platform has been stress-tested across diverse use cases, proving its versatility and reliability. We're strategically positioned in a growing market with strong tailwinds and increasing demand. Our business model includes multiple revenue streams including subscription tiers, premium features, and potential enterprise licensing, creating a sustainable path to profitability.`,
        `Traction indicators are strong across multiple dimensions. User feedback consistently highlights time savings, quality improvements, and reduced stress as key benefits. Our technical infrastructure is production-ready and designed to scale efficiently. We're addressing a large and growing market opportunity with minimal direct competition in our specific niche. The freemium model creates a low barrier to entry while premium features drive conversion. Strategic partnerships with complementary platforms open additional growth channels and strengthen our value proposition.`,
      ],
      requirements: [
        `This project directly addresses the core hackathon evaluation criteria through thoughtful feature selection and implementation. We've carefully aligned every major component with the judging rubric, ensuring our work demonstrates innovation, technical competence, and practical value. The solution showcases creative problem-solving while maintaining professional code quality and architectural integrity. We've integrated relevant sponsor technologies naturally into our platform, demonstrating both technical versatility and ecosystem awareness. All work was completed within the competition timeframe, with comprehensive documentation proving our development timeline and technical decisions.`,
        `Our submission meets all hackathon requirements while exceeding expectations in key areas. The judges will find clear evidence of innovation in our approach to solving the identified problem. Technical implementation demonstrates strong engineering fundamentals including scalable architecture, clean code practices, and robust error handling. Real-world applicability is evident through user-centered design and practical feature choices. We've strategically incorporated sponsor platforms in ways that enhance functionality rather than feeling forced, showing genuine platform expertise and commitment to the ecosystem.`,
        `We've architected this project specifically around the hackathon's judging criteria and constraints. Innovation shines through our unique approach to a real problem faced by the target audience. Technical execution demonstrates production-grade quality with attention to performance, security, and maintainability. The solution delivers tangible value with features that users would actually want and use. Sponsor technology integration is thoughtful and meaningful, adding genuine capability to the platform. Every aspect of our submission was built during the competition period, with clear documentation of our process and decisions.`,
      ],
      tools: [
        `Our technology stack combines modern, well-supported frameworks with proven scalability. The frontend leverages React with TypeScript for type-safe component development and Tailwind CSS for rapid, consistent styling. Backend services run on Supabase, providing PostgreSQL database, authentication, real-time capabilities, and Row Level Security. Build tooling uses Vite for fast development iterations and optimized production builds. We've chosen technologies that balance developer experience with performance and maintainability, ensuring the codebase remains manageable as features grow while delivering snappy user experiences.`,
        `We built this platform using a carefully selected stack that prioritizes both capability and velocity. React and TypeScript form our frontend foundation, enabling robust component architecture with compile-time safety. Tailwind CSS accelerates UI development while maintaining design consistency. Supabase powers our backend infrastructure, offering database management, user authentication, and serverless functions in one integrated platform. Supporting tools include FFmpeg for media processing and Lucide React for iconography. This stack enabled us to build quickly without sacrificing code quality or future scalability.`,
        `The technical architecture utilizes production-ready technologies chosen for their reliability and developer ergonomics. Our frontend stack combines React's component model with TypeScript's type system for maintainable, bug-resistant code. Tailwind CSS provides utility-first styling that accelerates development while keeping the design system coherent. Supabase delivers a complete backend solution including PostgreSQL database, built-in authentication, and real-time subscriptions. Additional integrations include modern build tools and libraries that enhance functionality without adding unnecessary complexity. This technology selection demonstrates both technical competence and practical decision-making.`,
      ],
      realworld_use: [
        `End users benefit immediately from reduced complexity and increased efficiency. The platform eliminates common pain points by automating tedious tasks and providing clear guidance for complex processes. Users report feeling more confident and less overwhelmed, with tangible time savings that free them to focus on higher-value activities. The structured approach helps prevent common mistakes that waste time and effort. Beyond immediate task completion, users develop transferable skills and frameworks they can apply to future challenges, creating lasting value beyond the tool itself.`,
        `Real-world impact extends across multiple user segments and use cases. Beginners gain access to expert-level workflows and guidance that accelerate their learning curve dramatically. Experienced users save time through intelligent automation and integration, allowing them to handle more volume without sacrificing quality. Organizations benefit from team members producing more consistent, higher-quality output with less supervision required. The platform's structured approach also facilitates knowledge transfer and collaboration, making it easier for teams to work together effectively and maintain continuity as team composition changes.`,
        `Practical applications span from individual productivity enhancement to team collaboration improvements. Users consistently cite reduced stress and increased confidence as major benefits, alongside measurable time savings. The platform helps people overcome the blank-page problem by providing frameworks and starting points that spark creativity rather than constraining it. Skills developed through using the platform transfer directly to adjacent domains and professional contexts. Long-term users report improved decision-making capabilities as they internalize the strategic frameworks and best practices embedded in the tool's design.`,
      ],
    };

      return fallbackAlternatives[sectionType] || [
        'Alternative content not available for this section type.',
        'Please try regenerating or editing manually.',
        'Try editing manually for better results.',
      ];
    }
  },
};

function analyzeJudgingCriteria(criteria: string[], projectIdea: string): {
  criteriaAnalysis: string;
  innovationFocus?: string;
  technicalFocus?: string;
  impactFocus?: string;
} {
  const lowerCriteria = criteria.join(' ').toLowerCase();
  const lowerIdea = projectIdea.toLowerCase();

  const innovationKeywords = ['innovation', 'innovative', 'creative', 'novel', 'original', 'unique', 'new'];
  const technicalKeywords = ['technical', 'implementation', 'code', 'architecture', 'engineering', 'quality', 'scalable', 'performance'];
  const impactKeywords = ['impact', 'usability', 'user', 'practical', 'real-world', 'usefulness', 'benefit', 'value'];
  const designKeywords = ['design', 'ui', 'ux', 'interface', 'experience', 'aesthetic'];
  const completionKeywords = ['complete', 'functional', 'working', 'finished', 'polish'];

  const hasInnovation = innovationKeywords.some(k => lowerCriteria.includes(k));
  const hasTechnical = technicalKeywords.some(k => lowerCriteria.includes(k));
  const hasImpact = impactKeywords.some(k => lowerCriteria.includes(k));
  const hasDesign = designKeywords.some(k => lowerCriteria.includes(k));
  const hasCompletion = completionKeywords.some(k => lowerCriteria.includes(k));

  const criteriaList: string[] = [];
  if (hasInnovation) criteriaList.push('innovation and originality');
  if (hasTechnical) criteriaList.push('technical implementation quality');
  if (hasImpact) criteriaList.push('real-world impact and usability');
  if (hasDesign) criteriaList.push('user interface and experience design');
  if (hasCompletion) criteriaList.push('project completeness and polish');

  const criteriaAnalysis = criteriaList.length > 0
    ? `The judges are evaluating submissions based on ${criteriaList.slice(0, 3).join(', ')}.`
    : `The judges are looking for ${criteria.slice(0, 2).join(' and ')}.`;

  const isAiProject = /\b(ai|artificial intelligence|machine learning|ml|gpt|llm)\b/i.test(lowerIdea);
  const isWebProject = /\b(web|website|app|application|platform|saas)\b/i.test(lowerIdea);
  const isDataProject = /\b(data|analytics|visualization|dashboard)\b/i.test(lowerIdea);
  const isToolProject = /\b(tool|automation|workflow|productivity)\b/i.test(lowerIdea);

  let innovationFocus = '';
  if (hasInnovation) {
    if (isAiProject) innovationFocus = 'leveraging AI to solve problems in novel ways that haven\'t been addressed by existing solutions';
    else if (isToolProject) innovationFocus = 'creating unique automation workflows that streamline processes in creative ways';
    else if (isDataProject) innovationFocus = 'presenting data insights through innovative visualization and interaction patterns';
    else innovationFocus = 'approaching the problem from a fresh perspective with creative feature combinations';
  }

  let technicalFocus = '';
  if (hasTechnical) {
    technicalFocus = 'clean architecture, efficient algorithms, scalable database design, and production-ready code quality with proper error handling and security practices';
  }

  let impactFocus = '';
  if (hasImpact) {
    if (isToolProject) impactFocus = 'time savings and productivity gains for real users facing this problem daily';
    else if (isDataProject) impactFocus = 'actionable insights that drive better decision-making for stakeholders';
    else impactFocus = 'tangible benefits and improved outcomes for our target users in real-world scenarios';
  }

  return {
    criteriaAnalysis,
    innovationFocus: innovationFocus || undefined,
    technicalFocus: technicalFocus || undefined,
    impactFocus: impactFocus || undefined,
  };
}

function extractNearbyText(text: string, index: number, range: number): string {
  const start = Math.max(0, index - range);
  const end = Math.min(text.length, index + range);
  const snippet = text.substring(start, end).trim();
  const sentences = snippet.split(/[.!?]/);
  return sentences.find(s => s.length > 10) || snippet.substring(0, 100);
}

function extractItems(text: string, keywords: string[], maxItems: number): string[] {
  const items: string[] = [];
  const lowerText = text.toLowerCase();

  keywords.forEach(keyword => {
    const index = lowerText.indexOf(keyword);
    if (index !== -1) {
      const section = text.substring(index, index + 500);
      const lines = section.split(/[.\n]/);
      lines.slice(0, 3).forEach(line => {
        const cleaned = line.trim();
        if (cleaned.length > 10 && cleaned.length < 150) {
          items.push(cleaned);
        }
      });
    }
  });

  return [...new Set(items)].slice(0, maxItems);
}
