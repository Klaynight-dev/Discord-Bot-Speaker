import { discord } from "../lib/discord.ts";
import { json, err, ok } from "../lib/response.ts";
import { isSnowflake } from "../lib/validate.ts";

interface PollAnswer {
  text: string;
  emoji?: string;
  emojiId?: string;
}

export async function handleSendPoll(req: Request): Promise<Response> {
  const body = await req.json() as {
    token: string; channelId: string; question: string;
    answers: PollAnswer[]; duration?: number; allow_multiselect?: boolean;
  };
  const { token, channelId, question, answers, duration = 24, allow_multiselect = false } = body;

  if (!token || !channelId)     return err("Paramètres manquants");
  if (!isSnowflake(channelId))  return err("channelId invalide");
  if (!question?.trim())        return err("Question requise");
  if (!answers?.length)         return err("Au moins 2 réponses requises");

  const pollAnswers = answers
    .filter(a => a.text?.trim())
    .slice(0, 10)
    .map(a => ({
      poll_media: {
        text: a.text.slice(0, 55),
        ...(a.emoji && !a.emojiId
          ? { emoji: { name: a.emoji } }
          : a.emojiId
          ? { emoji: { id: a.emojiId } }
          : {}),
      },
    }));

  if (pollAnswers.length < 2) return err("Au moins 2 réponses requises");

  const payload = {
    poll: {
      question: { text: question.slice(0, 300) },
      answers: pollAnswers,
      duration: Math.min(Math.max(1, Number(duration) || 24), 168),
      allow_multiselect,
    },
  };

  const r = await discord.post(`/channels/${channelId}/messages`, token, payload);
  return json(r.data, r.status);
}

export async function handleEndPoll(req: Request): Promise<Response> {
  const { token, channelId, messageId } = await req.json() as {
    token: string; channelId: string; messageId: string;
  };
  if (!token || !channelId || !messageId) return err("Paramètres manquants");
  if (!isSnowflake(channelId) || !isSnowflake(messageId)) return err("ID invalide");

  const r = await discord.post(`/channels/${channelId}/polls/${messageId}/expire`, token, {});
  return json(r.data, r.status);
}
