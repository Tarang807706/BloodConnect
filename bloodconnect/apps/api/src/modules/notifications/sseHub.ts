import { Response } from 'express';
import { logger } from '../../common/logger/pino';

interface SseClient {
  userId: string;
  res: Response;
}

class SseHub {
  private clients: Map<string, SseClient[]> = new Map();

  constructor() {
    // Send periodic heartbeat every 25 seconds to keep connections alive
    setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
  }

  registerClient(userId: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Initial greeting / ping
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    const userClients = this.clients.get(userId) || [];
    userClients.push({ userId, res });
    this.clients.set(userId, userClients);

    logger.debug({ userId, totalUserConnections: userClients.length }, 'SSE Client connected');

    res.on('close', () => {
      this.removeClient(userId, res);
    });
  }

  private removeClient(userId: string, res: Response) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;
    const filtered = userClients.filter(c => c.res !== res);
    if (filtered.length > 0) {
      this.clients.set(userId, filtered);
    } else {
      this.clients.delete(userId);
    }
    logger.debug({ userId }, 'SSE Client disconnected');
  }

  broadcastToUser(userId: string, event: string, data: any) {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.length === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of userClients) {
      try {
        client.res.write(payload);
      } catch (err) {
        logger.warn({ userId }, 'Failed to write SSE event, removing dead connection');
        this.removeClient(userId, client.res);
      }
    }
  }

  broadcastToAll(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [userId, userClients] of this.clients.entries()) {
      for (const client of userClients) {
        try {
          client.res.write(payload);
        } catch {
          this.removeClient(userId, client.res);
        }
      }
    }
  }

  private sendHeartbeat() {
    const heartbeat = `: heartbeat ${new Date().toISOString()}\n\n`;
    for (const [userId, userClients] of this.clients.entries()) {
      for (const client of userClients) {
        try {
          client.res.write(heartbeat);
        } catch {
          this.removeClient(userId, client.res);
        }
      }
    }
  }
}

export const sseHub = new SseHub();
