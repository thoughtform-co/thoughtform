-- ═══════════════════════════════════════════════════════════════════════════
-- ASSISTANT CHAT PERSISTENCE
-- Phase 3: Universal Assistant with chat history
-- ═══════════════════════════════════════════════════════════════════════════

-- Conversations table - stores chat sessions
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context binding (optional - for component-specific chats)
  context_type TEXT, -- 'foundry_item' | 'component' | 'general'
  context_id TEXT,   -- e.g., foundry item ID, component ID
  
  -- Metadata
  title TEXT, -- Auto-generated or user-defined title
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Messages table - stores individual messages
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Structured data (for assistant responses)
  -- Stores patches, design cards, variants, etc.
  structured_data JSONB,
  
  -- Metadata
  model TEXT, -- Which model generated this (for assistant messages)
  tokens_used INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user_id 
  ON assistant_conversations(user_id);

-- Fast lookup by context
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_context 
  ON assistant_conversations(context_type, context_id);

-- Fast lookup by conversation (for loading messages)
CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation_id 
  ON assistant_messages(conversation_id);

-- Order messages chronologically
CREATE INDEX IF NOT EXISTS idx_assistant_messages_created_at 
  ON assistant_messages(conversation_id, created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON assistant_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON assistant_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON assistant_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON assistant_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages inherit conversation access
CREATE POLICY "Users can view messages in own conversations"
  ON assistant_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assistant_conversations
      WHERE id = assistant_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON assistant_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assistant_conversations
      WHERE id = assistant_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at on conversations
CREATE OR REPLACE FUNCTION update_assistant_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_assistant_conversation_timestamp
  BEFORE UPDATE ON assistant_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_conversation_timestamp();

-- Update conversation timestamp when messages are added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assistant_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON assistant_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();
