-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Settings as JSONB for flexibility
  game_settings JSONB DEFAULT '{
    "defaultDifficulty": "medium",
    "autoSelectDifficulty": false,
    "enableHints": true,
    "hintDelay": 60,
    "autoHintThreshold": 10,
    "showTimer": true,
    "pauseOnBlur": true,
    "enableSound": true,
    "masterVolume": 70,
    "effectsVolume": 80,
    "musicVolume": 50,
    "confirmBeforeQuit": true,
    "autoSaveInterval": 30,
    "showMistakeIndicator": true,
    "enableAnimations": true
  }'::jsonb,
  
  ui_settings JSONB DEFAULT '{
    "theme": "auto",
    "colorScheme": "default",
    "fontSize": "medium",
    "reducedMotion": false,
    "compactMode": false,
    "highlightSelection": true,
    "highlightConflicts": true,
    "showPossibleValues": false,
    "gridStyle": "default"
  }'::jsonb,
  
  notification_settings JSONB DEFAULT '{
    "showAchievements": true,
    "showLevelUp": true,
    "showDailyChallenge": true,
    "enablePushNotifications": false,
    "dailyChallengeReminder": false,
    "weeklyProgress": false,
    "friendActivity": false
  }'::jsonb,
  
  privacy_settings JSONB DEFAULT '{
    "profileVisibility": "public",
    "showInLeaderboard": true,
    "shareStatistics": true,
    "anonymousAnalytics": true,
    "allowFriendRequests": true,
    "allowChallenges": true
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one settings row per user
  UNIQUE(user_id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Create indexes for performance
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view and update their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when user profile is created
CREATE TRIGGER create_user_settings_on_profile_create
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_settings();

-- Grant necessary permissions
GRANT ALL ON user_settings TO authenticated;

-- Add settings to database types
COMMENT ON TABLE user_settings IS 'User preferences and settings for the game';
COMMENT ON COLUMN user_settings.game_settings IS 'Game-related preferences (difficulty, hints, sound, etc.)';
COMMENT ON COLUMN user_settings.ui_settings IS 'UI preferences (theme, font size, display options)';
COMMENT ON COLUMN user_settings.notification_settings IS 'Notification preferences (achievements, reminders)';
COMMENT ON COLUMN user_settings.privacy_settings IS 'Privacy and social preferences (visibility, sharing)';