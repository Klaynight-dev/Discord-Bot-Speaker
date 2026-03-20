// ── Shared Discord API types ──────────────────────────
export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  discriminator: string;
  avatar?: string;
  bot?: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  premium_tier?: number;
  premium_subscription_count?: number;
}

export interface DiscordChannel {
  id: string;
  type: number;
  name: string;
  parent_id?: string;
  position?: number;
  topic?: string;
  rate_limit_per_user?: number;
  nsfw?: boolean;
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: DiscordUser;
  timestamp: string;
  edited_timestamp?: string;
  embeds?: DiscordEmbed[];
  attachments?: DiscordAttachment[];
  referenced_message?: DiscordMessage;
  poll?: DiscordPoll;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: { name: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  video?: { url: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export interface DiscordAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  content_type?: string;
}

export interface DiscordPoll {
  question: { text: string };
  answers: Array<{
    answer_id: number;
    poll_media: { text?: string; emoji?: { name?: string; id?: string } };
  }>;
  expiry?: string;
  allow_multiselect?: boolean;
  results?: {
    is_finalized: boolean;
    answer_counts: Array<{ id: number; count: number; me_voted: boolean }>;
  };
}

export interface DiscordSlashCommand {
  id: string;
  application_id: string;
  name: string;
  description: string;
  type?: number;
  options?: unknown[];
}

export interface DiscordMember {
  user?: DiscordUser;
  nick?: string;
  roles: string[];
  joined_at: string;
  premium_since?: string;
}

// ── Internal config / template types ─────────────────
export interface AppConfig {
  token?: string;
  guildId?: string;
  channelId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  content?: string;
  embeds?: DiscordEmbed[];
  createdAt: string;
}

// ── API response wrapper ──────────────────────────────
export interface ApiResult<T = unknown> {
  status: number;
  data: T;
}
