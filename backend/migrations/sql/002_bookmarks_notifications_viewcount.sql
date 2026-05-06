-- Migration: bookmarks, notifications, post viewCount
-- Run manually or via Sequelize alter:true

CREATE TABLE IF NOT EXISTS bookmarks (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  userId    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  postId    INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  createdAt DATETIME NOT NULL DEFAULT NOW(),
  updatedAt DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_bookmark (userId, postId)
);

CREATE TABLE IF NOT EXISTS notifications (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  userId    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type      VARCHAR(50)  NOT NULL,
  title     VARCHAR(255) NOT NULL,
  body      TEXT,
  refType   VARCHAR(30),
  refId     INT,
  isRead    TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT NOW(),
  updatedAt DATETIME NOT NULL DEFAULT NOW()
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS viewCount INT NOT NULL DEFAULT 0;
