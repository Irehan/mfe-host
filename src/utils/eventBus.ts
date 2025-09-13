
import { EventHandler, EventBusEvents } from '../types/types';

class EventBus {
  private events: Map<keyof EventBusEvents, Set<EventHandler>> = new Map();

  emit<K extends keyof EventBusEvents>(event: K, data: EventBusEvents[K]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${String(event)}:`, error);
        }
      });
    }
  }

  on<K extends keyof EventBusEvents>(
    event: K, 
    handler: EventHandler<EventBusEvents[K]>
  ): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    const handlers = this.events.get(event)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    };
  }
  subscribe<K extends keyof EventBusEvents>(
    event: K,
    handler: EventHandler<EventBusEvents[K]>
  ): () => void {
    return this.on(event, handler);
  }

  off<K extends keyof EventBusEvents>(
    event: K, 
    handler: EventHandler<EventBusEvents[K]>
  ): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  once<K extends keyof EventBusEvents>(
    event: K, 
    handler: EventHandler<EventBusEvents[K]>
  ): () => void {
    const wrappedHandler = (data: EventBusEvents[K]) => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    
    return this.on(event, wrappedHandler);
  }

  clear(event?: keyof EventBusEvents): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  getEventHandlerCount(event: keyof EventBusEvents): number {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }
}

export const eventBus = new EventBus();