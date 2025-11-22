export interface SectionTips {
  writing: string;
  visual: string;
}

export const scriptTips: Record<string, SectionTips> = {
  problem: {
    writing: 'Focus on the pain point your audience experiences. Use emotional language that makes the problem feel real and urgent. Avoid technical jargon - explain it like you\'re talking to a friend who faces this challenge.',
    visual: 'Show frustrated users dealing with the problem. Use screen recordings of broken workflows, cluttered interfaces, or manual processes. Facial expressions and body language convey frustration effectively. Consider using before/after comparisons.',
  },
  solution: {
    writing: 'Lead with your unique value proposition. Explain HOW your solution works, not just what it does. Use concrete examples and avoid vague claims. Connect each feature back to the problem it solves.',
    visual: 'Demonstrate your actual product in action. Show the user interface, key features, and smooth workflows. Use cursor movements and hover states to guide viewers\' eyes. Screen recordings should be clean with good contrast.',
  },
  traction: {
    writing: 'Use specific numbers and metrics when possible. Mention real user feedback, growth indicators, or technical milestones. Be honest but optimistic. Focus on future potential backed by current validation.',
    visual: 'Display charts, graphs, or metrics dashboards if available. Show user testimonials as text overlays. If you have team photos or user analytics, include them. Keep it professional and data-driven.',
  },
  requirements: {
    writing: 'Directly reference the judging criteria and hackathon requirements. Use the same language from the rules document. Show clear alignment between your project and what judges are evaluating. Be specific about how you meet each criterion.',
    visual: 'Show side-by-side comparison of requirements and your features. Use checkmarks or highlight matching elements. Display the hackathon logo or sponsor logos (with permission). Show timestamps or git logs proving work was done during the hackathon.',
  },
  tools: {
    writing: 'Name your tech stack clearly and explain why you chose each tool. Focus on how the technologies enable your solution, not just listing them. Mention integration points and architectural decisions that showcase technical depth.',
    visual: 'Show your project structure, code snippets, or architecture diagrams. Display logos of technologies used. Show your IDE or terminal with relevant code. GitHub repository view showing clean commits and documentation works well.',
  },
  realworld_use: {
    writing: 'Tell stories about specific user scenarios. Explain who benefits and exactly how their life improves. Use concrete examples rather than abstract benefits. Connect back to the original problem to show full circle.',
    visual: 'Show user personas or case study scenarios. Display workflow diagrams showing before and after states. If possible, show real users interacting with your product. Use annotations to highlight key improvements.',
  },
};
