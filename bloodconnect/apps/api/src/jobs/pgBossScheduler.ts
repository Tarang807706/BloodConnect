import { dbStore } from '../data/dbStore';
import { logger } from '../common/logger/pino';
import { CaseStatus } from '@bloodconnect/shared';

type TimerCallback = (caseId: string, stageNumber: number) => Promise<void>;

class Scheduler {
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private handler: TimerCallback | null = null;
  private sweeperInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSweeper();
  }

  setHandler(fn: TimerCallback) {
    this.handler = fn;
  }

  /**
   * Schedule a stage timeout.
   * Singleton key prevents duplicate timers.
   */
  scheduleStageTimeout(caseId: string, stageNumber: number, dueAt: Date) {
    const key = `case:${caseId}:stage:${stageNumber}`;

    // Clear any existing timer for this key
    if (this.activeTimers.has(key)) {
      clearTimeout(this.activeTimers.get(key)!);
      this.activeTimers.delete(key);
    }

    const delayMs = Math.max(0, dueAt.getTime() - Date.now());

    logger.info({
      key,
      dueAt: dueAt.toISOString(),
      delayMs,
    }, 'Scheduled stage timeout timer');

    const timer = setTimeout(async () => {
      this.activeTimers.delete(key);
      if (this.handler) {
        try {
          await this.handler(caseId, stageNumber);
        } catch (err: any) {
          logger.error({ err: err.message, key }, 'Error executing stage timeout timer handler');
        }
      }
    }, delayMs);

    this.activeTimers.set(key, timer);
  }

  cancelCaseTimers(caseId: string) {
    for (const [key, timer] of this.activeTimers.entries()) {
      if (key.startsWith(`case:${caseId}:`)) {
        clearTimeout(timer);
        this.activeTimers.delete(key);
        logger.info({ key }, 'Cancelled case timer');
      }
    }
  }

  /**
   * Timer recovery sweeper.
   * Runs every 30 seconds to check if any active case's nextStageDueAt has passed.
   * Recovers timers after server restarts or network blips.
   */
  private startSweeper() {
    this.sweeperInterval = setInterval(async () => {
      try {
        const now = new Date();
        const activeCases = await dbStore.emergencyCases.findMany(c => {
          return (
            [CaseStatus.ACTIVE_STAGE_1, CaseStatus.ACTIVE_STAGE_2, CaseStatus.NGO_ACTIVATED].includes(c.status) &&
            c.nextStageDueAt != null &&
            new Date(c.nextStageDueAt) <= now
          );
        });

        for (const c of activeCases) {
          logger.info({ caseId: c.id, stage: c.currentStageNumber, dueAt: c.nextStageDueAt }, 'Sweeper recovered overdue stage timer');
          if (this.handler) {
            await this.handler(c.id, c.currentStageNumber);
          }
        }
      } catch (err: any) {
        logger.error({ err: err.message }, 'Error in timer recovery sweeper');
      }
    }, 30000);
  }
}

export const scheduler = new Scheduler();
