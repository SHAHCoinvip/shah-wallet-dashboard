// AI Tip utility for the SHAH Wallet dashboard
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export async function getAiTip(): Promise<string> {
  // Return a default tip if no API key is available
  if (!OPENAI_API_KEY) {
    return "💡 Connect your wallet to start earning SHAH rewards through staking and farming!";
  }

  try {
    // This would integrate with OpenAI API for dynamic tips
    // For now, return a static tip
    return "💡 Connect your wallet to start earning SHAH rewards through staking and farming!";
  } catch (error) {
    console.error('Error getting AI tip:', error);
    return "💡 Connect your wallet to start earning SHAH rewards through staking and farming!";
  }
}
