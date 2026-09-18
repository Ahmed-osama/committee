// The plan's "heartbeat + push-based alerting" requirement, as an interface for the
// same reason as capture/input — no push provider (a phone push API, a Telegram bot,
// something else) has been picked yet. A real adapter is a new sibling file.

export interface AlertChannel {
  notify(message: string): Promise<void>;
}
