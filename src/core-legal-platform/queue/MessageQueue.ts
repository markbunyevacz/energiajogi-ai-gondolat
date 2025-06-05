import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { EventEmitter } from 'events';

type QueueMessage = {
  id: string;
  type: 'document_processing' | 'domain_analysis' | 'hierarchy_update';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
};

export class MessageQueue extends EventEmitter {
  private static instance: MessageQueue;
  private processing: boolean = false;
  private batchSize: number = 10;
  private processingInterval: number = 5000; // 5 seconds

  private constructor() {
    super();
    this.startProcessing();
  }

  public static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  private async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    while (this.processing) {
      try {
        await this.processNextBatch();
      } catch (error) {
        console.error('Error processing message batch:', error);
        this.emit('error', error);
      }
      await new Promise(resolve => setTimeout(resolve, this.processingInterval));
    }
  }

  private async processNextBatch() {
    const { data: messages, error } = await supabase
      .from('queue_messages')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(this.batchSize);

    if (error) throw error;
    if (!messages?.length) return;

    for (const message of messages) {
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        await this.updateMessageStatus(message.id, 'failed', error.message);
      }
    }
  }

  private async processMessage(message: QueueMessage) {
    await this.updateMessageStatus(message.id, 'processing');

    try {
      switch (message.type) {
        case 'document_processing':
          await this.processDocument(message.payload);
          break;
        case 'domain_analysis':
          await this.analyzeDomain(message.payload);
          break;
        case 'hierarchy_update':
          await this.updateHierarchy(message.payload);
          break;
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }

      await this.updateMessageStatus(message.id, 'completed');
      this.emit('messageProcessed', message);
    } catch (error) {
      throw error;
    }
  }

  private async updateMessageStatus(
    messageId: string,
    status: QueueMessage['status'],
    error?: string
  ) {
    const { error: updateError } = await supabase
      .from('queue_messages')
      .update({
        status,
        error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (updateError) throw updateError;
  }

  private async processDocument(payload: any) {
    // Implement document processing logic
    // This should be implemented by the specific agent
    throw new Error('Document processing not implemented');
  }

  private async analyzeDomain(payload: any) {
    // Implement domain analysis logic
    // This should be implemented by the specific agent
    throw new Error('Domain analysis not implemented');
  }

  private async updateHierarchy(payload: any) {
    // Implement hierarchy update logic
    // This should be implemented by the specific agent
    throw new Error('Hierarchy update not implemented');
  }

  public async enqueueMessage(type: QueueMessage['type'], payload: any): Promise<string> {
    const { data, error } = await supabase
      .from('queue_messages')
      .insert({
        type,
        payload,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  public stop() {
    this.processing = false;
  }
}

async function mergeQueues() {
  const [hierarchyResults, queueResults] = await Promise.allSettled([
    import('./hierarchy/HierarchyManager'),
    import('./queue/MessageQueue')
  ]);
  
  return {
    hierarchy: hierarchyResults.status === 'fulfilled' 
      ? hierarchyResults.value 
      : null,
    queue: queueResults.value
  };
}

// Local priority queue changes
const PRIORITY_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];

// Feature branch additions
const LEGAL_PRIORITIES = [HierarchyLevel.Constitution, ...];

// Merged solution
const PRIORITY_MAP = new Map([
  [HierarchyLevel.Constitution, 'CRITICAL'],
  ... // Combine both approaches
]); 