-- Schéma MySQL pour Jeux Bibliques API (Node.js/Express)
-- Équivalent des migrations Laravel, adapté pour exécution directe.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  age_group ENUM('child','teen','adult') NOT NULL DEFAULT 'adult',
  total_points INT UNSIGNED NOT NULL DEFAULT 0,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  blocked_at DATETIME NULL,
  blocked_reason VARCHAR(500) NULL,
  full_name VARCHAR(255) NULL,
  church_name VARCHAR(255) NULL,
  newsletter_consent TINYINT(1) NOT NULL DEFAULT 0,
  marketing_consent TINYINT(1) NOT NULL DEFAULT 0,
  consent_date DATETIME NULL,
  country VARCHAR(100) NULL,
  detected_country VARCHAR(100) NULL,
  last_seen_at DATETIME NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_token CHAR(36) NULL,
  verification_token_expires DATETIME NULL,
  password_reset_token CHAR(36) NULL,
  password_reset_token_expires DATETIME NULL,
  hearts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS games (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  icon VARCHAR(100) NULL,
  color VARCHAR(50) NULL,
  cover_image_url LONGTEXT NULL,
  min_age INT UNSIGNED NOT NULL DEFAULT 0,
  difficulty_levels JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scores (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  game_id CHAR(36) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  max_score INT NOT NULL DEFAULT 0,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',
  time_spent INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_scores_user (user_id),
  INDEX idx_scores_game (game_id),
  CONSTRAINT fk_scores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_scores_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  game_id CHAR(36) NOT NULL,
  level INT UNSIGNED NOT NULL DEFAULT 1,
  games_played INT UNSIGNED NOT NULL DEFAULT 0,
  best_score INT UNSIGNED NOT NULL DEFAULT 0,
  last_played_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_game (user_id, game_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS verses (
  id CHAR(36) PRIMARY KEY,
  reference VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  book VARCHAR(100) NOT NULL,
  chapter INT UNSIGNED NOT NULL,
  verse_number INT UNSIGNED NOT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  speaker VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_verses_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS quiz_questions (
  id CHAR(36) PRIMARY KEY,
  game_type ENUM('quiz','true_false','who_said','character_match') NOT NULL,
  question TEXT NOT NULL,
  correct_answer VARCHAR(500) NOT NULL,
  wrong_answers JSON NULL,
  explanation TEXT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  category VARCHAR(100) NULL,
  verse_reference VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quiz_game_type (game_type),
  INDEX idx_quiz_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bible_words (
  id CHAR(36) PRIMARY KEY,
  word VARCHAR(100) NOT NULL,
  hint VARCHAR(255) NULL,
  category VARCHAR(100) NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_words_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bible_characters (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  story_title VARCHAR(255) NOT NULL,
  story_description TEXT NULL,
  book VARCHAR(100) NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_characters_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS banners (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url LONGTEXT NOT NULL,
  link_url VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  duration_seconds TINYINT UNSIGNED NOT NULL DEFAULT 5,
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_banners_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS donation_settings (
  id CHAR(36) PRIMARY KEY,
  iframe_code TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  show_user_counter TINYINT(1) NOT NULL DEFAULT 0,
  updated_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_donation_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS smtp_settings (
  id CHAR(36) PRIMARY KEY,
  host VARCHAR(255) NULL,
  port INT NULL DEFAULT 587,
  secure TINYINT(1) NOT NULL DEFAULT 0,
  username VARCHAR(255) NULL,
  password VARCHAR(500) NULL,
  from_email VARCHAR(255) NULL,
  from_name VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  require_email_verification TINYINT(1) NOT NULL DEFAULT 0,
  updated_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_smtp_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','urgent') NOT NULL DEFAULT 'info',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cards (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url LONGTEXT NULL,
  points_threshold INT UNSIGNED NOT NULL,
  hearts_reward INT UNSIGNED NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_cards (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  card_id CHAR(36) NOT NULL,
  unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  seen TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_user_card (user_id, card_id),
  CONSTRAINT fk_user_cards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_cards_card FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
