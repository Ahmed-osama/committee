import type { AlertChannel } from './alert-channel.js';

// The only "real" adapter that exists yet — logs to stdout. Fine for running the
// loop at a desk during development; not a substitute for the real push channel
// (nothing wakes Ahmed up if the bot halts overnight) once one is picked.
export class ConsoleAlertChannel implements AlertChannel {
  async notify(message: string): Promise<void> {
    console.log(`[srom-bot alert] ${message}`);
  }
}
